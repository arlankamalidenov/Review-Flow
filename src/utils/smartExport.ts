// ✅ One-Click Export Logic - Smart Chain Processing

import { VideoFile, SubtitleSegment, VideoProcessingState } from '../types/video';

interface SmartExportOptions {
    videoFile: VideoFile;
    subtitles: SubtitleSegment[];
    openAIKey: string;
    startTime: number;
    duration: number;
    onProgress: (state: VideoProcessingState) => void;
    onSubtitlesGenerated?: (subtitles: SubtitleSegment[]) => void;
}

/**
 * ✅ Smart Chain: Auto-generate subtitles if missing, then render
 * 
 * Flow:
 * 1. Check if subtitles exist
 * 2. If not → Generate with Whisper (AI is listening...)
 * 3. Then → Render video (Rendering video...)
 * 4. Return final blob
 */
export const smartExportReel = async ({
    videoFile,
    subtitles,
    openAIKey,
    startTime,
    duration,
    onProgress,
    onSubtitlesGenerated,
}: SmartExportOptions): Promise<Blob> => {
    let finalSubtitles = subtitles;

    // ✅ Step 1: Check if subtitles exist
    if (!subtitles || subtitles.length === 0) {
        console.log('🎤 [Smart Export] No subtitles found, generating with Whisper...');

        onProgress({
            status: 'loading',
            progress: 0,
            message: '🎤 AI is listening...'
        });

        // Import Whisper service
        const { transcribeVideo, optimizeSubtitleSegments, adjustSubtitleTiming } = await import('../services/whisperService');
        const { initFFmpeg, extractAudio } = await import('../utils/ffmpeg');

        // Initialize FFmpeg
        const ffmpeg = await initFFmpeg((p) => {
            onProgress({
                status: 'loading',
                progress: Math.round(p * 20), // 0-20%
                message: '🎤 AI is listening...'
            });
        });

        // Extract audio
        onProgress({
            status: 'loading',
            progress: 20,
            message: '🎤 Extracting audio...'
        });

        const audioBlob = await extractAudio(ffmpeg, videoFile.file, (p) => {
            onProgress({
                status: 'loading',
                progress: 20 + Math.round(p * 20), // 20-40%
                message: '🎤 Extracting audio...'
            });
        });

        // Transcribe with Whisper
        onProgress({
            status: 'loading',
            progress: 40,
            message: '🎤 AI is listening...'
        });

        const rawSegments = await transcribeVideo(audioBlob, openAIKey, (p) => {
            onProgress({
                status: 'loading',
                progress: 40 + Math.round(p * 30), // 40-70%
                message: '🎤 AI is listening...'
            });
        });

        // Optimize subtitles
        onProgress({
            status: 'loading',
            progress: 70,
            message: '✨ Optimizing subtitles...'
        });

        const optimizedSegments = optimizeSubtitleSegments(rawSegments);
        finalSubtitles = adjustSubtitleTiming(optimizedSegments, startTime, duration);

        console.log(`✅ [Smart Export] Generated ${finalSubtitles.length} subtitle segments`);

        // Notify parent component
        if (onSubtitlesGenerated) {
            onSubtitlesGenerated(finalSubtitles);
        }
    } else {
        console.log(`✅ [Smart Export] Using existing ${subtitles.length} subtitle segments`);
    }

    // ✅ Step 2: Render video with subtitles
    console.log('🎬 [Smart Export] Starting video rendering...');

    onProgress({
        status: 'loading',
        progress: 75,
        message: '🎬 Rendering video...'
    });

    const { processCompleteReel } = await import('../utils/ffmpeg');

    const outputBlob = await processCompleteReel(
        videoFile.file,
        finalSubtitles,
        {
            startTime,
            duration,
            targetWidth: 1080,
            targetHeight: 1920,
            subtitleStyle: {
                fontFamily: 'Inter',
                fontSize: 40,
                color: '#FFFFFF',
                strokeColor: '#BA0C2F',
                strokeWidth: 2,
            }
        },
        (p) => {
            onProgress({
                status: 'loading',
                progress: 75 + Math.round(p * 25), // 75-100%
                message: '🎬 Rendering video...'
            });
        }
    );

    onProgress({
        status: 'complete',
        progress: 100,
        message: '✅ Reel created successfully!'
    });

    console.log('✅ [Smart Export] Export complete!');

    return outputBlob;
};
