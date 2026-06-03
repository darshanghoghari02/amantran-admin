'use client';

import { API_URL } from '@/config';
import React, { useState, useEffect } from 'react';
import { Sparkles, Save, Check, RefreshCw, AlertCircle, HelpCircle, Layers, FileText } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { Category, Template, SubscriptionPlan } from '../types';

export default function Subscriptions() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);
  
  // Local form states
  const [monthlyName, setMonthlyName] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState(99);
  const [monthlyDesc, setMonthlyDesc] = useState('');
  const [monthlyActive, setMonthlyActive] = useState(true);
  const [monthlyCats, setMonthlyCats] = useState<string[]>([]);
  const [monthlyTpls, setMonthlyTpls] = useState<string[]>([]);

  const [yearlyName, setYearlyName] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState(499);
  const [yearlyDesc, setYearlyDesc] = useState('');
  const [yearlyActive, setYearlyActive] = useState(true);
  const [yearlyCats, setYearlyCats] = useState<string[]>([]);
  const [yearlyTpls, setYearlyTpls] = useState<string[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const [resPlans, resCats, resTpls] = await Promise.all([
        fetch(`${API_URL}/api/subscriptions`),
        fetch(`${API_URL}/api/categories`),
        fetch(`${API_URL}/api/templates`)
      ]);

      const plansData = await resPlans.json();
      const catsData = await resCats.json();
      const tplsData = await resTpls.json();

      setPlans(Array.isArray(plansData) ? plansData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
      setTemplates(Array.isArray(tplsData) ? tplsData : []);

      // Initialize form states
      const mPlan = plansData.find((p: any) => p.id === 'monthly');
      if (mPlan) {
        setMonthlyName(mPlan.name || 'Monthly Premium');
        setMonthlyPrice(mPlan.price || 99);
        setMonthlyDesc(mPlan.description || '');
        setMonthlyActive(mPlan.isActive !== false);
        setMonthlyCats(mPlan.includedCategories || []);
        setMonthlyTpls(mPlan.includedTemplateIds || []);
      }

      const yPlan = plansData.find((p: any) => p.id === 'yearly');
      if (yPlan) {
        setYearlyName(yPlan.name || 'Yearly Premium');
        setYearlyPrice(yPlan.price || 499);
        setYearlyDesc(yPlan.description || '');
        setYearlyActive(yPlan.isActive !== false);
        setYearlyCats(yPlan.includedCategories || []);
        setYearlyTpls(yPlan.includedTemplateIds || []);
      }
    } catch (error) {
      console.error('Failed to load subscription settings:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSavePlan = async (planId: 'monthly' | 'yearly') => {
    setSavingPlanId(planId);
    
    const payload = planId === 'monthly' ? {
      name: monthlyName,
      price: monthlyPrice,
      description: monthlyDesc,
      isActive: monthlyActive,
      includedCategories: monthlyCats,
      includedTemplateIds: monthlyTpls
    } : {
      name: yearlyName,
      price: yearlyPrice,
      description: yearlyDesc,
      isActive: yearlyActive,
      includedCategories: yearlyCats,
      includedTemplateIds: yearlyTpls
    };

    try {
      const res = await fetch(`${API_URL}/api/subscriptions/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveSuccessId(planId);
        setTimeout(() => setSaveSuccessId(null), 3000);
        useToastStore.getState().addToast(
          `${planId === 'monthly' ? 'Monthly' : 'Yearly'} subscription properties saved successfully!`,
          'success'
        );
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

  const toggleCategoryInclusion = (planId: 'monthly' | 'yearly', catId: string) => {
    if (planId === 'monthly') {
      setMonthlyCats(prev => 
        prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
      );
    } else {
      setYearlyCats(prev => 
        prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
      );
    }
  };

  const toggleTemplateInclusion = (planId: 'monthly' | 'yearly', tplId: string) => {
    if (planId === 'monthly') {
      setMonthlyTpls(prev => 
        prev.includes(tplId) ? prev.filter(t => t !== tplId) : [...prev, tplId]
      );
    } else {
      setYearlyTpls(prev => 
        prev.includes(tplId) ? prev.filter(t => t !== tplId) : [...prev, tplId]
      );
    }
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
            Configure monthly & yearly premium membership details. Define paywall gates by setting category-wide overrides or selecting specific individual templates included under each subscription package.
          </p>
        </div>
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
        {/* ==================== MONTHLY PREMIUM CARD ==================== */}
        <div className="bg-white border border-wedding-pink-medium/40 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col justify-between">
          <div className="p-6 sm:p-8 space-y-6">
            {/* Plan Header */}
            <div className="flex justify-between items-center pb-4 border-b border-wedding-pink-medium/20">
              <div>
                <h4 className="text-lg font-black text-wedding-charcoal-dark tracking-tight">Monthly Premium Plan</h4>
                <p className="text-xs text-gray-400 font-mono mt-0.5">plan_id: monthly</p>
              </div>
              <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black rounded-lg uppercase tracking-wider">
                Monthly Pass
              </span>
            </div>

            {/* Config Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Plan Title</label>
                  <input
                    type="text"
                    value={monthlyName}
                    onChange={(e) => setMonthlyName(e.target.value)}
                    placeholder="e.g. Monthly Premium"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/30 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 focus:bg-white font-medium transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Price (₹ / month)</label>
                  <input
                    type="number"
                    min="0"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/30 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 focus:bg-white font-bold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Description</label>
                <textarea
                  value={monthlyDesc}
                  onChange={(e) => setMonthlyDesc(e.target.value)}
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
                    checked={monthlyActive}
                    onChange={(e) => setMonthlyActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-pink-dark"></div>
                  <span className="ml-3 text-xs font-bold text-wedding-charcoal-dark">
                    {monthlyActive ? 'Active' : 'Disabled'}
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
                    const isChecked = monthlyCats.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategoryInclusion('monthly', cat.id)}
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
                    const isChecked = monthlyTpls.includes(tpl.id);
                    return (
                      <button
                        type="button"
                        key={tpl.id}
                        onClick={() => toggleTemplateInclusion('monthly', tpl.id)}
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
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              Assigns paywall inclusions instantly
            </div>
            <button
              onClick={() => handleSavePlan('monthly')}
              disabled={savingPlanId === 'monthly'}
              className="flex items-center gap-2 px-5 py-3 bg-wedding-charcoal-dark hover:bg-wedding-charcoal-light text-wedding-gold-light hover:text-white text-xs font-extrabold rounded-2xl shadow transition-all duration-300 disabled:opacity-50"
            >
              {savingPlanId === 'monthly' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saveSuccessId === 'monthly' ? (
                <>
                  <Check className="w-4 h-4 text-green-400 stroke-[3]" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-wedding-pink-medium" />
                  Save Monthly settings
                </>
              )}
            </button>
          </div>
        </div>

        {/* ==================== YEARLY PREMIUM CARD ==================== */}
        <div className="bg-white border border-wedding-pink-medium/40 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col justify-between">
          <div className="p-6 sm:p-8 space-y-6">
            {/* Plan Header */}
            <div className="flex justify-between items-center pb-4 border-b border-wedding-pink-medium/20">
              <div>
                <h4 className="text-lg font-black text-wedding-charcoal-dark tracking-tight">Yearly Premium Plan</h4>
                <p className="text-xs text-gray-400 font-mono mt-0.5">plan_id: yearly</p>
              </div>
              <span className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-black rounded-lg uppercase tracking-wider">
                Yearly Pass
              </span>
            </div>

            {/* Config Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Plan Title</label>
                  <input
                    type="text"
                    value={yearlyName}
                    onChange={(e) => setYearlyName(e.target.value)}
                    placeholder="e.g. Yearly Premium"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/30 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 focus:bg-white font-medium transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Price (₹ / year)</label>
                  <input
                    type="number"
                    min="0"
                    value={yearlyPrice}
                    onChange={(e) => setYearlyPrice(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-wedding-pink-medium/30 text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 focus:bg-white font-bold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Description</label>
                <textarea
                  value={yearlyDesc}
                  onChange={(e) => setYearlyDesc(e.target.value)}
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
                    checked={yearlyActive}
                    onChange={(e) => setYearlyActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-pink-dark"></div>
                  <span className="ml-3 text-xs font-bold text-wedding-charcoal-dark">
                    {yearlyActive ? 'Active' : 'Disabled'}
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
                    const isChecked = yearlyCats.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategoryInclusion('yearly', cat.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${isChecked
                          ? 'bg-purple-50 border-purple-500 text-purple-700 font-black shadow-xs'
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
                    const isChecked = yearlyTpls.includes(tpl.id);
                    return (
                      <button
                        type="button"
                        key={tpl.id}
                        onClick={() => toggleTemplateInclusion('yearly', tpl.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${isChecked
                          ? 'bg-purple-50 border-purple-500 text-purple-700 font-black shadow-xs'
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
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              Assigns paywall inclusions instantly
            </div>
            <button
              onClick={() => handleSavePlan('yearly')}
              disabled={savingPlanId === 'yearly'}
              className="flex items-center gap-2 px-5 py-3 bg-wedding-charcoal-dark hover:bg-wedding-charcoal-light text-wedding-gold-light hover:text-white text-xs font-extrabold rounded-2xl shadow transition-all duration-300 disabled:opacity-50"
            >
              {savingPlanId === 'yearly' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saveSuccessId === 'yearly' ? (
                <>
                  <Check className="w-4 h-4 text-green-400 stroke-[3]" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-wedding-pink-medium" />
                  Save Yearly settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
