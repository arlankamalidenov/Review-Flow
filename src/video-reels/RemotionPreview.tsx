import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { VideoReelComposition, VideoReelProps } from './Composition';
import { Play, Pause, Maximize, Minimize } from 'lucide-react';

interface RemotionPreviewProps {
    videoUrl: string;
    startTime?: number; // ✅ Start time offset
    subtitles: VideoReelProps['subtitles'];
    styleConfig: VideoReelProps['styleConfig'];
    durationInFrames: number;
    fps?: number;
    currentTime?: number; // ✅ External time control for timeline sync
    onTimeUpdate?: (time: number) => void; // ✅ Callback for time updates
    onFrameUpdate?: (frame: number) => void; // ✅ Callback for frame updates
    onPlay?: () => void;
    onPause?: () => void;
}

// ✅ Apple-Style Remotion Player with Timeline Synchronization
export const RemotionPreview = forwardRef<PlayerRef, RemotionPreviewProps>(
    (
        {
            videoUrl,
            startTime = 0,
            subtitles,
            styleConfig,
            durationInFrames,
            fps = 30,
            currentTime,
            onTimeUpdate,
            onFrameUpdate,
            onPlay,
            onPause,
        },
        forwardedRef
    ) => {
        const [isPlaying, setIsPlaying] = useState(false);
        const [internalFrame, setInternalFrame] = useState(0);
        const [isFullscreen, setIsFullscreen] = useState(false);
        const playerRef = useRef<PlayerRef>(null);
        const containerRef = useRef<HTMLDivElement>(null);

        // ✅ Expose playerRef to parent via forwardedRef
        useImperativeHandle(forwardedRef, () => playerRef.current as PlayerRef);

        // ✅ Sync with external currentTime (from timeline slider)
        useEffect(() => {
            if (currentTime !== undefined && playerRef.current) {
                // If we have an offset startTime, we need to account for it if currentTime is absolute
                // However, currentTime passed from VideoReelCutter seems to be the absolute time
                // If the player represents a segment [startTime, startTime+duration], 
                // then internal frame 0 corresponds to startTime.
                // So targetFrame = (currentTime - startTime) * fps

                const relativeTime = Math.max(0, currentTime - startTime);
                const targetFrame = Math.floor(relativeTime * fps);

                // ✅ Fix: Don't seek if we are playing and the drift is small (natural React cycle latency)
                // This prevents the "fighting" loop where the player updates parent -> parent updates prop -> prop seeks player
                const diff = Math.abs(targetFrame - internalFrame);
                const tolerance = isPlaying ? 10 : 1; // Higher tolerance while playing

                if (diff > tolerance) {
                    playerRef.current.seekTo(targetFrame);
                    setInternalFrame(targetFrame);
                }
            }
        }, [currentTime, startTime, fps, isPlaying]); // Removed internalFrame to avoid circular dependency loop

        // ✅ Fullscreen change listener
        useEffect(() => {
            const handleFullscreenChange = () => {
                setIsFullscreen(!!document.fullscreenElement);
            };

            document.addEventListener('fullscreenchange', handleFullscreenChange);
            return () => {
                document.removeEventListener('fullscreenchange', handleFullscreenChange);
            };
        }, []);

        const handlePlayPause = useCallback(() => {
            if (!playerRef.current) {
                console.warn('⚠️ [RemotionPreview] No player ref!');
                return;
            }

            const isPlayerPlaying = playerRef.current.isPlaying();
            console.log('⏯️ [RemotionPreview] Toggle clicked. Remotion says playing:', isPlayerPlaying, 'React State:', isPlaying);

            if (isPlayerPlaying) {
                console.log('⏸️ [RemotionPreview] Force Pausing...');
                playerRef.current.pause();
                // Imperatively update local state to match immediately, though callbacks should handle it
                setIsPlaying(false);
            } else {
                console.log('▶️ [RemotionPreview] Playing...');
                playerRef.current.play();
                setIsPlaying(true);
            }
        }, [isPlaying]);

        const toggleFullscreen = useCallback(async () => {
            if (!containerRef.current) return;

            try {
                if (!document.fullscreenElement) {
                    await containerRef.current.requestFullscreen();
                } else {
                    await document.exitFullscreen();
                }
            } catch (error) {
                console.error('Fullscreen error:', error);
            }
        }, []);

        const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            const frame = parseInt(e.target.value);
            setInternalFrame(frame);
            if (playerRef.current) {
                playerRef.current.seekTo(frame);
            }
            // ✅ Notify parent component (convert back to absolute time)
            if (onTimeUpdate) {
                onTimeUpdate(startTime + (frame / fps));
            }
            if (onFrameUpdate) {
                onFrameUpdate(frame);
            }
        }, [fps, onTimeUpdate, onFrameUpdate, startTime]);

        const handleFrameUpdate = useCallback((frame: number) => {
            setInternalFrame(frame);
            // ✅ Notify parent component
            if (onTimeUpdate) {
                onTimeUpdate(startTime + (frame / fps));
            }
            if (onFrameUpdate) {
                onFrameUpdate(frame);
            }
        }, [fps, onTimeUpdate, onFrameUpdate, startTime]);

        return (
            <div className="relative w-full max-w-md mx-auto">
                {/* Remotion Player (Frameless, 9:16 aspect ratio) */}
                <div
                    ref={containerRef}
                    className={`relative rounded-2xl overflow-hidden shadow-2xl ${isFullscreen ? 'bg-black' : ''
                        }`}
                    style={isFullscreen ? {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100vw',
                        height: '100vh',
                        padding: '0',
                    } : {}}
                >
                    {/* Fullscreen Button */}
                    <button
                        onClick={toggleFullscreen}
                        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all group"
                        title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Fullscreen'}
                    >
                        {isFullscreen ? (
                            <Minimize className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                        ) : (
                            <Maximize className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                        )}
                    </button>

                    {/* Video Container - в fullscreen занимает доступное пространство */}
                    <div
                        className={isFullscreen ? 'flex items-center justify-center flex-1 w-full' : 'relative'}
                        style={isFullscreen ? {
                            maxHeight: 'calc(100vh - 140px)', // Оставляем место для контролов
                        } : {}}
                    >
                        <Player
                            ref={playerRef}
                            component={VideoReelComposition}
                            durationInFrames={durationInFrames}
                            compositionWidth={1080}
                            compositionHeight={1920}
                            fps={fps}
                            style={{
                                width: isFullscreen ? 'auto' : '100%',
                                height: isFullscreen ? 'calc(100vh - 140px)' : 'auto',
                                aspectRatio: '9/16',
                                maxHeight: isFullscreen ? 'calc(100vh - 140px)' : undefined,
                            }}
                            controls={false}
                            inputProps={{
                                videoUrl,
                                startTime,
                                subtitles,
                                styleConfig,
                            }}
                            onPlay={() => {
                                setIsPlaying(true);
                                onPlay?.();
                            }}
                            onPause={() => {
                                setIsPlaying(false);
                                onPause?.();
                            }}
                            onFrameUpdate={handleFrameUpdate}
                        />
                    </div>

                    {/* Apple-Style Backdrop Blur Controls - в fullscreen НЕ absolute */}
                    <div
                        className={
                            isFullscreen
                                ? "w-full bg-black/30 backdrop-blur-xl border-t border-white/10 relative z-50"
                                : "absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-xl border-t border-white/10 z-50"
                        }
                        style={isFullscreen ? {
                            position: 'relative',
                            flexShrink: 0,
                        } : {
                            zIndex: 50 // Explicitly set z-index
                        }}
                    >
                        <div className="p-4 space-y-3">
                            {/* Progress Bar with Brand Color */}
                            <input
                                type="range"
                                min={0}
                                max={durationInFrames}
                                step={1}
                                value={internalFrame}
                                onChange={handleSeek}
                                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #BA0C2F 0%, #BA0C2F ${(internalFrame / durationInFrames) * 100}%, rgba(255,255,255,0.2) ${(internalFrame / durationInFrames) * 100}%, rgba(255,255,255,0.2) 100%)`,
                                }}
                            />

                            {/* Play/Pause Button */}
                            <div className="flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handlePlayPause();
                                    }}
                                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all active:scale-95"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-6 h-6 text-white" />
                                    ) : (
                                        <Play className="w-6 h-6 text-white ml-1" />
                                    )}
                                </button>
                            </div>

                            {/* Time Display */}
                            <div className="flex justify-between text-xs text-white/70 font-mono">
                                <span>
                                    {(() => {
                                        const seconds = internalFrame / fps;
                                        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
                                        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
                                        return `${m}:${s}`;
                                    })()}
                                </span>
                                <span>
                                    {(() => {
                                        const seconds = durationInFrames / fps;
                                        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
                                        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
                                        return `${m}:${s}`;
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);
