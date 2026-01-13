import React from 'react';
import { motion } from 'framer-motion';
import { Check, Trash2, ShieldAlert, Reply, Clock } from 'lucide-react';
import { WPComment, CommentStatus } from '../types';
import { StatusBadge, Button } from './ui/Primitives';

interface ReviewCardProps {
  comment: WPComment;
  onApprove: (id: number) => void;
  onSpam: (id: number) => void;
  onTrash: (id: number) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ comment, onApprove, onSpam, onTrash }) => {
  // Strip HTML tags for preview
  const createMarkup = (html: string) => {
    return { __html: html };
  };

  const formattedDate = new Date(comment.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold overflow-hidden border border-slate-200">
             {comment.author_avatar_urls?.['48'] ? (
               <img src={comment.author_avatar_urls['48']} alt={comment.author_name} className="w-full h-full object-cover" />
             ) : (
               comment.author_name.charAt(0).toUpperCase()
             )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{comment.author_name}</h3>
            <p className="text-xs text-slate-400">{comment.author_email}</p>
          </div>
        </div>
        <StatusBadge status={comment.status} />
      </div>

      <div 
        className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3"
        dangerouslySetInnerHTML={createMarkup(comment.content.rendered)} 
      />

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
        <div className="flex items-center text-xs text-slate-400 gap-1">
          <Clock className="w-3 h-3" />
          <span>{formattedDate}</span>
        </div>

        {/* Action Buttons - Reveal on hover or always visible on mobile, tailored for minimalist look */}
        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          
          {comment.status !== CommentStatus.Approved && (
             <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => onApprove(comment.id)} title="Approve">
                <Check className="w-4 h-4" />
             </Button>
          )}

          {comment.status !== CommentStatus.Spam && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700" onClick={() => onSpam(comment.id)} title="Mark as Spam">
                <ShieldAlert className="w-4 h-4" />
            </Button>
          )}

          {comment.status !== CommentStatus.Trash && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => onTrash(comment.id)} title="Move to Trash">
                <Trash2 className="w-4 h-4" />
            </Button>
          )}
          
          <Button size="icon" variant="ghost" className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700" title="Reply (Mock)">
             <Reply className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};