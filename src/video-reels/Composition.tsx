import React from 'react';
import { z } from 'zod';
import { OffthreadVideo, AbsoluteFill } from 'remotion';
import { SubtitleLayer } from './SubtitleLayer';

// ✅ Zod Schema for Props Validation
export const VideoReelSchema = z.object({
    videoUrl: z.string(),
    startTime: z.number().default(0), // ✅ New Prop for offset
    subtitles: z.array(
        z.object({
            start: z.number(),
            end: z.number(),
            text: z.string(),
        })
    ),
    styleConfig: z.object({
        fontFamily: z.string().default('Inter'),
        fontSize: z.number().default(40),
        color: z.string().default('#FFFFFF'),
        strokeColor: z.string().default('#BA0C2F'),
        strokeWidth: z.number().default(2),
    }),
});

export type VideoReelProps = z.infer<typeof VideoReelSchema>;

// ✅ Main Video Composition (Updated with SubtitleLayer)
export const VideoReelComposition: React.FC<VideoReelProps> = ({
    videoUrl,
    startTime = 0,
    subtitles,
    styleConfig,
}) => {
    return (
        <AbsoluteFill className="bg-black">
            {/* Background Video - z-index: 1 */}
            <OffthreadVideo
                src={videoUrl}
                startFrom={Math.floor(startTime * 30)} // ✅ Start from offset
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1, // ✅ Video layer
                }}
            />

            {/* ✅ Subtitle Overlay - z-index: 10 (ABOVE video!) */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 10,
                pointerEvents: 'none', // Allow clicks to pass through
            }}>
                <SubtitleLayer
                    subtitles={subtitles}
                    styleConfig={styleConfig}
                    startTimeOffset={startTime} // ✅ Pass offset to fix relative timing
                />
            </div>
        </AbsoluteFill>
    );
};
