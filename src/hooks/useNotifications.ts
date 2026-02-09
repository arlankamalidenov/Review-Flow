import { useEffect, useRef, useState } from 'react';
import { ProjectConfig, WPCredentials, ReviewStatus } from '../types';
import { fetchReviewCount } from '../services/wpService';

interface UseNotificationsOptions {
    project: ProjectConfig;
    creds: WPCredentials;
    enabled: boolean;
    intervalMs?: number;
}

export const useNotifications = ({
    project,
    creds,
    enabled,
    intervalMs = 5 * 60 * 1000 // 5 minutes
}: UseNotificationsOptions) => {
    const [pendingCount, setPendingCount] = useState<number>(0);
    const previousCountRef = useRef<number>(0);
    const [hasPermission, setHasPermission] = useState<boolean>(false);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                setHasPermission(true);
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then((permission) => {
                    setHasPermission(permission === 'granted');
                });
            }
        }
    }, []);

    // Check for new reviews
    const checkForNewReviews = async () => {
        if (!enabled) return;

        try {
            const count = await fetchReviewCount(project, creds, ReviewStatus.Pending);
            setPendingCount(count);

            // Check if count increased
            if (count > previousCountRef.current && previousCountRef.current > 0) {
                const newReviewsCount = count - previousCountRef.current;

                // Update document title
                document.title = `(${newReviewsCount}) ReviewFlow - ${project.name}`;

                // Show notification
                if (hasPermission && 'Notification' in window) {
                    const notification = new Notification(`Новый отзыв на ${project.name}!`, {
                        body: `У вас ${newReviewsCount} новых отзывов. Нажмите, чтобы прочитать.`,
                        icon: '/favicon.ico',
                        tag: 'review-notification',
                        requireInteraction: false
                    });

                    notification.onclick = () => {
                        window.focus();
                        notification.close();
                    };

                    // Auto-close after 5 seconds
                    setTimeout(() => notification.close(), 5000);
                }
            }

            previousCountRef.current = count;
        } catch (error) {
            console.error('Failed to check for new reviews:', error);
        }
    };

    // Set up interval
    useEffect(() => {
        if (!enabled) return;

        // Initial check
        checkForNewReviews();

        // Set up interval
        const interval = setInterval(checkForNewReviews, intervalMs);

        return () => clearInterval(interval);
    }, [enabled, project.id, creds.url, intervalMs]);

    // Reset document title when component unmounts or count is viewed
    useEffect(() => {
        return () => {
            document.title = 'ReviewFlow';
        };
    }, []);

    return {
        pendingCount,
        hasPermission
    };
};
