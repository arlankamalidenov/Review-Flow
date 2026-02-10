// Backend API base URL
const API_BASE_URL = 'http://localhost:3001';

/**
 * Initialize FFmpeg - No-op since we moved to backend
 */
export async function initFFmpeg(onProgress?: (progress: number) => void): Promise<any> {
    console.log('Backend-based processing initialized.');
    return null;
}

/**
 * Get video metadata (duration, dimensions)
 * Kept client-side for speed
 */
export async function getVideoMetadata(file: File): Promise<{
    duration: number;
    width: number;
    height: number;
}> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            resolve({
                duration: video.duration,
                width: video.videoWidth,
                height: video.videoHeight,
            });
            URL.revokeObjectURL(video.src);
        };

        video.onerror = () => {
            reject(new Error('Failed to load video metadata'));
            URL.revokeObjectURL(video.src);
        };

        video.src = URL.createObjectURL(file);
    });
}

/**
 * Upload video to backend and get server path
 */
export async function uploadVideo(file: File): Promise<{ filePath: string; filename: string }> {
    const formData = new FormData();
    formData.append('video', file);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Video upload failed');
    }

    return response.json();
}

/**
 * Extract audio via Backend API
 */
export async function extractCompressedAudio(
    ffmpeg: any, // Unused
    inputFile: File | { filePath?: string; path?: string; file?: File }, // Accept File or backend object
    onProgress?: (progress: number) => void
): Promise<Blob> {

    let videoPath: string | undefined;
    let fileToUpload: File | undefined;

    if (inputFile instanceof File) {
        fileToUpload = inputFile;
    } else {
        // @ts-ignore
        videoPath = inputFile.filePath || inputFile.path;
        // @ts-ignore
        if (!videoPath && inputFile.file instanceof File) {
            // @ts-ignore
            fileToUpload = inputFile.file;
        }
    }

    // Check if we need to upload first
    if (!videoPath && fileToUpload) {
        console.log('📤 [Audio] Uploading video first...');
        onProgress?.(10);
        const uploaded = await uploadVideo(fileToUpload);
        videoPath = uploaded.filePath;
        onProgress?.(30);
    } else if (!videoPath) {
        throw new Error('No video file or path provided for audio extraction');
    }

    console.log('mic [Audio] Requesting extraction from backend...');
    onProgress?.(50);

    const response = await fetch(`${API_BASE_URL}/api/extract-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoPath })
    });

    if (!response.ok) {
        throw new Error('Audio extraction failed');
    }

    onProgress?.(100);
    return await response.blob();
}

/**
 * Process complete reel: trim, crop, and add subtitles (Native M2 Backend)
 */
export async function processCompleteReel(
    inputFile: File | { filePath?: string; path?: string; file?: File },
    startTime: number,
    duration: number,
    subtitles: Array<{ start: number; end: number; text: string }>,
    style: {
        fontFamily: string;
        fontSize: number;
        color: string;
    },
    onProgress?: (stage: string, progress: number) => void
): Promise<Blob> {

    console.log('🚀 [ProcessReel] Starting M2 Hardware Export...');
    onProgress?.('rendering', 0);
    onProgress?.('info', 1);

    try {
        const formData = new FormData();

        // Pass metadata safely
        formData.append('startTime', startTime.toString());
        formData.append('duration', duration.toString());
        formData.append('subtitles', JSON.stringify(subtitles));
        formData.append('style', JSON.stringify(style));

        let inputPath: string | undefined;
        let fileToUpload: File | undefined;

        if (inputFile instanceof File) {
            fileToUpload = inputFile;
        } else {
            // @ts-ignore
            inputPath = inputFile.filePath || inputFile.path;
            // @ts-ignore
            if (!inputPath && inputFile.file instanceof File) {
                // @ts-ignore
                fileToUpload = inputFile.file;
            }
        }

        if (inputPath) {
            console.log('📂 [ProcessReel] Using backend file path:', inputPath);
            formData.append('inputPath', inputPath);
        } else if (fileToUpload) {
            console.log('📤 [ProcessReel] Uploading file to backend (no path access)...');
            formData.append('video', fileToUpload);
        } else {
            throw new Error('No input file or path provided for rendering');
        }

        const response = await fetch(`${API_BASE_URL}/export`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Export failed: ${err.error || response.statusText}`);
        }

        onProgress?.('rendering', 100);
        console.log('✅ [ProcessReel] M2 Export Complete!');

        return await response.blob();

    } catch (error) {
        console.error('❌ [ProcessReel] Error calling backend:', error);
        throw error;
    }
}

