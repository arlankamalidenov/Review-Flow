import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { ReviewList } from './ReviewList';
import { EditModal } from './EditModal';
import { SearchBar } from './SearchBar';
import { Pagination } from './Pagination';
import { CoverLab } from './CoverLab';
import { VideoReelsCutter } from './VideoReelsCutter';
import {
  fetchReviews,
  updateReviewStatus,
  deleteReview,
  updateReview,
  createReview,
  fetchAndUploadImage
} from '../services/wpService';
import {
  ReviewFilter,
  WPCredentials,
  ReviewStatus,
  UnifiedReview,
  ProjectConfig,
  PROJECTS
} from '../types';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { ReviewSkeleton } from './ui/Skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotifications } from '../hooks/useNotifications';
import { useReviewCounts } from '../hooks/useReviewCounts';

interface DashboardLayoutProps {
  creds: WPCredentials; // Initial creds from login, but we'll use per-project storage
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ creds: initialCreds, onLogout }) => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [editingReview, setEditingReview] = useState<UnifiedReview | null>(null);

  // Search and Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);


  // Local state for tracking published archive items
  const [publishedArchiveIds, setPublishedArchiveIds] = useState<string[]>(() => {
    const stored = localStorage.getItem('rf_published_tg_ids');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('rf_published_tg_ids', JSON.stringify(publishedArchiveIds));
  }, [publishedArchiveIds]);

  // Project Management
  const [currentProject, setCurrentProject] = useState<ProjectConfig>(PROJECTS[0]);
  const [projectCreds, setProjectCreds] = useState<Record<string, WPCredentials>>({});

  console.log('🖥️ DashboardLayout Render:', {
    projectId: currentProject.id,
    filter,
    hasCreds: !!projectCreds[currentProject.id],
    searchQuery,
    currentPage
  });

  // Load project-specific credentials from local storage
  useEffect(() => {
    console.log('📥 Loading project creds from localStorage');
    const stored = localStorage.getItem('rf_project_creds');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProjectCreds(parsed);
      } catch (e) {
        console.error('Failed to parse project creds', e);
      }
    }
  }, []);

  // Current active credentials
  const activeCreds = useMemo(() => projectCreds[currentProject.id] || initialCreds, [projectCreds, currentProject.id, initialCreds]);

  // Notifications system
  useNotifications({
    project: currentProject,
    creds: activeCreds,
    enabled: true
  });

  // Review counts for badges
  const counts = useReviewCounts({
    project: currentProject,
    creds: activeCreds,
    enabled: true
  });

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, currentProject.id]);

  const { data: reviewsData, isLoading: isReviewsLoading, isError, error } = useQuery({
    queryKey: ['reviews', currentProject.id, filter, currentPage, searchQuery],
    queryFn: () => {
      if (filter === 'archive') return { reviews: [], pagination: { total: 0, totalPages: 0, currentPage: 1 } }; // Handled by separate query
      if (filter === 'cover-lab' || filter === 'video-reels') return { reviews: [], pagination: { total: 0, totalPages: 0, currentPage: 1 } }; // No reviews needed
      console.log('📡 useQuery: Starting fetchReviews for:', currentProject.id);
      return fetchReviews(currentProject, activeCreds, filter as any, currentPage, searchQuery);
    },
    enabled: filter !== 'archive' && filter !== 'cover-lab' && filter !== 'video-reels',
    retry: 1
  });

  // Query for Telegram Archive
  const { data: archiveReviews, isLoading: isArchiveLoading } = useQuery({
    queryKey: ['archive', publishedArchiveIds],
    queryFn: async () => {
      const resp = await fetch('/src/data/tg_archive.json');
      if (!resp.ok) throw new Error('TG Archive not found');
      const data = await resp.json();

      return data.map((item: any) => ({
        id: item.id,
        date: item.review_date,
        status: ReviewStatus.Draft,
        author: item.review_name,
        email: item.review_email === 'empty@mail.ru' ? '' : item.review_email,
        text: item.review_message,
        rating: Number(item.review_rating),
        photo: item.review_image_url,
        meta: 'Telegram Archive',
        originalData: item
      })).filter((r: any) => !publishedArchiveIds.includes(r.id));
    },
    enabled: currentProject.id === 'rbesolov' && filter === 'archive'
  });

  const isLoading = isReviewsLoading || isArchiveLoading;

  // Client-side pagination and search for archive
  const paginatedArchiveReviews = useMemo(() => {
    if (filter !== 'archive' || !archiveReviews) {
      return {
        reviews: [],
        pagination: { total: 0, totalPages: 0, currentPage: 1 }
      };
    }

    let filtered = archiveReviews;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((review: UnifiedReview) =>
        review.email.toLowerCase().includes(query) ||
        review.author.toLowerCase().includes(query)
      );
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * 20;
    const endIndex = startIndex + 20;

    return {
      reviews: filtered.slice(startIndex, endIndex),
      pagination: {
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / 20),
        currentPage
      }
    };
  }, [archiveReviews, filter, searchQuery, currentPage]);

  // Get current reviews and pagination based on filter
  const currentReviews = filter === 'archive' ? paginatedArchiveReviews.reviews : (reviewsData?.reviews || []);
  const currentPagination = filter === 'archive' ? paginatedArchiveReviews.pagination : (reviewsData?.pagination || { total: 0, totalPages: 0, currentPage: 1 });

  const approveMutation = useMutation({
    mutationFn: (id: number) => updateReviewStatus(currentProject, activeCreds, id, ReviewStatus.Published),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', currentProject.id] });
    }
  });

  const trashMutation = useMutation({
    mutationFn: (id: number) => updateReviewStatus(currentProject, activeCreds, id, ReviewStatus.Trash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', currentProject.id] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateReview(currentProject, activeCreds, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', currentProject.id] });
      setEditingReview(null);
    }
  });

  const publishArchiveMutation = useMutation({
    mutationFn: async (review: UnifiedReview) => {
      // 1. Sideload image if it exists
      let mediaId = null;
      if (review.photo && typeof review.photo === 'string' && review.photo.startsWith('http')) {
        mediaId = await fetchAndUploadImage(activeCreds, review.photo, `review_${review.id}.jpg`);
      }

      // 2. Prepare raw data for WP API
      // RBesolov requires 'fields' key for ACF in POST requests, while Bfisherman uses 'acf'
      const metadataKey = currentProject.id === 'rbesolov' ? 'fields' : 'acf';

      const rawData = {
        title: review.author,
        status: 'publish',
        [metadataKey]: {
          review_name: review.author,
          review_message: review.text,
          review_email: review.email || 'empty@mail.ru',
          review_phone_full: '+7771234567',
          review_rating: "5",
          review_country_name: review.meta || 'Telegram Archive',
          review_country_iso: review.country_iso || 'RU',
          review_image: mediaId // Send the ID if sideloaded successfully
        }
      };

      return createReview(currentProject, activeCreds, rawData);
    },
    onSuccess: (data, review) => {
      console.log('✅ Archive review published:', data);
      setPublishedArchiveIds(prev => [...prev, review.id as any]);
      queryClient.invalidateQueries({ queryKey: ['reviews', currentProject.id] });
    },
    onError: (error: any) => {
      console.error('❌ Publish failed:', error);
      alert(`Ошибка публикации: ${error.message || 'Неизвестная ошибка API'}`);
    }
  });

  const handleProjectChange = useCallback((project: ProjectConfig) => {
    console.log('🔄 handleProjectChange called:', project.id);
    if (project.id !== currentProject.id) {
      setFilter('all');
      setCurrentProject(project);
      setSearchQuery('');
      setCurrentPage(1);
    }
  }, [currentProject.id]);

  const handleSaveProjectCreds = useCallback((projectId: string, creds: WPCredentials) => {
    console.log('💾 Saving creds for project:', projectId);
    const newProjectCreds = { ...projectCreds, [projectId]: creds };
    setProjectCreds(newProjectCreds);
    localStorage.setItem('rf_project_creds', JSON.stringify(newProjectCreds));

    // Invalidate current queries to refetch with new creds
    queryClient.invalidateQueries({ queryKey: ['reviews', projectId] });
  }, [projectCreds, queryClient]);

  const handleApprove = useCallback((id: number) => {
    console.log('✅ Approved clicked:', id);
    approveMutation.mutate(id);
  }, [approveMutation]);

  const handleTrash = useCallback((id: number) => {
    console.log('🗑️ Trash clicked:', id);
    trashMutation.mutate(id);
  }, [trashMutation]);

  const handleEdit = useCallback((review: UnifiedReview) => {
    console.log('✏️ Edit clicked:', review.id);
    setEditingReview(review);
  }, []);

  const handleSave = useCallback((id: number, rawData: any) => {
    console.log('💾 Save clicked:', id);
    updateMutation.mutate({ id, data: rawData });
  }, [updateMutation]);

  const handlePublishArchive = useCallback((review: UnifiedReview) => {
    console.log('🚀 Publishing archive review:', review.id);
    publishArchiveMutation.mutate(review);
  }, [publishArchiveMutation]);

  const handleRefresh = useCallback(async () => {
    console.log('🔄 Refreshing reviews...');
    setIsRefreshing(true);

    // Invalidate all review-related queries
    await queryClient.invalidateQueries({ queryKey: ['reviews'] });
    await queryClient.invalidateQueries({ queryKey: ['review-count'] });
    await queryClient.invalidateQueries({ queryKey: ['archive'] });

    // Keep the animation for at least 500ms for better UX
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, [queryClient]);


  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        currentFilter={filter}
        onFilterChange={setFilter}
        currentProject={currentProject}
        activeCreds={activeCreds}
        onProjectChange={handleProjectChange}
        onSaveProjectCreds={handleSaveProjectCreds}
        onLogout={onLogout}
        counts={counts}
      />

      {/* Conditional Main Content */}
      {filter === 'cover-lab' ? (
        <CoverLab />
      ) : filter === 'video-reels' ? (
        <VideoReelsCutter />
      ) : (
        <main className="flex-1 md:ml-64 p-6 md:p-12 overflow-y-auto">
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] uppercase font-bold tracking-wider">
                  {currentProject.id}
                </span>
              </div>
              <p className="text-slate-500 font-medium">Manage student reviews for {currentProject.name}</p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-emerald-500 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'
                  }`}
              />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                {isRefreshing ? 'Updating...' : 'Live Feed'}
              </span>
            </button>

          </header>

          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by email or name..."
            />
          </div>

          {isError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600"
            >
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">{(error as any)?.message || 'Failed to load reviews'}</p>
            </motion.div>
          )}

          {/* Transition area for projects */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProject.id + filter}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <ReviewSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <>
                  <ReviewList
                    reviews={currentReviews}
                    creds={activeCreds}
                    projectId={currentProject.id}
                    onApprove={handleApprove}
                    onTrash={handleTrash}
                    onEdit={handleEdit}
                    onPublish={filter === 'archive' ? handlePublishArchive : undefined}
                    isPublishing={publishArchiveMutation.isPending ? (publishArchiveMutation.variables as UnifiedReview)?.id : undefined}
                  />

                  <Pagination
                    currentPage={currentPagination.currentPage}
                    totalPages={currentPagination.totalPages}
                    onPageChange={setCurrentPage}
                    isLoading={isLoading}
                  />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      )}

      <EditModal
        review={editingReview}
        project={currentProject}
        isOpen={!!editingReview}
        onClose={() => setEditingReview(null)}
        onSave={handleSave}
        isSaving={updateMutation.isPending}
      />
    </div>
  );
};