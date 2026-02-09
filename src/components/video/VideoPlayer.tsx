import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { SubtitleSegment } from '../../types/video';
import { SubtitleOverlay } from './SubtitleOverlay';
import { DEFAULT_SUBTITLE_STYLE } from '../../types/video';

interface VideoPlayerProps {
    videoUrl: string;
    duration: number;
    currentTime: number;
    onTimeUpdate: (time: number) => void;
    onSeek: (time: number) => void;
    subtitles?: SubtitleSegment[];
    showSubtitles?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    videoUrl,
    duration,
    currentTime,
    onTimeUpdate,
    onSeek,
    subtitles = [],
    showSubtitles = false,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });

    // Current subtitle to display
    const currentSubtitle = subtitles.find(
        sub => currentTime >= sub.start && currentTime <= sub.end
    );

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            onTimeUpdate(video.currentTime);
        };

        const handleLoadedMetadata = () => {
            setVideoDimensions({
                width: video.videoWidth,
                height: video.videoHeight,
            });
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [onTimeUpdate]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.currentTime = currentTime;
        }
    }, [currentTime]);

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const skipTime = (seconds: number) => {
        if (videoRef.current) {
            const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
            videoRef.current.currentTime = newTime;
            onSeek(newTime);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
            {/* Video Container */}
            <div className="relative aspect-video">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />

                {/* Subtitle Overlay */}
                {showSubtitles && currentSubtitle && (
                    <SubtitleOverlay
                        text={currentSubtitle.text}
                        style={DEFAULT_SUBTITLE_STYLE}
                        videoWidth={videoDimensions.width}
                        videoHeight={videoDimensions.height}
                    />
                )}

                {/* Play/Pause Overlay */}
                <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                    onClick={togglePlayPause}
                >
                    <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {isPlaying ? (
                            <Pause className="w-10 h-10 text-white" fill="white" />
                        ) : (
                            <Play className="w-10 h-10 text-white ml-1" fill="white" />
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-gradient-to-t from-black/90 to-transparent p-6 space-y-4">
                {/* Time Display */}
                <div className="flex items-center justify-between text-white text-sm font-medium">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 bg-white/20 rounded-full cursor-pointer group">
                    <div
                        className="absolute h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                    <input
                        type="range"
                        min="0"
                        max={duration}
                        step="0.1"
                        value={currentTime}
                        onChange={(e) => {
                            const time = parseFloat(e.target.value);
                            if (videoRef.current) {
                                videoRef.current.currentTime = time;
                            }
                            onSeek(time);
                        }}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => skipTime(-5)}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all"
                    >
                        <SkipBack className="w-5 h-5" />
                    </button>

                    <button
                        onClick={togglePlayPause}
                        className="w-14 h-14 rounded-full bg-white hover:bg-white/90 flex items-center justify-center text-black transition-all shadow-lg"
                    >
                        {isPlaying ? (
                            <Pause className="w-6 h-6" fill="currentColor" />
                        ) : (
                            <Play className="w-6 h-6 ml-1" fill="currentColor" />
                        )}
                    </button>

                    <button
                        onClick={() => skipTime(5)}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all"
                    >
                        <SkipForward className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
