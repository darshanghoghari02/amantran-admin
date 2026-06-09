'use client';

import { API_URL } from '@/config';
import React, { useState, useEffect } from 'react';
import { Heart, Lock, Mail, Server, LogIn, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Dashboard from '../components/Dashboard';
import Categories from '../components/Categories';
import TemplatesList from '../components/TemplatesList';
import Fonts from '../components/Fonts';
import Languages from '../components/Languages';
import Users from '../components/Users';
import Subscriptions from '../components/Subscriptions';
import RolesAndPermissions from '../components/RolesAndPermissions';
import AuditLogs from '../components/AuditLogs';
import Settings from '../components/Settings';
import EditorWorkspace from '../components/editor/EditorWorkspace';
import { useCanvasStore } from '../store/canvasStore';
import { User } from '../types';

export default function RootPage() {
  // Navigation & Session states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isFirebase, setIsFirebase] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth Form State
  const [email, setEmail] = useState('admin@amantran.com');
  const [password, setPassword] = useState('admin123');
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { setTemplate } = useCanvasStore();

  // Check backend server connection on boot
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function checkBackend() {
      try {
        const res = await fetch(`${API_URL}/`);
        const data = await res.json();
        setBackendStatus('online');
        setIsFirebase(data.mode === 'firebase' || data.mode === 'dual-mode' || data.isFirebase === true);

        // If successfully online, check less frequently (every 30 seconds)
        if (data.status === 'online') {
          clearInterval(intervalId);
          intervalId = setInterval(checkBackend, 30000);
        }
      } catch (err) {
        console.warn('Backend server is not running yet. Retrying...');
        setBackendStatus('offline');
        // If offline, assume local fallback mock rendering mode
        setIsFirebase(false);
      }
    }

    checkBackend();

    // Check every 6 seconds until backend is online
    intervalId = setInterval(checkBackend, 6000);

    return () => clearInterval(intervalId);
  }, []);

  // Dynamically load custom fonts into the browser DOM
  useEffect(() => {
    async function loadCustomFonts() {
      if (backendStatus !== 'online') return;
      try {
        const res = await fetch(`${API_URL}/api/fonts`);
        const fonts = await res.json();
        if (Array.isArray(fonts)) {
          const activeFonts = fonts.filter((f) => f.isActive);

          let styleContent = '';
          activeFonts.forEach((f) => {
            const cleanPath = f.localPath.startsWith('/') ? f.localPath : `/${f.localPath}`;
            const fontUrl = `${API_URL}${cleanPath}`;
            styleContent += `
              @font-face {
                font-family: '${f.family}';
                src: url('${fontUrl}') format('truetype');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
              }
            `;
          });

          // Inject into document head
          const id = 'dynamic-custom-fonts';
          const existingStyle = document.getElementById(id);
          if (existingStyle) {
            existingStyle.textContent = styleContent;
          } else {
            const style = document.createElement('style');
            style.id = id;
            style.textContent = styleContent;
            document.head.appendChild(style);
          }
          console.log(`✨ Dynamically loaded ${activeFonts.length} custom typographies into browser.`);
        }
      } catch (err) {
        console.error('Failed to dynamically load custom fonts:', err);
      }
    }

    loadCustomFonts();
  }, [backendStatus, currentTab]);

  // Sync logged-in admin user's profile from database in real-time
  useEffect(() => {
    if (isLoggedIn && currentUser && currentUser.id !== 'admin_super') {
      fetch(`${API_URL}/api/users/${currentUser.id}`, {
        headers: { 'x-user-id': currentUser.id }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Database sync skipped');
        })
        .then(updated => {
          if (updated && updated.displayName) {
            setCurrentUser(updated);
          }
        })
        .catch(err => console.log('Dynamic user sync:', err.message));
    }
  }, [currentTab, isLoggedIn]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoggingIn(true);

    try {
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        setIsLoggedIn(true);
      } else {
        const err = await res.json();
        setAuthError(err.error || 'Authentication failed. Incorrect email or password.');
      }
    } catch (err) {
      console.error('Login submit error:', err);
      setAuthError('Connection failed. Please ensure the backend is running.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Login view layout
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FFF0F2] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Floating concentric design circles */}
        <div className="absolute top-[-10%] left-[-10%] w-[45%] aspect-square rounded-full border border-[#FFCAD2]/30 pointer-events-none z-0"></div>
        <div className="absolute top-[-5%] left-[-5%] w-[33%] aspect-square rounded-full border border-[#FFCAD2]/45 pointer-events-none z-0"></div>
        <div className="absolute top-[0%] left-[0%] w-[22%] aspect-square rounded-full border border-[#FFCAD2]/55 pointer-events-none z-0"></div>

        {/* Concentric rings at the bottom right */}
        <div className="absolute bottom-[-15%] right-[-15%] w-[50%] aspect-square rounded-full border border-[#FFCAD2]/25 pointer-events-none z-0"></div>
        <div className="absolute bottom-[-8%] right-[-8%] w-[35%] aspect-square rounded-full border border-[#FFCAD2]/35 pointer-events-none z-0"></div>

        {/* Layered wave curves at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-0 pointer-events-none">
          <svg className="relative block w-full h-[150px] md:h-[220px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C150,90 350,120 600,80 C850,40 1050,100 1200,20 L1200,120 L0,120 Z" fill="#FFAEC0" opacity="0.3"></path>
            <path d="M0,40 C180,100 320,40 600,90 C880,140 1020,30 1200,60 L1200,120 L0,120 Z" fill="#FF7FA0" opacity="0.4"></path>
            <path d="M0,70 C200,110 400,60 700,100 C1000,140 1100,80 1200,100 L1200,120 L0,120 Z" fill="#FF3E5C" opacity="0.65"></path>
          </svg>
        </div>

        {/* Dotted grid layouts */}
        <div className="absolute top-[20%] right-[10%] opacity-20 hidden md:block z-0 pointer-events-none">
          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-wedding-pink-dark"></div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-[20%] left-[5%] opacity-20 hidden md:block z-0 pointer-events-none">
          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-wedding-pink-dark"></div>
            ))}
          </div>
        </div>

        {/* Small floating outline rings */}
        <div className="absolute top-[25%] left-[20%] w-5 h-5 rounded-full border-[2.5px] border-[#FF3E5C]/35 z-0"></div>
        <div className="absolute top-[20%] right-[25%] w-6 h-6 rounded-full border-[2.5px] border-[#FF3E5C]/35 z-0"></div>

        {/* Central white auth card */}
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[36px] shadow-[0_20px_60px_-15px_rgba(255,62,92,0.14)] space-y-6 z-10 border border-wedding-pink-medium/10 animate-slideUp">

          {/* Logo Heading */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-[22px] bg-[#FF3E5C] flex items-center justify-center shadow-lg shadow-wedding-pink-dark/20 transition-transform duration-300 hover:scale-105">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl tracking-wide text-wedding-charcoal-dark font-sans uppercase">
                AMANTRAN <span className="text-wedding-pink-dark">ADMIN</span>
              </h1>
              <p className="text-xs text-gray-500 font-semibold mt-1">
                Professional Invitation CMS Portal
              </p>
            </div>
          </div>

          {/* Separation divider with heart icon */}
          <div className="flex items-center justify-center gap-3 py-1">
            <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-wedding-pink-medium/40"></div>
            <Heart className="w-3 h-3 text-[#FF3E5C] fill-[#FF3E5C]" />
            <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-wedding-pink-medium/40"></div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {authError && (
              <div className="p-3.5 bg-red-50 text-red-600 text-xs font-semibold rounded-2xl border border-red-200">
                ✕ {authError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Administrator Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-wedding-pink-dark absolute left-4 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@amantran.com"
                  className="w-full pl-12 pr-4 py-3 bg-[#FFF5F6] border border-[#FFCAD2] rounded-2xl text-wedding-charcoal-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/30 focus:bg-white text-sm font-semibold transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Security Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-wedding-pink-dark absolute left-4 top-1/2 transform -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-[#FFF5F6] border border-[#FFCAD2] rounded-2xl text-wedding-charcoal-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/30 focus:bg-white text-sm font-semibold transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 bg-gradient-to-r from-[#FF3E5C] to-[#FF6B81] hover:from-[#E62E47] hover:to-[#FF526E] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-wedding-pink-dark/20 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-white" />
              {loggingIn ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* Dev credentials tip */}
          <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-wedding-pink-medium/20 text-[10px] text-gray-500 font-semibold leading-relaxed">
            <span className="flex items-center gap-1 text-green-600">
              <span className="p-0.5 bg-green-50 rounded border border-green-200"><ShieldCheck className="w-3 h-3" /></span>
              Local Developer Credentials:
            </span>
            <code className="text-wedding-pink-dark font-bold font-mono">admin@amantran.com</code>
            <span>|</span>
            <code className="text-wedding-pink-dark font-bold font-mono">admin123</code>
          </div>
        </div>
      </div>
    );
  }

  // 1. Canva Canvas editor view: occupies full screen (hides sidebar/topbar)
  if (currentTab === 'editor') {
    return (
      <main className="min-h-screen flex flex-col bg-wedding-bg">
        <EditorWorkspace onClose={() => setCurrentTab('templates')} currentUser={currentUser || undefined} />
      </main>
    );
  }

  // Granular Tab Access Permission Guard
  const hasAccessToTab = (tab: string, user: User | null | undefined): boolean => {
    if (!user) return false;
    const roleId = user.roleId || user.role || 'user';
    if (roleId === 'super_admin') return true;

    // If the user's resolved permissions list contains '*' (wildcard), allow access to all tabs
    if (user.permissions?.includes('*')) return true;

    const mapping: Record<string, string> = {
      dashboard: 'dashboard.view',
      templates: 'templates.view',
      categories: 'categories.view',
      fonts: 'fonts.view',
      languages: 'languages.view',
      subscriptions: 'subscriptions.view',
      users: 'users.view',
      roles: 'roles.view',
      'audit-logs': 'roles.view',
      settings: 'settings.view'
    };

    const requiredPerm = mapping[tab];
    if (!requiredPerm) return false;

    return user.permissions?.includes(requiredPerm) || false;
  };

  // 2. Standard Dashboard panels view
  return (
    <div className="flex h-screen overflow-hidden bg-wedding-bg relative">
      {/* Dynamic Navigation Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser || undefined}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onLogout={() => {
          setIsLoggedIn(false);
          setCurrentUser(null);
          setCurrentTab('dashboard');
        }}
      />

      {/* Sidebar mobile dark overlay backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-wedding-charcoal-dark/50 backdrop-blur-xs z-40 md:hidden animate-fadeIn transition-opacity duration-300"
        />
      )}

      {/* Central content screen wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Dynamic header Topbar */}
        <Topbar
          currentTab={currentTab}
          isFirebase={isFirebase}
          backendStatus={backendStatus}
          apiUrl={API_URL}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Dynamic content rendering body */}
        <main className="flex-1 p-8 overflow-y-auto bg-wedding-bg">
          {currentTab === 'dashboard' && hasAccessToTab('dashboard', currentUser) && (
            <Dashboard onNavigate={setCurrentTab} />
          )}

          {currentTab === 'categories' && hasAccessToTab('categories', currentUser) && (
            <Categories currentUser={currentUser || undefined} />
          )}

          {currentTab === 'templates' && hasAccessToTab('templates', currentUser) && (
            <TemplatesList
              currentUser={currentUser || undefined}
              onOpenEditor={(tpl) => {
                setTemplate(tpl);
                setCurrentTab('editor');
              }}
            />
          )}

          {currentTab === 'fonts' && hasAccessToTab('fonts', currentUser) && (
            <Fonts currentUser={currentUser || undefined} />
          )}

          {currentTab === 'languages' && hasAccessToTab('languages', currentUser) && (
            <Languages currentUser={currentUser || undefined} />
          )}

          {currentTab === 'users' && hasAccessToTab('users', currentUser) && (
            <Users currentUser={currentUser || undefined} />
          )}

          {currentTab === 'subscriptions' && hasAccessToTab('subscriptions', currentUser) && (
            <Subscriptions currentUser={currentUser || undefined} />
          )}

          {currentTab === 'roles' && hasAccessToTab('roles', currentUser) && (
            <RolesAndPermissions currentUser={currentUser || undefined} />
          )}

          {currentTab === 'audit-logs' && hasAccessToTab('audit-logs', currentUser) && (
            <AuditLogs currentUser={currentUser || undefined} />
          )}

          {currentTab === 'settings' && hasAccessToTab('settings', currentUser) && (
            <Settings currentUser={currentUser || undefined} />
          )}

          {/* Access Denied Warning Redirect */}
          {currentUser && !hasAccessToTab(currentTab, currentUser) && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center bg-white border border-red-200 rounded-3xl p-8 shadow-sm">
              <span className="p-4 bg-red-50 text-red-600 rounded-full font-bold text-xl">⚠️</span>
              <h4 className="font-bold text-lg text-wedding-charcoal-dark">Section Access Restricted</h4>
              <p className="text-sm text-gray-500 max-w-sm">
                Your active role ({(currentUser.roleId || currentUser.role).toUpperCase()}) does not possess the administrative privileges required to access this system module.
              </p>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="mt-2 px-5 py-2.5 bg-wedding-charcoal-dark hover:bg-wedding-charcoal-light text-wedding-gold-light hover:text-white text-xs font-bold rounded-xl transition-all shadow"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
