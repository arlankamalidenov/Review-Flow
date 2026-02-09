import React, { useState } from 'react';
import { Sparkles, Copy, Check, TrendingUp, Clock } from 'lucide-react';
import { HighlightSegment } from '../types/highlight';

interface HighlightsSidebarProps {
    highlights: HighlightSegment[];
    onSelectHighlight: (start: number, end: number) => void;
    isLoading?: boolean;
}

export const HighlightsSidebar: React.FC<HighlightsSidebarProps> = ({
    highlights,
    onSelectHighlight,
    isLoading = false,
}) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopyCaption = async (caption: string, index: number) => {
        try {
            await navigator.clipboard.writeText(caption);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (error) {
            console.error('Failed to copy caption:', error);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDuration = (seconds: number): string => {
        return formatTime(seconds);
    };

    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-green-600 bg-green-50';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50';
        return 'text-orange-600 bg-orange-50';
    };

    const getScoreBadgeColor = (score: number): string => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">AI Suggestions</h3>
                        <p className="text-sm text-slate-500">Analyzing content...</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                            <div className="h-24 bg-slate-100 rounded-xl"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (highlights.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">AI Suggestions</h3>
                        <p className="text-sm text-slate-500">No highlights yet</p>
                    </div>
                </div>
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm">
                        Generate subtitles to see AI-powered<br />viral segment suggestions
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">AI Suggestions</h3>
                        <p className="text-sm text-slate-500">{highlights.length} viral moments found</p>
                    </div>
                </div>
            </div>

            {/* Highlights List */}
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {highlights.map((highlight, index) => (
                    <div
                        key={index}
                        className="group relative bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer"
                        onClick={() => onSelectHighlight(highlight.start, highlight.end)}
                    >
                        {/* Viral Score Badge */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getScoreColor(highlight.viral_score)}`}>
                                <TrendingUp className="w-3 h-3" />
                                <span className="text-xs font-bold">{highlight.viral_score}</span>
                            </div>
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-slate-900 mb-2 pr-16 group-hover:text-purple-600 transition-colors">
                            {highlight.title}
                        </h4>

                        {/* Duration & Time */}
                        <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDuration(highlight.duration)}</span>
                            </div>
                            <span>•</span>
                            <span className="font-mono">
                                {formatTime(highlight.start)} - {formatTime(highlight.end)}
                            </span>
                        </div>

                        {/* Caption Preview */}
                        <div className="mb-3">
                            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                                {highlight.social_caption.split('\n')[0]}
                            </p>
                        </div>

                        {/* Copy Caption Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCopyCaption(highlight.social_caption, index);
                            }}
                            className={`w-full px-3 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${copiedIndex === index
                                ? 'bg-green-500 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-purple-100 hover:text-purple-700'
                                }`}
                        >
                            {copiedIndex === index ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span>Copy Caption</span>
                                </>
                            )}
                        </button>

                        {/* Hover Indicator */}
                        <div className="absolute inset-0 rounded-xl border-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                ))}
            </div>

            {/* Footer Tip */}
            <div className="p-3 border-t border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-500 text-center">
                    💡 Click a card to set trim area • Copy caption for instant posting
                </p>
            </div>
        </div>
    );
};
