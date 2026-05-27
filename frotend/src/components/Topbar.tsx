import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

interface TopbarProps {
  currentTab: string;
  isFirebase: boolean;
}

export default function Topbar({ currentTab, isFirebase }: TopbarProps) {
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
    <header className="h-20 bg-white border-b border-wedding-pink-medium/40 px-8 flex items-center justify-between shadow-sm shrink-0">
      <div>
        <h2 className="text-xl font-bold text-wedding-charcoal-dark tracking-tight">
          {getTitle()}
        </h2>
        <p className="text-xs text-gray-500">Amantran Invitation App CMS</p>
      </div>

      <div className="flex items-center gap-6">
        {/* Connection status pills */}
        <div className="flex items-center gap-2">
          {isFirebase ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
              <Cloud className="w-3.5 h-3.5" />
              Live Firestore Mode
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200 shadow-sm animate-pulse">
              <CloudOff className="w-3.5 h-3.5" />
              Local JSON Database Fallback
            </span>
          )}
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-wedding-pink-light text-wedding-pink-dark text-xs font-semibold rounded-full border border-wedding-pink-medium/40">
            <RefreshCw className="w-3.5 h-3.5 text-wedding-pink-dark" />
            Auto-Sync Connected
          </span>
        </div>
      </div>
    </header>
  );
}
