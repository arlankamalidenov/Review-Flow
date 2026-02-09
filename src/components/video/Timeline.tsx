import React, { useRef, useState } from 'react';
import { Scissors } from 'lucide-react';

interface TimelineProps {
    duration: number;
    startTime: number;
    reelDuration: number;
    onStartTimeChange: (time: number) => void;
    currentTime: number;
}

export const Timeline: React.FC<TimelineProps> = ({
    duration,
    startTime,
    reelDuration,
    onStartTimeChange,
    currentTime,
}) => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        updateStartTime(e);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            updateStartTime(e);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const updateStartTime = (e: React.MouseEvent) => {
        if (!timelineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = x / rect.width;
        const newStartTime = Math.max(0, Math.min(percentage * duration, duration - reelDuration));

        onStartTimeChange(newStartTime);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startPercentage = (startTime / duration) * 100;
    const endPercentage = ((startTime + reelDuration) / duration) * 100;
    const currentPercentage = (currentTime / duration) * 100;

    return (
        <div className="space-y-3">
            {/* Timeline Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-semibold text-slate-900">Select 60s Clip</span>
                </div>
                <div className="text-xs font-medium text-slate-500">
                    {formatTime(startTime)} - {formatTime(Math.min(startTime + reelDuration, duration))}
                </div>
            </div>

            {/* Timeline Track */}
            <div
                ref={timelineRef}
                className="relative h-16 bg-slate-100 rounded-xl cursor-pointer overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Full Duration Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-slate-100" />

                {/* Selected Range */}
                <div
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border-2 border-indigo-500 rounded-lg transition-all"
                    style={{
                        left: `${startPercentage}%`,
                        width: `${endPercentage - startPercentage}%`,
                    }}
                >
                    {/* Start Handle */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 cursor-ew-resize" />

                    {/* End Handle */}
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-600 cursor-ew-resize" />

                    {/* Duration Label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-lg">
                            60s
                        </div>
                    </div>
                </div>

                {/* Current Time Indicator */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10 transition-all"
                    style={{ left: `${currentPercentage}%` }}
                >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-indigo-600" />
                </div>

                {/* Time Markers */}
                <div className="absolute inset-x-0 bottom-1 flex justify-between px-2">
                    {Array.from({ length: 11 }, (_, i) => {
                        const time = (duration / 10) * i;
                        return (
                            <div key={i} className="text-[10px] font-medium text-slate-400">
                                {formatTime(time)}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Selection Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => onStartTimeChange(0)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                    Start
                </button>
                <button
                    onClick={() => onStartTimeChange(Math.max(0, duration / 2 - reelDuration / 2))}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                    Middle
                </button>
                <button
                    onClick={() => onStartTimeChange(Math.max(0, duration - reelDuration))}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                    End
                </button>
            </div>
        </div>
    );
};
