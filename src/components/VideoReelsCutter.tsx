import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Download, Sparkles, Settings2, Film, Play, Pause } from 'lucide-react';
import { ProcessingProgress } from './video/ProcessingProgress';
import { getVideoMetadata, processCompleteReel, initFFmpeg, createProxyVideo } from '../utils/ffmpeg';
import { transcribeVideo, optimizeSubtitleSegments, adjustSubtitleTiming } from '../services/whisperService';
import { analyzeHighlights } from '../services/highlightService';
import { VideoFile, VideoProcessingState, ReelConfig, DEFAULT_REEL_CONFIG, SubtitleSegment } from '../types/video';
import { HighlightSegment } from '../types/highlight';
import { downloadVideoFile } from '../utils/downloadHelper';
import { RemotionPreview } from '../video-reels';
import { PlayerRef } from '@remotion/player';
import { HighlightsSidebar } from './HighlightsSidebar';
import { useVideoSync } from '../hooks/useVideoSync';
import { PlayerControls } from './PlayerControls';

const PREVIEW_STYLE = {
    fontFamily: 'Eurostile',
    fontSize: 50,
    color: '#FFFFFF',
};

export const VideoReelsCutter: React.FC = () => {
    const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
    const [proxyVideoUrl, setProxyVideoUrl] = useState<string | null>(null);
    const [reelConfig, setReelConfig] = useState<ReelConfig>(DEFAULT_REEL_CONFIG);
    const [processingState, setProcessingState] = useState<VideoProcessingState>({
        status: 'idle',
        progress: 0,
    });
    const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);
    const [outputVideo, setOutputVideo] = useState<Blob | null>(null);
    const [outputVideoUrl, setOutputVideoUrl] = useState<string | null>(null);
    const [openAIKey, setOpenAIKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || '');
    const [showSettings, setShowSettings] = useState(false);
    const [highlights, setHighlights] = useState<HighlightSegment[]>([]);
    const [isAnalyzingHighlights, setIsAnalyzingHighlights] = useState(false);

    // ✅ Custom Hook for Video Synchronization - Passive Mode
    const sync = useVideoSync();

    // Handle video file upload
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setProcessingState({ status: 'loading', progress: 10, message: 'Loading video...' });

            const metadata = await getVideoMetadata(file);
            const url = URL.createObjectURL(file);

            setVideoFile({
                file,
                url,
                duration: metadata.duration,
                width: metadata.width,
                height: metadata.height,
            });

            setProcessingState({ status: 'idle', progress: 0 });
            sync.syncToSegment(0); // Reset time
            setSubtitles([]);
            setHighlights([]);
            setOutputVideo(null);
            setProxyVideoUrl(null);
            if (outputVideoUrl) {
                URL.revokeObjectURL(outputVideoUrl);
                setOutputVideoUrl(null);
            }

            // 🔄 GENERATE PROXY (Immediate Background Process)
            // This runs after state update so UI shows original first, then switches to proxy
            console.log('🔄 [Proxy] Starting generation...');
            // Need to use a separate async function to not block
            (async () => {
                try {
                    // Temporarily show loading status for proxy? 
                    // Or just let it happen in background. User said "high-speed".
                    // Let's create a non-blocking toast or small indicator if possible, 
                    // but for now we'll just log it and update when ready.

                    const ffmpeg = await initFFmpeg();
                    const proxyBlob = await createProxyVideo(ffmpeg, file, (p) => {
                        console.log(`[Proxy Progress] ${p}%`);
                    });

                    const proxyUrl = URL.createObjectURL(proxyBlob);
                    setProxyVideoUrl(proxyUrl);
                    console.log('✅ [Proxy] Ready and set!');
                } catch (err) {
                    console.error('❌ [Proxy] Generation failed:', err);
                    // Fallback to original is automatic since proxyVideoUrl stays null
                }
            })();

        } catch (error) {
            setProcessingState({
                status: 'error',
                progress: 0,
                error: error instanceof Error ? error.message : 'Failed to load video',
            });
        }
    }, [outputVideoUrl, sync]);

    // Generate subtitles using Whisper AI (Full Pipeline)
    const handleGenerateSubtitles = useCallback(async () => {
        if (!videoFile || !openAIKey) {
            alert('Please upload a video and provide OpenAI API key');
            return;
        }

        try {
            // Step 1: Extract audio from video
            setProcessingState({
                status: 'loading',
                progress: 0,
                message: 'Extracting audio from video...'
            });

            const ffmpeg = await getVideoMetadata(videoFile.file).then(() => {
                // Import initFFmpeg
                return import('../utils/ffmpeg').then(m => m.initFFmpeg((p) => {
                    // p приходит в процентах (0-100), нормализуем и масштабируем в 0-20%
                    const normalizedProgress = Math.min(100, Math.max(0, p));
                    const finalProgress = Math.min(20, Math.round(normalizedProgress * 0.2));
                    setProcessingState(prev => ({
                        ...prev,
                        progress: finalProgress // 0-20%
                    }));
                }));
            });

            setProcessingState({
                status: 'loading',
                progress: 20,
                message: 'Extracting audio...'
            });

            const { extractAudio } = await import('../utils/ffmpeg');
            const audioBlob = await extractAudio(ffmpeg, videoFile.file, (p) => {
                // p приходит в процентах (0-100), нормализуем и масштабируем в 20-40%
                const normalizedProgress = Math.min(100, Math.max(0, p));
                const finalProgress = Math.min(40, 20 + Math.round(normalizedProgress * 0.2));
                setProcessingState(prev => ({
                    ...prev,
                    progress: finalProgress // 20-40%
                }));
            });

            console.log('✅ Audio extracted:', (audioBlob.size / 1024 / 1024).toFixed(2), 'MB');

            // Step 2: Transcribe with Whisper API
            setProcessingState({
                status: 'transcribing',
                progress: 40,
                message: 'AI is listening to your video...'
            });

            const { transcribeAudio } = await import('../services/whisperService');
            const segments = await transcribeAudio(audioBlob, openAIKey, (progress) => {
                // progress приходит в процентах (0-100), нормализуем и масштабируем в 40-90%
                const normalizedProgress = Math.min(100, Math.max(0, progress));
                const finalProgress = Math.min(90, 40 + Math.round(normalizedProgress * 0.5));
                setProcessingState(prev => ({
                    ...prev,
                    progress: finalProgress // 40-90%
                }));
            });

            // Step 3: Optimize segments
            setProcessingState({
                status: 'loading',
                progress: 90,
                message: 'Optimizing subtitles...'
            });

            const optimized = optimizeSubtitleSegments(segments);
            setSubtitles(optimized);

            setProcessingState({
                status: 'idle',
                progress: 100,
                message: `✅ Generated ${optimized.length} subtitle segments`
            });

            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setProcessingState({ status: 'idle', progress: 0 });
            }, 3000);

        } catch (error) {
            console.error('❌ Subtitle generation failed:', error);
            setProcessingState({
                status: 'error',
                progress: 0,
                error: error instanceof Error ? error.message : 'Failed to generate subtitles',
            });
        }
    }, [videoFile, openAIKey]);

    // Process and render final reel
    const handleRenderReel = useCallback(async () => {
        if (!videoFile) return;

        try {
            setProcessingState({ status: 'loading', progress: 0, message: 'Initializing...' });

            // Adjust subtitle timing for the trimmed video
            // Use subtitles if they exist, regardless of subtitlesEnabled flag
            const adjustedSubtitles = subtitles.length > 0
                ? adjustSubtitleTiming(subtitles, reelConfig.startTime, reelConfig.duration)
                : [];

            console.log('🎬 [Render] Starting reel processing...');
            console.log('📝 [Render] Subtitles count:', subtitles.length);
            console.log('📝 [Render] Adjusted subtitles:', adjustedSubtitles.length);

            // Process video
            const output = await processCompleteReel(
                videoFile.file,
                reelConfig.startTime,
                reelConfig.duration,
                adjustedSubtitles,
                reelConfig.subtitleStyle,
                (stage, progress) => {
                    const statusMap: Record<string, VideoProcessingState['status']> = {
                        init: 'loading',
                        trimming: 'trimming',
                        cropping: 'cropping',
                        rendering: 'rendering',
                    };
                    setProcessingState({
                        status: statusMap[stage] || 'loading',
                        progress,
                        message: `Processing: ${stage}...`,
                    });
                }
            );

            setOutputVideo(output);

            // Create URL for preview
            if (outputVideoUrl) {
                URL.revokeObjectURL(outputVideoUrl);
            }
            const newUrl = URL.createObjectURL(output);
            setOutputVideoUrl(newUrl);

            setProcessingState({ status: 'complete', progress: 100, message: 'Reel ready!' });
        } catch (error) {
            setProcessingState({
                status: 'error',
                progress: 0,
                error: error instanceof Error ? error.message : 'Failed to render reel',
            });
        }
    }, [videoFile, reelConfig, subtitles, outputVideoUrl]);

    // ✅ Prepare Preview - Subtitles should already exist from Global Analysis
    const handleCreateReel = useCallback(async () => {
        if (!videoFile) {
            alert('Please upload a video');
            return;
        }

        if (subtitles.length === 0) {
            alert('Please run "Analyze Full Video" first to generate subtitles and highlights');
            return;
        }

        // Just show a success message - subtitles are already loaded
        setProcessingState({
            status: 'complete',
            progress: 100,
            message: '✅ Preview ready! Adjust timeline and click "Download MP4" to export.'
        });

        // Reset processing state after 2 seconds
        setTimeout(() => {
            setProcessingState({
                status: 'idle',
                progress: 0,
            });
        }, 2000);

        console.log('✅ [Preview] Ready with', subtitles.length, 'subtitles');
    }, [videoFile, subtitles]);

    // ✅ WYSIWYG Download - Full Player Capture (Video + Subtitles → MP4)
    // ✅ Export Logic - Use Original File with FFmpeg
    // Replaced WYSIWYG capture with direct FFmpeg processing for max quality
    const handleDownload = useCallback(async () => {
        console.log('🎬 [Download] Starting export with original file...');

        if (!videoFile) return;

        if (subtitles.length === 0) {
            alert('No subtitles to export. Run analysis first.');
            return;
        }

        try {
            setProcessingState({
                status: 'rendering',
                progress: 0,
                message: '🎬 Initializing High-Quality Export...'
            });

            // Adjust timing
            const adjustedSubtitles = adjustSubtitleTiming(subtitles, reelConfig.startTime, reelConfig.duration);

            await processCompleteReel(
                videoFile.file, // ✅ ALWAYS use original file
                reelConfig.startTime,
                reelConfig.duration,
                adjustedSubtitles,
                PREVIEW_STYLE, // Use shared style config
                (stage, progress) => {
                    // Normalize progress for UI
                    // trimming (0-30), cropping (30-60), rendering (60-100)
                    let uiProgress = 0;
                    let uiMessage = '';

                    if (stage === 'init') { uiProgress = 0; uiMessage = 'Initializing...'; }
                    else if (stage === 'trimming') { uiProgress = progress * 0.3; uiMessage = 'Step 1/3: Trimming High-Quality Video...'; }
                    else if (stage === 'cropping') { uiProgress = 30 + (progress * 0.3); uiMessage = 'Step 2/3: Cropping to 9:16...'; }
                    else if (stage === 'rendering') { uiProgress = 60 + (progress * 0.4); uiMessage = 'Step 3/3: Burning Subtitles...'; }

                    setProcessingState({
                        status: 'rendering',
                        progress: Math.min(99, Math.round(uiProgress)),
                        message: uiMessage
                    });
                }
            ).then(outputBlob => {
                downloadVideoFile(outputBlob, `reel-${Date.now()}.mp4`);

                setProcessingState({
                    status: 'complete',
                    progress: 100,
                    message: '✅ Export Complete!'
                });

                // Reset after 3s
                setTimeout(() => setProcessingState({ status: 'idle', progress: 0 }), 3000);
            });

        } catch (error) {
            console.error('❌ [Download] Error:', error);
            setProcessingState({
                status: 'error',
                progress: 0,
                error: error instanceof Error ? error.message : 'Export failed',
            });
        }
    }, [videoFile, subtitles, reelConfig]);

    // 🎬 DIRECTOR MODEL: Global Analysis - Extract audio, transcribe, and find highlights
    const handleGlobalAnalysis = useCallback(async () => {
        if (!videoFile || !openAIKey) {
            alert('Please upload a video and provide OpenAI API key');
            return;
        }

        try {
            setIsAnalyzingHighlights(true);

            // Step 1: Initialize FFmpeg (0-10%)
            setProcessingState({
                status: 'loading',
                progress: 0,
                message: '🎬 Initializing...'
            });

            const ffmpeg = await getVideoMetadata(videoFile.file).then(() => {
                return import('../utils/ffmpeg').then(m => m.initFFmpeg((p) => {
                    const normalizedProgress = Math.min(100, Math.max(0, p));
                    const finalProgress = Math.min(10, Math.round(normalizedProgress * 0.1));
                    setProcessingState(prev => ({
                        ...prev,
                        progress: finalProgress
                    }));
                }));
            });

            // Step 2: Extract compressed audio (10-30%)
            setProcessingState({
                status: 'loading',
                progress: 10,
                message: '🎤 Extracting audio (compressed for API)...'
            });

            const { extractCompressedAudio } = await import('../utils/ffmpeg');
            const audioBlob = await extractCompressedAudio(ffmpeg, videoFile.file, (p) => {
                const normalizedProgress = Math.min(100, Math.max(0, p));
                const finalProgress = Math.min(30, 10 + Math.round(normalizedProgress * 0.2));
                setProcessingState(prev => ({
                    ...prev,
                    progress: finalProgress
                }));
            });

            console.log('✅ Compressed audio extracted:', (audioBlob.size / 1024 / 1024).toFixed(2), 'MB');

            // Step 3: Transcribe with Whisper (30-70%)
            setProcessingState({
                status: 'transcribing',
                progress: 30,
                message: '🎤 AI is listening to your video...'
            });

            const { transcribeAudio } = await import('../services/whisperService');
            const segments = await transcribeAudio(audioBlob, openAIKey, (progress) => {
                const normalizedProgress = Math.min(100, Math.max(0, progress));
                const finalProgress = Math.min(70, 30 + Math.round(normalizedProgress * 0.4));
                setProcessingState(prev => ({
                    ...prev,
                    progress: finalProgress
                }));
            });

            // Step 4: Optimize subtitles (70-75%)
            setProcessingState({
                status: 'loading',
                progress: 70,
                message: '✨ Optimizing subtitles...'
            });

            const optimized = optimizeSubtitleSegments(segments);
            setSubtitles(optimized);

            console.log(`✅ Generated ${optimized.length} subtitle segments`);

            // Step 5: Analyze highlights (75-100%)
            setProcessingState({
                status: 'loading',
                progress: 75,
                message: '🎯 Finding viral moments...'
            });

            const foundHighlights = await analyzeHighlights(
                optimized,
                videoFile.duration,
                openAIKey,
                (progress) => {
                    const normalizedProgress = Math.min(100, Math.max(0, progress));
                    const finalProgress = Math.min(100, 75 + Math.round(normalizedProgress * 0.25));
                    setProcessingState(prev => ({
                        ...prev,
                        progress: finalProgress,
                        message: progress < 50
                            ? '🎯 AI is analyzing content...'
                            : '✨ Generating captions...'
                    }));
                }
            );

            setHighlights(foundHighlights);
            setIsAnalyzingHighlights(false);

            setProcessingState({
                status: 'complete',
                progress: 100,
                message: `✅ Analysis complete! Found ${foundHighlights.length} viral moments with ${optimized.length} subtitles`
            });

            setTimeout(() => {
                setProcessingState({ status: 'idle', progress: 0 });
            }, 3000);

        } catch (error) {
            console.error('❌ Global analysis failed:', error);
            setIsAnalyzingHighlights(false);
            setProcessingState({
                status: 'error',
                progress: 0,
                error: error instanceof Error ? error.message : 'Analysis failed',
            });
        }
    }, [videoFile, openAIKey]);

    // Handle highlight selection - update timeline
    const handleSelectHighlight = useCallback((start: number, end: number) => {
        if (!videoFile) return;

        const duration = end - start;

        // Update reel config with selected segment
        setReelConfig(prev => ({
            ...prev,
            startTime: start,
            duration: Math.min(60, Math.max(5, duration)) // Clamp between 5-60s
        }));

        // ✅ Use hook to sync
        sync.syncToSegment(start);

        console.log('🎯 Selected highlight:', { start, end, duration });
    }, [videoFile, sync]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (outputVideoUrl) {
                URL.revokeObjectURL(outputVideoUrl);
            }
            if (proxyVideoUrl) {
                URL.revokeObjectURL(proxyVideoUrl);
            }
        };
    }, [outputVideoUrl, proxyVideoUrl]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 md:ml-64">
            {/* Header */}
            <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                <div className="px-6 md:px-8 lg:px-12 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                                <Film className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">Video Reels Cutter</h1>
                                <p className="text-sm text-slate-500">Create perfect 60s vertical reels with AI subtitles</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Settings2 className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8">
                {/* Settings Panel */}
                {showSettings && (
                    <div className="mb-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    OpenAI API Key (for subtitles)
                                </label>
                                <input
                                    type="password"
                                    value={openAIKey}
                                    onChange={(e) => setOpenAIKey(e.target.value)}
                                    placeholder="sk-..."
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Required for AI-powered subtitle generation
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="subtitles-enabled"
                                    checked={reelConfig.subtitlesEnabled}
                                    onChange={(e) => setReelConfig(prev => ({ ...prev, subtitlesEnabled: e.target.checked }))}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                                <label htmlFor="subtitles-enabled" className="text-sm font-medium text-slate-700">
                                    Enable AI Subtitles
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Area */}
                {!videoFile ? (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-20 md:p-32 text-center hover:border-indigo-400 transition-colors">
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="video-upload"
                        />
                        <label htmlFor="video-upload" className="cursor-pointer">
                            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-lg">
                                <Upload className="w-16 h-16 text-indigo-600" />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Upload Your Video</h3>
                            <p className="text-slate-500 mb-8 text-xl max-w-2xl mx-auto">Drag and drop your video file here, or click the button below to browse</p>
                            <div className="inline-flex px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all text-xl">
                                Choose File
                            </div>
                            <p className="text-slate-400 text-sm mt-6">Supported formats: MP4, MOV, AVI, WebM • Max size: 500MB</p>
                        </label>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Triple Layout: Source Video + Result Preview + AI Suggestions */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                            {/* Source Video (Left Panel) */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-200 bg-slate-50">
                                    <h3 className="font-bold text-slate-900">Source Video (16:9)</h3>
                                    <p className="text-sm text-slate-500">
                                        {videoFile.width} × {videoFile.height} • {sync.formatTime(videoFile.duration)}
                                    </p>
                                </div>
                                <div className="relative bg-black aspect-video">
                                    {/* ✅ Remotion Preview with React-based Subtitles */}
                                    <RemotionPreview
                                        videoUrl={proxyVideoUrl || videoFile.url} // ✅ Use Proxy if available
                                        subtitles={subtitles}
                                        styleConfig={PREVIEW_STYLE} // Use shared constant
                                        durationInFrames={Math.floor(videoFile.duration * 30)}
                                        fps={30}
                                        // currentTime removed to avoid re-renders
                                        onFrameUpdate={(frame) => sync.handleFrameUpdate(frame)} // Source starts at 0, frame=global
                                    />
                                </div>
                            </div>

                            {/* Result Preview (Center Panel) */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-200 bg-slate-50">
                                    <h3 className="font-bold text-slate-900">Result Preview (9:16)</h3>
                                    <p className="text-sm text-slate-500">
                                        {subtitles.length > 0 ? `${subtitles.length} subtitles • ${reelConfig.duration}s` : 'Generate subtitles to preview'}
                                    </p>
                                </div>
                                <div className="relative bg-black flex items-center justify-center" style={{ aspectRatio: '9/16', maxHeight: '600px' }}>
                                    {videoFile && subtitles.length > 0 ? (
                                        <>
                                            {/* ✅ Remotion Preview with React-based Subtitles */}
                                            <RemotionPreview
                                                key={`${reelConfig.startTime}-${reelConfig.duration}-${proxyVideoUrl ? 'proxy' : 'original'}`} // Re-mount when proxy ready
                                                ref={sync.playerRef}
                                                videoUrl={proxyVideoUrl || videoFile.url} // ✅ Uses Proxy if available
                                                startTime={reelConfig.startTime} // ✅ Pass offset to component
                                                subtitles={subtitles}
                                                styleConfig={PREVIEW_STYLE} // Use shared constant
                                                durationInFrames={Math.floor(reelConfig.duration * 30)}
                                                fps={30}
                                                // currentTime to avoid re-renders
                                                onFrameUpdate={(frame) => sync.handleFrameUpdate(Math.floor(reelConfig.startTime * 30) + frame)}
                                                onPlay={() => sync.updatePlayingStatus('playing')}
                                                onPause={() => sync.updatePlayingStatus('paused')}
                                            />

                                        </>
                                    ) : (
                                        <div className="text-center p-8 transition-all duration-300">
                                            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                                                <Film className="w-12 h-12 text-slate-400" />
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-300 mb-2">Your reel will appear here</h4>
                                            <p className="text-sm text-slate-400">Click "Create Reel" to generate preview</p>
                                        </div>
                                    )}
                                </div>

                                {/* Download Button - Below preview to avoid overlap */}
                                {videoFile && subtitles.length > 0 && (
                                    <div className="p-4 border-t border-slate-200 bg-slate-50">
                                        <button
                                            onClick={handleDownload}
                                            disabled={processingState.status === 'rendering'}
                                            className="w-full px-6 py-3 bg-[#BA0C2F] text-white font-semibold rounded-xl hover:bg-[#9A0A26] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Download className="w-5 h-5" />
                                            {processingState.status === 'rendering' ? 'Exporting...' : 'Download MP4'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* AI Suggestions Sidebar (Right Panel) */}
                            <div className="xl:row-span-1">
                                <HighlightsSidebar
                                    highlights={highlights}
                                    onSelectHighlight={handleSelectHighlight}
                                    isLoading={isAnalyzingHighlights}
                                />
                            </div>
                        </div>

                        {/* Interactive Timeline - Replaced with PlayerControls */}
                        {videoFile && (
                            <PlayerControls
                                videoDuration={videoFile.duration}
                                reelConfig={reelConfig}
                                onReelConfigChange={setReelConfig}
                                sync={sync}
                            />
                        )}

                        {/* Processing Progress */}
                        {processingState.status !== 'idle' && (
                            <ProcessingProgress
                                status={processingState.status}
                                progress={processingState.progress}
                                message={processingState.message}
                                error={processingState.error}
                            />
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4 justify-center">
                            {/* ✅ Preview Selection Button */}
                            <button
                                onClick={handleCreateReel}
                                disabled={!videoFile || processingState.status === 'loading'}
                                className="px-8 py-4 bg-gradient-to-r from-[#BA0C2F] to-[#9A0A26] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                            >
                                {processingState.status === 'loading' ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>{processingState.message || 'Processing...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Film className="w-5 h-5" />
                                        <span>Preview Selection</span>
                                    </>
                                )}
                            </button>

                            {/* Analyze Full Video Button */}
                            <button
                                onClick={handleGlobalAnalysis}
                                disabled={!videoFile || !openAIKey || isAnalyzingHighlights}
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                            >
                                {isAnalyzingHighlights ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        <span>Analyze Full Video</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    setVideoFile(null);
                                    setSubtitles([]);
                                    setOutputVideo(null);
                                    setHighlights([]);
                                    if (outputVideoUrl) {
                                        URL.revokeObjectURL(outputVideoUrl);
                                        setOutputVideoUrl(null);
                                    }
                                    setProcessingState({ status: 'idle', progress: 0 });
                                }}
                                className="px-8 py-4 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium"
                            >
                                Upload New Video
                            </button>
                        </div>

                        {/* Subtitles Preview */}
                        {subtitles.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
                                    Subtitles ({subtitles.length})
                                </h3>
                                <div className="max-h-64 overflow-y-auto space-y-2">
                                    {subtitles.slice(0, 10).map((sub, idx) => (
                                        <div key={idx} className="text-xs p-2 bg-slate-50 rounded-lg">
                                            <div className="text-slate-500 mb-1">
                                                {Math.floor(sub.start)}s - {Math.floor(sub.end)}s
                                            </div>
                                            <div className="text-slate-900">{sub.text}</div>
                                        </div>
                                    ))}
                                    {subtitles.length > 10 && (
                                        <div className="text-xs text-slate-500 text-center pt-2">
                                            +{subtitles.length - 10} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};
