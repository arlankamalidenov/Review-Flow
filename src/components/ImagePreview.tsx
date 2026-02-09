import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { fetchMediaUrl } from '../services/wpService';
import { WPCredentials } from '../types';

interface ImagePreviewProps {
    photo: number | string; // Can be ID or direct URL
    creds: WPCredentials;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ photo, creds }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(typeof photo === 'string' ? photo : null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        // If photo is a string, it's a direct URL
        if (typeof photo === 'string') {
            setImageUrl(photo);
            return;
        }

        // Only fetch if it's a number (ID) and we don't have the URL yet
        if (isHovered && typeof photo === 'number' && !imageUrl && !isLoading && !error) {
            setIsLoading(true);
            fetchMediaUrl(creds, photo)
                .then((url) => {
                    setImageUrl(url);
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error('Failed to load image preview:', err);
                    setError(true);
                    setIsLoading(false);
                });
        }
    }, [isHovered, photo, creds, imageUrl, isLoading, error]);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600 transition-colors bg-indigo-50 px-2 py-1 rounded-lg">
                <ImageIcon size={14} />
                <span>Photo</span>
            </button>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 pointer-events-auto"
                    >
                        <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl rounded-xl overflow-hidden p-1 min-w-[120px] min-h-[120px] flex items-center justify-center">
                            {isLoading ? (
                                <Loader2 size={20} className="text-slate-400 animate-spin" />
                            ) : error ? (
                                <div className="p-4 flex flex-col items-center gap-2 text-center">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                        <ImageIcon size={20} />
                                    </div>
                                    <div className="text-[10px] text-slate-400 max-w-[100px]">Photo unavailable in preview</div>
                                    {typeof photo === 'string' && (
                                        <a
                                            href={photo}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[9px] text-indigo-500 hover:underline pointer-events-auto"
                                        >
                                            Open link
                                        </a>
                                    )}
                                </div>
                            ) : imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt="Review attachment"
                                    className="max-w-[240px] max-h-[240px] rounded-lg object-contain"
                                    onError={() => {
                                        console.log('🖼️ Image load error for:', imageUrl);
                                        setError(true);
                                    }}
                                    referrerPolicy="no-referrer"
                                />
                            ) : null}

                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white/80" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
