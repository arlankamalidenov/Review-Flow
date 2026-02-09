import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

interface SubtitleSegment {
    start: number;
    end: number;
    text: string;
}

interface SubtitleLayerProps {
    subtitles: SubtitleSegment[];
    startTimeOffset?: number;
}

// Simple Subtitle Layer - White text on black background
export const SubtitleLayer: React.FC<SubtitleLayerProps> = React.memo(({
    subtitles,
    startTimeOffset = 0,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const playerTime = frame / fps;
    const globalSearchTime = playerTime + startTimeOffset;

    // Find active subtitle
    const activeSubtitle = useMemo(() => {
        return subtitles.find(
            (sub) => globalSearchTime >= sub.start && globalSearchTime <= sub.end
        );
    }, [subtitles, globalSearchTime]);

    if (!activeSubtitle) {
        return null;
    }

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '150px',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                paddingLeft: '32px',
                paddingRight: '32px',
                zIndex: 9999,
                pointerEvents: 'none',
            }}
        >
            <div
                style={{
                    maxWidth: '900px',
                    width: '100%',
                }}
            >
                <div
                    style={{
                        padding: '12px 24px',
                        textAlign: 'center',
                        lineHeight: 1.3,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        borderRadius: '8px',
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'Eurostile', sans-serif",
                            fontSize: '50px',
                            fontWeight: 500,
                            color: '#FFFFFF',
                        }}
                    >
                        {activeSubtitle.text}
                    </span>
                </div>
            </div>
        </div>
    );
});
