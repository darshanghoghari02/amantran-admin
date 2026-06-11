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
  FileText,
  ChevronDown
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

const MOCK_STATS_FALLBACK = {
  counters: {
    totalUsers: 18,
    totalTemplates: 4,
    totalCategories: 4,
    premiumTemplates: 2,
    totalInvitations: 45,
    totalDrafts: 12
  },
  recentActivities: [
    { id: '1', action: 'New Template "Royal Wedding" created', user: 'Vicky Patel', time: '2 hours ago' },
    { id: '2', action: 'User registered: ramesh.patel@gmail.com', user: 'System', time: '5 hours ago' },
    { id: '3', action: 'Font "Hind Vadodara" updated', user: 'Sneha Sharma', time: '1 day ago' }
  ],
  topTemplates: [
    { id: '1', name: 'Royal Wedding Cover', isPremium: true, downloads: 340 },
    { id: '2', name: 'Elegant Floral Invitation', isPremium: false, downloads: 210 }
  ]
};

const MOCK_CHARTS_FALLBACK = {
  userGrowthTrend: [
    { month: 'Jan', users: 120 },
    { month: 'Feb', users: 240 },
    { month: 'Mar', users: 380 },
    { month: 'Apr', users: 510 },
    { month: 'May', users: 720 },
    { month: 'Jun', users: 950 }
  ],
  categoryDistribution: [
    { name: 'Wedding', count: 8 },
    { name: 'Engagement', count: 4 },
    { name: 'Baby Shower', count: 3 },
    { name: 'Reception', count: 5 }
  ]
};

