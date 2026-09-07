import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton, ErrorState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Clock,
  HandCoins,
  HandHeart,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/currency/formatter';
import { useLanguage } from '@/context/LanguageContext';
import type { Database } from '@/types/database';

type ZakatCalc = Database['public']['Tables']['zakat_calculations']['Row'];

function StatusBadge({ status, t }: { status: string; t: any }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: {
      label: t.zakat.statusDraft,
      cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    },
    confirmed_snapshot: {
      label: t.zakat.statusConfirmed,
      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    },
    paid: {
      label: t.zakat.statusPaid,
      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    },
  };

  const { label, cls } =
    map[status] ?? { label: status, cls: 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]' };

  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

export function ZakatHistoryPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculations, setCalculations] = useState<ZakatCalc[]>([]);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('zakat_calculations')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setCalculations((data as unknown as ZakatCalc[]) ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-6 pb-12 p-4 md:p-8 bg-[var(--color-bg-page)] min-h-svh max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/zakat')}
          className="rounded-full bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 backdrop-blur-sm border shadow-sm w-10 h-10 p-0 flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <HandHeart className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {t.zakat.historyTitle}
          </h1>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
      )}

      {/* Error */}
      {!loading && error && <ErrorState message={error} onRetry={fetchHistory} />}

      {/* Empty state */}
      {!loading && !error && calculations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
            <HandCoins className="w-8 h-8" />
          </div>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            {t.zakat.historyEmpty}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-xs">
            {t.zakat.historyEmptyDesc}
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard/zakat/calculator')}
            className="mt-4 gap-2 rounded-2xl px-6 h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-0 shadow-lg shadow-emerald-500/20"
          >
            <Calculator className="w-4 h-4" />
            {t.zakat.startCalculation}
          </Button>
        </div>
      )}

      {/* Calculation list */}
      {!loading && !error && calculations.length > 0 && (
        <div className="space-y-4">
          {calculations.map((calc) => (
            <div
              key={calc.id}
              className="bg-white dark:bg-[var(--color-bg-elevated)] rounded-3xl border border-[var(--color-border)] shadow-sm p-6 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Left: icon + meta */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      calc.is_eligible
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {calc.is_eligible ? (
                      <HandCoins className="w-6 h-6" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          calc.is_eligible
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {calc.is_eligible ? t.zakat.eligible : t.zakat.notEligible}
                      </span>
                      <StatusBadge status={calc.status} t={t} />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(calc.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                      {calc.zakat_anniversary_date && (
                        <>
                          <span className="opacity-50">·</span>
                          <span>Hawl: {new Date(calc.zakat_anniversary_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: amounts */}
                <div className="flex flex-row sm:flex-col items-end gap-3 sm:gap-1 text-right shrink-0">
                  {calc.is_eligible && (
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)] font-medium uppercase tracking-wider">
                        {t.zakat.estimatedZakatDue}
                      </p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(Number(calc.estimated_zakat_amount))}
                      </p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {t.zakat.netZakatableWealth}
                    </p>
                    <p className="text-base font-semibold text-[var(--color-text-primary)]">
                      {formatCurrency(Number(calc.net_zakatable_wealth))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
