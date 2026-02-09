import React from 'react';
import { motion } from 'framer-motion';
import { Check, Trash2, Edit2, Clock, Globe, Send, Image as ImageIcon } from 'lucide-react';
import { UnifiedReview, ReviewStatus, WPCredentials, ProjectId } from '../types';
import { StatusBadge, Button } from './ui/Primitives';
import { formatDateShort, getCountryFlag, getCountryName } from '../utils/formatters';
import { StarRating } from './StarRating';
import { ImagePreview } from './ImagePreview';

interface ReviewCardProps {
  review: UnifiedReview;
  projectId: ProjectId;
  creds: WPCredentials;
  onApprove: (id: number) => void;
  onTrash: (id: number) => void;
  onEdit: (review: UnifiedReview) => void;
  onPublish?: (review: UnifiedReview) => void;
  isPublishing?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  projectId,
  creds,
  onApprove,
  onTrash,
  onEdit,
  onPublish,
  isPublishing
}) => {
  const formattedDate = formatDateShort(review.date);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full"
    >
      {/* ... (rest of the card content) */}
      <div className="absolute top-4 right-4 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
        {projectId === 'bfisherman' ? review.meta : review.meta || 'Renat Besolov'}
      </div>

      <div className="flex items-start gap-4 mb-4 pr-24">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0 shadow-sm">
          {review.author.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-900 truncate mb-1">
            {review.author}
          </h3>
          <p className="text-sm text-slate-500 truncate">{review.email}</p>

          {review.country_iso ? (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-lg leading-none" title={getCountryName(review.country_iso)}>
                {getCountryFlag(review.country_iso)}
              </span>
              <span className="text-xs text-slate-400">
                {getCountryName(review.country_iso)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-2 text-slate-300">
              <Globe size={14} />
              <span className="text-xs">Location hidden</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <StarRating rating={review.rating} size={18} />
      </div>

      <p className="text-slate-700 text-sm leading-relaxed mb-6 line-clamp-4 flex-1">
        {review.text}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center text-xs text-slate-400 gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={review.status} />
            {review.photo ? (
              <ImagePreview
                photo={
                  typeof review.photo === 'object' && review.photo !== null
                    ? (review.photo as any).url
                    : review.photo
                }
                creds={creds}
              />
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-300 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100/50">
                <ImageIcon size={12} />
                <span>No Photo</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          {onPublish ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl"
                onClick={() => onPublish(review)}
                title="Опубликовать на сайт"
                isLoading={isPublishing}
              >
                {!isPublishing && <Check className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl"
                onClick={() => onEdit(review)}
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl"
                onClick={() => onTrash(review.id)}
                title="Remove from Archive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              {review.status !== ReviewStatus.Published && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl"
                  onClick={() => onApprove(review.id)}
                  title="Approve"
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}

              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl"
                onClick={() => onEdit(review)}
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </Button>

              {review.status !== ReviewStatus.Trash && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl"
                  onClick={() => onTrash(review.id)}
                  title="Move to Trash"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>

  );
};