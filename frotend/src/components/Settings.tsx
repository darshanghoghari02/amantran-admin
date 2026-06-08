'use client';

import React, { useState, useEffect } from 'react';
import { API_URL } from '@/config';
import { useToastStore } from '../store/toastStore';
import { User, Role } from '../types';
import { 
  Sliders, 
  Save, 
  ShieldAlert, 
  Mail, 
  Info,
  CheckCircle2, 
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  AppWindow,
  UserPlus
} from 'lucide-react';

interface SettingsProps {
  currentUser?: User;
}

interface SystemConfig {
  appName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  defaultUserRole: string;
  allowSelfRegistration: boolean;
}

export default function Settings({ currentUser }: SettingsProps) {
  const { addToast } = useToastStore();
  const [config, setConfig] = useState<SystemConfig>({
    appName: 'Amantran Invitation App CMS',
    supportEmail: 'support@amantran.com',
    maintenanceMode: false,
    defaultUserRole: 'user',
    allowSelfRegistration: true
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Helper check for permissions
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
      
      const configRes = await fetch(`${API_URL}/api/settings`, { headers });
      if (!configRes.ok) {
        throw new Error('Could not retrieve system configurations.');
      }
      const configData = await configRes.json();
      
      const rolesRes = await fetch(`${API_URL}/api/roles`, { headers });
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        if (Array.isArray(rolesData)) {
          setRoles(rolesData);
        }
      }

      if (configData) {
        setConfig({
          appName: configData.appName || '',
          supportEmail: configData.supportEmail || '',
          maintenanceMode: configData.maintenanceMode === true,
          defaultUserRole: configData.defaultUserRole || 'user',
          allowSelfRegistration: configData.allowSelfRegistration !== false
        });
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Error loading global settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('settings.edit')) {
      addToast('Access Denied. You do not have permission to edit settings.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'admin_super'
        },
        body: JSON.stringify(config)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save configuration settings.');
      }

      addToast('System configuration settings updated successfully.', 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-wedding-pink-dark"></div>
      </div>
    );
  }

  const isEditable = hasPermission('settings.edit');

  return (
    <div className="max-w-4xl space-y-6 animate-fadeIn">
      {/* Upper header section */}
      <div>
        <h2 className="text-2xl font-extrabold text-wedding-charcoal-dark font-sans tracking-wide">
          SYSTEM CONFIGURATION SETTINGS
        </h2>
        <p className="text-xs text-gray-500 font-semibold mt-1">
          Adjust global parameters, contact configurations, registration policies, and maintenance statuses.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Identity Panel */}
        <div className="bg-white rounded-[28px] border border-wedding-pink-medium/10 p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2.5 bg-rose-50 text-wedding-pink-dark rounded-xl border border-rose-100">
              <AppWindow className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-wedding-charcoal-dark uppercase tracking-wider">
                Application Brand Settings
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                Configure default labels and support communication details.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* App name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Application Brand Title</label>
              <input
                type="text"
                value={config.appName}
                onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                disabled={!isEditable}
                className="w-full px-4 py-3 bg-[#FFF5F6]/40 border border-[#FFCAD2]/60 rounded-xl text-wedding-charcoal-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/25 focus:bg-white text-sm font-semibold transition-all disabled:opacity-60 disabled:bg-gray-50 disabled:border-gray-200"
                placeholder="e.g. Amantran CMS"
                required
              />
            </div>

            {/* Support Email */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Support Contact Email</label>
              </div>
              <input
                type="email"
                value={config.supportEmail}
                onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                disabled={!isEditable}
                className="w-full px-4 py-3 bg-[#FFF5F6]/40 border border-[#FFCAD2]/60 rounded-xl text-wedding-charcoal-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/25 focus:bg-white text-sm font-semibold transition-all disabled:opacity-60 disabled:bg-gray-50 disabled:border-gray-200"
                placeholder="e.g. support@domain.com"
                required
              />
            </div>

          </div>
        </div>

        {/* User Account Policies Panel */}
        <div className="bg-white rounded-[28px] border border-wedding-pink-medium/10 p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl border border-indigo-100">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-wedding-charcoal-dark uppercase tracking-wider">
                Registration & Access Policies
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                Regulate self-service enrollment parameters and initial privileges.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Default role */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Default New User Role</label>
              <select
                value={config.defaultUserRole}
                onChange={(e) => setConfig({ ...config, defaultUserRole: e.target.value })}
                disabled={!isEditable}
                className="w-full px-4 py-3 bg-[#FFF5F6]/40 border border-[#FFCAD2]/60 rounded-xl text-wedding-charcoal-dark focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/25 focus:bg-white text-sm font-semibold transition-all disabled:opacity-60 disabled:bg-gray-50 disabled:border-gray-200"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.isDefault ? '(System)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[9px] text-gray-400 font-semibold leading-relaxed">
                Choose the baseline privileges assigned automatically when custom users self-register.
              </p>
            </div>

            {/* Self registration */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Allow Self-Registration</label>
              <div className="flex items-center mt-2">
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.allowSelfRegistration}
                    onChange={(e) => setConfig({ ...config, allowSelfRegistration: e.target.checked })}
                    disabled={!isEditable}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-pink-dark disabled:opacity-50"></div>
                  <span className="ml-3 text-xs font-bold text-gray-500 uppercase">
                    {config.allowSelfRegistration ? 'Public Enrollments Enabled' : 'Registrations Restricted'}
                  </span>
                </label>
              </div>
            </div>

          </div>
        </div>

        {/* Platform Maintenance Mode Panel */}
        <div className="bg-white rounded-[28px] border border-wedding-pink-medium/10 p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl border border-amber-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-wedding-charcoal-dark uppercase tracking-wider">
                Emergency & System Maintenance
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                Activate temporary read-only lockouts for scheduled database migrations.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="mt-1">
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.maintenanceMode}
                  onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                  disabled={!isEditable}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 disabled:opacity-50"></div>
              </label>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-wedding-charcoal-dark uppercase">
                {config.maintenanceMode ? '⚡ Platform Lockout Active' : '🟢 Platform Online & Operating'}
              </h4>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed max-w-xl">
                When active, all mobile customer client actions (invitation drafting, purchase processing) will display a maintenance message. Admin control panels remain accessible to authorized managers.
              </p>
            </div>
          </div>
        </div>

        {/* Submit button */}
        {isEditable && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3.5 bg-wedding-charcoal-dark hover:bg-wedding-charcoal-light text-wedding-gold-light hover:text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Updating system configurations...' : 'Save Configuration Changes'}
            </button>
          </div>
        )}

      </form>
    </div>
  );
}
