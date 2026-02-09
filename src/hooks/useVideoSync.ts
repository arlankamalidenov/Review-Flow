import { useCallback, useRef } from 'react';
import { PlayerRef } from '@remotion/player';

export const useVideoSync = (fps = 30) => {
    // Refs for passive state (no re-renders)
    const currentFrameRef = useRef(0);
    const isPlayingRef = useRef(false);
    const playerRef = useRef<PlayerRef>(null);

    // Subscribers for components that NEED to render on frame updates (like the Timeline/Slider)
    const subscribers = useRef<Set<(frame: number) => void>>(new Set());

    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Subscribe to frame updates
    const subscribe = useCallback((callback: (frame: number) => void) => {
        subscribers.current.add(callback);
        return () => {
            subscribers.current.delete(callback);
        };
    }, []);

    // 30fps loop calls this - minimal work
    const handleFrameUpdate = useCallback((globalFrame: number) => {
        currentFrameRef.current = globalFrame;
        // Broadcast to subscribers
        subscribers.current.forEach(cb => cb(globalFrame));
    }, []);

    const syncToSegment = useCallback((startInSeconds: number) => {
        const startFrame = Math.floor(startInSeconds * fps);
        currentFrameRef.current = startFrame;

        // Broadcast update immediately so UI snaps to new position
        subscribers.current.forEach(cb => cb(startFrame));

        // Seek player
        if (playerRef.current) {
            playerRef.current.seekTo(0);
        }
    }, [fps]);

    const updatePlayingStatus = useCallback((status: 'playing' | 'paused') => {
        isPlayingRef.current = status === 'playing';
    }, []);

    const play = useCallback(() => {
        playerRef.current?.play();
    }, []);

    const pause = useCallback(() => {
        playerRef.current?.pause();
    }, []);

    const togglePlay = useCallback(() => {
        if (isPlayingRef.current) {
            pause();
        } else {
            play();
        }
    }, [pause, play]);

    return {
        // Refs
        playerRef,
        currentFrameRef,
        isPlayingRef,

        // Methods
        handleFrameUpdate,
        syncToSegment,
        updatePlayingStatus,
        formatTime,
        subscribe,
        play,
        pause,
        togglePlay
    };
};
