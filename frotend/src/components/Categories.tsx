import { API_URL, getImageUrl } from '@/config';
import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, Trash2, CheckCircle2, XCircle, Upload, Eye } from 'lucide-react';
import { Category } from '../types';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setDisplayOrder('1');
    setIsActive(true);
    setImageUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDisplayOrder(String(cat.displayOrder));
    setIsActive(cat.isActive);
    setImageUrl(cat.imageUrl);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate clean slug
    if (!editingId) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_'));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const cleanSlug = slug || 'temp_category';
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Direct call to local asset upload system
      const res = await fetch(`${API_URL}/api/uploads/single?type=category&categorySlug=${cleanSlug}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setImageUrl(data.filePath);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload category image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      alert('Name and slug are required.');
      return;
    }

    const payload = {
      name,
      slug,
      imageUrl,
      displayOrder: parseInt(displayOrder) || 1,
      isActive
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_URL}/api/categories/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/api/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        fetchCategories();
      } else {
        const err = await res.json();
        alert(err.error || 'Save failed');
      }
    } catch (error) {
      console.error('Submit category error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This will affect associated templates.')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Delete category error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-wedding-pink-medium/40 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-wedding-charcoal-dark tracking-tight">Category List</h3>
          <p className="text-xs text-gray-500">Manage categories, icons, cover visual assets, and render sequences</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 bg-wedding-pink-dark hover:bg-[#a0525e] text-white text-sm font-bold rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <PlusCircle className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-10 h-10 border-4 border-wedding-pink-medium border-t-wedding-pink-dark rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-wedding-pink-dark">Loading your directories...</p>
        </div>
      ) : (
        <div className="bg-white border border-wedding-pink-medium/40 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-wedding-pink-light/35 border-b border-wedding-pink-medium/30 text-wedding-charcoal-dark font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Image</th>
                <th className="py-4 px-6">Category Name</th>
                <th className="py-4 px-6">Slug Path</th>
                <th className="py-4 px-6">Order</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wedding-pink-medium/20 text-sm">
              {(Array.isArray(categories) ? categories : []).map((cat) => (
                <tr key={cat.id} className="hover:bg-wedding-pink-light/10 transition-colors">
                  <td className="py-4 px-6">
                    {cat.imageUrl ? (
                      <div className="w-14 h-10 rounded-lg overflow-hidden border border-wedding-pink-medium/40 bg-gray-100 flex items-center justify-center">
                        <img 
                          src={getImageUrl(cat.imageUrl)} 
                          alt={cat.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-10 rounded-lg border border-dashed border-wedding-pink-medium/40 flex items-center justify-center bg-wedding-pink-light/20 text-[10px] text-wedding-pink-dark font-bold">
                        No image
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 font-bold text-wedding-charcoal-dark">{cat.name}</td>
                  <td className="py-4 px-6 text-gray-500 font-mono text-xs">{cat.slug}</td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-wedding-pink-light text-wedding-pink-dark text-xs font-bold rounded-lg border border-wedding-pink-medium/30">
                      {cat.displayOrder}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {cat.isActive ? (
                      <span className="flex items-center gap-1 text-green-700 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 fill-green-100" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400 text-xs font-semibold">
                        <XCircle className="w-4 h-4 fill-gray-100" /> Disabled
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-2 text-wedding-charcoal-light hover:text-wedding-gold-dark hover:bg-wedding-pink-light/30 rounded-xl transition-all duration-200"
                        title="Edit category"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CRUD Overlay Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-wedding-charcoal-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-wedding-bg border border-wedding-pink-medium/40 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-6 bg-wedding-charcoal-dark text-white flex justify-between items-center">
              <h4 className="font-bold text-lg text-wedding-gold-light">
                {editingId ? 'Edit Invitation Category' : 'Create Invitation Category'}
              </h4>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white font-bold text-sm bg-wedding-charcoal-light px-3 py-1.5 rounded-xl transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Category Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Category Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Royal Wedding"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20"
                />
              </div>

              {/* Slug Path Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Folder Slug (automatic)</label>
                <input 
                  type="text" 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  placeholder="e.g. royal_wedding"
                  disabled={!!editingId}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/30 text-wedding-charcoal-dark/70 text-sm font-mono focus:outline-none"
                />
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                  * Creates storage sub-path automatically: <code className="font-mono bg-wedding-pink-light/45 px-1 py-0.5 text-wedding-pink-dark rounded">assets/images/{slug || 'slug'}/</code>
                </p>
              </div>

              {/* Grid of Display Order and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Display Sequence</label>
                  <input 
                    type="number" 
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20"
                  />
                </div>
                
                <div className="space-y-1.5 flex flex-col justify-center">
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
                      {isActive ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Cover Image Upload system */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider block">Category Cover Visual</label>
                
                <div className="flex gap-4 items-center">
                  {imageUrl ? (
                    <div className="w-24 h-16 rounded-xl overflow-hidden border border-wedding-pink-medium/50 shadow-sm relative group bg-gray-100 flex items-center justify-center">
                      <img 
                        src={getImageUrl(imageUrl)} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button 
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute inset-0 bg-red-950/40 opacity-0 group-hover:opacity-100 text-white text-[10px] font-bold flex items-center justify-center transition-opacity"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-16 rounded-xl border-2 border-dashed border-wedding-pink-medium/40 bg-wedding-pink-light/10 flex flex-col items-center justify-center text-[10px] text-wedding-pink-dark font-semibold">
                      <span>No image</span>
                    </div>
                  )}

                  <label className="flex-1 border border-wedding-pink-medium/40 hover:bg-wedding-pink-light/20 cursor-pointer p-4 rounded-2xl flex flex-col items-center justify-center transition-all">
                    <Upload className="w-5 h-5 text-wedding-pink-dark mb-1" />
                    <span className="text-[11px] font-bold text-wedding-charcoal-dark">
                      {uploading ? 'Processing Upload...' : 'Upload Image Asset'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                  </label>
                </div>
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
                  className="px-6 py-3 rounded-2xl bg-wedding-pink-dark hover:bg-[#a0525e] text-white text-sm font-bold shadow-lg transition-all"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
