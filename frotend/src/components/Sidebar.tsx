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
  LogOut,
  Sparkles,
  Scroll,
  Sliders
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

export default function Sidebar({
  currentTab,
  setCurrentTab,
  currentUser,
  onLogout,
  isSidebarOpen,
  setIsSidebarOpen
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { id: 'templates', name: 'Templates', icon: Palette, permission: 'templates.view' },
    { id: 'categories', name: 'Categories', icon: FolderHeart, permission: 'categories.view' },
    { id: 'fonts', name: 'Typography & Fonts', icon: Type, permission: 'fonts.view' },
    { id: 'languages', name: 'Languages', icon: Languages, permission: 'languages.view' },
    { id: 'subscriptions', name: 'Subscription Settings', icon: Sparkles, permission: 'subscriptions.view' },
    { id: 'users', name: 'User Management', icon: Users, permission: 'users.view' },
    { id: 'roles', name: 'Role & Permissions', icon: Settings, permission: 'roles.view' },
    { id: 'audit-logs', name: 'Audit Logs', icon: Scroll, permission: 'roles.view' },
    { id: 'settings', name: 'Settings', icon: Sliders, permission: 'settings.view' },
  ];

  // Dynamically filter items by role permissions
  const filteredMenuItems = menuItems.filter((item) => {
    const roleId = currentUser?.roleId || currentUser?.role || 'super_admin';
    if (roleId === 'super_admin') return true;
    
    if (currentUser?.permissions?.includes('*')) return true;
    
    // Check if the user has resolved permissions array
    if (currentUser?.permissions && Array.isArray(currentUser.permissions)) {
      return currentUser.permissions.includes(item.permission);
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
    admin: 'Admin',
    content_manager: 'Content Manager',
    subscription_manager: 'Subscription Manager',
    editor: 'Editor',
    user: 'Standard User'
  };

  const getRoleLabel = (roleStr: string) => {
    if (!roleStr) return 'Super Admin';
    if (roleLabels[roleStr]) return roleLabels[roleStr];
    return roleStr.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <aside className={`w-72 bg-wedding-charcoal-dark border-r border-wedding-pink-medium/10 flex flex-col justify-between text-white shrink-0 fixed inset-y-0 left-0 z-50 md:static transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-xl`}>
      <div>
        {/* Logo / Title Area */}
        <div className="p-8 border-b border-wedding-pink-medium/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff6b81] to-wedding-pink-dark flex items-center justify-center shadow-lg shadow-wedding-pink-medium/30 animate-pulse">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-wider text-white font-sans uppercase">
                AMANTRAN
              </h1>
              <p className="text-[10px] text-wedding-pink-dark uppercase tracking-widest font-bold mt-0.5">
                Invitation Card Maker
              </p>
            </div>
          </div>
          {setIsSidebarOpen && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-white p-2 hover:bg-wedding-pink-light/10 rounded-xl transition-colors border border-transparent hover:border-wedding-pink-medium/10"
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
                className={`group w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-wedding-pink-dark to-[#ff6b81] text-white border-l-4 border-white shadow-lg shadow-wedding-pink-dark/20 scale-[1.02]'
                    : 'text-gray-400 hover:bg-wedding-pink-light/10 hover:text-white hover:pl-6'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-white scale-110' : 'text-gray-500 group-hover:text-wedding-pink-dark group-hover:scale-105'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dynamic Admin User Profile footer */}
      <div className="p-4 border-t border-wedding-pink-medium/10">
        <div className="flex items-center gap-3 p-3 bg-wedding-charcoal-light/35 border border-wedding-pink-medium/10 rounded-2xl mb-3">
          <div className="w-9 h-9 rounded-full bg-wedding-pink-dark flex items-center justify-center font-bold text-white text-xs select-none border border-wedding-pink-medium/30">
            {getInitials(currentUser?.displayName || 'Super Admin')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">
              {currentUser?.displayName || 'Super Admin'}
            </p>
            <p className="text-[9px] font-extrabold text-wedding-pink-dark uppercase tracking-wider mb-0.5">
              {getRoleLabel(currentUser?.roleId || currentUser?.role || 'super_admin')}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{currentUser?.email || 'admin@amantran.com'}</p>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-950/20 hover:text-red-300 rounded-xl text-sm font-bold transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
