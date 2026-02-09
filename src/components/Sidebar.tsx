import React, { useState } from 'react';
import {
  BarChart3,
  MessageCircle,
  CheckCircle2,
  Clock,
  Inbox,
  Trash2,
  LogOut,
  Settings,
  Archive,
  Sparkles,
  Video
} from 'lucide-react';
import { ReviewStatus, ProjectConfig, WPCredentials, ReviewFilter } from '../types';
import { ProjectSelector } from './ProjectSelector';
import { ProjectSettingsModal } from './ProjectSettingsModal';
import { CountBadge } from './ui/CountBadge';

interface SidebarProps {
  currentFilter: ReviewFilter;
  onFilterChange: (filter: ReviewFilter) => void;
  currentProject: ProjectConfig;
  activeCreds: WPCredentials;
  onProjectChange: (project: ProjectConfig) => void;
  onSaveProjectCreds: (projectId: string, creds: WPCredentials) => void;
  onLogout: () => void;
  counts?: {
    all: number;
    pending: number;
    published: number;
    draft: number;
    trash: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFilter,
  onFilterChange,
  currentProject,
  activeCreds,
  onProjectChange,
  onSaveProjectCreds,
  onLogout,
  counts
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const menuItems = [
    { id: 'all', label: 'All Reviews', icon: Inbox, count: counts?.all },
    { id: ReviewStatus.Pending, label: 'Pending', icon: Clock, count: counts?.pending },
    { id: ReviewStatus.Published, label: 'Published', icon: CheckCircle2, count: counts?.published },
    { id: ReviewStatus.Draft, label: 'Draft', icon: BarChart3, count: counts?.draft },
    { id: ReviewStatus.Trash, label: 'Trash', icon: Trash2, count: counts?.trash },
  ];

  if (currentProject.id === 'rbesolov') {
    menuItems.push({ id: 'archive', label: 'Archive (TG)', icon: Archive, count: undefined });
  }

  // Add Cover Lab for all projects
  menuItems.push({ id: 'cover-lab', label: 'Cover Lab', icon: Sparkles, count: undefined });

  // Add Video Reels Cutter for all projects
  menuItems.push({ id: 'video-reels', label: 'Video Reels', icon: Video, count: undefined });

  const getCountBadgeVariant = (itemId: string) => {
    if (itemId === ReviewStatus.Pending) return 'danger';
    if (itemId === 'all') return 'primary';
    return 'default';
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen fixed left-0 top-0 z-30">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <MessageCircle size={20} />
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">ReviewFlow</h1>
          </div>

          {/* Project Selector Integrated into Sidebar */}
          <ProjectSelector
            currentProject={currentProject}
            onProjectChange={onProjectChange}
          />

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 mb-6 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all text-xs font-bold uppercase tracking-wider"
          >
            <Settings size={14} />
            <span>Project Settings</span>
          </button>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onFilterChange(item.id as any)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${currentFilter === item.id
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <CountBadge
                    count={item.count}
                    variant={getCountBadgeVariant(item.id)}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-6 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">Admin</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Connected</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-rose-600 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <ProjectSettingsModal
        project={currentProject}
        currentCreds={activeCreds}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={onSaveProjectCreds}
      />
    </>
  );
};