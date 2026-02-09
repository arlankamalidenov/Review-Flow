import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    isLoading = false
}) => {
    if (totalPages <= 1) return null;

    const canGoPrev = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4 mt-8 pb-8"
        >
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!canGoPrev || isLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 
                   text-slate-700 font-medium shadow-sm
                   hover:bg-slate-50 hover:border-slate-300 hover:shadow-md
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:shadow-sm
                   transition-all duration-200"
            >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex items-center gap-3 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl shadow-sm">
                <span className="text-sm font-medium text-slate-600">Page</span>
                <span className="text-lg font-bold text-indigo-600">{currentPage}</span>
                <span className="text-sm font-medium text-slate-400">of</span>
                <span className="text-lg font-bold text-slate-900">{totalPages}</span>
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!canGoNext || isLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 
                   text-slate-700 font-medium shadow-sm
                   hover:bg-slate-50 hover:border-slate-300 hover:shadow-md
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:shadow-sm
                   transition-all duration-200"
            >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
            </button>
        </motion.div>
    );
};
