'use client';

import { API_URL } from '@/config';
import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users as UsersIcon,
  PlusCircle,
  Edit3,
  X,
  Shield,
  ChevronDown,
  Lock,
  Smartphone
} from 'lucide-react';
import { User, Role } from '../types';
import { useToastStore } from '../store/toastStore';

// Granular permission keys from the RBAC system (mirrored from auth.js)
const ALL_PERMISSIONS = [
  { id: 'dashboard.view', name: 'View Dashboard & Stats' },
  { id: 'templates.view', name: 'View Templates' },
  { id: 'templates.create', name: 'Create Templates' },
  { id: 'templates.edit', name: 'Edit Templates' },
  { id: 'templates.delete', name: 'Delete Templates' },
  { id: 'templates.publish', name: 'Publish / Unpublish Templates' },
  { id: 'categories.view', name: 'View Categories' },
  { id: 'categories.create', name: 'Create Categories' },
  { id: 'categories.edit', name: 'Edit Categories' },
  { id: 'categories.delete', name: 'Delete Categories' },
  { id: 'fonts.view', name: 'View Fonts' },
  { id: 'fonts.create', name: 'Upload Fonts' },
  { id: 'fonts.edit', name: 'Edit Fonts' },
  { id: 'fonts.delete', name: 'Delete Fonts' },
  { id: 'languages.view', name: 'View Languages' },
  { id: 'languages.create', name: 'Add Languages' },
  { id: 'languages.edit', name: 'Edit Languages' },
  { id: 'languages.delete', name: 'Delete Languages' },
  { id: 'subscriptions.view', name: 'View Subscriptions' },
  { id: 'subscriptions.create', name: 'Create Subscription Plans' },
  { id: 'subscriptions.edit', name: 'Edit Subscription Plans' },
  { id: 'subscriptions.delete', name: 'Delete Subscription Plans' },
  { id: 'subscriptions.activate', name: 'Activate Plans' },
  { id: 'subscriptions.deactivate', name: 'Deactivate Plans' },
  { id: 'subscriptions.manage_pricing', name: 'Manage Pricing' },
  { id: 'users.view', name: 'View Users' },
  { id: 'users.create', name: 'Create Users' },
  { id: 'users.edit', name: 'Edit Users' },
  { id: 'users.delete', name: 'Delete Users' },
  { id: 'users.suspend', name: 'Suspend Users' },
  { id: 'users.activate', name: 'Activate Suspended Users' },
  { id: 'users.assign_roles', name: 'Assign Roles to Users' },
  { id: 'users.manage_permissions', name: 'Manage Custom Permission Overrides' },
  { id: 'roles.view', name: 'View Roles & Audit Logs' },
  { id: 'roles.create', name: 'Create Custom Roles' },
  { id: 'roles.edit', name: 'Edit Role Settings' },
  { id: 'roles.delete', name: 'Delete Roles' },
  { id: 'roles.assign_permissions', name: 'Assign Role Permissions' },
  { id: 'settings.view', name: 'View System Settings' },
  { id: 'settings.edit', name: 'Edit System Settings' },
];

interface UsersComponentProps {
  currentUser?: User;
}

