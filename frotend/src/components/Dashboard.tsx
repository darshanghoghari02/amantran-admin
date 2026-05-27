import { API_URL } from '@/config';
import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  Palette, 
  FolderHeart, 
  Sparkles, 
  Download, 
  PlusCircle, 
  ChevronRight, 
  Calendar,
  FileText
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [resSummary, resCharts] = await Promise.all([
          fetch(`${API_URL}/api/analytics/summary`),
          fetch(`${API_URL}/api/analytics/charts`)
        ]);
        
        const summaryData = await resSummary.json();
        const chartsData = await resCharts.json();
        
        setStats(summaryData);
        setCharts(chartsData);
      } catch (error) {
        console.error('Failed to load dashboard analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-wedding-pink-medium border-t-wedding-pink-dark rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-wedding-pink-dark">Assembling your wedding dashboard...</p>
      </div>
    );
  }

  const counters = stats?.counters || { totalUsers: 0, totalTemplates: 0, totalCategories: 0, premiumTemplates: 0, totalInvitations: 0, totalDrafts: 0 };
  const recentActivities = stats?.recentActivities || [];
  const topTemplates = stats?.topTemplates || [];

  const cardData = [
    { name: 'Total Users', value: counters.totalUsers, icon: UsersIcon, bg: 'bg-[#FAF3F0]', border: 'border-wedding-pink-medium/50', text: 'text-[#B86B77]' },
    { name: 'Total Templates', value: counters.totalTemplates, icon: Palette, bg: 'bg-[#FCF8F2]', border: 'border-wedding-gold-accent/40', text: 'text-wedding-gold-dark' },
    { name: 'Active Categories', value: counters.totalCategories, icon: FolderHeart, bg: 'bg-[#F3F8F2]', border: 'border-green-200', text: 'text-green-700' },
    { name: 'Premium Invitations', value: counters.premiumTemplates, icon: Sparkles, bg: 'bg-[#FAF6FF]', border: 'border-purple-200', text: 'text-purple-700' },
    { name: 'Total Invitations Created', value: counters.totalInvitations, icon: Download, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    { name: 'User Drafts', value: counters.totalDrafts, icon: FileText, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-wedding-charcoal-dark to-[#3a2024] p-8 rounded-3xl text-white shadow-xl relative overflow-hidden flex items-center justify-between">
        <div className="z-10 space-y-2 max-w-xl">
          <span className="px-3 py-1 bg-wedding-gold-accent/20 border border-wedding-gold-accent/30 text-wedding-gold-light text-xs font-semibold uppercase tracking-wider rounded-full">
            CMS Center
          </span>
          <h3 className="text-2xl font-bold tracking-tight mt-2">Welcome Back to Amantran Admin Panel</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            Manage your categories, custom fonts, invitation layouts, and canvas vectors. Monitor user invites and template downloads effortlessly.
          </p>
        </div>
        <div className="z-10 flex gap-4">
          <button
            onClick={() => onNavigate('templates')}
            className="flex items-center gap-2 px-5 py-3 bg-wedding-gold-accent hover:bg-wedding-gold-dark text-wedding-charcoal-dark text-sm font-bold rounded-2xl shadow-lg shadow-wedding-gold-accent/20 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5" />
            Add Template
          </button>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-12">
          <Palette className="w-96 h-96 text-wedding-gold-accent" />
        </div>
      </div>

      {/* Grid of Statistical cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardData.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className={`${card.bg} ${card.border} border p-6 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300`}
            >
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{card.name}</p>
                <h4 className="text-3xl font-extrabold text-wedding-charcoal-dark tracking-tight">{card.value}</h4>
              </div>
              <div className={`p-4 rounded-2xl bg-white border ${card.border} shadow-sm`}>
                <Icon className={`w-6 h-6 ${card.text}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Data Charts Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SVG User Growth Chart */}
        <div className="bg-white border border-wedding-pink-medium/40 p-8 rounded-3xl shadow-sm space-y-4">
          <div>
            <h4 className="text-lg font-bold text-wedding-charcoal-dark tracking-tight">Active User Growth</h4>
            <p className="text-xs text-gray-500">Monthly registration count trend</p>
          </div>
          <div className="h-64 w-full relative flex items-end pt-4">
            {charts && Array.isArray(charts.userGrowthTrend) && charts.userGrowthTrend.length >= 6 && (
              <svg className="w-full h-full" viewBox="0 0 500 200">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                {/* Horizontal Guide Lines */}
                <line x1="40" y1="30" x2="480" y2="30" stroke="#f1f1f1" strokeDasharray="4 4" />
                <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f1f1" strokeDasharray="4 4" />
                <line x1="40" y1="130" x2="480" y2="130" stroke="#f1f1f1" strokeDasharray="4 4" />
                <line x1="40" y1="170" x2="480" y2="170" stroke="#e1e1e1" strokeWidth="2" />
                
                {/* Area Gradient */}
                <path
                  d={`M 40,170 L 40,${170 - (charts.userGrowthTrend[0].users / 8)} 
                      L 128,${170 - (charts.userGrowthTrend[1].users / 8)} 
                      L 216,${170 - (charts.userGrowthTrend[2].users / 8)} 
                      L 304,${170 - (charts.userGrowthTrend[3].users / 8)} 
                      L 392,${170 - (charts.userGrowthTrend[4].users / 8)} 
                      L 480,${170 - (charts.userGrowthTrend[5].users / 8)} 
                      L 480,170 Z`}
                  fill="url(#chartGrad)"
                />
                
                {/* Line Path */}
                <path
                  d={`M 40,${170 - (charts.userGrowthTrend[0].users / 8)} 
                      L 128,${170 - (charts.userGrowthTrend[1].users / 8)} 
                      L 216,${170 - (charts.userGrowthTrend[2].users / 8)} 
                      L 304,${170 - (charts.userGrowthTrend[3].users / 8)} 
                      L 392,${170 - (charts.userGrowthTrend[4].users / 8)} 
                      L 480,${170 - (charts.userGrowthTrend[5].users / 8)}`}
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                
                {/* Data Nodes */}
                {charts.userGrowthTrend.map((pt: any, idx: number) => {
                  const x = 40 + idx * 88;
                  const y = 170 - pt.users / 8;
                  return (
                    <g key={idx} className="group cursor-pointer">
                      <circle cx={x} cy={y} r="5" fill="#B86B77" stroke="#FFF" strokeWidth="2" />
                      <circle cx={x} cy={y} r="8" fill="#B86B77" opacity="0" className="group-hover:opacity-20 transition-opacity" />
                      <text x={x} y={y - 12} fontSize="9" fontWeight="bold" fill="#1E1D1E" textAnchor="middle">
                        {pt.users}
                      </text>
                      <text x={x} y="188" fontSize="10" fill="#888" textAnchor="middle">
                        {pt.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* SVG Templates by Category Distribution */}
        <div className="bg-white border border-wedding-pink-medium/40 p-8 rounded-3xl shadow-sm space-y-4">
          <div>
            <h4 className="text-lg font-bold text-wedding-charcoal-dark tracking-tight">Template Distribution</h4>
            <p className="text-xs text-gray-500">Number of invitation layouts by categories</p>
          </div>
          <div className="h-64 w-full relative flex items-end pt-4">
            {charts && Array.isArray(charts.categoryDistribution) && (
              <svg className="w-full h-full" viewBox="0 0 500 200">
                <line x1="40" y1="170" x2="480" y2="170" stroke="#e1e1e1" strokeWidth="2" />
                
                {/* Render bars dynamically */}
                {charts.categoryDistribution.map((pt: any, idx: number) => {
                  const spacing = 110;
                  const x = 60 + idx * spacing;
                  const barWidth = 40;
                  const barHeight = pt.count * 25;
                  const y = 170 - barHeight;
                  return (
                    <g key={idx} className="group cursor-pointer">
                      {/* Highlight rect on hover */}
                      <rect x={x - 8} y="15" width={barWidth + 16} height="155" fill="#FFF5F5" opacity="0" className="group-hover:opacity-50 transition-opacity rounded-xl" />
                      
                      {/* The bar */}
                      <rect 
                        x={x} 
                        y={y} 
                        width={barWidth} 
                        height={barHeight} 
                        fill={idx % 2 === 0 ? "#B86B77" : "#D4AF37"}
                        rx="4" 
                      />
                      
                      {/* Text */}
                      <text x={x + barWidth / 2} y={y - 8} fontSize="11" fontWeight="bold" fill="#1E1D1E" textAnchor="middle">
                        {pt.count}
                      </text>
                      <text x={x + barWidth / 2} y="188" fontSize="10.5" fontWeight="500" fill="#3D3B3C" textAnchor="middle">
                        {pt.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row Details: Recent Activities & Top Performing templates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities Section */}
        <div className="bg-white border border-wedding-pink-medium/40 p-6 rounded-3xl shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-bold text-wedding-charcoal-dark tracking-tight">Recent Activity Log</h4>
            <span className="text-xs text-wedding-pink-dark font-semibold cursor-pointer hover:underline flex items-center gap-0.5">
              View all log <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="divide-y divide-wedding-pink-medium/20">
            {recentActivities.map((act: any) => (
              <div key={act.id} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-wedding-pink-light flex items-center justify-center text-wedding-pink-dark shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-wedding-charcoal-dark">{act.action}</p>
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span className="font-medium text-wedding-pink-dark">{act.user}</span>
                    <span>•</span>
                    <span>{act.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Downloaded Templates Section */}
        <div className="bg-white border border-wedding-pink-medium/40 p-6 rounded-3xl shadow-sm space-y-4">
          <h4 className="text-lg font-bold text-wedding-charcoal-dark tracking-tight">Top Templates</h4>
          <div className="space-y-4">
            {topTemplates.map((tpl: any) => (
              <div key={tpl.id} className="p-4 bg-wedding-pink-light/35 border border-wedding-pink-medium/20 rounded-2xl flex items-center justify-between">
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-wedding-charcoal-dark">{tpl.name}</h5>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-wedding-gold-accent/25 text-wedding-gold-dark text-[9px] font-bold rounded-md uppercase">
                      {tpl.isPremium ? 'Premium' : 'Free'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-wedding-pink-dark text-xs font-semibold bg-white px-3 py-1.5 rounded-xl border border-wedding-pink-medium/30 shadow-sm">
                  <Download className="w-3.5 h-3.5" />
                  {tpl.downloads} downloads
                </div>
              </div>
            ))}
            <button
              onClick={() => onNavigate('templates')}
              className="w-full py-3 bg-wedding-pink-light text-wedding-pink-dark hover:bg-wedding-pink-medium/35 text-xs font-bold rounded-2xl transition-all duration-300 text-center"
            >
              Open Template Manager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
