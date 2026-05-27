'use client';

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

export default function RootPage() {
  // Navigation & Session states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isFirebase, setIsFirebase] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  // Auth Form State
  const [email, setEmail] = useState('admin@amantran.com');
  const [password, setPassword] = useState('admin123');
  const [authError, setAuthError] = useState('');

  const { setTemplate } = useCanvasStore();

  // Check backend server connection on boot
  useEffect(() => {
    async function checkBackend() {
      try {
        const res = await fetch('http://localhost:5000/');
        const data = await res.json();
        setBackendStatus('online');
        setIsFirebase(data.mode === 'firebase' || data.isFirebase === true);
      } catch (err) {
        console.warn('Backend server is not running yet. Make sure to spin up express on port 5000.');
        setBackendStatus('offline');
        // If offline, assume local fallback mock rendering mode
        setIsFirebase(false);
      }
    }
    checkBackend();
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Secure credentials validation
    if (email === 'admin@amantran.com' && password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      setAuthError('Incorrect administrative credentials. Use admin@amantran.com / admin123 for developer testing.');
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
              className="w-full py-3.5 bg-wedding-charcoal-dark hover:bg-wedding-charcoal-light text-wedding-gold-light hover:text-white font-bold text-sm rounded-2xl shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Sign In to Dashboard
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

  // 2. Standard Dashboard panels view
  return (
    <div className="flex h-screen overflow-hidden bg-wedding-bg">
      {/* Dynamic Navigation Left Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Central content screen wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Dynamic header Topbar */}
        <Topbar currentTab={currentTab} isFirebase={isFirebase} />

        {/* Dynamic content rendering body */}
        <main className="flex-1 p-8 overflow-y-auto bg-wedding-bg">
          {currentTab === 'dashboard' && (
            <Dashboard onNavigate={setCurrentTab} />
          )}

          {currentTab === 'categories' && (
            <Categories />
          )}

          {currentTab === 'templates' && (
            <TemplatesList 
              onOpenEditor={(tpl) => {
                setTemplate(tpl);
                setCurrentTab('editor');
              }} 
            />
          )}

          {currentTab === 'fonts' && (
            <Fonts />
          )}

          {currentTab === 'languages' && (
            <Languages />
          )}

          {currentTab === 'users' && (
            <Users />
          )}
        </main>
      </div>
    </div>
  );
}
