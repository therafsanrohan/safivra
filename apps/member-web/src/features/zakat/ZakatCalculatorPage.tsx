import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, Spinner, ErrorState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { ArrowLeft, ChevronRight, ChevronLeft, CheckCircle2, Info, Wallet, Coins, TrendingUp, CreditCard, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/currency/formatter';
import { calculateZakatApi, saveZakatCalculationApi } from '@/lib/api/zakatClient';
import type { Database } from '@/types/database';

type RateSnapshot = Database['public']['Tables']['zakat_rate_snapshots']['Row'];
type RuleSet = Database['public']['Tables']['zakat_rule_sets']['Row'];

export function ZakatCalculatorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeRate, setActiveRate] = useState<RateSnapshot | null>(null);
  const [activeRules, setActiveRules] = useState<RuleSet | null>(null);

  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // Form State
  const [formData, setFormData] = useState({
    anniversaryDate: new Date().toISOString().split('T')[0],
    cashInHand: 0,
    bankBalance: 0,
    goldValue: 0,
    silverValue: 0,
    investments: 0,
    businessInventory: 0,
    personalDebts: 0,
    businessDebts: 0
  });

  // Calculation Results
  const [calculationResult, setCalculationResult] = useState<{
    thresholds?: any;
    liability?: number;
    isEligible?: boolean;
  } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [{ data: rateData, error: rateError }, { data: rulesData, error: rulesError }] = await Promise.all([
        supabase.from('zakat_rate_snapshots').select('*').order('fetch_timestamp', { ascending: false }).limit(1).single(),
        supabase.from('zakat_rule_sets').select('*').order('version', { ascending: false }).limit(1).single()
      ]);

      if (rateError && rateError.code !== 'PGRST116') throw rateError;
      if (rulesError && rulesError.code !== 'PGRST116') throw rulesError;

      setActiveRate(rateData as unknown as RateSnapshot | null);
      setActiveRules(rulesData as unknown as RuleSet | null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Perform calculation via API when reaching the review step
  useEffect(() => {
    if (step === 6 && activeRate) {
      calculateFinal();
    }
  }, [step]);

  const getTotalAssets = () => {
    return formData.cashInHand + formData.bankBalance + formData.goldValue + formData.silverValue + formData.investments + formData.businessInventory;
  };

  const getTotalDeductions = () => {
    return formData.personalDebts + formData.businessDebts;
  };

  const getNetWealth = () => {
    return Math.max(0, getTotalAssets() - getTotalDeductions());
  };

  const calculateFinal = async () => {
    if (!activeRate) return;
    const netWealth = getNetWealth();
    
    // Call backend API
    const res = await calculateZakatApi(
      netWealth,
      activeRate.gold_rate_per_gram,
      activeRate.silver_rate_per_gram,
      true // Assuming lunar year for now
    );
    
    if (res.data) {
      setCalculationResult(res.data);
    } else {
      setError(res.error?.message || 'Failed to calculate');
    }
  };

  const handleSave = async () => {
    if (!activeRules || !activeRate || !calculationResult) return;
    
    setSaving(true);
    
    const payload = {
      rule_set_id: activeRules.id,
      rate_snapshot_id: activeRate.id,
      status: 'confirmed_snapshot',
      zakat_anniversary_date: formData.anniversaryDate,
      total_assets: getTotalAssets(),
      total_deductions: getTotalDeductions(),
      net_zakatable_wealth: getNetWealth(),
      is_eligible: calculationResult.isEligible || false,
      estimated_zakat_amount: calculationResult.liability || 0,
      currency: 'BDT',
      items: [
        { item_type: 'cash', amount: formData.cashInHand + formData.bankBalance, description: 'Cash & Bank' },
        { item_type: 'gold', amount: formData.goldValue, description: 'Gold Value' },
        { item_type: 'silver', amount: formData.silverValue, description: 'Silver Value' },
        { item_type: 'investment', amount: formData.investments + formData.businessInventory, description: 'Investments & Business' },
        { item_type: 'liability', amount: formData.personalDebts + formData.businessDebts, description: 'Debts & Liabilities' }
      ].filter(item => item.amount > 0)
    };

    const res = await saveZakatCalculationApi(payload);
    
    setSaving(false);
    if (res.data) {
      navigate('/dashboard/zakat');
    } else {
      setError(res.error?.message || 'Failed to save snapshot');
    }
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-svh bg-[var(--color-bg-page)]">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorState message={error} onRetry={() => { setError(null); if (step === 6) calculateFinal(); else fetchInitialData(); }} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 bg-[var(--color-bg-page)] min-h-svh max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard/zakat')} className="rounded-full bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 backdrop-blur-sm border shadow-sm w-10 h-10 p-0 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {t('zakat.calculator.title', 'Zakat Calculator')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Step {step} of {totalSteps}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-500 ease-out ${
              i + 1 <= step 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm' 
                : 'bg-[var(--color-border)] opacity-50'
            }`}
          />
        ))}
      </div>

      {/* Main Content Area */}
      <Card className="min-h-[500px] flex flex-col border-0 shadow-xl shadow-black/5 bg-gradient-to-b from-white to-gray-50 dark:from-[var(--color-bg-elevated)] dark:to-[var(--color-bg-surface)] overflow-hidden rounded-3xl">
        <div className="flex-1 p-6 md:p-8">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-2">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">{t('zakat.calculator.step1.title', 'Zakat Anniversary (Hawl)')}</h2>
              </div>
              <p className="text-[var(--color-text-secondary)] text-base">
                Zakat becomes obligatory after holding wealth above the Nisab threshold for one full lunar year (Hawl). Please select your Zakat due date.
              </p>
              <div className="pt-6 max-w-md">
                <label className="block text-sm font-medium mb-2">Hawl Date</label>
                <input 
                  type="date" 
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-white dark:bg-black/20 px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm transition-all"
                  value={formData.anniversaryDate}
                  onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                />
                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex gap-3 text-sm text-emerald-800 dark:text-emerald-300">
                  <Info className="w-5 h-5 shrink-0" />
                  <p>It is recommended to calculate your Zakat using the Hijri calendar, which is approximately 354 days long.</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-2">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl">
                  <Wallet className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">{t('zakat.calculator.step2.title', 'Cash & Bank Accounts')}</h2>
              </div>
              <p className="text-[var(--color-text-secondary)] text-base">
                Include all liquid cash and money in bank accounts. Do not include money that is inaccessible.
              </p>
              
              <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-black/20 p-5 rounded-3xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all">
                  <CurrencyInput 
                    label="Cash in Hand" 
                    value={formData.cashInHand} 
                    onChange={(val) => setFormData({...formData, cashInHand: val})} 
                    size="lg"
                  />
                </div>
                <div className="bg-white dark:bg-black/20 p-5 rounded-3xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all">
                  <CurrencyInput 
                    label="Bank Balance" 
                    value={formData.bankBalance} 
                    onChange={(val) => setFormData({...formData, bankBalance: val})} 
                    size="lg"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="flex items-center gap-3 text-yellow-500 mb-2">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl">
                  <Coins className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">{t('zakat.calculator.step3.title', 'Gold & Silver')}</h2>
              </div>
              <p className="text-[var(--color-text-secondary)] text-base">
                Enter the current market value of all gold and silver you own, including jewelry not used for daily wear.
              </p>
              
              <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 p-5 rounded-3xl border border-yellow-200 dark:border-yellow-900/50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-yellow-300 opacity-20 blur-2xl rounded-full"></div>
                  <CurrencyInput 
                    label="Value of Gold" 
                    value={formData.goldValue} 
                    onChange={(val) => setFormData({...formData, goldValue: val})} 
                    size="lg"
                  />
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/50 dark:to-gray-900/50 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-slate-400 opacity-20 blur-2xl rounded-full"></div>
                  <CurrencyInput 
                    label="Value of Silver" 
                    value={formData.silverValue} 
                    onChange={(val) => setFormData({...formData, silverValue: val})} 
                    size="lg"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">{t('zakat.calculator.step4.title', 'Investments & Business')}</h2>
              </div>
              <p className="text-[var(--color-text-secondary)] text-base">
                Include the current market value of stocks held for trading, mutual funds, and business inventory.
              </p>
              
              <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-black/20 p-5 rounded-3xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all">
                  <CurrencyInput 
                    label="Stocks & Investments" 
                    value={formData.investments} 
                    onChange={(val) => setFormData({...formData, investments: val})} 
                    size="lg"
                  />
                </div>
                <div className="bg-white dark:bg-black/20 p-5 rounded-3xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all">
                  <CurrencyInput 
                    label="Business Inventory" 
                    value={formData.businessInventory} 
                    onChange={(val) => setFormData({...formData, businessInventory: val})} 
                    size="lg"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-2">
                <div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-2xl">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">{t('zakat.calculator.step5.title', 'Liabilities & Debts')}</h2>
              </div>
              <p className="text-[var(--color-text-secondary)] text-base">
                Enter any outstanding debts that you are actively paying. These will be deducted from your Zakatable assets.
              </p>
              
              <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-rose-50/50 dark:bg-rose-950/20 p-5 rounded-3xl border border-rose-100 dark:border-rose-900/50 shadow-sm hover:shadow-md transition-all">
                  <CurrencyInput 
                    label="Personal Debts" 
                    value={formData.personalDebts} 
                    onChange={(val) => setFormData({...formData, personalDebts: val})} 
                    size="lg"
                  />
                </div>
                <div className="bg-rose-50/50 dark:bg-rose-950/20 p-5 rounded-3xl border border-rose-100 dark:border-rose-900/50 shadow-sm hover:shadow-md transition-all">
                  <CurrencyInput 
                    label="Business Debts" 
                    value={formData.businessDebts} 
                    onChange={(val) => setFormData({...formData, businessDebts: val})} 
                    size="lg"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-2">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl">
                  <Save className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">{t('zakat.calculator.step6.title', 'Review & Save')}</h2>
              </div>
              
              {!calculationResult ? (
                 <div className="py-12 flex flex-col items-center justify-center">
                    <Spinner size={32} />
                    <p className="mt-4 text-sm text-[var(--color-text-secondary)]">Calculating your Zakat...</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Summary Breakdown */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Calculation Summary</h3>
                    <div className="bg-white dark:bg-black/30 p-5 rounded-3xl border border-[var(--color-border)] shadow-sm space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[var(--color-text-secondary)]">Total Assets</span>
                        <span className="font-medium">{formatCurrency(getTotalAssets())}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[var(--color-text-secondary)]">Total Deductions</span>
                        <span className="font-medium text-rose-500">- {formatCurrency(getTotalDeductions())}</span>
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent my-3" />
                      <div className="flex justify-between items-center font-medium">
                        <span className="text-base">Net Zakatable Wealth</span>
                        <span className="text-lg">{formatCurrency(getNetWealth())}</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-blue-800 dark:text-blue-300">Active Nisab Threshold</span>
                        <span className="font-semibold text-blue-900 dark:text-blue-200">{formatCurrency(calculationResult.thresholds?.activeNisab || 0)}</span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Calculated using the {activeRules?.nisab_standard} standard as of {activeRate && new Date(activeRate.fetch_timestamp).toLocaleDateString()}.
                      </p>
                    </div>
                  </div>

                  {/* Final Result Card */}
                  <div className="flex flex-col">
                    <div className={`flex-1 flex flex-col justify-center p-8 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${calculationResult.isEligible ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-700 dark:to-emerald-950 border-emerald-400 dark:border-emerald-600 text-white shadow-emerald-600/20' : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-300 dark:border-slate-700'}`}>
                      
                      {calculationResult.isEligible && (
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-300 dark:bg-emerald-400 opacity-20 blur-3xl rounded-full"></div>
                      )}

                      <div className="relative z-10 text-center space-y-2">
                        <h3 className={`text-sm font-medium uppercase tracking-wider ${calculationResult.isEligible ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {calculationResult.isEligible ? 'Estimated Zakat Due' : 'Status'}
                        </h3>
                        
                        {calculationResult.isEligible ? (
                          <>
                            <p className="text-5xl md:text-6xl font-bold tracking-tight py-4 drop-shadow-md">
                              {formatCurrency(calculationResult.liability || 0)}
                            </p>
                            <p className="text-sm text-emerald-100/80">
                              Based on 2.5% of your Net Zakatable Wealth.
                            </p>
                          </>
                        ) : (
                          <div className="py-8">
                             <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
                             <p className="text-xl font-semibold">Alhamdulillah</p>
                             <p className="text-sm mt-2 text-[var(--color-text-secondary)]">Your net wealth is below the Nisab threshold. Zakat is not obligatory for you at this time.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50/80 dark:bg-black/20 p-6 border-t border-[var(--color-border)] flex items-center justify-between backdrop-blur-md rounded-b-3xl">
          <Button variant="outline" onClick={prevStep} disabled={step === 1 || saving} className="gap-2 rounded-xl px-6 h-12 bg-white dark:bg-transparent shadow-sm border-[var(--color-border)] hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
            <ChevronLeft className="h-5 w-5" />
            {t('common.back', 'Back')}
          </Button>
          
          {step < totalSteps ? (
            <Button variant="primary" onClick={nextStep} className="gap-2 rounded-xl px-8 h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/20 border-0 transition-all">
              {t('common.continue', 'Continue')}
              <ChevronRight className="h-5 w-5" />
            </Button>
          ) : (
            <Button 
              variant="primary" 
              onClick={handleSave} 
              disabled={saving || !calculationResult}
              className="gap-2 rounded-xl px-8 h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/20 border-0 transition-all"
            >
              {saving ? <Spinner size={20} className="text-white" /> : <Save className="h-5 w-5" />}
              {saving ? 'Saving...' : t('zakat.save_snapshot', 'Save Snapshot')}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
