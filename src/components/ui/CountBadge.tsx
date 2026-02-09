import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountBadgeProps {
    count: number;
    variant?: 'default' | 'primary' | 'danger';
    show?: boolean;
}

export const CountBadge: React.FC<CountBadgeProps> = ({
    count,
    variant = 'default',
    show = true
}) => {
    if (!show || count === 0) return null;

    const variantStyles = {
        default: 'bg-slate-100 text-slate-600',
        primary: 'bg-indigo-500 text-white',
        danger: 'bg-red-500 text-white'
    };

    return (
        <AnimatePresence>
            <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`
          inline-flex items-center justify-center
          min-w-[20px] h-5 px-1.5
          rounded-full
          text-[10px] font-bold
          ${variantStyles[variant]}
          shadow-sm
        `}
                style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif'
                }}
            >
                {count > 99 ? '99+' : count}
            </motion.span>
        </AnimatePresence>
    );
};
