export interface VideoFile {
    file: File;
    url: string;
    duration: number;
    width: number;
    height: number;
}

export interface TimelineMarker {
    time: number;
    label?: string;
}

export interface SubtitleSegment {
    start: number;
    end: number;
    text: string;
    isAccent?: boolean; // ✅ Mark accent/punchline segments for Caveat font
    words?: Array<{
        word: string;
        start: number;
        end: number;
    }>;
}

export interface VideoProcessingState {
    status: 'idle' | 'loading' | 'trimming' | 'cropping' | 'transcribing' | 'rendering' | 'complete' | 'error';
    progress: number;
    message?: string;
    error?: string;
}

export interface ReelConfig {
    startTime: number;
    duration: number; // Always 60 seconds for reels
    cropToVertical: boolean;
    subtitlesEnabled: boolean;
    subtitleStyle: SubtitleStyle;
}

export interface SubtitleStyle {
    fontFamily: string;
    fontSize: number;
    color: string;
    strokeColor: string;
    strokeWidth: number;
    backgroundColor?: string;
    activeColor?: string; // Color for current word in Karaoke mode
    position: 'top' | 'center' | 'bottom';
}

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
    fontFamily: 'TT Lakes Neue',
    fontSize: 48,
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 3,
    position: 'center',
};

export const DEFAULT_REEL_CONFIG: ReelConfig = {
    startTime: 0,
    duration: 60,
    cropToVertical: true,
    subtitlesEnabled: true,
    subtitleStyle: DEFAULT_SUBTITLE_STYLE,
};
