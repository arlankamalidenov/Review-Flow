import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { UnifiedReview, WPCredentials, ProjectId } from '../types';
import { ReviewCard } from './ReviewCard';

interface ReviewListProps {
    reviews: UnifiedReview[];
    creds: WPCredentials;
    projectId: ProjectId;
    onApprove: (id: number) => void;
    onTrash: (id: number) => void;
    onEdit: (review: UnifiedReview) => void;
    onPublish?: (review: UnifiedReview) => void;
    isPublishing?: string | number;
}

export const ReviewList: React.FC<ReviewListProps> = ({
    reviews,
    creds,
    projectId,
    onApprove,
    onTrash,
    onEdit,
    onPublish,
    isPublishing
}) => {
    if (reviews.length === 0) {
        return (
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
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6 pb-12">
            <AnimatePresence mode="popLayout">
                {reviews.map((review) => (
                    <ReviewCard
                        key={review.id}
                        review={review}
                        projectId={projectId}
                        creds={creds}
                        onApprove={onApprove}
                        onTrash={onTrash}
                        onEdit={onEdit}
                        onPublish={onPublish}
                        isPublishing={review.id === isPublishing}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};
