import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;

/**
 * Initialize FFmpeg WebAssembly
 */
export async function initFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
    console.log('🎬 [FFmpeg Init] Starting initialization...');

    // Check SharedArrayBuffer support
    if (typeof SharedArrayBuffer === 'undefined') {
        const error = 'SharedArrayBuffer is not available. COOP/COEP headers may be missing.';
        console.error('❌ [FFmpeg Init]', error);
        throw new Error(error);
    }
    console.log('✅ [FFmpeg Init] SharedArrayBuffer is available');

    if (ffmpegInstance && ffmpegInstance.loaded) {
        console.log('✅ [FFmpeg Init] Using cached instance');
        return ffmpegInstance;
    }

    const ffmpeg = new FFmpeg();
    console.log('📦 [FFmpeg Init] FFmpeg instance created');

    // Set up progress logging
    ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg Log]', message);
    });

    ffmpeg.on('progress', ({ progress }) => {
        console.log(`[FFmpeg Progress] ${Math.round(progress * 100)}%`);
        if (onProgress) {
            onProgress(Math.round(progress * 100));
        }
    });

    // Load FFmpeg core
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    console.log('📥 [FFmpeg Init] Loading core from:', baseURL);

    try {
        const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
        console.log('✅ [FFmpeg Init] Core JS loaded');

        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
        console.log('✅ [FFmpeg Init] WASM loaded');

        console.log('⚙️ [FFmpeg Init] Calling ffmpeg.load()...');
        await ffmpeg.load({
            coreURL,
            wasmURL,
        });
        console.log('✅ [FFmpeg Init] ffmpeg.load() completed successfully');
    } catch (error) {
        console.error('❌ [FFmpeg Init] Load failed:', error);
        throw error;
    }

    ffmpegInstance = ffmpeg;
    console.log('🎉 [FFmpeg Init] Initialization complete!');
    return ffmpeg;
}

/**
 * Get video metadata (duration, dimensions)
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
 * Extract audio from video as MP3 for Whisper API
 */
export async function extractAudio(
    ffmpeg: FFmpeg,
    inputFile: File | Blob,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const inputName = 'input.mp4';
    const outputName = 'audio.mp3';

    // Write input file to FFmpeg virtual filesystem
    await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

    // Extract audio with high quality MP3
    await ffmpeg.exec([
        '-i', inputName,
        '-vn',                    // No video
        '-acodec', 'libmp3lame',  // MP3 codec
        '-q:a', '2',              // High quality (0-9, lower is better)
        outputName
    ]);

    // Read output file
    const data = await ffmpeg.readFile(outputName);

    // Clean up
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    // Convert FileData to proper Uint8Array for Blob
    const uint8Data = data instanceof Uint8Array ? new Uint8Array(data) : data;
    return new Blob([uint8Data], { type: 'audio/mpeg' });
}

/**
 * Extract compressed audio optimized for Whisper API (stays under 25MB limit)
 * Uses Mono, 16kHz, 64kbps to minimize file size while maintaining transcription quality
 */
export async function extractCompressedAudio(
    ffmpeg: FFmpeg,
    inputFile: File | Blob,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const inputName = 'input.mp4';
    const outputName = 'audio.mp3';

    console.log('🎤 [CompressedAudio] Starting compressed audio extraction...');
    console.log('📦 [CompressedAudio] Input size:', (inputFile.size / 1024 / 1024).toFixed(2), 'MB');

    // Write input file to FFmpeg virtual filesystem
    await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

    // Extract audio with aggressive compression for Whisper API
    // Mono: -ac 1 (reduces size by ~50%)
    // 16kHz: -ar 16000 (Whisper's native sample rate)
    // 64kbps: -b:a 64k (good quality for speech)
    await ffmpeg.exec([
        '-i', inputName,
        '-vn',
        '-ar', '16000',
        '-ac', '1',
        '-b:a', '32k',
        outputName
    ]);

    // Read output file
    const data = await ffmpeg.readFile(outputName);

    console.log('✅ [CompressedAudio] Output size:', (data.length / 1024 / 1024).toFixed(2), 'MB');
    console.log('📊 [CompressedAudio] Compression ratio:', ((1 - data.length / inputFile.size) * 100).toFixed(1), '%');

    // Validate size is under 25MB
    const sizeMB = data.length / 1024 / 1024;
    if (sizeMB > 25) {
        console.warn('⚠️ [CompressedAudio] File still over 25MB:', sizeMB.toFixed(2), 'MB');
        throw new Error(`Audio file too large: ${sizeMB.toFixed(2)}MB (max 25MB). Please use a shorter video.`);
    }

    // Clean up
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    // Convert FileData to proper Uint8Array for Blob
    const uint8Data = data instanceof Uint8Array ? new Uint8Array(data) : data;
    return new Blob([uint8Data], { type: 'audio/mpeg' });
}

