import React from 'react';
import { LayoutGrid, MessageCircle, CheckCircle, AlertOctagon, Trash } from 'lucide-react';
import { SidebarLink, CommentStatus } from '../types';

interface SidebarProps {
  currentFilter: CommentStatus | 'all';
  onFilterChange: (filter: CommentStatus | 'all') => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentFilter, onFilterChange, onLogout }) => {
  const links: SidebarLink[] = [
    { label: 'All Reviews', icon: <LayoutGrid size={18} />, statusFilter: 'all' },
    { label: 'Pending', icon: <MessageCircle size={18} />, statusFilter: CommentStatus.Hold },
    { label: 'Published', icon: <CheckCircle size={18} />, statusFilter: CommentStatus.Approved },
    { label: 'Spam', icon: <AlertOctagon size={18} />, statusFilter: CommentStatus.Spam },
    { label: 'Trash', icon: <Trash size={18} />, statusFilter: CommentStatus.Trash },
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-slate-50 border-r border-slate-200 hidden md:flex flex-col z-20">
      <div className="p-8 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
          ReviewFlow
        </h2>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {links.map((link) => {
          const isActive = currentFilter === link.statusFilter;
          return (
            <button
              key={link.label}
              onClick={() => onFilterChange(link.statusFilter)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-white text-indigo-600 shadow-soft' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                {link.icon}
              </span>
              {link.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                    AD
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-900">Admin</span>
                    <span className="text-[10px] text-slate-400">Connected</span>
                </div>
            </div>
            <button 
                onClick={onLogout}
                className="text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
            >
                Log out
            </button>
        </div>
      </div>
    </aside>
  );
};