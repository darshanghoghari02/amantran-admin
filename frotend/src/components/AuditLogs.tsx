'use client';

import React, { useState, useEffect } from 'react';
import { API_URL } from '@/config';
import { useToastStore } from '../store/toastStore';
import { User } from '../types';
import { 
  Scroll, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  User as UserIcon,
  Tag,
  RefreshCw,
  Sliders
} from 'lucide-react';

interface AuditLog {
  id?: string;
  user: string;
  userId: string;
  action: string;
  resource: string;
  date: string;
  time: string;
  createdAt: string;
}

interface AuditLogsProps {
  currentUser?: User;
}

export default function AuditLogs({ currentUser }: AuditLogsProps) {
  const { addToast } = useToastStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/audit-logs`, {
        headers: {
          'x-user-id': currentUser?.id || 'admin_super'
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to retrieve system audit trails.');
      }
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Error fetching audit logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentUser]);

  // Extract unique resources for filter drop-down
  const resourcesList = Array.from(new Set(logs.map(log => log.resource).filter(Boolean)));

  // Filter & Search Logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesResource = resourceFilter === 'all' || log.resource.toLowerCase() === resourceFilter.toLowerCase();
    
    return matchesSearch && matchesResource;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, resourceFilter]);

  const getResourceBadgeStyle = (resource: string) => {
    const res = resource.toLowerCase();
    if (res.includes('role') || res.includes('permission')) {
      return 'bg-purple-50 text-purple-700 border-purple-100';
    }
    if (res.includes('user')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
    if (res.includes('template')) {
      return 'bg-blue-50 text-blue-700 border-blue-100';
    }
    if (res.includes('category')) {
      return 'bg-rose-50 text-rose-700 border-rose-100';
    }
    if (res.includes('font') || res.includes('typography')) {
      return 'bg-amber-50 text-amber-700 border-amber-100';
    }
    if (res.includes('subscription')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
    if (res.includes('setting')) {
      return 'bg-sky-50 text-sky-700 border-sky-100';
    }
    return 'bg-gray-50 text-gray-700 border-gray-100';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-wedding-charcoal-dark font-sans tracking-wide">
            AUDIT TRAILS & SECURITY LOGS
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Real-time tracking of platform configuration alterations and administrative changes.
          </p>
        </div>
        
        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-wedding-pink-medium/20 hover:border-wedding-pink-medium/40 hover:bg-gray-50 text-wedding-charcoal-dark text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Trails
        </button>
      </div>

      {/* Filter Options Bar */}
      <div className="bg-white rounded-[24px] border border-wedding-pink-medium/10 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        
        {/* Search Input */}
        <div className="relative sm:col-span-8">
          <Search className="w-4 h-4 text-gray-400 absolute left-4.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs by administrator email, action statement, resource name..."
            className="w-full pl-12 pr-4 py-3 bg-[#FFF5F6]/30 border border-[#FFCAD2]/55 rounded-2xl text-wedding-charcoal-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/25 focus:bg-white text-sm font-semibold transition-all"
          />
        </div>

        {/* Resource Selection Dropdown */}
        <div className="relative sm:col-span-4">
          <Filter className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="w-full pl-11 pr-8 py-3 bg-[#FFF5F6]/30 border border-[#FFCAD2]/55 rounded-2xl text-wedding-charcoal-dark focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/25 focus:bg-white text-sm font-semibold transition-all appearance-none"
          >
            <option value="all">All Modules</option>
            {resourcesList.map(resName => (
              <option key={resName} value={resName.toLowerCase()}>{resName}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
            ▼
          </div>
        </div>

      </div>

      {/* Main Logs Table Card */}
      <div className="bg-white rounded-[28px] border border-wedding-pink-medium/10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-wedding-pink-dark"></div>
            <p className="text-xs text-gray-400 font-bold">Querying system log registry...</p>
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto text-gray-400 border border-gray-100">
              <Scroll className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-wedding-charcoal-dark uppercase">No Audit Logs Match Filter</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              We couldn't locate any events matching your active keyword queries or selected system module filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">User Account</th>
                  <th className="px-6 py-4.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Resource Class</th>
                  <th className="px-6 py-4.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Action Executed</th>
                  <th className="px-6 py-4.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50/70 transition-colors">
                    
                    {/* User profile details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-full bg-wedding-pink-dark/10 text-wedding-pink-dark flex items-center justify-center font-bold text-xs border border-wedding-pink-medium/10">
                          {log.user.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-wedding-charcoal-dark">{log.user}</p>
                          <p className="text-[9px] text-gray-400 font-semibold font-mono mt-0.5">{log.userId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Resource Category Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-black border rounded-lg uppercase tracking-wide ${getResourceBadgeStyle(log.resource)}`}>
                        <Tag className="w-2.5 h-2.5" />
                        {log.resource}
                      </span>
                    </td>

                    {/* Action Message details */}
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-wedding-charcoal-light leading-relaxed max-w-md">
                        {log.action}
                      </p>
                    </td>

                    {/* Time / Date Details */}
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-right sm:text-left">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-gray-300" />
                          <span>{log.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-semibold text-gray-400">
                          <Clock className="w-3.5 h-3.5 text-gray-300" />
                          <span>{log.time}</span>
                        </div>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Elegant Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase">
              Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length} Records
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  const isCurrent = pNum === currentPage;
                  return (
                    <button
                      key={pNum}
                      onClick={() => handlePageChange(pNum)}
                      className={`w-8.5 h-8.5 rounded-xl text-xs font-bold transition-all border ${
                        isCurrent
                          ? 'bg-wedding-charcoal-dark border-wedding-charcoal-dark text-wedding-gold-light'
                          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
