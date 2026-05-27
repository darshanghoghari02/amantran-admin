import { API_URL } from '@/config';
import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, CheckCircle2, XCircle, Upload, Type } from 'lucide-react';
import { CustomFont } from '../types';

export default function Fonts() {
  const [fonts, setFonts] = useState<CustomFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [family, setFamily] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFonts();
  }, []);

  async function fetchFonts() {
    try {
      const res = await fetch(`${API_URL}/api/fonts`);
      const data = await res.json();
      setFonts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load fonts:', error);
      setFonts([]);
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Direct call to local asset upload system (routes to backend/assets/fonts)
      const res = await fetch(`${API_URL}/api/uploads/single?type=font`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setLocalPath(data.flutterPath);
        // Auto fill family name from file name if empty
        if (!family) {
          const cleanName = file.name
            .replace(/\.[^/.]+$/, "") // strip extension
            .replace(/[-_]/g, ' ');   // replace dashes with spaces
          setFamily(cleanName);
        }
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload font file.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || !localPath) {
      alert('Font Family and file path are required.');
      return;
    }

    const payload = {
      family,
      localPath,
      isActive
    };

    try {
      const res = await fetch(`${API_URL}/api/fonts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchFonts();
      } else {
        const err = await res.json();
        alert(err.error || 'Save failed');
      }
    } catch (error) {
      console.error('Submit font error:', error);
    }
  };

  const handleToggle = async (id: string, activeState: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/fonts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !activeState })
      });
      if (res.ok) {
        fetchFonts();
      }
    } catch (error) {
      console.error('Toggle font status error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this font? Templates using this font will fall back to default typography.')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/fonts/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchFonts();
      }
    } catch (error) {
      console.error('Delete font error:', error);
    }
  };

  const openAddModal = () => {
    setFamily('');
    setLocalPath('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-wedding-pink-medium/40 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-wedding-charcoal-dark tracking-tight">Typography & Fonts</h3>
          <p className="text-xs text-gray-500">Upload wedding typography binaries (.ttf/.otf) and register layout families</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 bg-wedding-pink-dark hover:bg-[#a0525e] text-white text-sm font-bold rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <PlusCircle className="w-5 h-5" />
          Upload Font Asset
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-10 h-10 border-4 border-wedding-pink-medium border-t-wedding-pink-dark rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-wedding-pink-dark">Loading your typographies...</p>
        </div>
      ) : (
        <div className="bg-white border border-wedding-pink-medium/40 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-wedding-pink-light/35 border-b border-wedding-pink-medium/30 text-wedding-charcoal-dark font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Font Family</th>
                <th className="py-4 px-6">Live Specimen Preview</th>
                <th className="py-4 px-6">Flutter Asset Destination</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wedding-pink-medium/20 text-sm">
              {(Array.isArray(fonts) ? fonts : []).map((f) => (
                <tr key={f.id} className="hover:bg-wedding-pink-light/10 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-wedding-pink-light/60 rounded-lg text-wedding-pink-dark">
                        <Type className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-wedding-charcoal-dark">{f.family}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span 
                      style={{ fontFamily: f.family }} 
                      className="text-lg text-wedding-charcoal-dark"
                    >
                      Aarav weds Ananya | 18.12.2026
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500 font-mono text-xs">{f.localPath}</td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleToggle(f.id, f.isActive)}
                      className="flex items-center gap-1.5 focus:outline-none"
                    >
                      {f.isActive ? (
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
                      onClick={() => handleDelete(f.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                      title="Delete Font Record"
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

      {/* Font Upload overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-wedding-charcoal-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-wedding-bg border border-wedding-pink-medium/40 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-6 bg-wedding-charcoal-dark text-white flex justify-between items-center">
              <h4 className="font-bold text-lg text-wedding-gold-light">Upload Custom Invitation Font</h4>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white font-bold text-sm bg-wedding-charcoal-light px-3 py-1.5 rounded-xl transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Font file uploader */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider block">Font binary (.ttf / .otf)</label>
                
                <label className="border-2 border-dashed border-wedding-pink-medium/40 hover:bg-wedding-pink-light/10 cursor-pointer p-8 rounded-2xl flex flex-col items-center justify-center transition-all">
                  <Upload className="w-8 h-8 text-wedding-pink-dark mb-2" />
                  <span className="text-sm font-bold text-wedding-charcoal-dark">
                    {uploading ? 'Processing Binary Upload...' : 'Click to Upload TTF/OTF File'}
                  </span>
                  <span className="text-[10px] text-gray-500 mt-1">Supports Kap011, Hind Vadodara, Farsan, Rasa formats</span>
                  <input 
                    type="file" 
                    accept=".ttf,.otf"
                    onChange={handleFileUpload}
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Font Family Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Font Family Name</label>
                <input 
                  type="text" 
                  value={family}
                  onChange={(e) => setFamily(e.target.value)}
                  placeholder="e.g. Hind Vadodara"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20"
                />
              </div>

              {/* Flutter Path (Automatic) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Saved Asset Path (automatic)</label>
                <input 
                  type="text" 
                  value={localPath}
                  disabled
                  placeholder="assets/fonts/font_name.ttf"
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/30 text-wedding-charcoal-dark/70 text-sm font-mono focus:outline-none"
                />
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                  * Dynamic target: <code className="font-mono bg-wedding-pink-light/45 px-1 py-0.5 text-wedding-pink-dark rounded">assets/fonts/</code>. Flutter will map to this exact asset tree.
                </p>
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
                    {isActive ? 'Active & Usable' : 'Disabled'}
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-wedding-pink-medium/20 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-2xl bg-gray-100 text-wedding-charcoal-light hover:bg-gray-200 text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!localPath || uploading}
                  className="px-6 py-3 rounded-2xl bg-wedding-pink-dark hover:bg-[#a0525e] text-white text-sm font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Font
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