/**
 * Trim video to specified duration starting from startTime
 */
export async function trimVideo(
    ffmpeg: FFmpeg,
    inputFile: File,
    startTime: number,
    duration: number,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const inputName = 'input.mp4';
    const outputName = 'trimmed.mp4';

    console.log('✂️ [Trim] Starting trim operation...');
    console.log('⏱️ [Trim] Start:', startTime, 'Duration:', duration);

    // Write input file to FFmpeg virtual filesystem
    await ffmpeg.writeFile(inputName, await fetchFile(inputFile));
    console.log('✅ [Trim] Input written to virtual FS');

    // ✅ FIXED: Use re-encoding instead of stream copy to avoid frame freeze artifacts
    // -ss before -i for faster seeking
    // -avoid_negative_ts to fix timestamp issues
    await ffmpeg.exec([
        '-ss', startTime.toString(),
        '-i', inputName,
        '-t', duration.toString(),
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '18',
        '-avoid_negative_ts', 'make_zero',
        '-c:a', 'copy',
        '-y',
        outputName
    ]);

    console.log('✅ [Trim] FFmpeg exec completed');

    // Read output file
    const data = await ffmpeg.readFile(outputName);

    // ✅ FIXED: Validate output file is not empty/corrupted
    if (data.length < 1000) {
        throw new Error('Trimming failed: output file is empty or corrupted (size: ' + data.length + ' bytes)');
    }

    console.log('📦 [Trim] Output size:', (data.length / 1024 / 1024).toFixed(2), 'MB');

    // Clean up
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    // Convert FileData to proper Uint8Array for Blob
    const uint8Data = data instanceof Uint8Array ? new Uint8Array(data) : data;
    return new Blob([uint8Data], { type: 'video/mp4' });
}

/**
 * Crop video to 9:16 aspect ratio (vertical format for reels)
 */
export async function cropToVertical(
    ffmpeg: FFmpeg,
    inputFile: Blob,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const inputName = 'input.mp4';
    const outputName = 'cropped.mp4';

    console.log('📐 [Crop] Starting crop to 9:16...');

    // Write input file
    await ffmpeg.writeFile(inputName, await fetchFile(inputFile));
    console.log('✅ [Crop] Input written to virtual FS');

    // Calculate crop dimensions for 9:16 aspect ratio
    // This will crop the center portion of the video
    await ffmpeg.exec([
        '-i', inputName,
        '-vf', 'crop=ih*9/16:ih',
        '-c:a', 'copy',
        '-y',
        outputName
    ]);

    console.log('✅ [Crop] FFmpeg exec completed');

    // Read output
    const data = await ffmpeg.readFile(outputName);

    // ✅ FIXED: Validate output file is not empty/corrupted
    if (data.length < 1000) {
        throw new Error('Cropping failed: output file is empty or corrupted (size: ' + data.length + ' bytes)');
    }

    console.log('📦 [Crop] Output size:', (data.length / 1024 / 1024).toFixed(2), 'MB');

    // Clean up
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    const uint8Data = data instanceof Uint8Array ? new Uint8Array(data) : data;
    return new Blob([uint8Data], { type: 'video/mp4' });
}

/**
 * Create a low-resolution proxy video (480p) for smooth preview
 */
export async function createProxyVideo(
    ffmpeg: FFmpeg,
    inputFile: File | Blob,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const inputName = 'input_proxy.mp4';
    const outputName = 'proxy.mp4';

    console.log('🔄 [Proxy] Starting proxy generation...');

    // Write input file
    await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

    // Scale to 480p, use ultrafast preset for speed, lower quality (CRF 30)
    // 854x480 is standard 480p 16:9
    await ffmpeg.exec([
        '-i', inputName,
        '-vf', 'scale=854:480',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '30',
        '-c:a', 'copy',
        '-y',
        outputName
    ]);

    console.log('✅ [Proxy] FFmpeg exec completed');

    const data = await ffmpeg.readFile(outputName);

    // Validate
    if (data.length < 1000) {
        throw new Error('Proxy generation failed: output file is empty');
    }

    console.log('📦 [Proxy] Output size:', (data.length / 1024 / 1024).toFixed(2), 'MB');

    // Clean up
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    const uint8Data = data instanceof Uint8Array ? new Uint8Array(data) : data;
    return new Blob([uint8Data], { type: 'video/mp4' });
}

