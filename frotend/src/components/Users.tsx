import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, CheckCircle, ShieldCheck, Trash2, Users as UsersIcon } from 'lucide-react';
import { User } from '../types';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, selectedRole]);

  async function fetchUsers() {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedRole) params.append('role', selectedRole);

      const res = await fetch(`http://localhost:5000/api/users?${params.toString()}`);
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleBlock = async (id: string, currentlyBlocked: boolean) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: !currentlyBlocked })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Toggle block status error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user profile? All associated draft records will be permanently removed.')) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Delete user error:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg uppercase">Super Admin</span>;
      case 'editor':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg uppercase">Editor</span>;
      case 'content_manager':
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-lg uppercase">Manager</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-lg uppercase">User</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and filter controls header */}
      <div className="bg-white p-6 rounded-3xl border border-wedding-pink-medium/40 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-auto flex-1 max-w-md relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search profiles by name or email address..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/40 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 focus:bg-white transition-all duration-300"
          />
        </div>

        <div className="w-full md:w-auto flex gap-4">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20"
          >
            <option value="">All Account Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="editor">Editor</option>
            <option value="content_manager">Content Manager</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-10 h-10 border-4 border-wedding-pink-medium border-t-wedding-pink-dark rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-wedding-pink-dark">Querying active directory...</p>
        </div>
      ) : (
        <div className="bg-white border border-wedding-pink-medium/40 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-wedding-pink-light/35 border-b border-wedding-pink-medium/30 text-wedding-charcoal-dark font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">User Profile</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Created Invites</th>
                <th className="py-4 px-6">Total Drafts</th>
                <th className="py-4 px-6">Account Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wedding-pink-medium/20 text-sm">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-semibold">
                    No users matching search filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-wedding-pink-light/10 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-wedding-pink-light flex items-center justify-center font-extrabold text-wedding-pink-dark text-sm border border-wedding-pink-medium/30">
                          {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div>
                          <p className="font-bold text-wedding-charcoal-dark">{user.displayName || 'No Display Name'}</p>
                          <p className="text-xs text-gray-500 font-mono">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">{getRoleBadge(user.role)}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200">
                        {user.invitationCount || 0} cards
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
                        {user.draftsCount || 0} sheets
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {user.isBlocked ? (
                        <span className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg w-fit">
                          <ShieldAlert className="w-3.5 h-3.5" /> Suspended
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-700 text-xs font-bold bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg w-fit">
                          <ShieldCheck className="w-3.5 h-3.5" /> Good Standing
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 shadow-sm transition-all duration-200 ${
                            user.isBlocked
                              ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                              : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                          }`}
                          title={user.isBlocked ? 'Restore User' : 'Suspend User'}
                        >
                          {user.isBlocked ? 'Activate' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent hover:border-red-100 shadow-sm hover:shadow"
                          title="Purge Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
