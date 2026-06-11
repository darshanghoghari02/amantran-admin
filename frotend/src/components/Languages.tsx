import { API_URL } from '@/config';
import { cmsCache } from '@/config/cache';
import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, CheckCircle2, XCircle, Globe } from 'lucide-react';
import { Language, User } from '../types';
import { useToastStore } from '../store/toastStore';

interface LanguagesProps {
  currentUser?: User;
}

import ISO6391 from 'iso-639-1';

// Safe wrapper to handle ESM / CommonJS default export differences across Node.js/Next.js/Webpack
const getIsoLib = () => {
  const lib = ISO6391 as any;
  if (lib && typeof lib.getAllCodes === 'function') {
    return lib;
  }
  if (lib && lib.default && typeof lib.default.getAllCodes === 'function') {
    return lib.default;
  }
  return null;
};

const ISO = getIsoLib();

interface PresetLanguage {
  name: string;
  code: string;
  nativeName: string;
}

// Generate all standard languages and sort by name
const PRESET_LANGUAGES: PresetLanguage[] = ISO 
  ? ISO.getAllCodes().map((code: string) => ({
      name: ISO.getName(code),
      code: code,
      nativeName: ISO.getNativeName(code)
    })).sort((a: any, b: any) => a.name.localeCompare(b.name))
  : [];

