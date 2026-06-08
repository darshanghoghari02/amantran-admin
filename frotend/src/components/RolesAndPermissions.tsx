'use client';

import React, { useState, useEffect } from 'react';
import { API_URL } from '@/config';
import { useToastStore } from '../store/toastStore';
import { User, Role } from '../types';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  X, 
  AlertCircle, 
  Users as UsersIcon, 
  Settings as SettingsIcon, 
  Sliders, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Save,
  Lock,
  Search,
  Sparkles
} from 'lucide-react';

interface RolesAndPermissionsProps {
  currentUser?: User;
}

const PERMISSION_GROUPS = [
  {
    category: 'Dashboard',
    permissions: [
      { key: 'dashboard.view', label: 'View Dashboard Analytics', description: 'Allows viewing main admin dashboard charts and stats' }
    ]
  },
  {
    category: 'Templates',
    permissions: [
      { key: 'templates.view', label: 'View Templates List', description: 'Browse and preview invitation template designs' },
      { key: 'templates.create', label: 'Create New Template', description: 'Create and initialize a blank or upload template design' },
      { key: 'templates.edit', label: 'Edit Template Layout', description: 'Modify structure, pages, and objects in Canva editor' },
      { key: 'templates.delete', label: 'Delete Templates', description: 'Permanently remove template assets and records' },
      { key: 'templates.publish', label: 'Publish Templates', description: 'Make templates live for mobile/client application' },
      { key: 'templates.unpublish', label: 'Unpublish Templates', description: 'Temporarily hide templates from mobile application' },
      { key: 'templates.feature', label: 'Feature Templates', description: 'Mark templates as featured' }
    ]
  },
  {
    category: 'Categories',
    permissions: [
      { key: 'categories.view', label: 'View Categories', description: 'View invitation categories catalog' },
      { key: 'categories.create', label: 'Create Categories', description: 'Add new design categories' },
      { key: 'categories.edit', label: 'Edit Categories', description: 'Modify name, ordering, or thumbnail of categories' },
      { key: 'categories.delete', label: 'Delete Categories', description: 'Delete categories (only if they have no active templates)' }
    ]
  },
  {
    category: 'Typography & Fonts',
    permissions: [
      { key: 'fonts.view', label: 'View Custom Fonts', description: 'View custom typography styles registered' },
      { key: 'fonts.create', label: 'Upload Typography Files', description: 'Upload and register new .ttf font assets' },
      { key: 'fonts.edit', label: 'Edit Typography', description: 'Modify registered font options' },
      { key: 'fonts.delete', label: 'Delete Typography', description: 'Permanently delete font styles' }
    ]
  },
  {
    category: 'Languages',
    permissions: [
      { key: 'languages.view', label: 'View Languages', description: 'View platform translation languages' },
      { key: 'languages.create', label: 'Add Languages', description: 'Add new translation languages' },
      { key: 'languages.edit', label: 'Edit Languages', description: 'Enable/disable language status' },
      { key: 'languages.delete', label: 'Delete Languages', description: 'Remove platform language locales' }
    ]
  },
  {
    category: 'Subscription Tiers',
    permissions: [
      { key: 'subscriptions.view', label: 'View Subscriptions', description: 'View subscription plans and customer list' },
      { key: 'subscriptions.create', label: 'Add Subscription Plan', description: 'Create new pricing plans' },
      { key: 'subscriptions.edit', label: 'Edit Subscription Details', description: 'Modify price, tags, and category inclusion' },
      { key: 'subscriptions.delete', label: 'Delete Subscription Tier', description: 'Remove inactive/unused subscription plans' },
      { key: 'subscriptions.activate', label: 'Activate Plans', description: 'Enable plans to be sold' },
      { key: 'subscriptions.deactivate', label: 'Deactivate Plans', description: 'Temporarily hide plans from client storefront' },
      { key: 'subscriptions.manage_pricing', label: 'Manage Price Values', description: 'Change exact monetary prices' }
    ]
  },
  {
    category: 'User Accounts',
    permissions: [
      { key: 'users.view', label: 'View User Management', description: 'View list of admin users and registered customers' },
      { key: 'users.create', label: 'Create Admin User', description: 'Register new administrator accounts' },
      { key: 'users.edit', label: 'Edit User Accounts', description: 'Modify standard profile details' },
      { key: 'users.delete', label: 'Delete User Accounts', description: 'Permanently delete user profiles' },
      { key: 'users.suspend', label: 'Suspend User', description: 'Block user login capabilities' },
      { key: 'users.activate', label: 'Activate User', description: 'Restore suspended user accounts' },
      { key: 'users.assign_roles', label: 'Assign Roles', description: 'Modify system roles of user accounts' },
      { key: 'users.manage_permissions', label: 'Manage Custom Overrides', description: 'Define custom override permission tags per user' }
    ]
  },
  {
    category: 'Role & Permissions',
    permissions: [
      { key: 'roles.view', label: 'View Roles', description: 'View roles, permissions matrix, and audit trails' },
      { key: 'roles.create', label: 'Create Custom Roles', description: 'Define new roles' },
      { key: 'roles.edit', label: 'Edit Role Settings', description: 'Change role names, descriptions, and defaults' },
      { key: 'roles.delete', label: 'Delete Roles', description: 'Remove custom roles (only if no users are assigned)' },
      { key: 'roles.clone', label: 'Clone Roles', description: 'Clone permissions from a template role' },
      { key: 'roles.assign_permissions', label: 'Assign Role Permissions', description: 'Edit the permission mappings of roles' }
    ]
  },
  {
    category: 'System Config Settings',
    permissions: [
      { key: 'settings.view', label: 'View System Settings', description: 'View global application configurations' },
      { key: 'settings.edit', label: 'Edit System Settings', description: 'Modify support emails, app name, and maintenance states' }
    ]
  }
];

