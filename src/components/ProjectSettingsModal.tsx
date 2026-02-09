import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Link, User, Key, Save } from 'lucide-react';
import { WPCredentials, ProjectConfig } from '../types';
import { Input, Button } from './ui/Primitives';

interface ProjectSettingsModalProps {
    project: ProjectConfig;
    currentCreds: WPCredentials;
    isOpen: boolean;
    onClose: () => void;
    onSave: (projectId: string, creds: WPCredentials) => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
    project,
    currentCreds,
    isOpen,
    onClose,
    onSave
}) => {
    const [url, setUrl] = useState(currentCreds.url);
    const [username, setUsername] = useState(currentCreds.username);
    const [appPassword, setAppPassword] = useState(currentCreds.appPassword);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(project.id, { url, username, appPassword });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60]"
                        onClick={onClose}
                    />
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto border border-slate-100"
                        >
                            <div className="px-8 pt-8 pb-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Settings size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Project API</h2>
                                            <p className="text-xs text-slate-500 font-medium">{project.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-slate-500 mb-1 ml-1 text-xs font-bold uppercase tracking-wider">
                                            <Link size={12} />
                                            <span>WordPress URL</span>
                                        </div>
                                        <Input
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="https://example.com"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-slate-500 mb-1 ml-1 text-xs font-bold uppercase tracking-wider">
                                            <User size={12} />
                                            <span>Username</span>
                                        </div>
                                        <Input
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="admin"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-slate-500 mb-1 ml-1 text-xs font-bold uppercase tracking-wider">
                                            <Key size={12} />
                                            <span>Application Password</span>
                                        </div>
                                        <Input
                                            type="password"
                                            value={appPassword}
                                            onChange={(e) => setAppPassword(e.target.value)}
                                            placeholder="xxxx xxxx xxxx xxxx"
                                            required
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-relaxed">
                                            Create this in WordPress: Users → Your Profile → Application Passwords.
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full mt-6 py-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} />
                                        Save Configuration
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
