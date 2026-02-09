import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: number;
    showNumber?: boolean;
    className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
    rating,
    maxRating = 5,
    size = 16,
    showNumber = false,
    className = ''
}) => {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {Array.from({ length: maxRating }, (_, i) => (
                <Star
                    key={i}
                    size={size}
                    className={`${i < rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-200 text-slate-200'
                        } transition-colors`}
                />
            ))}
            {showNumber && (
                <span className="text-sm font-medium text-slate-600 ml-1">
                    {rating}/{maxRating}
                </span>
            )}
        </div>
    );
};
