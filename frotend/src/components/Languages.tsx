import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, CheckCircle2, XCircle, Globe } from 'lucide-react';
import { Language } from '../types';

export default function Languages() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchLanguages();
  }, []);

  async function fetchLanguages() {
    try {
      const res = await fetch('http://localhost:5000/api/languages');
      const data = await res.json();
      setLanguages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load languages:', error);
      setLanguages([]);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      alert('Code and Language Name are required.');
      return;
    }

    const payload = { code, name, isActive };

    try {
      const res = await fetch('http://localhost:5000/api/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchLanguages();
      } else {
        const err = await res.json();
        alert(err.error || 'Save failed');
      }
    } catch (error) {
      console.error('Submit language error:', error);
    }
  };

  const handleToggle = async (id: string, activeState: boolean) => {
    try {
      const res = await fetch(`http://localhost:5000/api/languages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !activeState })
      });
      if (res.ok) {
        fetchLanguages();
      }
    } catch (error) {
      console.error('Toggle language status error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this language? Templates using this language will lose their translation metadata.')) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/languages/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchLanguages();
      }
    } catch (error) {
      console.error('Delete language error:', error);
    }
  };

  const openAddModal = () => {
    setCode('');
    setName('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-wedding-pink-medium/40 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-wedding-charcoal-dark tracking-tight">Supported Languages</h3>
          <p className="text-xs text-gray-500">Manage translation locales enabled for card templates</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 bg-wedding-pink-dark hover:bg-[#a0525e] text-white text-sm font-bold rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <PlusCircle className="w-5 h-5" />
          Add Language
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-10 h-10 border-4 border-wedding-pink-medium border-t-wedding-pink-dark rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-wedding-pink-dark">Loading translation locales...</p>
        </div>
      ) : (
        <div className="bg-white border border-wedding-pink-medium/40 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-wedding-pink-light/35 border-b border-wedding-pink-medium/30 text-wedding-charcoal-dark font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Language</th>
                <th className="py-4 px-6">Locale Code</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wedding-pink-medium/20 text-sm">
              {(Array.isArray(languages) ? languages : []).map((lang) => (
                <tr key={lang.id} className="hover:bg-wedding-pink-light/10 transition-colors">
                  <td className="py-4 px-6 font-bold text-wedding-charcoal-dark">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-wedding-pink-light flex items-center justify-center text-wedding-pink-dark">
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
                    <button
                      onClick={() => handleDelete(lang.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                      title="Delete Language"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              {/* Language Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Language Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Gujarati"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20"
                />
              </div>

              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Locale ISO Code</label>
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.toLowerCase())}
                  placeholder="e.g. gu"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 font-mono"
                />
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
                  className="px-5 py-2.5 rounded-xl bg-wedding-pink-dark hover:bg-[#a0525e] text-white text-xs font-bold shadow-lg transition-all"
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
