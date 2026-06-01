import React from 'react';
import { 
  LayoutDashboard, 
  FolderHeart, 
  Palette, 
  Type, 
  Languages, 
  Users, 
  Heart, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser?: User;
  onLogout?: () => void;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
}

export default function Sidebar({ currentTab, setCurrentTab, currentUser, onLogout, isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'templates', name: 'Templates', icon: Palette },
    { id: 'categories', name: 'Categories', icon: FolderHeart },
    { id: 'fonts', name: 'Typography & Fonts', icon: Type },
    { id: 'languages', name: 'Languages', icon: Languages },
    { id: 'users', name: 'User Management', icon: Users },
  ];

  // Dynamically filter items by role permissions
  const filteredMenuItems = menuItems.filter((item) => {
    const role = currentUser?.role || 'super_admin';
    if (role === 'super_admin') return true;
    
    if (role === 'content_manager') {
      return item.id !== 'users';
    }
    
    if (role === 'editor' || role === 'user') {
      return item.id === 'dashboard' || item.id === 'templates';
    }
    
    return false;
  });

  const getInitials = (name: string) => {
    if (!name) return 'AD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    content_manager: 'Content Manager',
    editor: 'Editor',
    user: 'Standard User'
  };

  return (
    <aside className={`w-72 bg-wedding-charcoal-dark border-r border-[#3d2e31]/60 flex flex-col justify-between text-white shrink-0 fixed inset-y-0 left-0 z-50 md:static transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div>
        {/* Logo / Title Area */}
        <div className="p-8 border-b border-[#3d2e31]/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-wedding-pink-medium to-wedding-gold-accent flex items-center justify-center shadow-lg shadow-wedding-pink-medium/10">
              <Heart className="w-5 h-5 text-wedding-charcoal-dark fill-wedding-charcoal-dark" />
            </div>
            <div>
              <h1 className="font-semibold text-lg tracking-wide bg-gradient-to-r from-wedding-pink-medium via-wedding-gold-light to-wedding-gold-accent bg-clip-text text-transparent">
                AMANTRAN
              </h1>
              <p className="text-[10px] text-wedding-pink-medium/60 uppercase tracking-widest font-medium">
                Wedding invitation CMS
              </p>
            </div>
          </div>
          {setIsSidebarOpen && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-white p-2 hover:bg-[#3d2e31]/50 rounded-xl transition-colors border border-transparent hover:border-[#3d2e31]/40"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation Menu Links */}
        <nav className="p-4 space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  if (setIsSidebarOpen) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-wedding-pink-dark/80 to-[#5a363d]/80 text-wedding-gold-light border-l-4 border-wedding-gold-accent shadow-md shadow-wedding-pink-dark/10'
                    : 'text-gray-300 hover:bg-wedding-charcoal-light hover:text-white hover:pl-6'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-wedding-gold-accent scale-110' : 'text-gray-400'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dynamic Admin User Profile footer */}
      <div className="p-4 border-t border-[#3d2e31]/40">
        <div className="flex items-center gap-3 p-3 bg-wedding-charcoal-light/30 rounded-xl mb-3">
          <div className="w-9 h-9 rounded-full bg-wedding-pink-medium/80 flex items-center justify-center font-bold text-wedding-charcoal-dark text-xs select-none">
            {getInitials(currentUser?.displayName || 'Super Admin')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-wedding-gold-light truncate">
              {currentUser?.displayName || 'Super Admin'}
            </p>
            <p className="text-[9px] font-bold text-wedding-pink-medium/60 uppercase tracking-wider mb-0.5">
              {roleLabels[currentUser?.role || 'super_admin']}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{currentUser?.email || 'admin@amantran.com'}</p>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-950/20 hover:text-red-300 rounded-xl text-sm font-medium transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
