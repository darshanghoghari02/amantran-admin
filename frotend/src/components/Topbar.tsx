import React from 'react';
import { Cloud, CloudOff, RefreshCw, Menu } from 'lucide-react';

interface TopbarProps {
  currentTab: string;
  isFirebase: boolean;
  backendStatus?: 'checking' | 'online' | 'offline';
  apiUrl?: string;
  onToggleSidebar?: () => void;
}

export default function Topbar({ currentTab, isFirebase, backendStatus, apiUrl, onToggleSidebar }: TopbarProps) {
  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'templates': return 'Invitation Templates';
      case 'categories': return 'Category Directory';
      case 'fonts': return 'Typography Library';
      case 'languages': return 'Supported Languages';
      case 'users': return 'User Database';
      case 'editor': return 'Canva Card Designer';
      default: return 'Amantran CMS';
    }
  };

  return (
    <header className="h-20 bg-white border-b border-wedding-pink-medium/40 px-6 sm:px-8 flex items-center justify-between shadow-sm shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden p-2 hover:bg-wedding-pink-light/60 text-wedding-charcoal-dark hover:text-wedding-pink-dark rounded-xl transition-colors border border-wedding-pink-medium/20 shadow-xs flex items-center justify-center shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-extrabold text-wedding-charcoal-dark tracking-tight truncate">
            {getTitle()}
          </h2>
          <p className="text-[10px] sm:text-xs text-gray-500 font-semibold truncate">Amantran Invitation App CMS</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0 select-none">
        {/* Connection status pills */}
        <div className="flex items-center">
          {isFirebase ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
              <Cloud className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Live Firestore Mode</span>
            </span>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 shadow-sm">
                <CloudOff className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Local Database Fallback</span>
              </span>
            </div>
          )}
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-wedding-pink-light text-wedding-pink-dark text-xs font-bold rounded-full border border-wedding-pink-medium/40">
            <RefreshCw className="w-3.5 h-3.5 text-wedding-pink-dark shrink-0" />
            <span className="hidden sm:inline">Auto-Sync Connected</span>
          </span>
        </div>
      </div>
    </header>
  );
}
