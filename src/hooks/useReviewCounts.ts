import { useQuery } from '@tanstack/react-query';
import { ProjectConfig, WPCredentials, ReviewStatus } from '../types';
import { fetchReviewCount } from '../services/wpService';

interface UseReviewCountsOptions {
    project: ProjectConfig;
    creds: WPCredentials;
    enabled?: boolean;
}

export const useReviewCounts = ({
    project,
    creds,
    enabled = true
}: UseReviewCountsOptions) => {
    // Fetch counts for each status
    const { data: allCount = 0 } = useQuery({
        queryKey: ['review-count', project.id, 'all'],
        queryFn: () => fetchReviewCount(project, creds, 'all'),
        enabled,
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
        staleTime: 4 * 60 * 1000 // Consider stale after 4 minutes
    });

    const { data: pendingCount = 0 } = useQuery({
        queryKey: ['review-count', project.id, ReviewStatus.Pending],
        queryFn: () => fetchReviewCount(project, creds, ReviewStatus.Pending),
        enabled,
        refetchInterval: 5 * 60 * 1000,
        staleTime: 4 * 60 * 1000
    });

    const { data: publishedCount = 0 } = useQuery({
        queryKey: ['review-count', project.id, ReviewStatus.Published],
        queryFn: () => fetchReviewCount(project, creds, ReviewStatus.Published),
        enabled,
        refetchInterval: 5 * 60 * 1000,
        staleTime: 4 * 60 * 1000
    });

    const { data: draftCount = 0 } = useQuery({
        queryKey: ['review-count', project.id, ReviewStatus.Draft],
        queryFn: () => fetchReviewCount(project, creds, ReviewStatus.Draft),
        enabled,
        refetchInterval: 5 * 60 * 1000,
        staleTime: 4 * 60 * 1000
    });

    const { data: trashCount = 0 } = useQuery({
        queryKey: ['review-count', project.id, ReviewStatus.Trash],
        queryFn: () => fetchReviewCount(project, creds, ReviewStatus.Trash),
        enabled,
        refetchInterval: 5 * 60 * 1000,
        staleTime: 4 * 60 * 1000
    });

    return {
        all: allCount,
        pending: pendingCount,
        published: publishedCount,
        draft: draftCount,
        trash: trashCount
    };
};
