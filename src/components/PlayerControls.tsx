import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useVideoSync } from '../hooks/useVideoSync';
import { ReelConfig } from '../types/video';

interface PlayerControlsProps {
    videoDuration: number;
    reelConfig: ReelConfig;
    onReelConfigChange: (newConfig: ReelConfig) => void;
    sync: ReturnType<typeof useVideoSync>;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
    videoDuration,
    reelConfig,
    onReelConfigChange,
    sync
}) => {
    // Local state for fast updates - only this component re-renders on frame update
    const [currentFrame, setCurrentFrame] = useState(0);
    const timelineRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Subscribe to global frame updates
    useEffect(() => {
        return sync.subscribe((frame) => {
            setCurrentFrame(frame);
        });
    }, [sync]);

    // Format time helper
    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Timeline drag handlers (for the Selection Box)
    const handleTimelineDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current) return;
        setIsDragging(true);
        updateSelectionFromMouseEvent(e);
    }, []);

    const handleTimelineDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !timelineRef.current) return;
        updateSelectionFromMouseEvent(e);
    }, [isDragging]);

    const handleTimelineDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    const updateSelectionFromMouseEvent = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));

        // Calculate new start time based on percentage
        // Ensure we don't go out of bounds
        const maxStartTime = Math.max(0, videoDuration - reelConfig.duration);
        const newStartTime = Math.min(percentage * videoDuration, maxStartTime);

        // Update parent config
        onReelConfigChange({ ...reelConfig, startTime: newStartTime });

        // Sync video to new position
        sync.syncToSegment(newStartTime);
    };

    const handleDurationChange = (newDuration: number) => {
        const maxStart = Math.max(0, videoDuration - newDuration);
        onReelConfigChange({
            ...reelConfig,
            duration: newDuration,
            startTime: Math.min(reelConfig.startTime, maxStart)
        });
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900">Timeline Selector</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">Duration:</span>
                        <div className="flex gap-1">
                            {[5, 15, 30, 60].map(duration => (
                                <button
                                    key={duration}
                                    onClick={() => handleDurationChange(duration)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${reelConfig.duration === duration
                                        ? 'bg-[#BA0C2F] text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {duration}s
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Duration Slider */}
                <div className="mb-3">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-medium min-w-[60px]">Custom:</span>
                        <input
                            type="range"
                            min="5"
                            max="60"
                            step="5"
                            value={reelConfig.duration}
                            onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#BA0C2F]"
                        />
                        <span className="text-sm font-mono font-bold text-[#BA0C2F] min-w-[50px]">
                            {formatTime(reelConfig.duration)}
                        </span>
                    </div>
                </div>

                <p className="text-sm text-slate-600">
                    Selected: <span className="font-mono text-[#BA0C2F]">{formatTime(reelConfig.startTime)} - {formatTime(reelConfig.startTime + reelConfig.duration)}</span> ({formatTime(reelConfig.duration)})
                </p>
            </div>

            <div
                ref={timelineRef}
                className="relative h-20 bg-slate-100 rounded-xl overflow-hidden cursor-pointer"
                onMouseDown={handleTimelineDragStart}
                onMouseMove={handleTimelineDrag}
                onMouseUp={handleTimelineDragEnd}
                onMouseLeave={handleTimelineDragEnd}
            >
                {/* Timeline background */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />

                {/* Sliding Window (Selection) */}
                <div
                    className="absolute top-0 bottom-0 bg-[#BA0C2F]/20 border-2 border-[#BA0C2F] rounded-lg transition-all duration-150"
                    style={{
                        left: `${(reelConfig.startTime / Math.max(videoDuration, 1)) * 100}%`,
                        width: `${(reelConfig.duration / videoDuration) * 100}%`,
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#BA0C2F]/10 to-transparent" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-[#BA0C2F] bg-white/90 px-3 py-1 rounded-full shadow-sm">
                        {reelConfig.duration}s
                    </div>
                </div>

                {/* Current time indicator - Updates at 30fps via local state */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg transition-all duration-75 ease-linear"
                    style={{
                        left: `${((currentFrame / 30) / videoDuration) * 100}%`,
                        // Use a transform for potentially smoother performance
                        // transform: `translateX(...)` could be better but verify positioning logic
                    }}
                />
            </div>

            {/* Time markers */}
            <div className="flex justify-between mt-2 text-xs text-slate-500 font-mono">
                <span>0:00</span>
                <span>{formatTime(videoDuration / 2)}</span>
                <span>{formatTime(videoDuration)}</span>
            </div>
        </div>
    );
};
