import { API_URL, getImageUrl } from '@/config';
import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, Trash2, CheckCircle2, XCircle, Upload } from 'lucide-react';
import { Category, User } from '../types';
import { useToastStore } from '../store/toastStore';

interface CategoriesProps {
  currentUser?: User;
}

import { cmsCache } from '@/config/cache';

export default function Categories({ currentUser }: CategoriesProps) {
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
  const [categories, setCategories] = useState<Category[]>(cmsCache.categories || []);
  const [loading, setLoading] = useState(!cmsCache.categories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        headers: { 'x-user-id': currentUser?.id || 'admin_super' }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setCategories(list);
      cmsCache.categories = list;
    } catch (error) {
      console.error('Failed to load categories:', error);
      if (!cmsCache.categories) setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Category name is required.';
    }
    if (!slug.trim()) {
      newErrors.slug = 'Slug is required.';
    } else if (!/^[a-z0-9_]+$/.test(slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and underscores.';
    }
    const orderNum = parseInt(displayOrder);
    if (!displayOrder.trim()) {
      newErrors.displayOrder = 'Display sequence is required.';
    } else if (isNaN(orderNum) || orderNum < 1) {
      newErrors.displayOrder = 'Display sequence must be a positive number.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setDisplayOrder('1');
    setIsActive(true);
    setImageUrl('');
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDisplayOrder(String(cat.displayOrder));
    setIsActive(cat.isActive);
    setImageUrl(cat.imageUrl);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (errors.name) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.name;
        return copy;
      });
    }
    // Auto-generate clean slug
    if (!editingId) {
      const generatedSlug = val.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
      setSlug(generatedSlug);
      if (errors.slug) {
        setErrors(prev => {
          const copy = { ...prev };
          delete copy.slug;
          return copy;
        });
      }
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
        useToastStore.getState().addToast('Category cover image uploaded successfully!', 'success');
      } else {
        useToastStore.getState().addToast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      console.error('Upload error:', err);
      useToastStore.getState().addToast('Failed to upload category image.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      useToastStore.getState().addToast('Please resolve the errors in the form.', 'warning');
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
        if (!hasPermission('categories.edit')) {
          useToastStore.getState().addToast('Access Denied. You lack the "categories.edit" permission.', 'warning');
          return;
        }
        res = await fetch(`${API_URL}/api/categories/${editingId}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(payload)
        });
      } else {
        if (!hasPermission('categories.create')) {
          useToastStore.getState().addToast('Access Denied. You lack the "categories.create" permission.', 'warning');
          return;
        }
        res = await fetch(`${API_URL}/api/categories`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        fetchCategories();
        useToastStore.getState().addToast(
          editingId ? 'Category updated successfully!' : 'Category created successfully!',
          'success'
        );
      } else {
        const err = await res.json();
        useToastStore.getState().addToast(err.error || 'Save failed', 'error');
      }
    } catch (error) {
      console.error('Submit category error:', error);
      useToastStore.getState().addToast('Failed to save category.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission('categories.delete')) {
      useToastStore.getState().addToast('Access Denied. You lack the "categories.delete" permission.', 'warning');
      return;
    }
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser?.id || 'admin_super' }
      });
      if (res.ok) {
        fetchCategories();
        useToastStore.getState().addToast('Category deleted successfully!', 'success');
      } else {
        const err = await res.json();
        useToastStore.getState().addToast(err.error || 'Failed to delete category.', 'error');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      useToastStore.getState().addToast('Network error. Failed to delete category.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex justify-between items-center bg-wedding-card p-6 rounded-3xl border border-wedding-pink-medium/20 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-wedding-charcoal-dark tracking-tight">Category List</h3>
          <p className="text-xs text-gray-500 font-semibold">Manage categories, icons, cover visual assets, and render sequences</p>
        </div>
        {hasPermission('categories.create') && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 bg-wedding-pink-dark hover:bg-wedding-pink-hover text-white text-sm font-bold rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5" />
            Add Category
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-10 h-10 border-4 border-wedding-pink-medium border-t-wedding-pink-dark rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-wedding-pink-dark">Loading your directories...</p>
        </div>
      ) : (
        <div className="bg-wedding-card border border-wedding-pink-medium/20 rounded-3xl shadow-xs overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-wedding-pink-light/40 border-b border-wedding-pink-medium/20 text-wedding-charcoal-dark font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Image</th>
                <th className="py-4 px-6">Category Name</th>
                <th className="py-4 px-6">Slug Path</th>
                <th className="py-4 px-6">Order</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wedding-pink-medium/15 text-sm text-wedding-charcoal-dark/95">
              {(Array.isArray(categories) ? categories : []).map((cat) => (
                <tr key={cat.id} className="hover:bg-wedding-pink-light/20 transition-colors">
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
                    <span className="px-3 py-1 bg-wedding-pink-light text-wedding-pink-dark text-xs font-bold rounded-lg border border-wedding-pink-medium/30 shadow-xs">
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
                      {hasPermission('categories.edit') && (
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-2 text-wedding-charcoal-light hover:text-wedding-gold-dark hover:bg-wedding-pink-light/30 rounded-xl transition-all duration-200"
                          title="Edit category"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('categories.delete') && (
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
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
                  className={`w-full px-4 py-3 rounded-2xl bg-white border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 ${
                    errors.name 
                      ? 'border-red-500 focus:ring-red-500/20' 
                      : 'border-wedding-pink-medium/40 focus:ring-wedding-pink-dark/20'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{errors.name}</p>
                )}
              </div>

              {/* Slug Path Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Folder Slug (automatic)</label>
                <input 
                  type="text" 
                  value={slug}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                    setSlug(val);
                    if (errors.slug) {
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.slug;
                        return copy;
                      });
                    }
                  }}
                  placeholder="e.g. royal_wedding"
                  disabled={!!editingId}
                  className={`w-full px-4 py-3 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 ${
                    editingId 
                      ? 'bg-gray-50 border-wedding-pink-medium/30 text-wedding-charcoal-dark/70' 
                      : errors.slug 
                      ? 'bg-white border-red-500 focus:ring-red-500/20 text-wedding-charcoal-dark' 
                      : 'bg-white border-wedding-pink-medium/40 focus:ring-wedding-pink-dark/20 text-wedding-charcoal-dark'
                  }`}
                />
                {errors.slug && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{errors.slug}</p>
                )}
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
                    onChange={(e) => {
                      setDisplayOrder(e.target.value);
                      if (errors.displayOrder) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.displayOrder;
                          return copy;
                        });
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-2xl bg-white border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 ${
                      errors.displayOrder 
                        ? 'border-red-500 focus:ring-red-500/20' 
                        : 'border-wedding-pink-medium/40 focus:ring-wedding-pink-dark/20'
                    }`}
                  />
                  {errors.displayOrder && (
                    <p className="text-xs text-red-500 font-semibold mt-1">{errors.displayOrder}</p>
                  )}
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
                  className="px-6 py-3 rounded-2xl bg-wedding-pink-dark hover:bg-wedding-pink-hover text-white text-sm font-bold shadow-lg transition-all"
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
