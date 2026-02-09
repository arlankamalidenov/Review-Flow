import OpenAI from 'openai';
import { SubtitleSegment } from '../types/video';

/**
 * Transcribe audio/video using OpenAI Whisper API with word-level timestamps
 */
export async function transcribeAudio(
    audioFile: File | Blob,
    apiKey: string,
    onProgress?: (progress: number) => void
): Promise<SubtitleSegment[]> {
    if (!apiKey) {
        throw new Error('OpenAI API key is required');
    }

    const openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
    });

    try {
        onProgress?.(10);

        // Convert Blob to File if needed
        const file = audioFile instanceof File
            ? audioFile
            : new File([audioFile], 'audio.mp3', { type: 'audio/mpeg' });

        console.log('🎤 Sending audio to Whisper API...');
        console.log('📦 Audio size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

        // Transcribe with word-level timestamps
        const transcription = await openai.audio.transcriptions.create({
            file,
            model: 'whisper-1',
            response_format: 'verbose_json',
            timestamp_granularities: ['word', 'segment'],
        });

        onProgress?.(90);

        console.log('✅ Transcription received');

        // Convert to subtitle segments
        const segments: SubtitleSegment[] = [];

        // Use word-level timestamps if available for more precise subtitles
        if ('words' in transcription && Array.isArray(transcription.words)) {
            console.log('📝 Processing', transcription.words.length, 'words');

            // Group words into 3-5 second segments
            let currentSegment: SubtitleSegment | null = null;
            const maxSegmentDuration = 5;

            for (const word of transcription.words) {
                if (!currentSegment) {
                    currentSegment = {
                        start: word.start,
                        end: word.end,
                        text: word.word.trim(),
                        words: [{
                            word: word.word.trim(),
                            start: word.start,
                            end: word.end
                        }]
                    };
                } else {
                    const potentialDuration = word.end - currentSegment.start;

                    if (potentialDuration <= maxSegmentDuration) {
                        // Add to current segment
                        currentSegment.end = word.end;
                        currentSegment.text += ' ' + word.word.trim();
                        currentSegment.words?.push({
                            word: word.word.trim(),
                            start: word.start,
                            end: word.end
                        });
                    } else {
                        // Save current segment and start new one
                        segments.push(currentSegment);
                        currentSegment = {
                            start: word.start,
                            end: word.end,
                            text: word.word.trim(),
                            words: [{
                                word: word.word.trim(),
                                start: word.start,
                                end: word.end
                            }]
                        };
                    }
                }
            }

            // Add last segment
            if (currentSegment) {
                segments.push(currentSegment);
            }
        }
        // Fallback to segment-level timestamps
        else if ('segments' in transcription && Array.isArray(transcription.segments)) {
            console.log('📝 Processing', transcription.segments.length, 'segments');

            for (const segment of transcription.segments) {
                segments.push({
                    start: segment.start,
                    end: segment.end,
                    text: segment.text.trim(),
                });
            }
        }

        onProgress?.(100);
        console.log('✅ Generated', segments.length, 'subtitle segments');

        return segments;
    } catch (error) {
        console.error('❌ Transcription error:', error);
        throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Legacy function for backward compatibility
 */
export async function transcribeVideo(
    videoFile: File | Blob,
    apiKey: string,
    onProgress?: (progress: number) => void
): Promise<SubtitleSegment[]> {
    return transcribeAudio(videoFile, apiKey, onProgress);
}

/**
 * Split long segments into shorter ones for better readability
 * Aims for 3-5 second segments
 */
export function optimizeSubtitleSegments(
    segments: SubtitleSegment[],
    maxDuration: number = 5
): SubtitleSegment[] {
    const optimized: SubtitleSegment[] = [];

    for (const segment of segments) {
        const duration = segment.end - segment.start;

        if (duration <= maxDuration) {
            optimized.push(segment);
            continue;
        }

        // Split long segments
        const wordsStr = segment.text.split(' ');
        const wordsPerSegment = Math.ceil(wordsStr.length / Math.ceil(duration / maxDuration));
        const timePerWord = duration / wordsStr.length;

        for (let i = 0; i < wordsStr.length; i += wordsPerSegment) {

            // Calculate timing for this sub-segment
            const start = segment.start + (i * timePerWord);
            const end = Math.min(segment.start + ((i + wordsPerSegment) * timePerWord), segment.end);

            // Process words array if available, otherwise interpolate
            let finalWords: { word: string; start: number; end: number; }[] = [];

            if (segment.words && segment.words.length > 0) {
                // If we have real word data, slice it
                finalWords = segment.words.slice(i, i + wordsPerSegment);
            } else {
                // Fallback: Create interpolated word objects
                const subWordsStr = wordsStr.slice(i, i + wordsPerSegment);
                finalWords = subWordsStr.map((w, idx) => ({
                    word: w,
                    start: start + (idx * timePerWord),
                    end: start + ((idx + 1) * timePerWord)
                }));
            }

            optimized.push({
                start,
                end,
                text: finalWords.map(w => w.word).join(' '),
                words: finalWords
            });
        }
    }

    return optimized;
}

/**
 * Adjust subtitle timing to match trimmed video
 */
export function adjustSubtitleTiming(
    segments: SubtitleSegment[],
    videoStartTime: number,
    videoDuration: number
): SubtitleSegment[] {
    const videoEndTime = videoStartTime + videoDuration;

    return segments
        .filter(seg => {
            // Keep only segments that overlap with our video range
            return seg.end > videoStartTime && seg.start < videoEndTime;
        })
        .map(seg => ({
            start: Math.max(0, seg.start - videoStartTime),
            end: Math.min(videoDuration, seg.end - videoStartTime),
            text: seg.text,
            words: seg.words?.map(w => ({
                word: w.word,
                start: Math.max(0, w.start - videoStartTime),
                end: Math.min(videoDuration, w.end - videoStartTime)
            })).filter(w => w.end > 0 && w.start < videoDuration) // Keep valid words
        }));
}