/**
 * Add subtitles to video using FFmpeg drawtext filter (WASM-compatible)
 */
export async function addSubtitlesToVideo(
    ffmpeg: FFmpeg,
    inputFile: Blob,
    subtitles: Array<{ start: number; end: number; text: string }>,
    style: {
        fontFamily: string;
        fontSize: number;
        color: string;
        strokeColor: string;
        strokeWidth: number;
    },
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const inputName = 'input.mp4';
    const outputName = 'subtitled.mp4';
    const srtName = 'subtitles.srt';

    // ✅ FIXED: Hardcoded font mapping for Eurostile Medium Italic
    const fontName = 'fonnts.com-Eurostile_Medium_Italic.otf';
    const vfsFontName = 'eurostile.ttf'; // Simpler name for VFS to avoid issues

    console.log('🎬 [Subtitles] Starting subtitle rendering...');
    console.log('📝 [Subtitles] Segments:', subtitles.length);

    if (subtitles.length === 0) {
        console.log('⚠️ [Subtitles] No subtitles, returning input');
        return inputFile;
    }

    try {
        // ✅ FIXED: Load font into virtual filesystem
        console.log('📥 [Subtitles] Loading font:', fontName);
        try {
            const fontResponse = await fetch(`/fonts/${fontName}`);
            if (!fontResponse.ok) {
                throw new Error(`Font not found: ${fontName} (status: ${fontResponse.status})`);
            }
            const fontData = await fontResponse.arrayBuffer();
            await ffmpeg.writeFile(vfsFontName, new Uint8Array(fontData));
            console.log('✅ [Subtitles] Font loaded successfully as:', vfsFontName);
        } catch (fontError) {
            console.error('❌ [Subtitles] Font loading failed:', fontError);
            throw new Error(`Failed to load font ${fontName}: ${fontError instanceof Error ? fontError.message : 'Unknown error'}`);
        }

        // ✅ FIXED: Generate SRT file instead of using drawtext
        console.log('📝 [Subtitles] Generating SRT file...');
        const srtContent = generateSRT(subtitles);
        console.log('📝 [Subtitles] SRT Content Preview:', srtContent.substring(0, 200));
        await ffmpeg.writeFile(srtName, new TextEncoder().encode(srtContent));
        console.log('✅ [Subtitles] SRT file created:', subtitles.length, 'segments');

        // Write input video
        await ffmpeg.writeFile(inputName, await fetchFile(inputFile));
        console.log('✅ [Subtitles] Input video written');

        // ✅ FIXED: Use subtitles filter with HARDCODED style for Eurostile
        // Use colorToHex to swap RGB -> BGR for FFmpeg
        // Added 00 alpha (opaque) prefix to match standard ASS format: &H00BBGGRR&
        const primaryColor = '&H00' + colorToHex(style.color) + '&';
        const outlineColor = '&H00' + colorToHex(style.strokeColor) + '&';

        // Internal comma in option list?
        // force_style='FontName=Eurostile,Bold=1,Italic=1,...' 
        // The entire string is quoted, so commas are safe.
        const forceStyle = [
            // `FontName=Eurostile`,          // REMOVED for Blind Font Test
            `FontSize=${style.fontSize}`,
            `PrimaryColour=${primaryColor}`,
            `OutlineColour=${outlineColor}`,
            // `Outline=${style.strokeWidth}`, // Changed for box
            `Alignment=2`,
            `MarginV=60`,
            `Italic=1`,
            `Bold=1`,
            `BorderStyle=3`,               // Opaque box
            `Outline=0`,                   // No outline for box mode
            `BackColour=&H80000000&`       // Semi-transparent black
        ].join(',');

        console.log('🎨 [Subtitles] Applying subtitles filter...');
        console.log('🎨 [Subtitles] Style:', forceStyle);

        // ✅ EMERGENCY FIX: 
        // 1. Re-wrapped force_style in simple single quotes (User instruction)
        // 2. Removed leading slashes from VFS paths (subtitles.srt, fontsdir=.)
        // 3. One continuous string for the filter argument
        await ffmpeg.exec([
            '-i', inputName,
            '-vf', `subtitles=${srtName}:fontsdir=.:force_style='${forceStyle}'`,
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            '-c:a', 'copy',
            '-max_muxing_queue_size', '1024',
            '-y',
            outputName
        ]);

        console.log('✅ [Subtitles] FFmpeg completed');

        const data = await ffmpeg.readFile(outputName);

        // ✅ FIXED: Validate output file is not empty/corrupted
        if (data.length < 1000) {
            throw new Error('Subtitle rendering failed: output file is empty or corrupted (size: ' + data.length + ' bytes)');
        }

        console.log('📦 [Subtitles] Output size:', (data.length / 1024 / 1024).toFixed(2), 'MB');

        // Clean up
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
        await ffmpeg.deleteFile(srtName);
        await ffmpeg.deleteFile(vfsFontName);

        const uint8Data = data instanceof Uint8Array ? new Uint8Array(data) : data;
        return new Blob([uint8Data], { type: 'video/mp4' });
    } catch (error) {
        console.error('❌ [Subtitles] Error:', error);
        // Cleanup on error
        try {
            await ffmpeg.deleteFile(inputName).catch(() => { });
            await ffmpeg.deleteFile(outputName).catch(() => { });
            await ffmpeg.deleteFile(srtName).catch(() => { });
            await ffmpeg.deleteFile(vfsFontName).catch(() => { });
        } catch { }
        throw error;
    }
}

