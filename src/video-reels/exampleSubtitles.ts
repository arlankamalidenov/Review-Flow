// ✅ EXAMPLE SUBTITLE DATA - Dual-Font System
// Use this as a reference for creating subtitles with accent/punchline segments

import type { SubtitleSegment } from '../types/video';

// ✅ Example 1: From Reference Image 1
export const exampleSubtitles1: SubtitleSegment[] = [
    {
        start: 0,
        end: 3,
        text: 'показываю, как решить эту проблему',
        isAccent: false, // ✅ Montserrat (White, Bold)
    },
    {
        start: 3,
        end: 5,
        text: 'за 30 секунд',
        isAccent: true, // ✅ Caveat (Lime, Script, Rotated)
    },
];

// ✅ Example 2: From Reference Image 2
export const exampleSubtitles2: SubtitleSegment[] = [
    {
        start: 0,
        end: 3,
        text: 'но понятия не имеешь',
        isAccent: false, // ✅ Montserrat (White, Bold)
    },
    {
        start: 3,
        end: 5,
        text: 'о чём?',
        isAccent: true, // ✅ Caveat (Lime, Script, Rotated)
    },
];

// ✅ Example 3: Mixed Content
export const exampleSubtitles3: SubtitleSegment[] = [
    {
        start: 0,
        end: 2,
        text: 'смотри внимательно',
        isAccent: false,
    },
    {
        start: 2,
        end: 4,
        text: 'это важно!',
        isAccent: true,
    },
    {
        start: 4,
        end: 6,
        text: 'сейчас покажу секрет',
        isAccent: false,
    },
    {
        start: 6,
        end: 8,
        text: 'который изменит всё',
        isAccent: true,
    },
];

// ✅ Auto-detect accent segments (simple heuristic)
export const detectAccentSegments = (subtitles: SubtitleSegment[]): SubtitleSegment[] => {
    return subtitles.map((sub, index) => {
        // Mark every other segment as accent
        // OR mark short segments (< 10 chars) as accent
        // OR mark segments with question marks as accent
        const isShort = sub.text.length < 10;
        const hasQuestion = sub.text.includes('?');
        const isOdd = index % 2 === 1;

        return {
            ...sub,
            isAccent: isShort || hasQuestion || isOdd,
        };
    });
};

// ✅ Mark specific keywords as accent
export const markKeywordsAsAccent = (
    subtitles: SubtitleSegment[],
    keywords: string[]
): SubtitleSegment[] => {
    return subtitles.map((sub) => {
        const hasKeyword = keywords.some((keyword) =>
            sub.text.toLowerCase().includes(keyword.toLowerCase())
        );

        return {
            ...sub,
            isAccent: hasKeyword,
        };
    });
};

// ✅ Example usage:
// const subtitles = markKeywordsAsAccent(rawSubtitles, ['секунд', 'чём', 'важно']);
