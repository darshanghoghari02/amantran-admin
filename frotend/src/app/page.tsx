'use client';

import { API_URL } from '@/config';
import React, { useState, useEffect } from 'react';
import { Heart, Lock, Mail, Server } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Dashboard from '../components/Dashboard';
import Categories from '../components/Categories';
import TemplatesList from '../components/TemplatesList';
import Fonts from '../components/Fonts';
import Languages from '../components/Languages';
import Users from '../components/Users';
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
      fetch(`${API_URL}/api/users/${currentUser.id}`)
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
      <div className="min-h-screen bg-gradient-to-tr from-wedding-pink-light via-wedding-bg to-[#ffe4e8] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute top-10 left-10 w-48 h-48 bg-wedding-pink-medium/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-wedding-gold-light/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-white/70 backdrop-blur-md border border-wedding-pink-medium/40 p-8 rounded-3xl shadow-2xl space-y-8 z-10 animate-slideUp">
          
          {/* Logo Heading */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-wedding-pink-dark to-wedding-pink-medium flex items-center justify-center shadow-lg shadow-wedding-pink-medium/40">
              <Heart className="w-6 h-6 text-white fill-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl tracking-wide text-wedding-charcoal-dark font-sans uppercase">
                Amantran Admin
              </h1>
              <p className="text-xs text-wedding-pink-dark font-semibold mt-1">
                Professional Invitation CMS Portal
              </p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {authError && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-200">
                ✕ {authError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider block">Administrator Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@amantran.com"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-wedding-pink-medium/40 rounded-2xl text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider block">Security Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-wedding-pink-medium/40 rounded-2xl text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 bg-wedding-charcoal-dark hover:bg-wedding-charcoal-light text-wedding-gold-light hover:text-white font-bold text-sm rounded-2xl shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loggingIn ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* Dev credentials tip */}
          <div className="text-center pt-2 border-t border-wedding-pink-medium/20 text-[10px] text-gray-500 font-semibold leading-relaxed">
            💡 Local Developer Credentials: <code className="bg-wedding-pink-light/60 px-1 py-0.5 text-wedding-pink-dark rounded font-mono">admin@amantran.com</code> / <code className="bg-wedding-pink-light/60 px-1 py-0.5 text-wedding-pink-dark rounded font-mono">admin123</code>
          </div>
        </div>
      </div>
    );
  }

  // 1. Canva Canvas editor view: occupies full screen (hides sidebar/topbar)
  if (currentTab === 'editor') {
    return (
      <main className="min-h-screen flex flex-col bg-wedding-bg">
        <EditorWorkspace onClose={() => setCurrentTab('templates')} />
      </main>
    );
  }

  // Granular Tab Access Permission Guard
  const hasAccessToTab = (tab: string, role: string | undefined): boolean => {
    if (!role) return false;
    if (role === 'super_admin') return true;
    
    if (role === 'content_manager') {
      return tab !== 'users';
    }
    
    if (role === 'editor') {
      return tab === 'dashboard' || tab === 'templates' || tab === 'editor';
    }
    
    if (role === 'user') {
      return tab === 'dashboard' || tab === 'templates';
    }
    
    return false;
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
          {currentTab === 'dashboard' && hasAccessToTab('dashboard', currentUser?.role) && (
            <Dashboard onNavigate={setCurrentTab} />
          )}

          {currentTab === 'categories' && hasAccessToTab('categories', currentUser?.role) && (
            <Categories />
          )}

          {currentTab === 'templates' && hasAccessToTab('templates', currentUser?.role) && (
            <TemplatesList 
              currentUser={currentUser || undefined}
              onOpenEditor={(tpl) => {
                setTemplate(tpl);
                setCurrentTab('editor');
              }} 
            />
          )}

          {currentTab === 'fonts' && hasAccessToTab('fonts', currentUser?.role) && (
            <Fonts />
          )}

          {currentTab === 'languages' && hasAccessToTab('languages', currentUser?.role) && (
            <Languages />
          )}

          {currentTab === 'users' && hasAccessToTab('users', currentUser?.role) && (
            <Users />
          )}

          {/* Access Denied Warning Redirect */}
          {currentUser && !hasAccessToTab(currentTab, currentUser.role) && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center bg-white border border-red-200 rounded-3xl p-8 shadow-sm">
              <span className="p-4 bg-red-50 text-red-600 rounded-full font-bold text-xl">⚠️</span>
              <h4 className="font-bold text-lg text-wedding-charcoal-dark">Section Access Restricted</h4>
              <p className="text-sm text-gray-500 max-w-sm">
                Your active role ({currentUser.role.toUpperCase()}) does not possess the administrative privileges required to access this system module.
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
