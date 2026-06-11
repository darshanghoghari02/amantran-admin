'use client';

import { API_URL } from '@/config';
import { cmsCache } from '@/config/cache';
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Save, Check, RefreshCw, AlertCircle, HelpCircle, 
  Layers, FileText, PlusCircle, Trash2, Users, TrendingUp, 
  Coins, Percent, ChevronDown, ChevronUp, Search, Calendar 
} from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { Category, Template, SubscriptionPlan, User } from '../types';

interface SubscriptionsProps {
  currentUser?: User;
}

interface SubscriberData {
  userId: string;
  email: string;
  displayName: string;
  phone: string;
  activeSubscription: {
    planType: string;
    isActive: boolean;
    status: string;
    expiryDate: string;
    startDate: string;
    amountPaid: number;
    autoRenew: boolean;
  };
  history: Array<{
    id: string;
    planType: string;
    status: string;
    isActive: boolean;
    startDate: string;
    expiryDate: string;
    amountPaid: number;
    autoRenew: boolean;
    createdAt: string;
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    planId: string;
    status: string;
    timestamp: string;
    details?: string;
  }>;
}

export default function Subscriptions({ currentUser }: SubscriptionsProps) {
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

  const [activeSubTab, setActiveSubTab] = useState<'config' | 'analytics'>('config');

  // Plan configuration states
  const [plans, setPlans] = useState<SubscriptionPlan[]>(cmsCache.subscriptions || []);
  const [categories, setCategories] = useState<Category[]>(cmsCache.categories || []);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  const [loading, setLoading] = useState(!cmsCache.subscriptions);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);

  // Dynamic form state
  const [editStates, setEditStates] = useState<Record<string, {
    name: string;
    price: number;
    description: string;
    features: string; // Comma-separated list
    isActive: boolean;
    includedCategories: string[];
    includedTemplateIds: string[];
    durationType: '1day' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    durationDays: number;
    customStartDate: string | null;
    customEndDate: string | null;
  }>>({});

  // Modal states for creating a new plan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState(0);
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [newPlanFeatures, setNewPlanFeatures] = useState('');
  const [newPlanActive, setNewPlanActive] = useState(true);
  const [newPlanCats, setNewPlanCats] = useState<string[]>([]);
  const [newPlanTpls, setNewPlanTpls] = useState<string[]>([]);
  const [newPlanDurationType, setNewPlanDurationType] = useState<'1day' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [newPlanDurationDays, setNewPlanDurationDays] = useState(30);
  const [newPlanCustomStartDate, setNewPlanCustomStartDate] = useState('');
  const [newPlanCustomEndDate, setNewPlanCustomEndDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Analytics states
  const [stats, setStats] = useState<{
    totalSubscribers: number;
    activeTrials: number;
    monthlyRevenue: number;
    churnRate: number;
    growthTrend: Array<{ month: string; subscribers: number }>;
  } | null>(null);

  const [subscribers, setSubscribers] = useState<SubscriberData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Manual assign states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [allAppUsers, setAllAppUsers] = useState<User[]>([]);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignPlanId, setAssignPlanId] = useState('monthly');
  const [assignAmountPaid, setAssignAmountPaid] = useState(99);
  const [assignExpiryDate, setAssignExpiryDate] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'analytics') {
      fetchAnalyticsData();
    }
  }, [activeSubTab]);

  async function fetchInitialData() {
    if (!cmsCache.subscriptions) setLoading(true);
    try {
      const headers = { 'x-user-id': currentUser?.id || 'admin_super' };
      const [resPlans, resCats, resTpls] = await Promise.all([
        fetch(`${API_URL}/api/subscriptions`, { headers }),
        fetch(`${API_URL}/api/categories`, { headers }),
        fetch(`${API_URL}/api/templates`, { headers })
      ]);

      const plansData = await resPlans.json();
      const catsData = await resCats.json();
      const tplsData = await resTpls.json();

      const loadedPlans = Array.isArray(plansData) ? plansData : [];
      setPlans(loadedPlans);
      setCategories(Array.isArray(catsData) ? catsData : []);
      setTemplates(Array.isArray(tplsData) ? tplsData : []);
      cmsCache.subscriptions = loadedPlans;
      if (Array.isArray(catsData)) cmsCache.categories = catsData;

      // Initialize edit states for each plan
      const initialEditStates: typeof editStates = {};
      loadedPlans.forEach((plan: any) => {
        initialEditStates[plan.id] = {
          name: plan.name || '',
          price: plan.price || 0,
          description: plan.description || '',
          features: plan.features ? (Array.isArray(plan.features) ? plan.features.join(', ') : plan.features) : '',
          isActive: plan.isActive !== false,
          includedCategories: plan.includedCategories || [],
          includedTemplateIds: plan.includedTemplateIds || [],
          durationType: plan.durationType || 'monthly',
          durationDays: plan.durationDays !== undefined ? plan.durationDays : 30,
          customStartDate: plan.customStartDate || null,
          customEndDate: plan.customEndDate || null
        };
      });
      setEditStates(initialEditStates);
    } catch (error) {
      console.error('Failed to load subscription settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalyticsData() {
    setLoadingAnalytics(true);
    try {
      const headers = { 'x-user-id': currentUser?.id || 'admin_super' };
      const [resSummary, resSubscribers, resUsers] = await Promise.all([
        fetch(`${API_URL}/api/analytics/subscription-summary`, { headers }),
        fetch(`${API_URL}/api/user-subscriptions`, { headers }),
        fetch(`${API_URL}/api/users/app-users`, { headers })
      ]);

      const summaryData = await resSummary.json();
      const subsData = await resSubscribers.json();
      const appUsersData = await resUsers.json();

      setStats(summaryData);
      setSubscribers(Array.isArray(subsData) ? subsData : []);
      setAllAppUsers(Array.isArray(appUsersData) ? appUsersData : []);
    } catch (error) {
      console.error('Failed to load subscription analytics:', error);
      useToastStore.getState().addToast('Offline mode or failed to fetch analytics summaries.', 'error');
    } finally {
      setLoadingAnalytics(false);
    }
  }

  const handleFieldChange = (planId: string, field: string, value: any) => {
    setEditStates(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: value
      }
    }));
  };

  const toggleCategoryInclusion = (planId: string, catId: string) => {
    setEditStates(prev => {
      const state = prev[planId];
      if (!state) return prev;
      const currentCats = state.includedCategories || [];
      const newCats = currentCats.includes(catId)
        ? currentCats.filter(c => c !== catId)
        : [...currentCats, catId];
      return {
        ...prev,
        [planId]: {
          ...state,
          includedCategories: newCats
        }
      };
    });
  };

  const toggleTemplateInclusion = (planId: string, tplId: string) => {
    setEditStates(prev => {
      const state = prev[planId];
      if (!state) return prev;
      const currentTpls = state.includedTemplateIds || [];
      const newTpls = currentTpls.includes(tplId)
        ? currentTpls.filter(t => t !== tplId)
        : [...currentTpls, tplId];
      return {
        ...prev,
        [planId]: {
          ...state,
          includedTemplateIds: newTpls
        }
      };
    });
  };

  const handleSavePlan = async (planId: string) => {
    if (!hasPermission('subscriptions.edit') && !hasPermission('subscriptions.manage_pricing')) {
      useToastStore.getState().addToast('Access Denied. You lack the "subscriptions.edit" permission.', 'warning');
      return;
    }
    const editState = editStates[planId];
    if (!editState) return;

    // Split features by comma and trim
    const featuresList = editState.features
      ? editState.features.split(',').map(f => f.trim()).filter(Boolean)
      : [];

    const payload = {
      ...editState,
      features: featuresList
    };

    setSavingPlanId(planId);
    try {
      const res = await fetch(`${API_URL}/api/subscriptions/${planId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveSuccessId(planId);
        setTimeout(() => setSaveSuccessId(null), 3000);
        useToastStore.getState().addToast(
          `Subscription plan settings saved successfully!`,
          'success'
        );
        fetchInitialData();
      } else {
        useToastStore.getState().addToast('Failed to save subscription properties.', 'error');
      }
    } catch (error) {
      console.error('Error saving subscription plan:', error);
      useToastStore.getState().addToast('Network error. Failed to save plan properties.', 'error');
    } finally {
      setSavingPlanId(null);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!newPlanName.trim()) {
      newErrors.newPlanName = 'Plan Title is required.';
    }
    const priceNum = Number(newPlanPrice);
    if (newPlanPrice === undefined || newPlanPrice === null || isNaN(priceNum) || priceNum < 0) {
      newErrors.newPlanPrice = 'Price must be a non-negative number.';
    }
    
    if (newPlanDurationType !== 'custom') {
      const daysNum = Number(newPlanDurationDays);
      if (newPlanDurationDays === undefined || newPlanDurationDays === null || isNaN(daysNum) || daysNum < 1) {
        newErrors.newPlanDurationDays = 'Duration Days must be a positive number of days (at least 1).';
      }
    } else {
      if (!newPlanCustomStartDate) {
        newErrors.newPlanCustomStartDate = 'Start Date is required for custom duration.';
      }
      if (!newPlanCustomEndDate) {
        newErrors.newPlanCustomEndDate = 'End Date is required for custom duration.';
      }
      if (newPlanCustomStartDate && newPlanCustomEndDate) {
        if (new Date(newPlanCustomStartDate) > new Date(newPlanCustomEndDate)) {
          newErrors.newPlanCustomEndDate = 'End Date must be after or equal to Start Date.';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('subscriptions.create')) {
      useToastStore.getState().addToast('Access Denied. You lack the "subscriptions.create" permission.', 'warning');
      return;
    }
    if (!validateForm()) {
      useToastStore.getState().addToast('Please resolve the errors in the form.', 'warning');
      return;
    }

    setCreating(true);
    const featuresList = newPlanFeatures
      ? newPlanFeatures.split(',').map(f => f.trim()).filter(Boolean)
      : [];

    const payload = {
      name: newPlanName,
      price: newPlanPrice,
      description: newPlanDesc,
      features: featuresList,
      isActive: newPlanActive,
      includedCategories: newPlanCats,
      includedTemplateIds: newPlanTpls,
      durationType: newPlanDurationType,
      durationDays: newPlanDurationDays,
      customStartDate: newPlanDurationType === 'custom' ? newPlanCustomStartDate : null,
      customEndDate: newPlanDurationType === 'custom' ? newPlanCustomEndDate : null
    };

    try {
      const res = await fetch(`${API_URL}/api/subscriptions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        useToastStore.getState().addToast('Subscription plan created successfully!', 'success');
        setIsModalOpen(false);
        // Clear form
        setNewPlanName('');
        setNewPlanPrice(0);
        setNewPlanDesc('');
        setNewPlanFeatures('');
        setNewPlanActive(true);
        setNewPlanCats([]);
        setNewPlanTpls([]);
        setNewPlanDurationType('monthly');
        setNewPlanDurationDays(30);
        setNewPlanCustomStartDate('');
        setNewPlanCustomEndDate('');
        fetchInitialData();
      } else {
        const err = await res.json();
        useToastStore.getState().addToast(err.error || 'Failed to create plan', 'error');
      }
    } catch (error) {
      console.error('Create plan error:', error);
      useToastStore.getState().addToast('Network error. Failed to create plan.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!hasPermission('subscriptions.delete')) {
      useToastStore.getState().addToast('Access Denied. You lack the "subscriptions.delete" permission.', 'warning');
      return;
    }
    if (!confirm(`Are you sure you want to delete the "${planName}" subscription plan?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/subscriptions/${planId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser?.id || 'admin_super' }
      });

      if (res.ok) {
        useToastStore.getState().addToast(`Subscription plan "${planName}" deleted successfully!`, 'success');
        fetchInitialData();
      } else {
        const err = await res.json();
        useToastStore.getState().addToast(err.error || 'Failed to delete plan', 'error');
      }
    } catch (error) {
      console.error('Delete plan error:', error);
      useToastStore.getState().addToast('Network error. Failed to delete plan.', 'error');
    }
  };

  const handleManualAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId || !assignExpiryDate) {
      useToastStore.getState().addToast('Please select a user and an expiry date.', 'warning');
      return;
    }

    setAssigning(true);
    try {
      const res = await fetch(`${API_URL}/api/user-subscriptions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: assignUserId,
          planType: assignPlanId,
          expiryDate: new Date(assignExpiryDate).toISOString(),
          amountPaid: Number(assignAmountPaid) || 0
        })
      });

      if (res.ok) {
        useToastStore.getState().addToast('Subscription assigned successfully!', 'success');
        setIsAssignModalOpen(false);
        setAssignUserId('');
        setAssignExpiryDate('');
        fetchAnalyticsData();
      } else {
        const err = await res.json();
        useToastStore.getState().addToast(err.error || 'Failed to assign subscription.', 'error');
      }
    } catch (error) {
      console.error('Assign error:', error);
      useToastStore.getState().addToast('Failed to assign subscription.', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const toggleNewPlanCategory = (catId: string) => {
    setNewPlanCats(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const toggleNewPlanTemplate = (tplId: string) => {
    setNewPlanTpls(prev =>
      prev.includes(tplId) ? prev.filter(t => t !== tplId) : [...prev, tplId]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[45vh] gap-3 animate-fadeIn">
        <div className="w-10 h-10 border-4 border-wedding-pink-medium border-t-wedding-pink-dark rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-wedding-pink-dark">Querying active paywalls...</p>
      </div>
    );
  }

  // Filter subscribers list
  const filteredSubscribers = subscribers.filter(sub => {
    const matchesQuery = 
      (sub.email && sub.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sub.displayName && sub.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sub.phone && sub.phone.includes(searchQuery));

    const matchesStatus = 
      !statusFilter || 
      (sub.activeSubscription && sub.activeSubscription.status === statusFilter) ||
      (!sub.activeSubscription && statusFilter === 'expired');

    return matchesQuery && matchesStatus;
  });

  const totalPremium = templates.filter(t => t.isPremium).length;
  const totalFree = templates.filter(t => !t.isPremium).length;
  const inMonthly = templates.filter(t => t.isPremium && t.includedInMonthlyPlan).length;
  const inYearly = templates.filter(t => t.isPremium && t.includedInYearlyPlan).length;
  const purchasablePremium = templates.filter(t => t.isPremium && t.singlePurchasePrice && t.singlePurchasePrice > 0);
  const avgPrice = purchasablePremium.length > 0 
    ? Math.round(purchasablePremium.reduce((sum, t) => sum + (t.singlePurchasePrice || 0), 0) / purchasablePremium.length)
    : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Tab Selectors */}
      <div className="flex gap-2 p-1 bg-[#FFF5F6]/45 border border-[#FFCAD2]/40 rounded-2xl w-fit shadow-xs">
        <button
          onClick={() => setActiveSubTab('config')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
            activeSubTab === 'config'
              ? 'bg-wedding-charcoal-dark text-wedding-gold-light shadow-md'
              : 'text-gray-500 hover:text-wedding-charcoal-dark hover:bg-white/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Plan Configuration
        </button>
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
            activeSubTab === 'analytics'
              ? 'bg-wedding-charcoal-dark text-wedding-gold-light shadow-md'
              : 'text-gray-500 hover:text-wedding-charcoal-dark hover:bg-white/50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Subscribers & Analytics
        </button>
      </div>

      {activeSubTab === 'config' ? (
        <>
          {/* Overview Banner */}
          <div className="bg-gradient-to-r from-wedding-charcoal-dark to-[#2c1215] p-6 sm:p-8 rounded-3xl border border-wedding-pink-dark/20 text-white flex flex-col md:flex-row gap-6 justify-between items-start md:items-center shadow-xl">
            <div className="space-y-1 flex-1">
              <h3 className="text-lg sm:text-2xl font-black text-wedding-gold-light tracking-tight flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-wedding-gold-accent fill-wedding-gold-accent animate-pulse" />
                Premium Paywall Configuration
              </h3>
              <p className="text-xs text-gray-300 max-w-2xl font-medium leading-relaxed">
                Configure premium membership details. Define paywall gates by setting category-wide overrides, listing features, or selecting specific individual templates included under each subscription package.
              </p>
            </div>
            {hasPermission('subscriptions.create') && (
              <button
                onClick={() => { setErrors({}); setIsModalOpen(true); }}
                className="flex items-center gap-2 px-5 py-3 bg-wedding-pink-dark hover:bg-wedding-pink-hover text-white text-xs font-extrabold rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap"
              >
                <PlusCircle className="w-5 h-5" />
                Create Plan
              </button>
            )}
          </div>

          {/* Quick Statistics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Premium templates</span>
              <span className="text-2xl font-black text-amber-700 mt-1">{totalPremium}</span>
            </div>
            <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/5 border border-gray-500/20 rounded-2xl p-4 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-gray-800 uppercase tracking-wider block">Free templates</span>
              <span className="text-2xl font-black text-gray-700 mt-1">{totalFree}</span>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-4 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">In Monthly Pass</span>
              <span className="text-2xl font-black text-blue-700 mt-1">{inMonthly}</span>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-4 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">In Yearly Pass</span>
              <span className="text-2xl font-black text-purple-700 mt-1">{inYearly}</span>
            </div>
            <div className="bg-gradient-to-br from-amber-600/10 to-amber-700/5 border border-amber-600/20 rounded-2xl p-4 flex flex-col justify-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Avg Single Buy Price</span>
              <span className="text-2xl font-black text-amber-800 mt-1 font-mono">₹{avgPrice}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {plans.map((plan) => {
              const editState = editStates[plan.id] || {
                name: plan.name || '',
                price: plan.price || 0,
                description: plan.description || '',
                features: '',
                isActive: plan.isActive !== false,
                includedCategories: plan.includedCategories || [],
                includedTemplateIds: plan.includedTemplateIds || [],
                durationType: plan.durationType || 'monthly',
                durationDays: plan.durationDays !== undefined ? plan.durationDays : 30,
                customStartDate: plan.customStartDate || null,
                customEndDate: plan.customEndDate || null
              };

              const planBadgeColor = plan.id === 'monthly' 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : plan.id === 'yearly'
                ? 'bg-purple-50 border-purple-200 text-purple-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700';
                
              const planBadgeText = plan.id === 'monthly'
                ? 'Monthly Pass'
                : plan.id === 'yearly'
                ? 'Yearly Pass'
                : 'Custom Plan';

              return (
                <div key={plan.id} className="bg-white border border-wedding-pink-medium/40 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col justify-between">
                  <div className="p-6 sm:p-8 space-y-6">
                    {/* Plan Header */}
                    <div className="flex justify-between items-center pb-4 border-b border-wedding-pink-medium/20">
                      <div>
                        <h4 className="text-lg font-black text-wedding-charcoal-dark tracking-tight">{editState.name}</h4>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">plan_id: {plan.id}</p>
                      </div>
                      <span className={`px-3 py-1 border text-[10px] font-black rounded-lg uppercase tracking-wider ${planBadgeColor}`}>
                        {planBadgeText}
                      </span>
                    </div>

                    {/* Config Fields */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Plan Title</label>
                          <input
                            type="text"
                            disabled={!hasPermission('subscriptions.edit')}
                            value={editState.name}
                            onChange={(e) => handleFieldChange(plan.id, 'name', e.target.value)}
                            placeholder="e.g. Monthly Premium"
                            className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/30 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 focus:bg-white font-medium transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Price (₹ / cycle)</label>
                          <input
                            type="number"
                            min="0"
                            disabled={!hasPermission('subscriptions.manage_pricing')}
                            value={editState.price}
                            onChange={(e) => handleFieldChange(plan.id, 'price', Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/30 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 focus:bg-white font-bold transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Duration Type</label>
                          <select
                            value={editState.durationType || 'monthly'}
                            disabled={!hasPermission('subscriptions.edit')}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              let days = 30;
                              if (val === '1day') days = 1;
                              else if (val === 'weekly') days = 7;
                              else if (val === 'monthly') days = 30;
                              else if (val === 'yearly') days = 365;
                              else if (val === 'custom') days = 0;
                              
                              setEditStates(prev => ({
                                ...prev,
                                [plan.id]: {
                                  ...prev[plan.id],
                                  durationType: val,
                                  durationDays: days
                                }
                              }));
                            }}
                            className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/30 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 focus:bg-white font-medium transition-all"
                          >
                            <option value="1day">1 Day</option>
                            <option value="weekly">Weekly (7 Days)</option>
                            <option value="monthly">Monthly (30 Days)</option>
                            <option value="yearly">Yearly (365 Days)</option>
                            <option value="custom">Custom (Fixed Dates)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 flex flex-col justify-end">
                          <div className="px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/20 text-wedding-charcoal-light text-sm font-semibold">
                            Duration: {editState.durationType === 'custom' ? 'Defined by dates' : `${editState.durationDays || 30} days`}
                          </div>
                        </div>
                      </div>

                      {editState.durationType === 'custom' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Start Date</label>
                            <input
                              type="date"
                              disabled={!hasPermission('subscriptions.edit')}
                              value={editState.customStartDate ? editState.customStartDate.substring(0, 10) : ''}
                              onChange={(e) => handleFieldChange(plan.id, 'customStartDate', e.target.value)}
                              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/30 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 focus:bg-white font-medium transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">End Date</label>
                            <input
                              type="date"
                              disabled={!hasPermission('subscriptions.edit')}
                              value={editState.customEndDate ? editState.customEndDate.substring(0, 10) : ''}
                              onChange={(e) => handleFieldChange(plan.id, 'customEndDate', e.target.value)}
                              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/30 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 focus:bg-white font-medium transition-all"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Description</label>
                        <textarea
                          value={editState.description}
                          disabled={!hasPermission('subscriptions.edit')}
                          onChange={(e) => handleFieldChange(plan.id, 'description', e.target.value)}
                          placeholder="Plan description..."
                          rows={2}
                          className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/30 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 focus:bg-white transition-all resize-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Features (Comma-separated)</label>
                        <input
                          type="text"
                          disabled={!hasPermission('subscriptions.edit')}
                          value={editState.features}
                          onChange={(e) => handleFieldChange(plan.id, 'features', e.target.value)}
                          placeholder="e.g. Unlimited PDF exports, Ad-free, Premium Music, HD Quality"
                          className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/30 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 focus:bg-white font-medium transition-all"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-wedding-pink-medium/20 rounded-2xl">
                        <div>
                          <h5 className="text-xs font-black text-wedding-charcoal-dark uppercase tracking-wider">Plan Accessibility</h5>
                          <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Toggle plan availability on active devices</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={!hasPermission('subscriptions.edit')}
                            checked={editState.isActive}
                            onChange={(e) => handleFieldChange(plan.id, 'isActive', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-pink-dark"></div>
                          <span className="ml-3 text-xs font-bold text-wedding-charcoal-dark">
                            {editState.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </label>
                      </div>

                      {/* Inclusions Accordion */}
                      <div className="space-y-4 pt-4 border-t border-wedding-pink-medium/10">
                        <h5 className="text-xs font-black text-wedding-charcoal-dark uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-wedding-pink-dark" />
                          Included Template Categories
                        </h5>
                        <div className="flex gap-2 flex-wrap bg-gray-50/50 p-4 border border-wedding-pink-medium/15 rounded-2xl max-h-[140px] overflow-y-auto">
                          {categories.map((cat) => {
                            const isChecked = editState.includedCategories.includes(cat.id);
                            return (
                              <button
                                type="button"
                                key={cat.id}
                                disabled={!hasPermission('subscriptions.edit')}
                                onClick={() => toggleCategoryInclusion(plan.id, cat.id)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${isChecked
                                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-black shadow-xs'
                                  : 'border-wedding-pink-medium/35 bg-white text-wedding-charcoal-light hover:bg-wedding-pink-light/10'
                                  }`}
                              >
                                {cat.name}
                              </button>
                            );
                          })}
                        </div>

                        <h5 className="text-xs font-black text-wedding-charcoal-dark uppercase tracking-wider flex items-center gap-1.5 pt-2">
                          <FileText className="w-4 h-4 text-wedding-pink-dark" />
                          Included Specific Premium Templates
                        </h5>
                        <div className="flex gap-2 flex-wrap bg-gray-50/50 p-4 border border-wedding-pink-medium/15 rounded-2xl max-h-[160px] overflow-y-auto">
                          {templates.filter(t => t.isPremium).map((tpl) => {
                            const isChecked = editState.includedTemplateIds.includes(tpl.id);
                            return (
                              <button
                                type="button"
                                key={tpl.id}
                                disabled={!hasPermission('subscriptions.edit')}
                                onClick={() => toggleTemplateInclusion(plan.id, tpl.id)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${isChecked
                                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-black shadow-xs'
                                  : 'border-wedding-pink-medium/35 bg-white text-wedding-charcoal-light hover:bg-wedding-pink-light/10'
                                  }`}
                              >
                                {tpl.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="bg-gray-50 p-6 border-t border-wedding-pink-medium/20 flex items-center justify-between">
                    {hasPermission('subscriptions.delete') && (
                      <button
                        onClick={() => handleDeletePlan(plan.id, editState.name)}
                        className="flex items-center gap-1.5 px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl shadow-xs transition-all duration-200"
                        title="Delete this plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Plan
                      </button>
                    )}
                    
                    {(hasPermission('subscriptions.edit') || hasPermission('subscriptions.manage_pricing')) && (
                      <button
                        onClick={() => handleSavePlan(plan.id)}
                        disabled={savingPlanId === plan.id}
                        className="flex items-center gap-2 px-5 py-3 bg-wedding-charcoal-dark hover:bg-wedding-charcoal-light text-wedding-gold-light hover:text-white text-xs font-extrabold rounded-2xl shadow transition-all duration-300 disabled:opacity-50"
                      >
                        {savingPlanId === plan.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : saveSuccessId === plan.id ? (
                          <>
                            <Check className="w-4 h-4 text-green-400 stroke-[3]" />
                            Saved!
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 text-wedding-pink-medium" />
                            Save settings
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Dashboard KPI cards */}
          {loadingAnalytics || !stats ? (
            <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wedding-pink-dark"></div>
              <p className="text-xs text-gray-400 font-bold">Aggregating subscriber details...</p>
            </div>
          ) : (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-wedding-pink-medium/20 p-6 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-extrabold uppercase tracking-wider">Total Subscribers</p>
                    <h4 className="text-3xl font-extrabold text-wedding-charcoal-dark tracking-tight">{stats.totalSubscribers}</h4>
                  </div>
                  <div className="p-4 rounded-2xl bg-wedding-pink-light text-wedding-pink-dark border border-wedding-pink-medium/20 shadow-xs">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white border border-wedding-pink-medium/20 p-6 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-extrabold uppercase tracking-wider">Active Trials</p>
                    <h4 className="text-3xl font-extrabold text-wedding-charcoal-dark tracking-tight">{stats.activeTrials}</h4>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-xs">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white border border-wedding-pink-medium/20 p-6 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-extrabold uppercase tracking-wider">Monthly Revenue</p>
                    <h4 className="text-3xl font-extrabold text-wedding-charcoal-dark tracking-tight font-mono">₹{stats.monthlyRevenue}</h4>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs">
                    <Coins className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white border border-wedding-pink-medium/20 p-6 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-extrabold uppercase tracking-wider">Churn Rate</p>
                    <h4 className="text-3xl font-extrabold text-wedding-charcoal-dark tracking-tight">{stats.churnRate}%</h4>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-xs">
                    <Percent className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Growth trend chart */}
              <div className="bg-white border border-wedding-pink-medium/20 p-8 rounded-3xl shadow-xs space-y-4">
                <h4 className="text-lg font-bold text-wedding-charcoal-dark tracking-tight">Subscription Growth Trend</h4>
                <p className="text-xs text-gray-500 font-semibold">Historical dataset representing total active memberships</p>
                
                <div className="h-64 w-full relative flex items-end pt-4">
                  {stats.growthTrend && stats.growthTrend.length > 0 && (() => {
                    const trend = stats.growthTrend;
                    const maxSubs = Math.max(...trend.map(t => t.subscribers), 2);
                    const scale = 120 / maxSubs;
                    const trendSpacing = trend.length > 1 ? 435 / (trend.length - 1) : 435;
                    const gridLines = [
                      { label: '0', y: 170 },
                      { label: String(Math.round(maxSubs * 0.5)), y: 170 - (maxSubs * 0.5) * scale },
                      { label: String(maxSubs), y: 170 - maxSubs * scale }
                    ];

                    const points = trend.map((pt, idx) => {
                      const x = 45 + idx * trendSpacing;
                      const y = 170 - pt.subscribers * scale;
                      return `${x},${y}`;
                    });
                    const areaD = `M 45,170 L ${points.map(p => p.replace(',', ' ')).join(' L ')} L 480,170 Z`;
                    const lineD = `M ${points.map(p => p.replace(',', ' ')).join(' L ')}`;

                    return (
                      <svg className="w-full h-full" viewBox="0 0 500 200">
                        <defs>
                          <linearGradient id="subChartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F94C66" stopOpacity="0.25"/>
                            <stop offset="100%" stopColor="#F94C66" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                        {gridLines.map((line, idx) => (
                          <g key={idx}>
                            <line x1="45" y1={line.y} x2="480" y2={line.y} stroke="#F1EAEC" strokeWidth="1" strokeDasharray="4 4" />
                            <text x="30" y={line.y + 4} fontSize="9.5" fontWeight="bold" fill="#6B5E62" textAnchor="end">{line.label}</text>
                          </g>
                        ))}
                        <path d={areaD} fill="url(#subChartGrad)" />
                        <path d={lineD} fill="none" stroke="#F94C66" strokeWidth="3.5" strokeLinecap="round" />
                        {trend.map((pt, idx) => {
                          const x = 45 + idx * trendSpacing;
                          const y = 170 - pt.subscribers * scale;
                          return (
                            <g key={idx} className="group cursor-pointer">
                              <circle cx={x} cy={y} r="5" fill="#F94C66" stroke="#FFF" strokeWidth="2" />
                              <text x={x} y={y - 12} fontSize="9.5" fontWeight="bold" fill="#161112" textAnchor="middle">{pt.subscribers}</text>
                              <text x={x} y="188" fontSize="10.5" fontWeight="600" fill="#6B5E62" textAnchor="middle">{pt.month}</text>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
              </div>

              {/* Subscribers Table Search & Filter */}
              <div className="bg-white rounded-[24px] border border-wedding-pink-medium/10 p-5 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search subscribers by name, email, or phone..."
                    className="w-full pl-11 pr-4 py-3 bg-[#FFF5F6]/30 border border-[#FFCAD2]/55 rounded-2xl text-wedding-charcoal-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/25 focus:bg-white text-sm font-semibold transition-all"
                  />
                </div>
                <div className="flex gap-4 items-center">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-gray-50 border border-wedding-pink-medium/20 rounded-2xl text-wedding-charcoal-dark focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 text-sm font-semibold cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active Plan</option>
                    <option value="trial">Free Trial</option>
                    <option value="cancelled">Auto-renew Cancelled</option>
                    <option value="expired">Expired</option>
                  </select>

                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-wedding-charcoal-dark hover:bg-wedding-charcoal-light text-wedding-gold-light hover:text-white text-xs font-extrabold rounded-2xl shadow transition-all duration-300"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Manual Assign
                  </button>
                </div>
              </div>

              {/* Subscriber Table */}
              <div className="bg-white rounded-[28px] border border-wedding-pink-medium/10 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Subscriber</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Active Plan</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Expiry Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Billing History</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSubscribers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-gray-400">
                            <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm font-bold text-gray-500">No subscribers found matching criteria.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredSubscribers.map((sub) => {
                          const active = sub.activeSubscription;
                          const isExpanded = expandedSubId === sub.userId;

                          const statusColors: Record<string, string> = {
                            active: 'bg-green-50 text-green-700 border-green-200',
                            trial: 'bg-amber-50 text-amber-700 border-amber-200',
                            cancelled: 'bg-purple-50 text-purple-700 border-purple-200',
                            expired: 'bg-gray-50 text-gray-500 border-gray-200'
                          };
                          const statusLabel = active ? active.status : 'expired';
                          const statusClass = statusColors[statusLabel] || 'bg-gray-50 text-gray-500 border-gray-200';

                          return (
                            <React.Fragment key={sub.userId}>
                              <tr className="hover:bg-gray-50/60 transition-colors">
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="font-bold text-wedding-charcoal-dark text-sm">{sub.displayName}</p>
                                    <p className="text-[10px] text-gray-400 font-mono">{sub.email || sub.phone}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-bold text-xs uppercase text-wedding-charcoal-light">
                                    {active ? active.planType : 'None'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 border text-[10px] font-bold rounded-lg uppercase ${statusClass}`}>
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs font-semibold text-gray-600 font-mono">
                                  {active && active.expiryDate ? new Date(active.expiryDate).toLocaleDateString('en-IN') : '—'}
                                </td>
                                <td className="px-6 py-4 text-xs">
                                  <button
                                    onClick={() => setExpandedSubId(isExpanded ? null : sub.userId)}
                                    className="flex items-center gap-1 text-wedding-pink-dark hover:underline font-bold"
                                  >
                                    {sub.history.length} plan(s) / {sub.transactions.length} invoice(s)
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {active && active.status !== 'cancelled' && active.status !== 'expired' && (
                                    <button
                                      onClick={async () => {
                                        if (!confirm('Are you sure you want to cancel this subscriber\'s auto-renewal?')) return;
                                        try {
                                          const res = await fetch(`${API_URL}/api/user-subscriptions/${sub.userId}/cancel`, {
                                            method: 'POST',
                                            headers: authHeaders
                                          });
                                          if (res.ok) {
                                            useToastStore.getState().addToast('Subscription cancelled successfully.', 'success');
                                            fetchAnalyticsData();
                                          }
                                        } catch (error) {
                                          console.error('Cancel sub error:', error);
                                        }
                                      }}
                                      className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl shadow-xs transition-all duration-200"
                                    >
                                      Cancel Renew
                                    </button>
                                  )}
                                </td>
                              </tr>

                              {/* Expandable History Drawer */}
                              {isExpanded && (
                                <tr>
                                  <td colSpan={6} className="bg-gray-50/50 p-6 border-y border-gray-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      {/* Subscription History */}
                                      <div className="space-y-3">
                                        <h5 className="text-xs font-black text-wedding-charcoal-dark uppercase tracking-wider flex items-center gap-1.5">
                                          <Layers className="w-4 h-4 text-wedding-pink-dark" />
                                          Plan History Records
                                        </h5>
                                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                                          <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                              <tr className="bg-gray-50 border-b border-gray-100 font-bold">
                                                <th className="px-4 py-2.5">Plan</th>
                                                <th className="px-4 py-2.5">Status</th>
                                                <th className="px-4 py-2.5">Start</th>
                                                <th className="px-4 py-2.5">Expiry</th>
                                                <th className="px-4 py-2.5">Paid</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 font-semibold text-gray-600">
                                              {sub.history.map(hist => (
                                                <tr key={hist.id}>
                                                  <td className="px-4 py-2.5 capitalize">{hist.planType}</td>
                                                  <td className="px-4 py-2.5">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase border ${statusColors[hist.status]}`}>
                                                      {hist.status}
                                                    </span>
                                                  </td>
                                                  <td className="px-4 py-2.5 font-mono">{new Date(hist.startDate).toLocaleDateString('en-IN')}</td>
                                                  <td className="px-4 py-2.5 font-mono">{new Date(hist.expiryDate).toLocaleDateString('en-IN')}</td>
                                                  <td className="px-4 py-2.5 font-mono">₹{hist.amountPaid}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>

                                      {/* Transaction Invoices */}
                                      <div className="space-y-3">
                                        <h5 className="text-xs font-black text-wedding-charcoal-dark uppercase tracking-wider flex items-center gap-1.5">
                                          <Coins className="w-4 h-4 text-wedding-pink-dark" />
                                          Billing Transaction Invoices
                                        </h5>
                                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                                          <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                              <tr className="bg-gray-50 border-b border-gray-100 font-bold">
                                                <th className="px-4 py-2.5">Date</th>
                                                <th className="px-4 py-2.5">Type</th>
                                                <th className="px-4 py-2.5">Amount</th>
                                                <th className="px-4 py-2.5">Details</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 font-semibold text-gray-600">
                                              {sub.transactions.map(txn => (
                                                <tr key={txn.id}>
                                                  <td className="px-4 py-2.5 font-mono">{new Date(txn.timestamp).toLocaleDateString('en-IN')}</td>
                                                  <td className="px-4 py-2.5 uppercase font-bold text-[10px]">{txn.planId}</td>
                                                  <td className="px-4 py-2.5 font-mono text-emerald-600">₹{txn.amount}</td>
                                                  <td className="px-4 py-2.5 italic text-gray-400">{txn.details || 'Subscription checkout'}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Plan Overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-wedding-charcoal-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-wedding-bg border border-wedding-pink-medium/40 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-slideUp max-h-[90vh] flex flex-col">
            <div className="p-6 bg-wedding-charcoal-dark text-white flex justify-between items-center">
              <h4 className="font-bold text-lg text-wedding-gold-light">Create New Subscription Plan</h4>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white font-bold text-sm bg-wedding-charcoal-light px-3 py-1.5 rounded-xl">✕</button>
            </div>
            
            <form onSubmit={handleCreatePlan} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Plan Title</label>
                  <input 
                    type="text" 
                    value={newPlanName}
                    onChange={(e) => {
                      setNewPlanName(e.target.value);
                      if (errors.newPlanName) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.newPlanName;
                          return copy;
                        });
                      }
                    }}
                    placeholder="e.g. Quarterly Premium"
                    className={`w-full px-4 py-3 rounded-2xl bg-white border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 ${
                      errors.newPlanName ? 'border-red-500 focus:ring-red-500/20' : 'border-wedding-pink-medium/40 focus:ring-wedding-pink-dark/20'
                    }`}
                  />
                  {errors.newPlanName && <p className="text-xs text-red-500 font-semibold mt-1">{errors.newPlanName}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Price (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={newPlanPrice}
                    onChange={(e) => {
                      setNewPlanPrice(Number(e.target.value));
                      if (errors.newPlanPrice) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.newPlanPrice;
                          return copy;
                        });
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-2xl bg-white border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 font-bold ${
                      errors.newPlanPrice ? 'border-red-500 focus:ring-red-500/20' : 'border-wedding-pink-medium/40 focus:ring-wedding-pink-dark/20'
                    }`}
                  />
                  {errors.newPlanPrice && <p className="text-xs text-red-500 font-semibold mt-1">{errors.newPlanPrice}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Duration Type</label>
                  <select 
                    value={newPlanDurationType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setNewPlanDurationType(val);
                      let days = 30;
                      if (val === '1day') days = 1;
                      else if (val === 'weekly') days = 7;
                      else if (val === 'monthly') days = 30;
                      else if (val === 'yearly') days = 365;
                      else if (val === 'custom') days = 0;
                      setNewPlanDurationDays(days);
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 font-medium"
                  >
                    <option value="1day">1 Day</option>
                    <option value="weekly">Weekly (7 Days)</option>
                    <option value="monthly">Monthly (30 Days)</option>
                    <option value="yearly">Yearly (365 Days)</option>
                    <option value="custom">Custom (Fixed Dates)</option>
                  </select>
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <div className="px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/20 text-wedding-charcoal-light text-sm font-semibold">
                    Duration: {newPlanDurationType === 'custom' ? 'Defined by dates' : `${newPlanDurationDays} days`}
                  </div>
                </div>
              </div>

              {newPlanDurationType === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Start Date</label>
                    <input 
                      type="date" 
                      value={newPlanCustomStartDate}
                      onChange={(e) => setNewPlanCustomStartDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">End Date</label>
                    <input 
                      type="date" 
                      value={newPlanCustomEndDate}
                      onChange={(e) => setNewPlanCustomEndDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Description</label>
                <textarea 
                  value={newPlanDesc}
                  onChange={(e) => setNewPlanDesc(e.target.value)}
                  placeholder="Plan summary description..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-sm focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Features (Comma-separated)</label>
                <input 
                  type="text" 
                  value={newPlanFeatures}
                  onChange={(e) => setNewPlanFeatures(e.target.value)}
                  placeholder="e.g. Unlimited PDFs, Ad-free, Custom Fonts"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-wedding-pink-medium/20 rounded-2xl">
                <div>
                  <h5 className="text-xs font-black text-wedding-charcoal-dark uppercase tracking-wider">Plan Accessibility</h5>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Toggle plan availability on active devices</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newPlanActive}
                    onChange={(e) => setNewPlanActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-pink-dark"></div>
                  <span className="ml-3 text-sm font-semibold text-wedding-charcoal-dark">
                    {newPlanActive ? 'Active' : 'Disabled'}
                  </span>
                </label>
              </div>

              <div className="space-y-4 pt-4 border-t border-wedding-pink-medium/10">
                <h5 className="text-xs font-black text-wedding-charcoal-dark uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-wedding-pink-dark" />
                  Included Template Categories
                </h5>
                <div className="flex gap-2 flex-wrap bg-gray-50/50 p-4 border border-wedding-pink-medium/15 rounded-2xl max-h-[120px] overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => toggleNewPlanCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        newPlanCats.includes(cat.id) ? 'bg-blue-50 border-blue-500 text-blue-700 font-black' : 'border-wedding-pink-medium/35 bg-white'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-wedding-pink-medium/20 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 rounded-2xl bg-gray-100 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={creating} className="px-6 py-3 rounded-2xl bg-wedding-pink-dark text-white text-sm font-bold shadow-lg">{creating ? 'Creating...' : 'Create Plan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Assign Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-wedding-charcoal-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-wedding-bg border border-wedding-pink-medium/40 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-6 bg-wedding-charcoal-dark text-white flex justify-between items-center">
              <h4 className="font-bold text-lg text-wedding-gold-light">Manual Subscription Assigner</h4>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-white font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleManualAssign} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Select Mobile User</label>
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-sm font-semibold"
                  required
                >
                  <option value="">-- Select App User --</option>
                  {allAppUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.displayName} ({u.email || u.phone})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Select Subscription Plan</label>
                <select
                  value={assignPlanId}
                  onChange={(e) => {
                    setAssignPlanId(e.target.value);
                    const selected = plans.find(p => p.id === e.target.value);
                    if (selected) {
                      setAssignAmountPaid(selected.price);
                    }
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-sm font-semibold"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Amount Paid (₹)</label>
                <input
                  type="number"
                  value={assignAmountPaid}
                  onChange={(e) => setAssignAmountPaid(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-sm font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Expiration Date</label>
                <input
                  type="date"
                  value={assignExpiryDate}
                  onChange={(e) => setAssignExpiryDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-sm font-semibold"
                  required
                />
              </div>

              <div className="pt-4 border-t border-wedding-pink-medium/20 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-5 py-3 rounded-2xl bg-gray-100 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={assigning} className="px-6 py-3 rounded-2xl bg-wedding-charcoal-dark text-wedding-gold-light text-sm font-bold shadow-lg">
                  {assigning ? 'Assigning...' : 'Assign Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