/**
 * Generate SRT subtitle format
 */
function generateSRT(subtitles: Array<{ start: number; end: number; text: string }>): string {
    return subtitles
        .map((sub, index) => {
            const startTime = formatSRTTime(sub.start);
            const endTime = formatSRTTime(sub.end);
            return `${index + 1}\n${startTime} --> ${endTime}\n${sub.text}\n`;
        })
        .join('\n');
}

/**
 * Format time in SRT format (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

/**
 * Convert CSS color to FFmpeg hex format
 */
function colorToHex(color: string): string {
    // Remove # if present
    const hex = color.replace('#', '');

    // Convert RGB to BGR for FFmpeg
    if (hex.length === 6) {
        const r = hex.substring(0, 2);
        const g = hex.substring(2, 4);
        const b = hex.substring(4, 6);
        return `${b}${g}${r}`;
    }

    return hex;
}

/**
 * Process complete reel: trim, crop, and add subtitles (FIXED with error monitoring)
 */
/**
 * Process complete reel: trim, crop, and add subtitles (Native M2 Backend)
 */
export async function processCompleteReel(
    inputFile: File,
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

    // Fallback to WASM if backend is down? 
    // No, per user request we are "Transitioning to Native M2 FFmpeg".
    // We assume the user runs the backend.

    console.log('🚀 [ProcessReel] Starting M2 Hardware Export...');
    onProgress?.('rendering', 0);
    onProgress?.('info', 1); // Hack to show message if UI supports it? 
    // Actually the user asked: Add a loading state: "Rendering on M2 Hardware...".
    // We can't change the UI component from here, but we can log it.
    // If onProgress accepts string, we can pass "Rendering on M2 Hardware..." as stage.

    try {
        const formData = new FormData();

        // Pass metadata safely
        formData.append('startTime', startTime.toString());
        formData.append('duration', duration.toString());
        formData.append('subtitles', JSON.stringify(subtitles));
        formData.append('style', JSON.stringify(style));

        // Determine if we can send just the path (faster) or need to upload
        // In browser, File.path is usually empty or fake.
        // But if user is running in Electron or similar, it might be there.
        // User requested: "Pass the file paths...".
        // We TRY to pass the path.
        // @ts-ignore
        const inputPath = inputFile.path || (inputFile as any).file_path; // Common electron/custom props

        if (inputPath) {
            console.log('📂 [ProcessReel] Using local file path:', inputPath);
            formData.append('inputPath', inputPath);
        } else {
            console.log('📤 [ProcessReel] Uploading file to backend (no path access)...');
            formData.append('video', inputFile);
        }

        const response = await fetch('http://localhost:3001/export', {
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
