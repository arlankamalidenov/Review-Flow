import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { UnifiedReview, ProjectConfig } from '../types';
import { Input, Textarea, Button } from './ui/Primitives';

interface EditModalProps {
    review: UnifiedReview | null;
    project: ProjectConfig;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: number, rawData: any) => void;
    isSaving?: boolean;
}

export const EditModal: React.FC<EditModalProps> = ({
    review,
    project,
    isOpen,
    onClose,
    onSave,
    isSaving = false
}) => {
    const [author, setAuthor] = useState('');
    const [email, setEmail] = useState('');
    const [reviewText, setReviewText] = useState('');

    useEffect(() => {
        if (review) {
            setAuthor(review.author);
            setEmail(review.email);
            setReviewText(review.text);
        }
    }, [review]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!review) return;

        // Prepare raw data based on project mapping
        // RBesolov requires 'fields' key for ACF in POST requests, while Bfisherman uses 'acf'
        const metadataKey = project.id === 'rbesolov' ? 'fields' : 'acf';
        const rawData: any = { [metadataKey]: {} };

        const authorField = project.mapping.author.split('.').pop() || 'author';
        const emailField = project.mapping.email.split('.').pop() || 'email';
        const textField = project.mapping.text.split('.').pop() || 'text';

        rawData[metadataKey][authorField] = author;
        rawData[metadataKey][emailField] = email;
        rawData[metadataKey][textField] = reviewText;

        onSave(review.id, rawData);
    };

    const handleClose = () => {
        if (!isSaving) onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && review && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
                        onClick={handleClose}
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Edit Review</h2>
                                    <p className="text-sm text-slate-500 mt-0.5">Editing: {project.name}</p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={isSaving}
                                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <Input
                                    label="Author Name"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    required
                                    disabled={isSaving}
                                />

                                <Input
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isSaving}
                                />

                                <Textarea
                                    label="Review Message"
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    rows={6}
                                    required
                                    disabled={isSaving}
                                />

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                    <Button type="button" variant="ghost" onClick={handleClose} disabled={isSaving}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="primary" isLoading={isSaving} disabled={isSaving}>
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
