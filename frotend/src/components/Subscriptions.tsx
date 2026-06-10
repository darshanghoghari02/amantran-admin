'use client';

import { API_URL } from '@/config';
import React, { useState, useEffect } from 'react';
import { Sparkles, Save, Check, RefreshCw, AlertCircle, HelpCircle, Layers, FileText, PlusCircle, Trash2 } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { Category, Template, SubscriptionPlan, User } from '../types';

interface SubscriptionsProps {
  currentUser?: User;
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
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);

  // Dynamic form state
  const [editStates, setEditStates] = useState<Record<string, {
    name: string;
    price: number;
    description: string;
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
  const [newPlanActive, setNewPlanActive] = useState(true);
  const [newPlanCats, setNewPlanCats] = useState<string[]>([]);
  const [newPlanTpls, setNewPlanTpls] = useState<string[]>([]);
  const [newPlanDurationType, setNewPlanDurationType] = useState<'1day' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [newPlanDurationDays, setNewPlanDurationDays] = useState(30);
  const [newPlanCustomStartDate, setNewPlanCustomStartDate] = useState('');
  const [newPlanCustomEndDate, setNewPlanCustomEndDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
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

      // Initialize edit states for each plan
      const initialEditStates: typeof editStates = {};
      loadedPlans.forEach((plan: SubscriptionPlan) => {
        initialEditStates[plan.id] = {
          name: plan.name || '',
          price: plan.price || 0,
          description: plan.description || '',
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
    const payload = editStates[planId];
    if (!payload) return;

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
    const payload = {
      name: newPlanName,
      price: newPlanPrice,
      description: newPlanDesc,
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
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-wedding-charcoal-dark to-[#2c1215] p-6 sm:p-8 rounded-3xl border border-wedding-pink-dark/20 text-white flex flex-col md:flex-row gap-6 justify-between items-start md:items-center shadow-xl">
        <div className="space-y-1 flex-1">
          <h3 className="text-lg sm:text-2xl font-black text-wedding-gold-light tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-wedding-gold-accent fill-wedding-gold-accent animate-pulse" />
            Premium Paywall Configuration
          </h3>
          <p className="text-xs text-gray-300 max-w-2xl font-medium leading-relaxed">
            Configure premium membership details. Define paywall gates by setting category-wide overrides or selecting specific individual templates included under each subscription package.
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
        {/* Stat 1: Total Premium */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Premium templates</span>
          <span className="text-2xl font-black text-amber-700 mt-1">{totalPremium}</span>
        </div>

        {/* Stat 2: Total Free */}
        <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/5 border border-gray-500/20 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-gray-800 uppercase tracking-wider block">Free templates</span>
          <span className="text-2xl font-black text-gray-700 mt-1">{totalFree}</span>
        </div>

        {/* Stat 3: Monthly Inclusions */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">In Monthly Pass</span>
          <span className="text-2xl font-black text-blue-700 mt-1">{inMonthly}</span>
        </div>

        {/* Stat 4: Yearly Inclusions */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">In Yearly Pass</span>
          <span className="text-2xl font-black text-purple-700 mt-1">{inYearly}</span>
        </div>

        {/* Stat 5: Avg Purchase Price */}
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
            isActive: plan.isActive !== false,
            includedCategories: plan.includedCategories || [],
            includedTemplateIds: plan.includedTemplateIds || [],
            durationType: plan.durationType || 'monthly',
            durationDays: plan.durationDays !== undefined ? plan.durationDays : 30,
            customStartDate: plan.customStartDate || null,
            customEndDate: plan.customEndDate || null
          };

          const isDefault = plan.id === 'monthly' || plan.id === 'yearly';
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
                      <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Price (₹ / billing cycle)</label>
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
                      placeholder="Plan features summary..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/30 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 focus:bg-white transition-all resize-none"
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

      {/* Create Plan Overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-wedding-charcoal-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-wedding-bg border border-wedding-pink-medium/40 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-slideUp max-h-[90vh] flex flex-col">
            <div className="p-6 bg-wedding-charcoal-dark text-white flex justify-between items-center">
              <h4 className="font-bold text-lg text-wedding-gold-light">
                Create New Subscription Plan
              </h4>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white font-bold text-sm bg-wedding-charcoal-light px-3 py-1.5 rounded-xl transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreatePlan} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Plan Name */}
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
                      errors.newPlanName 
                        ? 'border-red-500 focus:ring-red-500/20' 
                        : 'border-wedding-pink-medium/40 focus:ring-wedding-pink-dark/20'
                    }`}
                  />
                  {errors.newPlanName && (
                    <p className="text-xs text-red-500 font-semibold mt-1">{errors.newPlanName}</p>
                  )}
                </div>

                {/* Plan Price */}
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
                      errors.newPlanPrice 
                        ? 'border-red-500 focus:ring-red-500/20' 
                        : 'border-wedding-pink-medium/40 focus:ring-wedding-pink-dark/20'
                    }`}
                  />
                  {errors.newPlanPrice && (
                    <p className="text-xs text-red-500 font-semibold mt-1">{errors.newPlanPrice}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Duration Type */}
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
                      if (val !== 'custom') {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.newPlanCustomStartDate;
                          delete copy.newPlanCustomEndDate;
                          return copy;
                        });
                      }
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
                {/* Duration Days display */}
                <div className="space-y-1.5 flex flex-col justify-end">
                  <div className="px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/20 text-wedding-charcoal-light text-sm font-semibold">
                    Duration: {newPlanDurationType === 'custom' ? 'Defined by dates' : `${newPlanDurationDays} days`}
                  </div>
                </div>
              </div>

              {newPlanDurationType === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Start Date</label>
                    <input 
                      type="date" 
                      value={newPlanCustomStartDate}
                      onChange={(e) => {
                        setNewPlanCustomStartDate(e.target.value);
                        if (errors.newPlanCustomStartDate) {
                          setErrors(prev => {
                            const copy = { ...prev };
                            delete copy.newPlanCustomStartDate;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 rounded-2xl bg-white border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 ${
                        errors.newPlanCustomStartDate 
                          ? 'border-red-500 focus:ring-red-500/20' 
                          : 'border-wedding-pink-medium/40 focus:ring-wedding-pink-dark/20'
                      }`}
                    />
                    {errors.newPlanCustomStartDate && (
                      <p className="text-xs text-red-500 font-semibold mt-1">{errors.newPlanCustomStartDate}</p>
                    )}
                  </div>
                  {/* End Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">End Date</label>
                    <input 
                      type="date" 
                      value={newPlanCustomEndDate}
                      onChange={(e) => {
                        setNewPlanCustomEndDate(e.target.value);
                        if (errors.newPlanCustomEndDate) {
                          setErrors(prev => {
                            const copy = { ...prev };
                            delete copy.newPlanCustomEndDate;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 rounded-2xl bg-white border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 ${
                        errors.newPlanCustomEndDate 
                          ? 'border-red-500 focus:ring-red-500/20' 
                          : 'border-wedding-pink-medium/40 focus:ring-wedding-pink-dark/20'
                      }`}
                    />
                    {errors.newPlanCustomEndDate && (
                      <p className="text-xs text-red-500 font-semibold mt-1">{errors.newPlanCustomEndDate}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Description</label>
                <textarea 
                  value={newPlanDesc}
                  onChange={(e) => setNewPlanDesc(e.target.value)}
                  placeholder="Plan features summary..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 resize-none"
                />
              </div>

              {/* Accessibility */}
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

              {/* Inclusions */}
              <div className="space-y-4 pt-4 border-t border-wedding-pink-medium/10">
                <h5 className="text-xs font-black text-wedding-charcoal-dark uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-wedding-pink-dark" />
                  Included Template Categories
                </h5>
                <div className="flex gap-2 flex-wrap bg-gray-50/50 p-4 border border-wedding-pink-medium/15 rounded-2xl max-h-[120px] overflow-y-auto">
                  {categories.map((cat) => {
                    const isChecked = newPlanCats.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleNewPlanCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isChecked
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
                <div className="flex gap-2 flex-wrap bg-gray-50/50 p-4 border border-wedding-pink-medium/15 rounded-2xl max-h-[140px] overflow-y-auto">
                  {templates.filter(t => t.isPremium).map((tpl) => {
                    const isChecked = newPlanTpls.includes(tpl.id);
                    return (
                      <button
                        type="button"
                        key={tpl.id}
                        onClick={() => toggleNewPlanTemplate(tpl.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isChecked
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
                  disabled={creating}
                  className="px-6 py-3 rounded-2xl bg-wedding-pink-dark hover:bg-wedding-pink-hover text-white text-sm font-bold shadow-lg transition-all disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
