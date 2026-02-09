import React from 'react';
import { RemotionPreview } from '../video-reels';

// ✅ Test Component for Remotion Integration
export const RemotionTest: React.FC = () => {
    // Test data
    const testVideoUrl = ''; // Will be set when user uploads video
    const testSubtitles = [
        { start: 1, end: 3, text: 'Hello World' },
        { start: 3.5, end: 5.5, text: 'This is Remotion!' },
        { start: 6, end: 8, text: 'React-based subtitles 🎉' },
    ];
    const testStyleConfig = {
        fontFamily: 'Inter',
        fontSize: 40,
        color: '#FFFFFF',
        strokeColor: '#BA0C2F',
        strokeWidth: 2,
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 md:ml-64">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        Remotion Test
                    </h1>
                    <p className="text-slate-600">
                        Testing Remotion Player with "Hello World" subtitle
                    </p>
                </div>

                {/* Instructions */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">
                        📋 Instructions
                    </h2>
                    <ol className="space-y-2 text-slate-600">
                        <li>1. Upload a video file (1080x1920 recommended)</li>
                        <li>2. The Remotion Player will appear below</li>
                        <li>3. You should see "Hello World" subtitle at 1-3 seconds</li>
                        <li>4. Controls: Play/Pause button and seek bar</li>
                    </ol>
                </div>

                {/* File Upload */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Upload Test Video
                    </label>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                // TODO: Set video URL
                                console.log('Video uploaded:', file.name);
                            }
                        }}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#BA0C2F] focus:border-transparent outline-none"
                    />
                </div>

                {/* Remotion Player */}
                {testVideoUrl && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">
                            Remotion Player
                        </h2>
                        <RemotionPreview
                            videoUrl={testVideoUrl}
                            subtitles={testSubtitles}
                            styleConfig={testStyleConfig}
                            durationInFrames={300} // 10 seconds at 30fps
                            fps={30}
                        />
                    </div>
                )}

                {/* Placeholder */}
                {!testVideoUrl && (
                    <div className="bg-slate-100 rounded-2xl p-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
                            <svg
                                className="w-10 h-10 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            Upload a video to test Remotion
                        </h3>
                        <p className="text-slate-500">
                            The player will appear here with "Hello World" subtitle
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
