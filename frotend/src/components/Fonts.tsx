import { API_URL } from '@/config';
import { cmsCache } from '@/config/cache';
import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, CheckCircle2, XCircle, Upload, Type } from 'lucide-react';
import { CustomFont, User } from '../types';
import { useToastStore } from '../store/toastStore';

interface FontsProps {
  currentUser?: User;
}

export default function Fonts({ currentUser }: FontsProps) {
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
  const [fonts, setFonts] = useState<CustomFont[]>(cmsCache.fonts || []);
  const [loading, setLoading] = useState(!cmsCache.fonts);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [family, setFamily] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchFonts();
  }, []);

  async function fetchFonts() {
    try {
      const res = await fetch(`${API_URL}/api/fonts`, {
        headers: { 'x-user-id': currentUser?.id || 'admin_super' }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setFonts(list);
      cmsCache.fonts = list;
    } catch (error) {
      console.error('Failed to load fonts:', error);
      if (!cmsCache.fonts) setFonts([]);
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
        let filledFamily = family;
        if (!family) {
          const cleanName = file.name
            .replace(/\.[^/.]+$/, "") // strip extension
            .replace(/[-_]/g, ' ');   // replace dashes with spaces
          setFamily(cleanName);
          filledFamily = cleanName;
        }
        
        // Clear validation errors
        setErrors(prev => {
          const copy = { ...prev };
          delete copy.localPath;
          if (filledFamily) delete copy.family;
          return copy;
        });
        
        useToastStore.getState().addToast('Font binary uploaded successfully!', 'success');
      } else {
        useToastStore.getState().addToast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      console.error('Upload error:', err);
      useToastStore.getState().addToast('Failed to upload font file.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!family.trim()) {
      newErrors.family = 'Font Family Name is required.';
    }
    if (!localPath.trim()) {
      newErrors.localPath = 'Font binary file upload is required.';
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

    const payload = {
      family,
      localPath,
      isActive
    };

    try {
      if (!hasPermission('fonts.create')) {
        useToastStore.getState().addToast('Access Denied. You lack the "fonts.create" permission.', 'warning');
        return;
      }
      const res = await fetch(`${API_URL}/api/fonts`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchFonts();
        useToastStore.getState().addToast('Font registered successfully!', 'success');
      } else {
        const err = await res.json();
        useToastStore.getState().addToast(err.error || 'Save failed', 'error');
      }
    } catch (error) {
      console.error('Submit font error:', error);
      useToastStore.getState().addToast('Failed to register font due to a network error.', 'error');
    }
  };

  const handleToggle = async (id: string, activeState: boolean) => {
    // Optimistically update fonts state immediately
    setFonts(prev =>
      prev.map(f => (f.id === id ? { ...f, isActive: !activeState } : f))
    );

    try {
      if (!hasPermission('fonts.edit')) {
        setFonts(prev => prev.map(f => (f.id === id ? { ...f, isActive: activeState } : f)));
        useToastStore.getState().addToast('Access Denied. You lack the "fonts.edit" permission.', 'warning');
        return;
      }
      const res = await fetch(`${API_URL}/api/fonts/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ isActive: !activeState })
      });
      if (!res.ok) {
        // Rollback state if the update failed on the server
        setFonts(prev =>
          prev.map(f => (f.id === id ? { ...f, isActive: activeState } : f))
        );
        const err = await res.json();
        useToastStore.getState().addToast(err.error || 'Failed to toggle status.', 'error');
      } else {
        fetchFonts();
        useToastStore.getState().addToast('Font status updated successfully!', 'success');
      }
    } catch (error) {
      console.error('Toggle font status error:', error);
      // Rollback state on network error
      setFonts(prev =>
        prev.map(f => (f.id === id ? { ...f, isActive: activeState } : f))
      );
      useToastStore.getState().addToast('Network error. Failed to toggle status.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission('fonts.delete')) {
      useToastStore.getState().addToast('Access Denied. You lack the "fonts.delete" permission.', 'warning');
      return;
    }
    if (!confirm('Are you sure you want to delete this font? Templates using this font will fall back to default typography.')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/fonts/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser?.id || 'admin_super' }
      });
      if (res.ok) {
        fetchFonts();
        useToastStore.getState().addToast('Font deleted successfully!', 'success');
      } else {
        const err = await res.json();
        useToastStore.getState().addToast(err.error || 'Failed to delete font.', 'error');
      }
    } catch (error) {
      console.error('Delete font error:', error);
      useToastStore.getState().addToast('Network error. Failed to delete font.', 'error');
    }
  };

  const openAddModal = () => {
    setFamily('');
    setLocalPath('');
    setIsActive(true);
    setErrors({});
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex justify-between items-center bg-wedding-card p-6 rounded-3xl border border-wedding-pink-medium/20 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-wedding-charcoal-dark tracking-tight">Typography & Fonts</h3>
          <p className="text-xs text-gray-500 font-semibold">Upload wedding typography binaries (.ttf/.otf) and register layout families</p>
        </div>
        {hasPermission('fonts.create') && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 bg-wedding-pink-dark hover:bg-wedding-pink-hover text-white text-sm font-bold rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5" />
            Upload Font Asset
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-10 h-10 border-4 border-wedding-pink-medium border-t-wedding-pink-dark rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-wedding-pink-dark">Loading your typographies...</p>
        </div>
      ) : (
        <div className="bg-wedding-card border border-wedding-pink-medium/20 rounded-3xl shadow-xs overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-wedding-pink-light/40 border-b border-wedding-pink-medium/20 text-wedding-charcoal-dark font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Font Family</th>
                <th className="py-4 px-6">Live Specimen Preview</th>
                <th className="py-4 px-6">Flutter Asset Destination</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wedding-pink-medium/15 text-sm text-wedding-charcoal-dark/95">
              {(Array.isArray(fonts) ? fonts : []).map((f) => (
                <tr key={f.id} className="hover:bg-wedding-pink-light/20 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-wedding-pink-light/30 rounded-lg text-wedding-pink-dark">
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
                    {hasPermission('fonts.delete') && (
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                        title="Delete Font Record"
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
                
                <label className={`border-2 border-dashed cursor-pointer p-8 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  errors.localPath 
                    ? 'border-red-500 bg-red-50/10 hover:bg-red-50/20' 
                    : 'border-wedding-pink-medium/40 hover:bg-wedding-pink-light/10'
                }`}>
                  <Upload className="w-8 h-8 text-wedding-pink-dark mb-2" />
                  <span className="text-sm font-bold text-wedding-charcoal-dark text-center">
                    {uploading ? 'Processing Binary Upload...' : localPath ? `Binary Uploaded: ${localPath.split('/').pop()}` : 'Click to Upload TTF/OTF File'}
                  </span>
                  <span className="text-[10px] text-gray-500 mt-1">Supports Kap011, Hind Vadodara, Farsan, Rasa formats</span>
                  <input 
                    type="file" 
                    accept=".ttf,.otf"
                    onChange={handleFileUpload}
                    className="hidden" 
                  />
                </label>
                {errors.localPath && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{errors.localPath}</p>
                )}
              </div>

              {/* Font Family Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Font Family Name</label>
                <input 
                  type="text" 
                  value={family}
                  onChange={(e) => {
                    setFamily(e.target.value);
                    if (errors.family) {
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.family;
                        return copy;
                      });
                    }
                  }}
                  placeholder="e.g. Hind Vadodara"
                  className={`w-full px-4 py-3 rounded-2xl bg-white border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 ${
                    errors.family 
                      ? 'border-red-500 focus:ring-red-500/20' 
                      : 'border-wedding-pink-medium/40 focus:ring-wedding-pink-dark/20'
                  }`}
                />
                {errors.family && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{errors.family}</p>
                )}
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
                  className="px-6 py-3 rounded-2xl bg-wedding-pink-dark hover:bg-wedding-pink-hover text-white text-sm font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