import { cmsCache } from '@/config/cache';

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<any>(cmsCache.dashboard?.stats || null);
  const [charts, setCharts] = useState<any>(cmsCache.dashboard?.charts || null);
  const [loading, setLoading] = useState(!cmsCache.dashboard);

  const [fetchingGrowth, setFetchingGrowth] = useState(false);
  const [fetchingDistribution, setFetchingDistribution] = useState(false);

  // Dynamic filter states
  const [userGrowthRange, setUserGrowthRange] = useState('6m');
  const [userGrowthStart, setUserGrowthStart] = useState('');
  const [userGrowthEnd, setUserGrowthEnd] = useState('');

  const [distributionRange, setDistributionRange] = useState('this_month');
  const [distributionStart, setDistributionStart] = useState('');
  const [distributionEnd, setDistributionEnd] = useState('');

  // Keep track of previous values to identify what changed
  const prevGrowthRange = React.useRef(userGrowthRange);
  const prevGrowthStart = React.useRef(userGrowthStart);
  const prevGrowthEnd = React.useRef(userGrowthEnd);

  const prevDistRange = React.useRef(distributionRange);
  const prevDistStart = React.useRef(distributionStart);
  const prevDistEnd = React.useRef(distributionEnd);

  useEffect(() => {
    // Check if parameters changed from previous render
    const growthChanged = 
      prevGrowthRange.current !== userGrowthRange ||
      prevGrowthStart.current !== userGrowthStart ||
      prevGrowthEnd.current !== userGrowthEnd;

    const distChanged = 
      prevDistRange.current !== distributionRange ||
      prevDistStart.current !== distributionStart ||
      prevDistEnd.current !== distributionEnd;

    // Update refs to current values immediately
    prevGrowthRange.current = userGrowthRange;
    prevGrowthStart.current = userGrowthStart;
    prevGrowthEnd.current = userGrowthEnd;
    prevDistRange.current = distributionRange;
    prevDistStart.current = distributionStart;
    prevDistEnd.current = distributionEnd;

    async function fetchDashboardData(silent = false) {
      if (!silent && !cmsCache.dashboard) setLoading(true);
      
      // If a specific chart filter changed, show local loader
      if (growthChanged) setFetchingGrowth(true);
      if (distChanged) setFetchingDistribution(true);

      try {
        const growthParams = new URLSearchParams({
          userGrowthRange,
          userGrowthStart,
          userGrowthEnd
        }).toString();

        const distParams = new URLSearchParams({
          distributionRange,
          distributionStart,
          distributionEnd
        }).toString();

        const [resSummary, resCharts] = await Promise.all([
          fetch(`${API_URL}/api/analytics/summary`),
          fetch(`${API_URL}/api/analytics/charts?${growthParams}&${distParams}`)
        ]);
        
        const summaryData = await resSummary.json();
        const chartsData = await resCharts.json();
        
        setStats(summaryData);
        setCharts(chartsData);
        cmsCache.dashboard = { stats: summaryData, charts: chartsData };
      } catch (error) {
        console.error('Failed to load dashboard analytics, using offline fallback:', error);
        if (!cmsCache.dashboard) {
          setStats(MOCK_STATS_FALLBACK);
          setCharts(MOCK_CHARTS_FALLBACK);
        }
      } finally {
        setLoading(false);
        setFetchingGrowth(false);
        setFetchingDistribution(false);
      }
    }
    fetchDashboardData(cmsCache.dashboard ? true : false);

    // Set up polling interval to keep dashboard statistics in sync in real-time (every 5 seconds)
    const intervalId = setInterval(() => {
      fetchDashboardData(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [userGrowthRange, userGrowthStart, userGrowthEnd, distributionRange, distributionStart, distributionEnd]);

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

  const userGrowth = charts?.userGrowthTrend || [];
  const rawMaxUsers = userGrowth.length > 0 ? Math.max(...userGrowth.map((pt: any) => pt.users), 1) : 1;
  const maxUsersY = rawMaxUsers <= 6 ? 6 : Math.ceil(rawMaxUsers / 6) * 6;
  const userScale = 120 / maxUsersY;

  const catDistribution = charts?.categoryDistribution || [];
  const rawMaxCat = catDistribution.length > 0 ? Math.max(...catDistribution.map((pt: any) => pt.count), 1) : 1;
  const maxCatY = rawMaxCat <= 8 ? 8 : Math.ceil(rawMaxCat / 4) * 4;
  const catScale = 110 / maxCatY;

  const cardData = [
    { name: 'Total Users', value: counters.totalUsers, icon: UsersIcon, bg: 'bg-wedding-card', border: 'border-wedding-pink-medium/30 shadow-wedding-pink-light/50', text: 'text-wedding-pink-dark', iconBg: 'bg-wedding-pink-light text-wedding-pink-dark border border-wedding-pink-medium/30' },
    { name: 'Total Templates', value: counters.totalTemplates, icon: Palette, bg: 'bg-wedding-card', border: 'border-wedding-gold-accent/30 shadow-wedding-gold-light/40', text: 'text-wedding-gold-dark', iconBg: 'bg-wedding-gold-light text-wedding-gold-dark border border-wedding-gold-accent/30' },
    { name: 'Active Categories', value: counters.totalCategories, icon: FolderHeart, bg: 'bg-wedding-card', border: 'border-green-500/20 shadow-green-50/40', text: 'text-green-600', iconBg: 'bg-green-50 text-green-600 border border-green-200' },
    { name: 'Premium Invitations', value: counters.premiumTemplates, icon: Sparkles, bg: 'bg-wedding-card', border: 'border-purple-500/20 shadow-purple-50/40', text: 'text-purple-600', iconBg: 'bg-purple-50 text-purple-600 border border-purple-200' },
    { name: 'Total Invitations Created', value: counters.totalInvitations, icon: Download, bg: 'bg-wedding-card', border: 'border-blue-500/20 shadow-blue-50/40', text: 'text-blue-600', iconBg: 'bg-blue-50 text-blue-600 border border-blue-200' },
    { name: 'User Drafts', value: counters.totalDrafts, icon: FileText, bg: 'bg-wedding-card', border: 'border-amber-500/20 shadow-amber-50/40', text: 'text-amber-600', iconBg: 'bg-amber-50 text-amber-600 border border-amber-200' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-wedding-charcoal-dark to-[#2c1215] p-8 rounded-3xl text-white shadow-xl relative overflow-hidden flex items-center justify-between border border-wedding-pink-dark/20">
        <div className="z-10 space-y-2 max-w-xl">
          <span className="px-3 py-1 bg-wedding-pink-dark/25 border border-wedding-pink-dark/30 text-wedding-pink-light text-xs font-semibold uppercase tracking-wider rounded-full">
            CMS Center
          </span>
          <h3 className="text-2xl font-black tracking-tight mt-2">Welcome Back, Super Admin! 👏</h3>
          <p className="text-gray-300 text-sm leading-relaxed font-medium">
            Manage your categories, custom fonts, invitation layouts, and canvas vectors. Monitor user invites and template downloads effortlessly.
          </p>
        </div>
        <div className="z-10 flex gap-4">
          <button
            onClick={() => onNavigate('templates')}
            className="flex items-center gap-2 px-5 py-3 bg-wedding-gold-accent hover:bg-wedding-gold-dark text-wedding-charcoal-dark text-sm font-black rounded-2xl shadow-lg shadow-wedding-gold-accent/20 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5 text-wedding-charcoal-dark shrink-0" />
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
              className={`${card.bg} ${card.border} border p-6 rounded-2xl flex items-center justify-between shadow-xs hover:shadow-md transition-all duration-300`}
            >
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-extrabold uppercase tracking-wider">{card.name}</p>
                <h4 className="text-3xl font-extrabold text-wedding-charcoal-dark tracking-tight">{card.value}</h4>
              </div>
              <div className={`p-4 rounded-2xl ${card.iconBg} shadow-xs`}>
                <Icon className={`w-6 h-6 ${card.text}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Data Charts Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SVG User Growth Chart */}
        <div className="bg-wedding-card border border-wedding-pink-medium/20 p-8 rounded-3xl shadow-xs space-y-4 relative">
          {fetchingGrowth && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center gap-2 z-10 animate-fadeIn">
              <div className="w-8 h-8 border-3 border-wedding-pink-medium border-t-wedding-pink-dark rounded-full animate-spin"></div>
              <span className="text-[10px] font-bold text-wedding-pink-dark uppercase tracking-wider">Refreshing Users...</span>
            </div>
          )}
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div>
              <h4 className="text-lg font-bold text-wedding-charcoal-dark tracking-tight">Active User Growth</h4>
              <p className="text-xs text-gray-500 font-semibold">Monthly registration count trend</p>
            </div>
            <div className="relative">
              <select
                value={userGrowthRange}
                onChange={(e) => setUserGrowthRange(e.target.value)}
                className="appearance-none pl-8 pr-8 py-1.5 bg-[#FFF0F2] hover:bg-[#FFE5E8] border border-[#FFCAD2] text-wedding-pink-dark text-xs font-bold rounded-xl shadow-xs transition-colors focus:outline-none cursor-pointer"
              >
                <option value="6m">Last 6 Months</option>
                <option value="12m">Last 12 Months</option>
                <option value="this_year">This Year</option>
                <option value="last_year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
              <Calendar className="w-3.5 h-3.5 text-wedding-pink-dark absolute left-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-wedding-pink-dark absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          
          {userGrowthRange === 'custom' && (
            <div className="flex gap-4 items-center p-3 bg-[#FFF0F2]/45 border border-[#FFCAD2]/40 rounded-2xl animate-fadeIn">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Start Date</span>
                <input 
                  type="date" 
                  value={userGrowthStart}
                  onChange={(e) => setUserGrowthStart(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-wedding-pink-medium/30 text-xs font-semibold focus:outline-none bg-white text-wedding-charcoal-dark"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase">End Date</span>
                <input 
                  type="date" 
                  value={userGrowthEnd}
                  onChange={(e) => setUserGrowthEnd(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-wedding-pink-medium/30 text-xs font-semibold focus:outline-none bg-white text-wedding-charcoal-dark"
                />
              </div>
            </div>
          )}

          <div className="h-64 w-full relative flex items-end pt-4">
            {charts && Array.isArray(charts.userGrowthTrend) && charts.userGrowthTrend.length >= 1 && (() => {
              const userGridLines = [
                { label: '0', y: 170 },
                { label: String(Math.round(maxUsersY * 1/3)), y: 170 - (maxUsersY * 1/3) * userScale },
                { label: String(Math.round(maxUsersY * 2/3)), y: 170 - (maxUsersY * 2/3) * userScale },
                { label: String(maxUsersY), y: 170 - maxUsersY * userScale }
              ];
              return (
                <svg className="w-full h-full" viewBox="0 0 500 200">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF3E5C" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#FF3E5C" stopOpacity="0.0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines with Y-Axis Labels */}
                  {userGridLines.map((line, idx) => (
                    <g key={idx}>
                      <line 
                        x1="45" 
                        y1={line.y} 
                        x2="480" 
                        y2={line.y} 
                        stroke={idx === 0 ? "#E6DFE1" : "#F1EAEC"} 
                        strokeWidth={idx === 0 ? "1.5" : "1"} 
                        strokeDasharray={idx === 0 ? "none" : "4 4"} 
                      />
                      <text 
                        x="30" 
                        y={line.y + 4} 
                        fontSize="9.5" 
                        fontWeight="bold" 
                        fill="#6B5E62" 
                        textAnchor="end"
                      >
                        {line.label}
                      </text>
                    </g>
                  ))}
                  
                  {/* Area Gradient */}
                  {(() => {
                    const trendSpacing = charts.userGrowthTrend.length > 1 ? 435 / (charts.userGrowthTrend.length - 1) : 435;
                    const points = charts.userGrowthTrend.map((pt: any, idx: number) => {
                      const x = 45 + idx * trendSpacing;
                      const y = 170 - pt.users * userScale;
                      return `${x},${y}`;
                    });
                    const areaD = `M 45,170 L ${points.map((p: string) => p.replace(',', ' ')).join(' L ')} L 480,170 Z`;
                    const lineD = `M ${points.map((p: string) => p.replace(',', ' ')).join(' L ')}`;

                    return (
                      <>
                        <path d={areaD} fill="url(#chartGrad)" />
                        <path d={lineD} fill="none" stroke="#FF3E5C" strokeWidth="3.5" strokeLinecap="round" />
                        
                        {/* Data Nodes */}
                        {charts.userGrowthTrend.map((pt: any, idx: number) => {
                          const x = 45 + idx * trendSpacing;
                          const y = 170 - pt.users * userScale;
                          return (
                            <g key={idx} className="group cursor-pointer">
                              <circle cx={x} cy={y} r="5" fill="#FF3E5C" stroke="#FFF" strokeWidth="2" />
                              <circle cx={x} cy={y} r="8" fill="#FF3E5C" opacity="0" className="group-hover:opacity-20 transition-opacity" />
                              <text x={x} y={y - 12} fontSize="9.5" fontWeight="bold" fill="#161112" textAnchor="middle">
                                {pt.users}
                              </text>
                              <text x={x} y="188" fontSize="10.5" fontWeight="600" fill="#6B5E62" textAnchor="middle">
                                {pt.month}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              );
            })()}
          </div>
        </div>

        {/* SVG Templates by Category Distribution */}
        <div className="bg-wedding-card border border-wedding-pink-medium/20 p-8 rounded-3xl shadow-xs space-y-4 relative">
          {fetchingDistribution && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center gap-2 z-10 animate-fadeIn">
              <div className="w-8 h-8 border-3 border-wedding-pink-medium border-t-wedding-pink-dark rounded-full animate-spin"></div>
              <span className="text-[10px] font-bold text-wedding-pink-dark uppercase tracking-wider">Refreshing Templates...</span>
            </div>
          )}
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div>
              <h4 className="text-lg font-bold text-wedding-charcoal-dark tracking-tight">Template Distribution</h4>
              <p className="text-xs text-gray-500 font-semibold">Number of invitation layouts by categories</p>
            </div>
            <div className="relative">
              <select
                value={distributionRange}
                onChange={(e) => setDistributionRange(e.target.value)}
                className="appearance-none pl-8 pr-8 py-1.5 bg-[#FFF0F2] hover:bg-[#FFE5E8] border border-[#FFCAD2] text-wedding-pink-dark text-xs font-bold rounded-xl shadow-xs transition-colors focus:outline-none cursor-pointer"
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
                <option value="all_time">All Time</option>
                <option value="custom">Custom Range</option>
              </select>
              <Calendar className="w-3.5 h-3.5 text-wedding-pink-dark absolute left-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-wedding-pink-dark absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          
          {distributionRange === 'custom' && (
            <div className="flex gap-4 items-center p-3 bg-[#FFF0F2]/45 border border-[#FFCAD2]/40 rounded-2xl animate-fadeIn">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Start Date</span>
                <input 
                  type="date" 
                  value={distributionStart}
                  onChange={(e) => setDistributionStart(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-wedding-pink-medium/30 text-xs font-semibold focus:outline-none bg-white text-wedding-charcoal-dark"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase">End Date</span>
                <input 
                  type="date" 
                  value={distributionEnd}
                  onChange={(e) => setDistributionEnd(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-wedding-pink-medium/30 text-xs font-semibold focus:outline-none bg-white text-wedding-charcoal-dark"
                />
              </div>
            </div>
          )}

          <div className="h-64 w-full relative flex items-end pt-4">
            {charts && Array.isArray(charts.categoryDistribution) && (() => {
              const catGridLines = [];
              const steps = 4;
              for (let i = 0; i <= steps; i++) {
                const val = (maxCatY / steps) * i;
                catGridLines.push({
                  label: String(Math.round(val)),
                  y: 150 - val * catScale
                });
              }
              const spacing = 430 / Math.max(1, catDistribution.length);
              return (
                <svg className="w-full h-full" viewBox="0 0 500 230">
                  {/* Grid Lines with Y-Axis Labels */}
                  {catGridLines.map((line, idx) => (
                    <g key={idx}>
                      <line 
                        x1="45" 
                        y1={line.y} 
                        x2="480" 
                        y2={line.y} 
                        stroke={idx === 0 ? "#E6DFE1" : "#F1EAEC"} 
                        strokeWidth={idx === 0 ? "1.5" : "1"} 
                        strokeDasharray={idx === 0 ? "none" : "4 4"} 
                      />
                      <text 
                        x="30" 
                        y={line.y + 4} 
                        fontSize="9.5" 
                        fontWeight="bold" 
                        fill="#6B5E62" 
                        textAnchor="end"
                      >
                        {line.label}
                      </text>
                    </g>
                  ))}
                  
                  {/* Render bars dynamically */}
                  {catDistribution.map((pt: any, idx: number) => {
                    const x = 52 + idx * spacing;
                    const barWidth = Math.max(6, Math.min(16, spacing - 8));
                    const barHeight = pt.count * catScale;
                    const y = 150 - barHeight;
                    return (
                      <g key={idx} className="group cursor-pointer">
                        {/* Highlight rect on hover */}
                        <rect x={x - 4} y="35" width={barWidth + 8} height="115" fill="#FFF0F2" opacity="0" className="group-hover:opacity-100 transition-opacity rounded-2xl" />
                        
                        {/* The bar */}
                        <rect 
                          x={x} 
                          y={y} 
                          width={barWidth} 
                          height={barHeight} 
                          fill={idx % 2 === 0 ? "#FF3E5C" : "#F7C566"}
                          rx="3" 
                        />
                        
                        {/* Text (only show above bar if count > 0, otherwise show 0 at baseline) */}
                        <text x={x + barWidth / 2} y={y - 6} fontSize="9" fontWeight="extrabold" fill="#161112" textAnchor="middle">
                          {pt.count}
                        </text>
                        
                        {/* Rotated non-overlapping label */}
                        <text 
                          x={x + barWidth / 2} 
                          y="160" 
                          fontSize="8.5" 
                          fontWeight="700" 
                          fill="#6B5E62" 
                          textAnchor="end"
                          transform={`rotate(-35, ${x + barWidth / 2}, 160)`}
                        >
                          {pt.name.length > 12 ? `${pt.name.substring(0, 10)}...` : pt.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Bottom Row Details: Recent Activities & Top Performing templates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities Section */}
        <div className="bg-wedding-card border border-wedding-pink-medium/20 p-6 rounded-3xl shadow-xs lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-bold text-wedding-charcoal-dark tracking-tight">Recent Activity Log</h4>
            <span className="text-xs text-wedding-pink-dark font-semibold cursor-pointer hover:underline flex items-center gap-0.5">
              View all log <ChevronRight className="w-3.5 h-3.5 text-wedding-pink-dark shrink-0" />
            </span>
          </div>
          <div className="divide-y divide-wedding-pink-medium/15">
            {recentActivities.map((act: any) => (
              <div key={act.id} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-wedding-pink-light text-wedding-pink-dark flex items-center justify-center shrink-0 border border-wedding-pink-medium/20 shadow-xs">
                  <Calendar className="w-4 h-4 text-wedding-pink-dark shrink-0" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-wedding-charcoal-dark">{act.action}</p>
                  <div className="flex gap-2 text-xs text-gray-500 font-medium">
                    <span className="font-semibold text-wedding-pink-dark">{act.user}</span>
                    <span>•</span>
                    <span>{act.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Downloaded Templates Section */}
        <div className="bg-wedding-card border border-wedding-pink-medium/20 p-6 rounded-3xl shadow-xs space-y-4">
          <h4 className="text-lg font-bold text-wedding-charcoal-dark tracking-tight">Top Templates</h4>
          <div className="space-y-4">
            {topTemplates.map((tpl: any) => (
              <div key={tpl.id} className="p-4 bg-wedding-pink-light/35 border border-wedding-pink-medium/25 rounded-2xl flex items-center justify-between">
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-wedding-charcoal-dark">{tpl.name}</h5>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-wedding-pink-light text-wedding-pink-dark text-[9px] font-bold rounded-md uppercase border border-wedding-pink-medium/30 shadow-xs">
                      {tpl.isPremium ? 'Premium' : 'Free'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-wedding-pink-dark text-xs font-semibold bg-wedding-pink-light px-3 py-1.5 rounded-xl border border-wedding-pink-medium/20 shadow-xs">
                  <Download className="w-3.5 h-3.5 text-wedding-pink-dark shrink-0" />
                  {tpl.downloads} downloads
                </div>
              </div>
            ))}
            <button
              onClick={() => onNavigate('templates')}
              className="w-full py-3 bg-wedding-pink-light/40 text-wedding-pink-dark hover:bg-wedding-pink-dark hover:text-white text-xs font-bold rounded-2xl transition-all duration-300 text-center border border-wedding-pink-medium/30"
            >
              Open Template Manager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
