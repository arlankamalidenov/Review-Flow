// ✅ Remotion Server-Side Renderer - Replaces FFmpeg for subtitle rendering

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { VideoReelProps } from '../video-reels/Composition';
import path from 'path';

interface RenderOptions {
    videoUrl: string;
    subtitles: VideoReelProps['subtitles'];
    styleConfig: VideoReelProps['styleConfig'];
    durationInFrames: number;
    fps?: number;
    onProgress?: (progress: number) => void;
}

/**
 * ✅ Render video with Remotion (React-based subtitles)
 * This replaces the old FFmpeg rendering
 */
export const renderWithRemotion = async ({
    videoUrl,
    subtitles,
    styleConfig,
    durationInFrames,
    fps = 30,
    onProgress,
}: RenderOptions): Promise<Blob> => {
    console.log('🎬 [Remotion Renderer] Starting render...');
    console.log('📝 [Remotion Renderer] Subtitles count:', subtitles.length);
    console.log('⏱️ [Remotion Renderer] Duration:', durationInFrames, 'frames');

    try {
        // Step 1: Bundle Remotion project
        onProgress?.(10);
        console.log('📦 [Remotion Renderer] Bundling project...');

        const bundleLocation = await bundle({
            entryPoint: path.resolve(__dirname, '../video-reels/Root.tsx'),
            // @ts-ignore
            webpackOverride: (config) => config,
        });

        console.log('✅ [Remotion Renderer] Bundle created:', bundleLocation);
        onProgress?.(30);

        // Step 2: Select composition
        console.log('🎯 [Remotion Renderer] Selecting composition...');
        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: 'VideoReel',
            inputProps: {
                videoUrl,
                subtitles,
                styleConfig,
            },
        });

        console.log('✅ [Remotion Renderer] Composition selected');
        onProgress?.(50);

        // Step 3: Render video
        console.log('🎬 [Remotion Renderer] Rendering video...');
        const outputPath = path.resolve(__dirname, `../../temp/output_${Date.now()}.mp4`);

        await renderMedia({
            composition,
            serveUrl: bundleLocation,
            codec: 'h264',
            outputLocation: outputPath,
            inputProps: {
                videoUrl,
                subtitles,
                styleConfig,
            },
            onProgress: ({ progress }) => {
                const renderProgress = 50 + Math.round(progress * 50);
                onProgress?.(renderProgress);
                console.log(`🎬 [Remotion Renderer] Progress: ${Math.round(progress * 100)}%`);
            },
        });

        console.log('✅ [Remotion Renderer] Render complete:', outputPath);
        onProgress?.(100);

        // Step 4: Read file as Blob
        const fs = await import('fs');
        const buffer = fs.readFileSync(outputPath);
        const blob = new Blob([buffer], { type: 'video/mp4' });

        // Cleanup
        fs.unlinkSync(outputPath);

        return blob;

    } catch (error) {
        console.error('❌ [Remotion Renderer] Error:', error);
        throw new Error(`Remotion rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