const totalUniquePermissions = PERMISSION_GROUPS.reduce((acc, g) => acc + g.permissions.length, 0);

export default function RolesAndPermissions({ currentUser }: RolesAndPermissionsProps) {
  const { addToast } = useToastStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Active Selected Role for modification
  const [selectedRoleId, setSelectedRoleId] = useState<string>('super_admin');
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true
  });

  // Modal / Creator State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    description: '',
    isActive: true,
    cloneRoleId: ''
  });
  const [creating, setCreating] = useState(false);

  // Helper for checking if current user has permission
  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    const roleId = currentUser.roleId || currentUser.role || 'user';
    if (roleId === 'super_admin') return true;
    if (currentUser.permissions?.includes('*')) return true;
    return currentUser.permissions?.includes(permission) || false;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { 'x-user-id': currentUser?.id || 'admin_super' };
      
      const rolesRes = await fetch(`${API_URL}/api/roles`, { headers });
      const rolesData = await rolesRes.json();
      
      const usersRes = await fetch(`${API_URL}/api/users`, { headers });
      const usersData = await usersRes.json();

      if (Array.isArray(rolesData)) {
        setRoles(rolesData);
      }
      if (Array.isArray(usersData)) {
        setAllUsers(usersData);
      }
    } catch (err: any) {
      console.error('Failed to load roles/users data:', err);
      addToast(err.message || 'Failed to load Role settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Selected role listener
  useEffect(() => {
    if (roles.length > 0) {
      const active = roles.find(r => r.id === selectedRoleId);
      if (active) {
        setRoleForm({
          name: active.name,
          description: (active as any).description || '',
          permissions: active.permissions || [],
          isActive: (active as any).isActive !== false
        });
      }
    }
  }, [selectedRoleId, roles]);

  const activeRoleObj = roles.find(r => r.id === selectedRoleId);
  const isSuperAdminRole = selectedRoleId === 'super_admin';
  const isDefaultSystemRole = activeRoleObj?.isDefault === true;

  // Stats derivation
  const totalRolesCount = roles.length;
  const inactiveRolesCount = roles.filter(r => (r as any).isActive === false).length;
  const totalAssignedUsersCount = allUsers.filter(u => u.roleId || u.role).length;

  const handleTogglePermission = (permKey: string) => {
    if (isSuperAdminRole) return; // Cannot modify super_admin permissions
    if (!hasPermission('roles.assign_permissions')) {
      addToast('Access Denied. You do not have permission to modify role permissions.', 'warning');
      return;
    }

    setRoleForm(prev => {
      const exists = prev.permissions.includes(permKey);
      let updated: string[];
      if (exists) {
        updated = prev.permissions.filter(k => k !== permKey);
      } else {
        updated = [...prev.permissions, permKey];
      }
      return { ...prev, permissions: updated };
    });
  };

  const handleSelectAllGroup = (groupPerms: { key: string }[], selectAll: boolean) => {
    if (isSuperAdminRole) return;
    if (!hasPermission('roles.assign_permissions')) {
      addToast('Access Denied. You do not have permission to modify role permissions.', 'warning');
      return;
    }

    setRoleForm(prev => {
      const keys = groupPerms.map(p => p.key);
      const filtered = prev.permissions.filter(k => !keys.includes(k));
      const updated = selectAll ? [...filtered, ...keys] : filtered;
      return { ...prev, permissions: updated };
    });
  };

  const handleSaveRoleDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuperAdminRole) return;

    if (!hasPermission('roles.edit')) {
      addToast('Access Denied. You do not have permission to edit roles.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/roles/${selectedRoleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'admin_super'
        },
        body: JSON.stringify({
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissions,
          isActive: roleForm.isActive
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update role details.');
      }

      addToast('Role settings updated successfully.', 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('roles.create')) {
      addToast('Access Denied. You do not have permission to create custom roles.', 'warning');
      return;
    }

    if (!newRoleForm.name.trim()) {
      addToast('Role Name is required.', 'warning');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'admin_super'
        },
        body: JSON.stringify({
          name: newRoleForm.name.trim(),
          description: newRoleForm.description.trim(),
          isActive: newRoleForm.isActive,
          cloneRoleId: newRoleForm.cloneRoleId || undefined
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create role.');
      }

      const created = await res.json();
      addToast(`Custom role ${created.name} created successfully.`, 'success');
      setIsCreateModalOpen(false);
      setNewRoleForm({
        name: '',
        description: '',
        isActive: true,
        cloneRoleId: ''
      });
      loadData();
      setSelectedRoleId(created.id);
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!hasPermission('roles.delete')) {
      addToast('Access Denied. You do not have permission to delete roles.', 'warning');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the custom role "${roleName}"? This action cannot be undone.`)) {
      try {
        const res = await fetch(`${API_URL}/api/roles/${roleId}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': currentUser?.id || 'admin_super'
          }
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to delete role.');
        }

        addToast(`Role "${roleName}" has been deleted.`, 'success');
        setSelectedRoleId('super_admin');
        loadData();
      } catch (err: any) {
        addToast(err.message, 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-wedding-pink-dark"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Upper header segment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-wedding-charcoal-dark font-sans tracking-wide">
            ROLE & PERMISSIONS MODULE
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Configure platform Access Control (RBAC), customize roles, and manage permissions matrices.
          </p>
        </div>
        
        {hasPermission('roles.create') && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-wedding-pink-dark to-[#ff6b81] hover:from-[#e62e47] hover:to-[#ff526e] text-white text-xs font-bold rounded-2xl shadow-md shadow-wedding-pink-medium/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Create Custom Role
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[28px] border border-wedding-pink-medium/10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Active Roles</p>
            <h3 className="text-3xl font-black text-wedding-charcoal-dark">{totalRolesCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-wedding-pink-medium/10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Platform Permissions</p>
            <h3 className="text-3xl font-black text-wedding-charcoal-dark">{totalUniquePermissions}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 border border-sky-100">
            <Sliders className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-wedding-pink-medium/10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Assigned Users</p>
            <h3 className="text-3xl font-black text-wedding-charcoal-dark">{totalAssignedUsersCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
            <UsersIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-wedding-pink-medium/10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inactive Roles</p>
            <h3 className="text-3xl font-black text-wedding-charcoal-dark">{inactiveRolesCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Interactive RBAC Workspace Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Roles Navigation Listing */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-[28px] border border-wedding-pink-medium/10 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.025)] space-y-4">
            <h4 className="text-xs font-bold text-wedding-charcoal-dark uppercase tracking-wider">
              System Roles Catalog
            </h4>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {roles.map((r) => {
                const isSelected = r.id === selectedRoleId;
                const userCount = allUsers.filter(u => u.roleId === r.id || u.role === r.id).length;
                
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`group w-full flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border text-left ${
                      isSelected
                        ? 'bg-[#FFF5F6] border-wedding-pink-medium/40 shadow-sm'
                        : 'bg-white hover:bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-extrabold truncate ${isSelected ? 'text-wedding-pink-dark' : 'text-wedding-charcoal-dark'}`}>
                          {r.name}
                        </span>
                        {r.isDefault && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[8px] font-bold rounded-md uppercase">
                            System
                          </span>
                        )}
                        {(r as any).isActive === false && (
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-500 text-[8px] font-bold rounded-md uppercase">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[180px]">
                        {(r as any).description || 'No description provided.'}
                      </p>
                      <div className="flex items-center gap-1 text-[9px] font-semibold text-gray-400 mt-1">
                        <UsersIcon className="w-3 h-3 text-gray-300" />
                        <span>{userCount} Assigned User{userCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {!r.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(r.id, r.name);
                        }}
                        disabled={!hasPermission('roles.delete')}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 focus:opacity-100"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Role Editor & Permissions Matrix Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[28px] border border-wedding-pink-medium/10 p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.025)]">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-gray-100 pb-5 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-wedding-charcoal-dark uppercase">
                    {roleForm.name || 'Select a Role'}
                  </h3>
                  {isSuperAdminRole && (
                    <span className="px-2 py-0.5 bg-yellow-50 border border-yellow-200 text-yellow-700 text-[8px] font-bold rounded-full uppercase flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Read-Only
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  ID: <code className="font-mono text-gray-600 bg-gray-50 px-1 py-0.5 rounded">{selectedRoleId}</code>
                </p>
              </div>

              {isSuperAdminRole && (
                <div className="p-3.5 bg-yellow-50/50 border border-yellow-100 rounded-2xl text-[10px] text-yellow-800 max-w-xs leading-relaxed font-semibold">
                  ⚡ <strong>System Safety Lock:</strong> The Super Admin role possesses the absolute root wildcard permission <code>*</code>. Its default configuration cannot be altered.
                </div>
              )}
            </div>

            <form onSubmit={handleSaveRoleDetails} className="space-y-6">
              
              {/* Grid Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Role Label Title</label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    disabled={isSuperAdminRole || isDefaultSystemRole}
                    className="w-full px-4 py-3 bg-[#FFF5F6]/40 border border-[#FFCAD2]/60 rounded-xl text-wedding-charcoal-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/25 focus:bg-white text-sm font-semibold transition-all disabled:opacity-60 disabled:bg-gray-50 disabled:border-gray-200"
                    placeholder="Enter role title..."
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Status</label>
                  <div className="flex items-center mt-2.5">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={roleForm.isActive}
                        disabled={isSuperAdminRole}
                        onChange={(e) => setRoleForm({ ...roleForm, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-pink-dark disabled:opacity-50"></div>
                      <span className="ml-3 text-xs font-bold text-gray-500 uppercase">
                        {roleForm.isActive ? 'Active Status' : 'Inactive / Suspended'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Role Purpose Description</label>
                  <textarea
                    rows={2}
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    disabled={isSuperAdminRole}
                    className="w-full px-4 py-3 bg-[#FFF5F6]/40 border border-[#FFCAD2]/60 rounded-xl text-wedding-charcoal-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/25 focus:bg-white text-sm font-semibold transition-all disabled:opacity-60 disabled:bg-gray-50 disabled:border-gray-200 resize-none"
                    placeholder="Describe what tasks users with this role can execute..."
                  />
                </div>
              </div>

              {/* Permission Matrix Grid Section */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-wedding-charcoal-dark uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4.5 h-4.5 text-wedding-pink-dark" />
                    Permission Mapping Grid
                  </h4>
                  {!isSuperAdminRole && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allKeys = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));
                          setRoleForm({ ...roleForm, permissions: allKeys });
                        }}
                        disabled={!hasPermission('roles.assign_permissions')}
                        className="text-[10px] text-wedding-pink-dark hover:underline font-bold disabled:opacity-50"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => setRoleForm({ ...roleForm, permissions: [] })}
                        disabled={!hasPermission('roles.assign_permissions')}
                        className="text-[10px] text-gray-500 hover:underline font-bold disabled:opacity-50"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-5 max-h-[600px] overflow-y-auto pr-1">
                  {PERMISSION_GROUPS.map((group) => {
                    const groupKeys = group.permissions.map(p => p.key);
                    const activeGroupKeysCount = groupKeys.filter(k => roleForm.permissions.includes(k)).length;
                    const isAllGroupSelected = activeGroupKeysCount === groupKeys.length;
                    const isSomeGroupSelected = activeGroupKeysCount > 0 && activeGroupKeysCount < groupKeys.length;

                    return (
                      <div key={group.category} className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
                        
                        {/* Group Header */}
                        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-100">
                          <span className="text-xs font-extrabold text-wedding-charcoal-dark">
                            {group.category}
                          </span>
                          {!isSuperAdminRole && (
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isAllGroupSelected}
                                disabled={!hasPermission('roles.assign_permissions')}
                                ref={el => {
                                  if (el) el.indeterminate = isSomeGroupSelected;
                                }}
                                onChange={(e) => handleSelectAllGroup(group.permissions, e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-wedding-pink-dark focus:ring-wedding-pink-dark/25"
                              />
                              <span className="text-[10px] font-bold text-gray-500 uppercase">
                                Toggle Group
                              </span>
                            </label>
                          )}
                        </div>

                        {/* List of individual permission checkboxes */}
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {group.permissions.map((perm) => {
                            const isChecked = isSuperAdminRole || roleForm.permissions.includes(perm.key);
                            
                            return (
                              <div
                                key={perm.key}
                                onClick={() => !isSuperAdminRole && handleTogglePermission(perm.key)}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-emerald-50/25 border-emerald-100'
                                    : 'bg-white border-gray-100 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isSuperAdminRole || !hasPermission('roles.assign_permissions')}
                                  onChange={() => {}} // Controlled by click parent handler
                                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-wedding-pink-dark focus:ring-wedding-pink-dark/25"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-extrabold text-wedding-charcoal-dark leading-snug">
                                    {perm.label}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">
                                    {perm.description}
                                  </p>
                                  <code className="inline-block text-[8px] text-gray-400 font-mono mt-1 bg-gray-50 px-1 py-0.5 rounded border border-gray-100">
                                    {perm.key}
                                  </code>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Submission actions */}
              {!isSuperAdminRole && hasPermission('roles.edit') && (
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3.5 bg-wedding-charcoal-dark hover:bg-wedding-charcoal-light text-wedding-gold-light hover:text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving Changes...' : 'Save Role Permissions'}
                  </button>
                </div>
              )}

            </form>

          </div>
        </div>

      </div>

      {/* CREATE NEW ROLE DIALOG MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-wedding-charcoal-dark/50 backdrop-blur-xs flex items-center justify-center p-4 z-9999 animate-fadeIn">
          <div className="bg-white rounded-[32px] border border-wedding-pink-medium/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] max-w-lg w-full p-6 md:p-8 space-y-6 relative animate-slideUp">
            
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-wedding-charcoal-dark uppercase">
                Create Custom Role
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                Establish a new permission template and clone settings from existing system profiles.
              </p>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Role Name *</label>
                <input
                  type="text"
                  value={newRoleForm.name}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                  placeholder="e.g. Graphic Designer, Support Team"
                  className="w-full px-4 py-3 bg-[#FFF5F6]/40 border border-[#FFCAD2]/60 rounded-xl text-wedding-charcoal-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/25 focus:bg-white text-sm font-semibold transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Description</label>
                <textarea
                  rows={2}
                  value={newRoleForm.description}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                  placeholder="Briefly explain responsibilities of this custom role..."
                  className="w-full px-4 py-3 bg-[#FFF5F6]/40 border border-[#FFCAD2]/60 rounded-xl text-wedding-charcoal-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/25 focus:bg-white text-sm font-semibold transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Clone Existing Role Permissions</label>
                  <select
                    value={newRoleForm.cloneRoleId}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, cloneRoleId: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FFF5F6]/40 border border-[#FFCAD2]/60 rounded-xl text-wedding-charcoal-dark focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/25 focus:bg-white text-sm font-semibold transition-all"
                  >
                    <option value="">-- Start with empty permissions --</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        Clone from: {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Initial Status</label>
                  <div className="flex items-center mt-3">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newRoleForm.isActive}
                        onChange={(e) => setNewRoleForm({ ...newRoleForm, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-pink-dark"></div>
                      <span className="ml-3 text-xs font-bold text-gray-500 uppercase">
                        {newRoleForm.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-3 bg-wedding-charcoal-dark hover:bg-wedding-charcoal-light text-wedding-gold-light hover:text-white text-xs font-bold rounded-xl transition-all disabled:opacity-60"
                >
                  {creating ? 'Creating...' : 'Create Role'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
