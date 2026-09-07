import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Spinner, ErrorState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Info,
  Wallet,
  Coins,
  TrendingUp,
  CreditCard,
  Save,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/currency/formatter';
import { calculateZakatLocally, saveZakatCalculationApi } from '@/lib/api/zakatClient';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/ui/Toast';
import type { Database } from '@/types/database';

type RateSnapshot = Database['public']['Tables']['zakat_rate_snapshots']['Row'];
type RuleSet = Database['public']['Tables']['zakat_rule_sets']['Row'];

export function ZakatCalculatorPage() {
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeRate, setActiveRate] = useState<RateSnapshot | null>(null);
  const [activeRules, setActiveRules] = useState<RuleSet | null>(null);

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 6;

  // ─── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    anniversaryDate: new Date().toISOString().split('T')[0],
    cashInHand: 0,
    bankBalance: 0,
    goldValue: 0,
    silverValue: 0,
    investments: 0,
    businessInventory: 0,
    personalDebts: 0,
    businessDebts: 0,
  });

  // ─── Calculation results (computed locally, no API) ────────────────────────
  const [calculationResult, setCalculationResult] = useState<ReturnType<
    typeof calculateZakatLocally
  > | null>(null);

  // ─── Fetch Supabase config data ────────────────────────────────────────────
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [{ data: rateData, error: rateError }, { data: rulesData, error: rulesError }] =
        await Promise.all([
          supabase
            .from('zakat_rate_snapshots')
            .select('*')
            .order('fetch_timestamp', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('zakat_rule_sets')
            .select('*')
            .order('version', { ascending: false })
            .limit(1)
            .single(),
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
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // ─── Derived totals ────────────────────────────────────────────────────────
  const getTotalAssets = () =>
    formData.cashInHand +
    formData.bankBalance +
    formData.goldValue +
    formData.silverValue +
    formData.investments +
    formData.businessInventory;

  const getTotalDeductions = () => formData.personalDebts + formData.businessDebts;

  const getNetWealth = () => Math.max(0, getTotalAssets() - getTotalDeductions());

  // ─── Run local calculation when entering the Review step ──────────────────
  useEffect(() => {
    if (step === TOTAL_STEPS && activeRate) {
      const result = calculateZakatLocally(
        getNetWealth(),
        activeRate.gold_rate_per_gram,
        activeRate.silver_rate_per_gram,
        activeRules?.nisab_standard ?? 'gold',
        activeRules?.zakat_percentage ?? 2.5
      );
      setCalculationResult(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, activeRate, activeRules]);

  // ─── Save snapshot to Supabase ────────────────────────────────────────────
  const handleSave = async () => {
    if (!activeRules || !activeRate || !calculationResult) return;
    setSaving(true);

    const res = await saveZakatCalculationApi({
      rule_set_id: activeRules.id,
      rate_snapshot_id: activeRate.id,
      status: 'confirmed_snapshot',
      zakat_anniversary_date: formData.anniversaryDate,
      total_assets: getTotalAssets(),
      total_deductions: getTotalDeductions(),
      net_zakatable_wealth: getNetWealth(),
      is_eligible: calculationResult.isEligible,
      estimated_zakat_amount: calculationResult.liability,
      currency: 'BDT',
      items: [
        {
          item_type: 'cash',
          amount: formData.cashInHand + formData.bankBalance,
          description: 'Cash & Bank',
        },
        { item_type: 'gold', amount: formData.goldValue, description: 'Gold Value' },
        { item_type: 'silver', amount: formData.silverValue, description: 'Silver Value' },
        {
          item_type: 'investment',
          amount: formData.investments + formData.businessInventory,
          description: 'Investments & Business',
        },
        {
          item_type: 'liability',
          amount: formData.personalDebts + formData.businessDebts,
          description: 'Debts & Liabilities',
        },
      ].filter((item) => item.amount > 0),
    });

    setSaving(false);

    if (res.data) {
      success(t.zakat.saveSnapshot, t.zakat.saveSuccess);
      navigate('/dashboard/zakat');
    } else {
      showError(t.zakat.saveSnapshot, res.error?.message || t.zakat.saveError);
    }
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // ─── Loading / Error states ────────────────────────────────────────────────
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
        <ErrorState
          message={error}
          onRetry={() => {
            setError(null);
            fetchInitialData();
          }}
        />
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 bg-[var(--color-bg-page)] min-h-svh max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/zakat')}
          className="rounded-full bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 backdrop-blur-sm border shadow-sm w-10 h-10 p-0 flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {t.zakat.calculatorTitle}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t.zakat.stepOf
              .replace('{{current}}', String(step))
              .replace('{{total}}', String(TOTAL_STEPS))}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
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

      {/* Main Content Card */}
      <Card className="min-h-[500px] flex flex-col border border-[var(--color-border)] shadow-xl shadow-black/5 bg-[var(--color-bg-surface)] overflow-hidden rounded-3xl">
        <div className="flex-1 p-6 md:p-8">

          {/* ── Step 1: Hawl Date ── */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-2">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                  {t.zakat.step1Title}
                </h2>
              </div>
              <p className="text-[var(--color-text-secondary)] text-base">{t.zakat.step1Desc}</p>
              <div className="pt-6 max-w-md">
                <label className="block text-sm font-medium mb-2">{t.zakat.hawlDateLabel}</label>
                <input
                  type="date"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-white dark:bg-black/20 px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm transition-all"
                  value={formData.anniversaryDate}
                  onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                />
                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex gap-3 text-sm text-emerald-800 dark:text-emerald-300">
                  <Info className="w-5 h-5 shrink-0" />
                  <p>{t.zakat.hawlInfo}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Cash & Bank ── */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-2">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl">
                  <Wallet className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                  {t.zakat.step2Title}
                </h2>
              </div>
              <p className="text-[var(--color-text-secondary)] text-base">{t.zakat.step2Desc}</p>
              <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-black/20 p-5 rounded-3xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all">
                  <CurrencyInput
                    label={t.zakat.cashInHand}
                    value={formData.cashInHand}
                    onChange={(val) => setFormData({ ...formData, cashInHand: val })}
                    size="lg"
                  />
                </div>
                <div className="bg-white dark:bg-black/20 p-5 rounded-3xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all">
                  <CurrencyInput
                    label={t.zakat.bankBalance}
                    value={formData.bankBalance}
                    onChange={(val) => setFormData({ ...formData, bankBalance: val })}
                    size="lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Gold & Silver ── */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 text-yellow-500 mb-2">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl">
                  <Coins className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                  {t.zakat.step3Title}
                </h2>
              </div>
              <p className="text-[var(--color-text-secondary)] text-base">{t.zakat.step3Desc}</p>
              <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--color-bg-subtle)] p-5 rounded-3xl border border-[var(--color-border)] shadow-sm relative overflow-hidden">
                  <CurrencyInput
                    label={t.zakat.goldValue}
                    value={formData.goldValue}
                    onChange={(val) => setFormData({ ...formData, goldValue: val })}
                    size="lg"
                  />
                </div>
                <div className="bg-[var(--color-bg-subtle)] p-5 rounded-3xl border border-[var(--color-border)] shadow-sm relative overflow-hidden">
                  <CurrencyInput
                    label={t.zakat.silverValue}
                    value={formData.silverValue}
                    onChange={(val) => setFormData({ ...formData, silverValue: val })}
                    size="lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Investments & Business ── */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                  {t.zakat.step4Title}
                </h2>
              </div>
              <p className="text-[var(--color-text-secondary)] text-base">{t.zakat.step4Desc}</p>
              <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-black/20 p-5 rounded-3xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all">
                  <CurrencyInput
                    label={t.zakat.stocksInvestments}
                    value={formData.investments}
                    onChange={(val) => setFormData({ ...formData, investments: val })}
                    size="lg"
                  />
                </div>
                <div className="bg-white dark:bg-black/20 p-5 rounded-3xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all">
                  <CurrencyInput
                    label={t.zakat.businessInventory}
                    value={formData.businessInventory}
                    onChange={(val) => setFormData({ ...formData, businessInventory: val })}
                    size="lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Liabilities & Debts ── */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-2">
                <div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-2xl">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                  {t.zakat.step5Title}
                </h2>
              </div>
              <p className="text-[var(--color-text-secondary)] text-base">{t.zakat.step5Desc}</p>
              <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--color-bg-subtle)] p-5 rounded-3xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all">
                  <CurrencyInput
                    label={t.zakat.personalDebts}
                    value={formData.personalDebts}
                    onChange={(val) => setFormData({ ...formData, personalDebts: val })}
                    size="lg"
                  />
                </div>
                <div className="bg-[var(--color-bg-subtle)] p-5 rounded-3xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all">
                  <CurrencyInput
                    label={t.zakat.businessDebts}
                    value={formData.businessDebts}
                    onChange={(val) => setFormData({ ...formData, businessDebts: val })}
                    size="lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 6: Review & Save ── */}
          {step === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-2">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl">
                  <Save className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                  {t.zakat.step6Title}
                </h2>
              </div>

              {!calculationResult ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Spinner size={32} />
                  <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
                    {t.zakat.calculating}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Summary Breakdown */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">{t.zakat.calculationSummary}</h3>
                    <div className="bg-white dark:bg-black/30 p-5 rounded-3xl border border-[var(--color-border)] shadow-sm space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[var(--color-text-secondary)]">{t.zakat.totalAssets}</span>
                        <span className="font-medium">{formatCurrency(getTotalAssets())}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[var(--color-text-secondary)]">
                          {t.zakat.totalDeductions}
                        </span>
                        <span className="font-medium text-rose-500">
                          - {formatCurrency(getTotalDeductions())}
                        </span>
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent my-3" />
                      <div className="flex justify-between items-center font-medium">
                        <span className="text-base">{t.zakat.netZakatableWealth}</span>
                        <span className="text-lg">{formatCurrency(getNetWealth())}</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-blue-800 dark:text-blue-300">
                          {t.zakat.activeNisabThreshold}
                        </span>
                        <span className="font-semibold text-blue-900 dark:text-blue-200">
                          {formatCurrency(calculationResult.thresholds.activeNisab)}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        {t.zakat.nisabNote
                          .replace('{{standard}}', activeRules?.nisab_standard ?? 'gold')
                          .replace(
                            '{{date}}',
                            activeRate
                              ? new Date(activeRate.fetch_timestamp).toLocaleDateString()
                              : '—'
                          )}
                      </p>
                    </div>
                  </div>

                  {/* Final Result Card */}
                  <div className="flex flex-col">
                    <div
                      className={`flex-1 flex flex-col justify-center p-8 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
                        calculationResult.isEligible
                          ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                          : 'bg-[var(--color-bg-subtle)] border-[var(--color-border)]'
                      }`}
                    >
                      {calculationResult.isEligible && (
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-300 dark:bg-emerald-400 opacity-20 blur-3xl rounded-full" />
                      )}

                      <div className="relative z-10 text-center space-y-2">
                        <h3
                          className={`text-sm font-medium uppercase tracking-wider ${
                            calculationResult.isEligible
                              ? 'text-emerald-100'
                              : 'text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {calculationResult.isEligible
                            ? t.zakat.estimatedZakatDue
                            : t.zakat.alhamdulillah}
                        </h3>

                        {calculationResult.isEligible ? (
                          <>
                            <p className="text-5xl md:text-6xl font-bold tracking-tight py-4 drop-shadow-md">
                              {formatCurrency(calculationResult.liability)}
                            </p>
                            <p className="text-sm text-emerald-100/80">{t.zakat.zakatBasis}</p>
                          </>
                        ) : (
                          <div className="py-8">
                            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
                            <p className="text-xl font-semibold">{t.zakat.alhamdulillah}</p>
                            <p className="text-sm mt-2 text-[var(--color-text-secondary)]">
                              {t.zakat.belowNisab}
                            </p>
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
        <div className="bg-[var(--color-bg-subtle)] p-6 border-t border-[var(--color-border)] flex items-center justify-between backdrop-blur-md rounded-b-3xl">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1 || saving}
            className="gap-2 rounded-xl px-6 h-12 bg-[var(--color-bg-surface)] shadow-sm border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
            {t.zakat.back}
          </Button>

          {step < TOTAL_STEPS ? (
            <Button
              variant="primary"
              onClick={nextStep}
              className="gap-2 rounded-xl px-8 h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/20 border-0 transition-all"
            >
              {t.zakat.continue}
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
              {saving ? t.zakat.saving : t.zakat.saveSnapshot}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
