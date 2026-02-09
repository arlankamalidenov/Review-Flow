// ✅ WYSIWYG Export Pipeline using Remotion WebCodecs
// This ensures subtitles in the final MP4 match the preview exactly

import { renderMedia } from '@remotion/webcodecs';
import { VideoReelProps } from '../video-reels/Composition';
import { downloadVideoFile } from './downloadHelper';

interface ExportOptions {
    videoUrl: string;
    subtitles: VideoReelProps['subtitles'];
    styleConfig: VideoReelProps['styleConfig'];
    durationInFrames: number;
    fps?: number;
    onProgress?: (stage: string, progress: number) => void;
}

/**
 * ✅ Export video with WebCodecs (WYSIWYG - What You See Is What You Get)
 * This produces an MP4 where subtitles match the preview exactly
 */
export const exportWithWebCodecs = async ({
    videoUrl,
    subtitles,
    styleConfig,
    durationInFrames,
    fps = 30,
    onProgress,
}: ExportOptions): Promise<Blob> => {
    console.log('🎬 [WebCodecs Export] Starting WYSIWYG export...');
    console.log('📝 [WebCodecs Export] Subtitles:', subtitles.length);
    console.log('⏱️ [WebCodecs Export] Duration:', durationInFrames, 'frames');
    console.log('🖥️ [WebCodecs Export] Hardware cores:', navigator.hardwareConcurrency);

    try {
        onProgress?.('encoding', 0);

        // ✅ Hardware optimization for MacBook Pro M-series
        const concurrency = Math.max(1, Math.floor((navigator.hardwareConcurrency || 8) * 0.75));
        const bitrate = 6_000_000; // 6 Mbps for high-quality Reels

        console.log('⚙️ [WebCodecs Export] Concurrency:', concurrency);
        console.log('📊 [WebCodecs Export] Bitrate:', (bitrate / 1_000_000).toFixed(1), 'Mbps');

        // ✅ Render using WebCodecs
        const { buffer, save } = await renderMedia({
            composition: {
                id: 'VideoReel',
                width: 1080,
                height: 1920,
                fps,
                durationInFrames,
                defaultProps: {
                    videoUrl,
                    subtitles,
                    styleConfig,
                },
            },
            codec: 'h264',
            // @ts-ignore - WebCodecs specific options
            videoBitrate: bitrate,
            concurrency,
            onProgress: ({ progress, renderedFrames, encodedFrames }) => {
                const percent = Math.round(progress * 100);
                console.log(
                    `🎬 [WebCodecs Export] Progress: ${percent}% (${renderedFrames}/${durationInFrames} frames, ${encodedFrames} encoded)`
                );

                if (progress < 0.8) {
                    onProgress?.('encoding', Math.round(progress * 80));
                } else {
                    onProgress?.('finalizing', 80 + Math.round((progress - 0.8) * 100));
                }
            },
            onDownload: (src) => {
                console.log('📥 [WebCodecs Export] Download ready:', src);
            },
        });

        onProgress?.('finalizing', 95);

        // ✅ Convert buffer to Blob
        console.log('📦 [WebCodecs Export] Creating blob...');
        const blob = new Blob([buffer], { type: 'video/mp4' });
        console.log('✅ [WebCodecs Export] Export complete:', (blob.size / 1024 / 1024).toFixed(2), 'MB');

        onProgress?.('complete', 100);

        return blob;

    } catch (error) {
        console.error('❌ [WebCodecs Export] Error:', error);
        throw new Error(`WebCodecs export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * ✅ Hybrid Pipeline: FFmpeg (trim/crop) + WebCodecs (subtitles)
 * Phase A: FFmpeg trims and crops to 9:16
 * Phase B: WebCodecs renders with React-based subtitles
 */
export const exportHybridPipeline = async ({
    inputFile,
    startTime,
    duration,
    subtitles,
    styleConfig,
    onProgress,
}: {
    inputFile: File;
    startTime: number;
    duration: number;
    subtitles: VideoReelProps['subtitles'];
    styleConfig: VideoReelProps['styleConfig'];
    onProgress?: (stage: string, progress: number) => void;
}): Promise<Blob> => {
    console.log('🎬 [Hybrid Pipeline] Starting export...');

    try {
        // ✅ Phase A: FFmpeg for trimming and cropping
        onProgress?.('trimming', 0);
        console.log('✂️ [Hybrid Pipeline] Phase A: FFmpeg preprocessing...');

        const { initFFmpeg, trimVideo, cropToVertical } = await import('./ffmpeg');

        const ffmpeg = await initFFmpeg((p) => {
            onProgress?.('trimming', Math.round(p * 20)); // 0-20%
        });

        // Trim
        console.log('✂️ [Hybrid Pipeline] Trimming video...');
        const trimmed = await trimVideo(ffmpeg, inputFile, startTime, duration, (p) => {
            onProgress?.('trimming', 20 + Math.round(p * 15)); // 20-35%
        });

        // Crop to 9:16
        console.log('📐 [Hybrid Pipeline] Cropping to 9:16...');
        const cropped = await cropToVertical(ffmpeg, trimmed, (p) => {
            onProgress?.('cropping', 35 + Math.round(p * 15)); // 35-50%
        });

        // Convert blob to URL for Remotion
        const croppedUrl = URL.createObjectURL(cropped);

        // ✅ Phase B: WebCodecs for subtitle rendering
        onProgress?.('encoding', 50);
        console.log('🎬 [Hybrid Pipeline] Phase B: WebCodecs rendering...');

        const fps = 30;
        const durationInFrames = Math.floor(duration * fps);

        const result = await exportWithWebCodecs({
            videoUrl: croppedUrl,
            subtitles,
            styleConfig,
            durationInFrames,
            fps,
            onProgress: (stage, progress) => {
                // Map 50-100% range
                const mappedProgress = 50 + Math.round(progress * 0.5);
                onProgress?.(stage, mappedProgress);
            },
        });

        // Cleanup
        URL.revokeObjectURL(croppedUrl);

        console.log('✅ [Hybrid Pipeline] Export complete!');
        return result;

    } catch (error) {
        console.error('❌ [Hybrid Pipeline] Error:', error);
        throw new Error(`Hybrid export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * ✅ Download exported video with reliable anchor injection
 */
export const downloadExportedVideo = async (blob: Blob, filename: string = `reel_${Date.now()}.mp4`) => {
    console.log('📥 [Download] Starting download:', filename);
    console.log('📦 [Download] Size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');

    await downloadVideoFile(blob, filename);

    console.log('✅ [Download] Complete!');
};
