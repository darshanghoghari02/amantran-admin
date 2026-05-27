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

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function Sidebar({ currentTab, setCurrentTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'templates', name: 'Templates', icon: Palette },
    { id: 'categories', name: 'Categories', icon: FolderHeart },
    { id: 'fonts', name: 'Typography & Fonts', icon: Type },
    { id: 'languages', name: 'Languages', icon: Languages },
    { id: 'users', name: 'User Management', icon: Users },
  ];

  return (
    <aside className="w-72 bg-wedding-charcoal-dark border-r border-[#3d2e31]/60 flex flex-col justify-between text-white shrink-0">
      <div>
        {/* Logo / Title Area */}
        <div className="p-8 border-b border-[#3d2e31]/40 flex items-center gap-3">
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

        {/* Navigation Menu Links */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
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

      {/* Admin User Profile footer */}
      <div className="p-4 border-t border-[#3d2e31]/40">
        <div className="flex items-center gap-3 p-3 bg-wedding-charcoal-light/30 rounded-xl mb-3">
          <div className="w-9 h-9 rounded-full bg-wedding-pink-medium/80 flex items-center justify-center font-bold text-wedding-charcoal-dark">
            AD
          </div>
          <div>
            <p className="text-sm font-semibold text-wedding-gold-light">Super Admin</p>
            <p className="text-[10px] text-gray-400">admin@amantran.com</p>
          </div>
        </div>
        
        <button className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-950/20 hover:text-red-300 rounded-xl text-sm font-medium transition-all duration-300">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
