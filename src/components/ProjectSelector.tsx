import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { ProjectConfig, PROJECTS, ProjectId } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectSelectorProps {
    currentProject: ProjectConfig;
    onProjectChange: (project: ProjectConfig) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ currentProject, onProjectChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative mb-8" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Globe size={18} />
                    </div>
                    <div>
                        <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Current Project</p>
                        <p className="text-sm font-semibold text-slate-900">{currentProject.name}</p>
                    </div>
                </div>
                <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 4, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden py-2 mt-1"
                    >
                        {PROJECTS.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => {
                                    onProjectChange(project);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors ${currentProject.id === project.id ? 'bg-indigo-50/50' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${currentProject.id === project.id ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                                    <span className={`text-sm font-medium ${currentProject.id === project.id ? 'text-indigo-600' : 'text-slate-700'}`}>
                                        {project.name}
                                    </span>
                                </div>
                                {currentProject.id === project.id && <Check size={16} className="text-indigo-600" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
