import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { ReviewCard } from './ReviewCard';
import { fetchComments, updateCommentStatus, deleteComment } from '../services/wpService';
import { WPCredentials, CommentStatus } from '../types';
import { Loader2, AlertCircle, MessageCircle } from 'lucide-react';

interface DashboardLayoutProps {
  creds: WPCredentials;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ creds, onLogout }) => {
  const [filter, setFilter] = useState<CommentStatus | 'all'>('all');
  const queryClient = useQueryClient();

  // Queries
  const { data: comments, isLoading, isError, error } = useQuery({
    queryKey: ['comments', filter],
    queryFn: () => fetchComments(creds, filter),
    staleTime: 1000 * 60, // 1 minute
    retry: false // Don't retry indefinitely on auth/404 errors
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CommentStatus }) => 
      updateCommentStatus(creds, id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => 
        deleteComment(creds, id, filter === CommentStatus.Trash), // Force delete if already in trash
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    }
  });

  // Handlers
  const handleApprove = (id: number) => updateStatusMutation.mutate({ id, status: CommentStatus.Approved });
  const handleSpam = (id: number) => updateStatusMutation.mutate({ id, status: CommentStatus.Spam });
  const handleTrash = (id: number) => {
      if (filter === CommentStatus.Trash) {
          // Permanently delete
          deleteMutation.mutate({ id });
      } else {
          // Move to trash
          updateStatusMutation.mutate({ id, status: CommentStatus.Trash });
      }
  };


  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        currentFilter={filter} 
        onFilterChange={setFilter} 
        onLogout={onLogout}
      />
      
      <main className="flex-1 md:ml-64 p-6 md:p-12 overflow-y-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1">
                {filter === 'all' ? 'All Reviews' : 
                 filter === CommentStatus.Hold ? 'Waiting for approval' : 
                 filter === CommentStatus.Approved ? 'Live on site' :
                 filter.charAt(0).toUpperCase() + filter.slice(1)}
            </p>
          </div>
          {/* Mobile Menu Toggle could go here */}
        </header>

        {isError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 mb-6">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-medium">
                {error instanceof Error ? error.message : "Error loading comments."}
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
             <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6 pb-12">
                <AnimatePresence mode="popLayout">
                    {comments?.map((comment) => (
                        <ReviewCard 
                            key={comment.id} 
                            comment={comment}
                            onApprove={handleApprove}
                            onSpam={handleSpam}
                            onTrash={handleTrash}
                        />
                    ))}
                </AnimatePresence>
                
                {comments?.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="col-span-full py-20 text-center"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                            <MessageCircle className="text-slate-300 w-8 h-8" />
                        </div>
                        <h3 className="text-slate-900 font-medium">No reviews found</h3>
                        <p className="text-slate-400 text-sm mt-1">This list is empty.</p>
                    </motion.div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};