export default function Languages({ currentUser }: LanguagesProps) {
  const hasPermission = (perm: string): boolean => {
    if (!currentUser) return false;
    const rId = currentUser.roleId || currentUser.role || 'user';
    if (rId === 'super_admin') return true;
    if (currentUser.permissions?.includes('*')) return true;
    return currentUser.permissions?.includes(perm) || false;
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    'x-user-id': currentUser?.id || 'admin_super'
  };
  const [languages, setLanguages] = useState<Language[]>(cmsCache.languages || []);
  const [loading, setLoading] = useState(!cmsCache.languages);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(-1);

  useEffect(() => {
    fetchLanguages();
  }, []);

  async function fetchLanguages() {
    try {
      const res = await fetch(`${API_URL}/api/languages`, {
        headers: { 'x-user-id': currentUser?.id || 'admin_super' }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setLanguages(list);
      cmsCache.languages = list;
    } catch (error) {
      console.error('Failed to load languages:', error);
      if (!cmsCache.languages) setLanguages([]);
    } finally {
      setLoading(false);
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Language Name is required.';
    }
    if (!code.trim()) {
      newErrors.code = 'ISO Code is required.';
    } else if (!/^[a-z]{2,3}$/.test(code)) {
      newErrors.code = 'ISO Code must be 2 or 3 lowercase letters (e.g. "gu", "hi", "en").';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      useToastStore.getState().addToast('Please resolve the errors in the form.', 'warning');
      return;
    }

    const payload = { code, name, isActive };

    try {
      if (!hasPermission('languages.create')) {
        useToastStore.getState().addToast('Access Denied. You lack the "languages.create" permission.', 'warning');
        return;
      }
      const res = await fetch(`${API_URL}/api/languages`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchLanguages();
        useToastStore.getState().addToast('Language locale registered successfully!', 'success');
      } else {
        const err = await res.json();
        useToastStore.getState().addToast(err.error || 'Save failed', 'error');
      }
    } catch (error) {
      console.error('Submit language error:', error);
      useToastStore.getState().addToast('Failed to save language due to a network error.', 'error');
    }
  };

  const handleToggle = async (id: string, activeState: boolean) => {
    // Optimistically update languages state immediately
    setLanguages(prev =>
      prev.map(lang => (lang.id === id ? { ...lang, isActive: !activeState } : lang))
    );

    try {
      if (!hasPermission('languages.edit')) {
        setLanguages(prev => prev.map(lang => (lang.id === id ? { ...lang, isActive: activeState } : lang)));
        useToastStore.getState().addToast('Access Denied. You lack the "languages.edit" permission.', 'warning');
        return;
      }
      const res = await fetch(`${API_URL}/api/languages/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ isActive: !activeState })
      });
      if (!res.ok) {
        // Rollback state if the update failed on the server
        setLanguages(prev =>
          prev.map(lang => (lang.id === id ? { ...lang, isActive: activeState } : lang))
        );
        const err = await res.json();
        useToastStore.getState().addToast(err.error || 'Failed to toggle status.', 'error');
      } else {
        fetchLanguages();
        useToastStore.getState().addToast('Language status updated successfully!', 'success');
      }
    } catch (error) {
      console.error('Toggle language status error:', error);
      // Rollback state on network error
      setLanguages(prev =>
        prev.map(lang => (lang.id === id ? { ...lang, isActive: activeState } : lang))
      );
      useToastStore.getState().addToast('Network error. Failed to toggle status.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission('languages.delete')) {
      useToastStore.getState().addToast('Access Denied. You lack the "languages.delete" permission.', 'warning');
      return;
    }
    if (!confirm('Are you sure you want to delete this language? Templates using this language will lose their translation metadata.')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/languages/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser?.id || 'admin_super' }
      });
      if (res.ok) {
        fetchLanguages();
        useToastStore.getState().addToast('Language deleted successfully!', 'success');
      } else {
        const err = await res.json();
        useToastStore.getState().addToast(err.error || 'Failed to delete language.', 'error');
      }
    } catch (error) {
      console.error('Delete language error:', error);
      useToastStore.getState().addToast('Network error. Failed to delete language.', 'error');
    }
  };

  const openAddModal = () => {
    setCode('');
    setName('');
    setIsActive(true);
    setErrors({});
    setSelectedPresetIndex(-1);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex justify-between items-center bg-wedding-card p-6 rounded-3xl border border-wedding-pink-medium/20 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-wedding-charcoal-dark tracking-tight">Supported Languages</h3>
          <p className="text-xs text-gray-500 font-semibold">Manage translation locales enabled for card templates</p>
        </div>
        {hasPermission('languages.create') && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 bg-wedding-pink-dark hover:bg-wedding-pink-hover text-white text-sm font-bold rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5" />
            Add Language
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-10 h-10 border-4 border-wedding-pink-medium border-t-wedding-pink-dark rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-wedding-pink-dark">Loading translation locales...</p>
        </div>
      ) : (
        <div className="bg-wedding-card border border-wedding-pink-medium/20 rounded-3xl shadow-xs overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-wedding-pink-light/40 border-b border-wedding-pink-medium/20 text-wedding-charcoal-dark font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Language</th>
                <th className="py-4 px-6">Locale Code</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wedding-pink-medium/15 text-sm text-wedding-charcoal-dark/95">
              {(Array.isArray(languages) ? languages : []).map((lang) => (
                <tr key={lang.id} className="hover:bg-wedding-pink-light/20 transition-colors">
                  <td className="py-4 px-6 font-bold text-wedding-charcoal-dark">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-wedding-pink-light/30 flex items-center justify-center text-wedding-pink-dark">
                        <Globe className="w-4 h-4" />
                      </div>
                      <span>{lang.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-500 font-mono text-xs font-semibold uppercase">{lang.code}</td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleToggle(lang.id, lang.isActive)}
                      className="focus:outline-none"
                    >
                      {lang.isActive ? (
                        <span className="flex items-center gap-1 text-green-700 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4 fill-green-100" /> Enabled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400 text-xs font-semibold">
                          <XCircle className="w-4 h-4 fill-gray-100" /> Disabled
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {hasPermission('languages.delete') && (
                      <button
                        onClick={() => handleDelete(lang.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                        title="Delete Language"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Language Add Modal overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-wedding-charcoal-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-wedding-bg border border-wedding-pink-medium/40 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-6 bg-wedding-charcoal-dark text-white flex justify-between items-center">
              <h4 className="font-bold text-lg text-wedding-gold-light">Add Supported Locale</h4>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white font-bold text-sm bg-wedding-charcoal-light px-3 py-1.5 rounded-xl transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Select Language Preset */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Select Language Preset</label>
                <select
                  value={selectedPresetIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setSelectedPresetIndex(idx);
                    if (idx >= 0) {
                      setName(PRESET_LANGUAGES[idx].name);
                      setCode(PRESET_LANGUAGES[idx].code);
                    } else if (idx === -1) {
                      setName('');
                      setCode('');
                    }
                    setErrors({});
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 focus:ring-wedding-pink-dark/20 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 font-semibold"
                >
                  <option value="-1">Select a language preset...</option>
                  {PRESET_LANGUAGES.map((lang, idx) => (
                    <option key={idx} value={idx}>
                      {lang.name} {lang.nativeName && lang.nativeName !== lang.name ? `(${lang.nativeName})` : ''} — {lang.code.toUpperCase()}
                    </option>
                  ))}
                  <option value="-2">Custom (Type manually...)</option>
                </select>
              </div>

              {/* Language Name */}
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Language Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.name;
                        return copy;
                      });
                    }
                  }}
                  placeholder="e.g. Gujarati"
                  className={`w-full px-4 py-3 rounded-2xl border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 bg-white border-wedding-pink-medium/40 focus:ring-wedding-pink-dark/20 ${errors.name ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{errors.name}</p>
                )}
              </div>

              {/* Code */}
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Locale ISO Code</label>
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toLowerCase());
                    if (errors.code) {
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.code;
                        return copy;
                      });
                    }
                  }}
                  placeholder="e.g. gu"
                  className={`w-full px-4 py-3 rounded-2xl border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 font-mono bg-white border-wedding-pink-medium/40 focus:ring-wedding-pink-dark/20 ${errors.code ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                />
                {errors.code && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{errors.code}</p>
                )}
              </div>

              {/* Display State */}
              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider mb-2">Display State</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-pink-dark"></div>
                  <span className="ml-3 text-sm font-semibold text-wedding-charcoal-dark">
                    {isActive ? 'Active' : 'Disabled'}
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-wedding-pink-medium/20 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-wedding-charcoal-light hover:bg-gray-200 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-wedding-pink-dark hover:bg-wedding-pink-hover text-white text-xs font-bold shadow-lg transition-all"
                >
                  Save Language
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
