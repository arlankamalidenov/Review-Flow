export interface HighlightSegment {
    title: string;
    start: number;
    end: number;
    viral_score: number;
    social_caption: string;
    duration: number;
}

export interface HighlightAnalysisRequest {
    segments: Array<{
        start: number;
        end: number;
        text: string;
    }>;
    videoDuration: number;
}

export interface HighlightAnalysisResponse {
    highlights: HighlightSegment[];
}