export default function Users({ currentUser }: UsersComponentProps) {
  const { addToast } = useToastStore();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'staff' | 'app_users'>('staff');
  const [appUsers, setAppUsers] = useState<User[]>([]);

  // User Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('editor');
  const [password, setPassword] = useState('');
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [isCustomPermissions, setIsCustomPermissions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Permission helper
  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    const rId = currentUser.roleId || currentUser.role || 'user';
    if (rId === 'super_admin') return true;
    if (currentUser.permissions?.includes('*')) return true;
    return currentUser.permissions?.includes(permission) || false;
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    'x-user-id': currentUser?.id || 'admin_super'
  };

  useEffect(() => {
    fetchInitialData();
  }, [searchQuery, selectedRoleFilter, activeTab]);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);

      const headers = { 'x-user-id': currentUser?.id || 'admin_super' };

      const resRoles = await fetch(`${API_URL}/api/roles`, { headers });
      const rolesData = await resRoles.json();
      setRoles(Array.isArray(rolesData) ? rolesData : []);

      if (activeTab === 'staff') {
        if (selectedRoleFilter) params.append('role', selectedRoleFilter);
        const resUsers = await fetch(`${API_URL}/api/users?${params.toString()}`, { headers });
        const usersData = await resUsers.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
        
        // Fetch app users count (unfiltered/unpaged) for the tab count badge
        const resAppUsers = await fetch(`${API_URL}/api/users/app-users`, { headers });
        const appUsersData = await resAppUsers.json();
        setAppUsers(Array.isArray(appUsersData) ? appUsersData : []);
      } else {
        const resAppUsers = await fetch(`${API_URL}/api/users/app-users?${params.toString()}`, { headers });
        const appUsersData = await resAppUsers.json();
        setAppUsers(Array.isArray(appUsersData) ? appUsersData : []);

        // Fetch staff users count (unfiltered/unpaged) for the tab count badge
        const resUsers = await fetch(`${API_URL}/api/users`, { headers });
        const usersData = await resUsers.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
      }
    } catch (error) {
      console.error('Failed to load user directories:', error);
      addToast('Failed to load user directory.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!displayName.trim()) {
      newErrors.displayName = 'Full Display Name is required.';
    }
    if (!email.trim()) {
      newErrors.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    
    if (!editingUser) {
      if (!password) {
        newErrors.password = 'Password is required.';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters.';
      }
    } else {
      if (password && password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters.';
      }
    }
    
    if (!roleId) {
      newErrors.roleId = 'Assigned System Role is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAddModal = () => {
    setEditingUser(null);
    setDisplayName('');
    setEmail('');
    const defaultRole = roles.find(r => r.id === 'editor')?.id || roles[0]?.id || 'editor';
    setRoleId(defaultRole);
    const matchedRole = roles.find(r => r.id === defaultRole);
    setCustomPermissions(matchedRole?.permissions || []);
    setIsCustomPermissions(false);
    setPassword('');
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setDisplayName(user.displayName || '');
    setEmail(user.email || '');
    const userRoleId = user.roleId || user.role || 'editor';
    setRoleId(userRoleId);
    setIsCustomPermissions(user.isCustomPermissions === true);
    if (user.isCustomPermissions && user.customPermissions && user.customPermissions.length > 0) {
      setCustomPermissions(user.customPermissions);
    } else if (user.isCustomPermissions && user.permissions && user.permissions.length > 0) {
      setCustomPermissions(user.permissions);
    } else {
      const matchedRole = roles.find(r => r.id === userRoleId);
      setCustomPermissions(matchedRole?.permissions || []);
    }
    setPassword('');
    setErrors({});
    setIsModalOpen(true);
  };

  const handleToggleCustomPermissions = (checked: boolean) => {
    setIsCustomPermissions(checked);
    if (!checked) {
      const matchedRole = roles.find(r => r.id === roleId);
      setCustomPermissions(matchedRole?.permissions || []);
    }
  };

  const handleToggleBlock = async (id: string, currentlyBlocked: boolean) => {
    const requiredPerm = currentlyBlocked ? 'users.activate' : 'users.suspend';
    if (!hasPermission(requiredPerm)) {
      addToast(`Access Denied. You lack the "${requiredPerm}" permission.`, 'warning');
      return;
    }

    try {
      const endpoint = activeTab === 'staff' 
        ? `${API_URL}/api/users/${id}`
        : `${API_URL}/api/users/app-users/${id}`;

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ isBlocked: !currentlyBlocked })
      });
      if (res.ok) {
        fetchInitialData();
        addToast(currentlyBlocked ? 'User account activated successfully!' : 'User account suspended successfully!', 'success');
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to toggle user status.', 'error');
      }
    } catch (error) {
      addToast('Network error. Failed to toggle user status.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission('users.delete')) {
      addToast('Access Denied. You lack the "users.delete" permission.', 'warning');
      return;
    }
    if (!confirm('Are you sure you want to delete this user? This action is permanent.')) return;

    try {
      const endpoint = activeTab === 'staff' 
        ? `${API_URL}/api/users/${id}`
        : `${API_URL}/api/users/app-users/${id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser?.id || 'admin_super' }
      });
      if (res.ok) {
        fetchInitialData();
        addToast('User deleted successfully!', 'success');
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to delete user.', 'error');
      }
    } catch (error) {
      addToast('Network error. Failed to delete user.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('Please resolve the errors in the form.', 'warning');
      return;
    }

    const isCreate = !editingUser;
    const requiredPerm = isCreate ? 'users.create' : 'users.edit';
    if (!hasPermission(requiredPerm)) {
      addToast(`Access Denied. You lack the "${requiredPerm}" permission.`, 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        displayName,
        email,
        roleId,
        role: roleId,
        isCustomPermissions,
        customPermissions: isCustomPermissions ? customPermissions : [],
        permissions: isCustomPermissions ? customPermissions : []
      };
      if (password) payload.password = password;

      const res = await fetch(
        isCreate ? `${API_URL}/api/users` : `${API_URL}/api/users/${editingUser!.id}`,
        {
          method: isCreate ? 'POST' : 'PUT',
          headers: authHeaders,
          body: JSON.stringify(payload)
        }
      );

      if (res.ok) {
        setIsModalOpen(false);
        fetchInitialData();
        addToast(isCreate ? 'User registered successfully!' : 'User profile updated successfully!', 'success');
      } else {
        const err = await res.json();
        addToast(err.error || 'Operation failed.', 'error');
      }
    } catch (error) {
      addToast('An error occurred while saving.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (user: User) => {
    const rId = user.roleId || user.role || 'user';
    const matchedRole = roles.find(r => r.id === rId);
    const label = matchedRole?.name || rId;

    const colorMap: Record<string, string> = {
      super_admin: 'bg-red-50 text-red-700 border-red-200',
      admin: 'bg-orange-50 text-orange-700 border-orange-200',
      content_manager: 'bg-green-50 text-green-700 border-green-200',
      subscription_manager: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      editor: 'bg-blue-50 text-blue-700 border-blue-200',
      user: 'bg-gray-50 text-gray-600 border-gray-200'
    };

    const colorClass = colorMap[rId] || 'bg-purple-50 text-purple-700 border-purple-200';
    return (
      <span className={`px-2.5 py-1 border text-xs font-bold rounded-lg uppercase ${colorClass}`}>
        {label}
      </span>
    );
  };

  const canSuspend = hasPermission('users.suspend') || hasPermission('users.activate');
  const canEdit = hasPermission('users.edit');
  const canDelete = hasPermission('users.delete');
  const canCreate = hasPermission('users.create');
  const canManagePerms = hasPermission('users.manage_permissions');
  const canAssignRoles = hasPermission('users.assign_roles');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-wedding-charcoal-dark font-sans tracking-wide">
            USER MANAGEMENT DIRECTORY
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Manage administrator profiles, assign roles, and configure individual custom permission overrides.
          </p>
        </div>

        {canCreate && activeTab === 'staff' && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-wedding-pink-dark to-[#ff6b81] hover:from-[#e62e47] hover:to-[#ff526e] text-white text-xs font-bold rounded-2xl shadow-md shadow-wedding-pink-medium/20 transition-all transform hover:-translate-y-0.5 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Register New User
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 p-1 bg-[#FFF5F6]/45 border border-[#FFCAD2]/40 rounded-2xl w-fit shadow-xs">
        <button
          onClick={() => {
            setActiveTab('staff');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
            activeTab === 'staff'
              ? 'bg-wedding-charcoal-dark text-wedding-gold-light shadow-md'
              : 'text-gray-500 hover:text-wedding-charcoal-dark hover:bg-white/50'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Staff Accounts
          <span className={`ml-1 px-2 py-0.5 text-[10px] rounded-md font-mono ${
            activeTab === 'staff' ? 'bg-wedding-charcoal-light text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {users.length}
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab('app_users');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
            activeTab === 'app_users'
              ? 'bg-wedding-charcoal-dark text-wedding-gold-light shadow-md'
              : 'text-gray-500 hover:text-wedding-charcoal-dark hover:bg-white/50'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Mobile App Users
          <span className={`ml-1 px-2 py-0.5 text-[10px] rounded-md font-mono ${
            activeTab === 'app_users' ? 'bg-wedding-charcoal-light text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {appUsers.length}
          </span>
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-[24px] border border-wedding-pink-medium/10 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'staff' ? "Search by display name or email address..." : "Search by name, email, phone number, or provider..."}
            className="w-full pl-11 pr-4 py-3 bg-[#FFF5F6]/30 border border-[#FFCAD2]/55 rounded-2xl text-wedding-charcoal-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/25 focus:bg-white text-sm font-semibold transition-all"
          />
        </div>

        {activeTab === 'staff' && (
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="w-full sm:w-48 px-4 py-3 bg-[#FFF5F6]/30 border border-[#FFCAD2]/55 rounded-2xl text-wedding-charcoal-dark focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/25 text-sm font-semibold transition-all appearance-none pr-8"
            >
              <option value="">All Roles</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[28px] border border-wedding-pink-medium/10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-wedding-pink-dark"></div>
            <p className="text-xs text-gray-400 font-bold">Loading user directory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              {activeTab === 'staff' ? (
                <>
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">User Profile</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Invites Created</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Drafts</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-400">
                            <UsersIcon className="w-10 h-10 text-gray-200" />
                            <p className="text-sm font-bold text-gray-500">No users found matching search criteria.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-wedding-pink-light flex items-center justify-center font-extrabold text-wedding-pink-dark text-sm border border-wedding-pink-medium/30">
                                {(user.displayName || 'US').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-wedding-charcoal-dark text-sm">{user.displayName || '—'}</p>
                                <p className="text-[10px] text-gray-400 font-mono">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">{getRoleBadge(user)}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                              {user.invitationCount || 0} cards
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">
                              {user.draftsCount || 0} drafts
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.isBlocked ? (
                              <span className="flex items-center gap-1.5 text-red-600 text-xs font-bold bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg w-fit">
                                <ShieldAlert className="w-3.5 h-3.5" /> Suspended
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-green-700 text-xs font-bold bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg w-fit">
                                <ShieldCheck className="w-3.5 h-3.5" /> Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {canEdit && (
                                <button
                                  onClick={() => openEditModal(user)}
                                  className="p-2 text-gray-400 hover:text-wedding-charcoal-dark hover:bg-gray-100 rounded-xl transition-all border border-transparent hover:border-gray-200"
                                  title="Edit User Profile"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}

                              {canSuspend && (
                                <button
                                  onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                                    user.isBlocked
                                      ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                      : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                                  }`}
                                  title={user.isBlocked ? 'Restore User' : 'Suspend User'}
                                >
                                  {user.isBlocked ? 'Activate' : 'Suspend'}
                                </button>
                              )}

                              {canDelete && user.role !== 'super_admin' && user.roleId !== 'super_admin' && (
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Mobile User</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Contact Info</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Auth Provider</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {appUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-400">
                            <Smartphone className="w-10 h-10 text-gray-200" />
                            <p className="text-sm font-bold text-gray-500">No app users found matching search criteria.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      appUsers.map((user) => {
                        const providerLabel = (user.provider || 'phone').replace('.com', '');
                        const providerColors: Record<string, string> = {
                          google: 'bg-red-50 text-red-700 border-red-100',
                          apple: 'bg-gray-50 text-gray-700 border-gray-200',
                          phone: 'bg-indigo-50 text-indigo-700 border-indigo-100',
                        };
                        const providerColor = providerColors[providerLabel] || 'bg-purple-50 text-purple-700 border-purple-100';

                        const formatLoginDate = (dt?: string | null) => {
                          if (!dt) return '—';
                          try {
                            return new Date(dt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            });
                          } catch { return '—'; }
                        };

                        return (
                          <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {user.profilePhoto ? (
                                  <img
                                    src={user.profilePhoto}
                                    alt={user.displayName}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-wedding-pink-medium/30 shadow-sm"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <div className={`w-10 h-10 rounded-full bg-wedding-pink-light flex items-center justify-center font-extrabold text-wedding-pink-dark text-sm border border-wedding-pink-medium/30 ${user.profilePhoto ? 'hidden' : ''}`}>
                                  {(user.displayName || user.phone || 'US').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-wedding-charcoal-dark text-sm">{user.displayName || 'Anonymous User'}</p>
                                  <p className="text-[9px] text-gray-400 font-mono truncate max-w-[130px]">{user.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs space-y-1">
                              {user.phone ? (
                                <p className="font-semibold text-wedding-charcoal-dark">📞 {user.phone}</p>
                              ) : null}
                              {user.email ? (
                                <p className="text-gray-500 font-mono text-[10px]">✉️ {user.email}</p>
                              ) : null}
                              {!user.phone && !user.email && (
                                <p className="text-gray-400 italic">No contact info</p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border uppercase ${providerColor}`}>
                                {providerLabel}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[11px] text-gray-600 font-semibold whitespace-nowrap">
                                {formatLoginDate(user.lastLoginAt || user.createdAt)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {user.isBlocked ? (
                                <span className="flex items-center gap-1.5 text-red-600 text-xs font-bold bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg w-fit">
                                  <ShieldAlert className="w-3.5 h-3.5" /> Suspended
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-green-700 text-xs font-bold bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg w-fit">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Active
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end items-center gap-2">
                                {canSuspend && (
                                  <button
                                    onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                                      user.isBlocked
                                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                        : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                                    }`}
                                    title={user.isBlocked ? 'Restore User' : 'Suspend User'}
                                  >
                                    {user.isBlocked ? 'Activate' : 'Suspend'}
                                  </button>
                                )}

                                {canDelete && (
                                  <button
                                    onClick={() => handleDelete(user.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </>
              )}
            </table>
          </div>
        )}
      </div>


      {/* USER CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-wedding-charcoal-dark/60 backdrop-blur-xs z-9999 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-wedding-pink-medium/20 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden my-8 animate-slideUp">
            
            {/* Modal Header */}
            <div className="p-6 bg-wedding-charcoal-dark text-white flex justify-between items-center">
              <div>
                <h4 className="font-bold text-base text-wedding-gold-light">
                  {editingUser ? 'Edit User Profile' : 'Register New Administrator'}
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {editingUser ? 'Modify user details, role assignment, and custom permissions.' : 'Create a new admin user account with a designated role.'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white bg-wedding-charcoal-light/60 hover:bg-wedding-charcoal-light p-2 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Full Display Name *</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (errors.displayName) {
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.displayName;
                        return copy;
                      });
                    }
                  }}
                  placeholder="e.g. Ramesh Patel"
                  className={`w-full px-4 py-3 rounded-xl bg-[#FFF5F6]/40 border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:bg-white font-semibold transition-all ${
                    errors.displayName 
                      ? 'border-red-500 focus:ring-red-500/20' 
                      : 'border-[#FFCAD2]/60 focus:ring-wedding-pink-dark/25'
                  }`}
                />
                {errors.displayName && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{errors.displayName}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.email;
                        return copy;
                      });
                    }
                  }}
                  placeholder="user@amantran.com"
                  className={`w-full px-4 py-3 rounded-xl bg-[#FFF5F6]/40 border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:bg-white font-semibold transition-all ${
                    errors.email 
                      ? 'border-red-500 focus:ring-red-500/20' 
                      : 'border-[#FFCAD2]/60 focus:ring-wedding-pink-dark/25'
                  }`}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  {editingUser ? 'Update Password (leave blank to keep current)' : 'Access Password *'}
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.password;
                        return copy;
                      });
                    }
                  }}
                  placeholder="Enter login password..."
                  className={`w-full px-4 py-3 rounded-xl bg-[#FFF5F6]/40 border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:bg-white font-mono font-semibold transition-all ${
                    errors.password 
                      ? 'border-red-500 focus:ring-red-500/20' 
                      : 'border-[#FFCAD2]/60 focus:ring-wedding-pink-dark/25'
                  }`}
                />
                {errors.password && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{errors.password}</p>
                )}
              </div>

              {/* Role Assignment */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-gray-400" />
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Assigned System Role *
                  </label>
                  {!canAssignRoles && editingUser && (
                    <span className="flex items-center gap-1 text-[8px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md font-bold uppercase">
                      <Lock className="w-2.5 h-2.5" /> Read-Only
                    </span>
                  )}
                </div>
                <select
                  value={roleId}
                  onChange={(e) => {
                    const newRoleId = e.target.value;
                    setRoleId(newRoleId);
                    if (errors.roleId) {
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.roleId;
                        return copy;
                      });
                    }
                    if (!isCustomPermissions) {
                      const matchedRole = roles.find(r => r.id === newRoleId);
                      setCustomPermissions(matchedRole?.permissions || []);
                    }
                  }}
                  disabled={!!editingUser && !canAssignRoles}
                  className={`w-full px-4 py-3 rounded-xl bg-[#FFF5F6]/40 border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 font-semibold transition-all disabled:opacity-60 disabled:bg-gray-50 ${
                    errors.roleId 
                      ? 'border-red-500 focus:ring-red-500/20' 
                      : 'border-[#FFCAD2]/60 focus:ring-wedding-pink-dark/25'
                  }`}
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                {errors.roleId && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{errors.roleId}</p>
                )}
              </div>

              {/* Custom Override Toggle — only visible if user has manage_permissions right */}
              {canManagePerms && (
                <div className="p-4 bg-[#FFF5F6]/30 border border-[#FFCAD2]/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-wedding-charcoal-dark block">Enable Custom Permission Override</label>
                      <span className="text-[10px] text-gray-400 font-semibold mt-0.5 block">
                        Assign specific granular permissions independent of the role defaults
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isCustomPermissions}
                        onChange={(e) => handleToggleCustomPermissions(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-wedding-pink-dark"></div>
                    </label>
                  </div>

                  {/* Permissions Grid */}
                  <div className={`space-y-2 max-h-[200px] overflow-y-auto transition-opacity duration-200 ${!isCustomPermissions ? 'opacity-50 pointer-events-none select-none' : ''}`}>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      {isCustomPermissions ? 'Custom Permissions (enabled)' : 'Inherited from Role'}
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {ALL_PERMISSIONS.map(perm => {
                        const isChecked = customPermissions.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-center gap-2.5 text-xs text-wedding-charcoal-dark font-semibold ${!isCustomPermissions ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!isCustomPermissions}
                              onChange={() => {
                                if (!isCustomPermissions) return;
                                setCustomPermissions(prev =>
                                  prev.includes(perm.id)
                                    ? prev.filter(p => p !== perm.id)
                                    : [...prev, perm.id]
                                );
                              }}
                              className="rounded border-gray-300 text-wedding-pink-dark focus:ring-wedding-pink-dark/20 h-3.5 w-3.5 disabled:opacity-40"
                            />
                            <span className="truncate">{perm.name}</span>
                            <code className="text-[8px] text-gray-400 font-mono ml-auto shrink-0">{perm.id}</code>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-wedding-charcoal-dark hover:bg-wedding-charcoal-light text-wedding-gold-light hover:text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingUser ? 'Update Profile' : 'Register User'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
