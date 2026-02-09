// Example: Using FFmpeg utilities directly

import {
    initFFmpeg,
    trimVideo,
    cropToVertical,
    processCompleteReel
} from '../utils/ffmpeg';

// Example 1: Initialize FFmpeg
async function example1_InitFFmpeg() {
    const ffmpeg = await initFFmpeg((progress) => {
        console.log(`Loading FFmpeg: ${progress}%`);
    });
    console.log('FFmpeg ready!');
}

// Example 2: Trim a video
async function example2_TrimVideo(videoFile: File) {
    const ffmpeg = await initFFmpeg();

    const trimmedBlob = await trimVideo(
        ffmpeg,
        videoFile,
        30, // Start at 30 seconds
        60, // Duration: 60 seconds
        (progress) => console.log(`Trimming: ${progress}%`)
    );

    // Download trimmed video
    const url = URL.createObjectURL(trimmedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trimmed.mp4';
    a.click();
}

// Example 3: Crop to vertical format
async function example3_CropToVertical(videoFile: File) {
    const ffmpeg = await initFFmpeg();

    const croppedBlob = await cropToVertical(
        ffmpeg,
        videoFile,
        (progress) => console.log(`Cropping: ${progress}%`)
    );

    return croppedBlob;
}

// Example 4: Complete reel processing
async function example4_CompleteReel(videoFile: File) {
    const subtitles = [
        { start: 0, end: 3, text: 'Welcome to our channel!' },
        { start: 3, end: 6, text: 'Today we will show you...' },
        { start: 6, end: 10, text: 'How to create amazing reels' },
    ];

    const style = {
        fontFamily: 'TT Lakes Neue',
        fontSize: 48,
        color: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 3,
    };

    const outputBlob = await processCompleteReel(
        videoFile,
        0, // Start time
        60, // Duration
        subtitles,
        style,
        (stage, progress) => {
            console.log(`${stage}: ${progress}%`);
        }
    );

    return outputBlob;
}

// Example 5: Using Whisper API for transcription
import { transcribeVideo, optimizeSubtitleSegments } from '../services/whisperService';

async function example5_TranscribeVideo(videoFile: File, apiKey: string) {
    const segments = await transcribeVideo(
        videoFile,
        apiKey,
        (progress) => console.log(`Transcribing: ${progress}%`)
    );

    console.log('Raw segments:', segments);

    // Optimize for better readability
    const optimized = optimizeSubtitleSegments(segments, 5); // Max 5 seconds per segment

    console.log('Optimized segments:', optimized);

    return optimized;
}

// Example 6: Custom subtitle styling
import { SubtitleStyle } from '../types/video';

const customStyles: Record<string, SubtitleStyle> = {
    bold: {
        fontFamily: 'TT Lakes Neue',
        fontSize: 56,
        color: '#FFD700',
        strokeColor: '#000000',
        strokeWidth: 4,
        position: 'center',
    },

    minimal: {
        fontFamily: 'TT Lakes Neue',
        fontSize: 40,
        color: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        position: 'bottom',
    },

    dramatic: {
        fontFamily: 'TT Lakes Neue',
        fontSize: 64,
        color: '#FF0000',
        strokeColor: '#FFFFFF',
        strokeWidth: 5,
        position: 'top',
    },
};

// Example 7: React component with custom hooks
import { useState, useCallback } from 'react';
import { VideoFile, VideoProcessingState } from '../types/video';

function useVideoProcessor() {
    const [state, setState] = useState<VideoProcessingState>({
        status: 'idle',
        progress: 0,
    });

    const processVideo = useCallback(async (
        videoFile: File,
        startTime: number,
        duration: number
    ) => {
        try {
            setState({ status: 'loading', progress: 0 });

            const output = await processCompleteReel(
                videoFile,
                startTime,
                duration,
                [],
                customStyles.bold,
                (stage, progress) => {
                    setState({
                        status: stage as any,
                        progress,
                        message: `Processing ${stage}...`,
                    });
                }
            );

            setState({ status: 'complete', progress: 100 });
            return output;
        } catch (error) {
            setState({
                status: 'error',
                progress: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }, []);

    return { state, processVideo };
}

// Example 8: Batch processing multiple videos
async function example8_BatchProcess(videoFiles: File[]) {
    const results: Blob[] = [];

    for (let i = 0; i < videoFiles.length; i++) {
        console.log(`Processing video ${i + 1}/${videoFiles.length}`);

        const output = await processCompleteReel(
            videoFiles[i],
            0,
            60,
            [],
            customStyles.minimal,
            (stage, progress) => {
                console.log(`Video ${i + 1} - ${stage}: ${progress}%`);
            }
        );

        results.push(output);
    }

    return results;
}

// Example 9: Error handling
async function example9_ErrorHandling(videoFile: File) {
    try {
        const output = await processCompleteReel(
            videoFile,
            0,
            60,
            [],
            customStyles.bold,
            (stage, progress) => {
                console.log(`${stage}: ${progress}%`);
            }
        );

        return { success: true, data: output };
    } catch (error) {
        console.error('Processing failed:', error);

        if (error instanceof Error) {
            if (error.message.includes('FFmpeg')) {
                return { success: false, error: 'FFmpeg initialization failed' };
            } else if (error.message.includes('memory')) {
                return { success: false, error: 'Not enough memory' };
            } else {
                return { success: false, error: error.message };
            }
        }

        return { success: false, error: 'Unknown error occurred' };
    }
}

// Example 10: Progress tracking with React
import { useEffect } from 'react';

function VideoProcessingComponent() {
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState('');

    const handleProcess = async (videoFile: File) => {
        await processCompleteReel(
            videoFile,
            0,
            60,
            [],
            customStyles.bold,
            (currentStage, currentProgress) => {
                setStage(currentStage);
                setProgress(currentProgress);
            }
        );
    };

    return (
        <div>
        <div>Stage: { stage } </div>
            < div > Progress: { progress }% </div>
                < progress value = { progress } max = { 100} />
                    </div>
  );
}

export {
    example1_InitFFmpeg,
    example2_TrimVideo,
    example3_CropToVertical,
    example4_CompleteReel,
    example5_TranscribeVideo,
    example8_BatchProcess,
    example9_ErrorHandling,
    useVideoProcessor,
    customStyles,
};
