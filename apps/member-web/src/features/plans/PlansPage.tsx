import React from 'react';
import { Link } from 'react-router-dom';
import { Target, RefreshCw, Trophy, ChevronRight, Coins, Wallet, Calendar as CalendarIcon, Lightbulb } from 'lucide-react';
import { Card, Skeleton } from '@/components/ui/Card';
import { useLanguage } from '@/context/LanguageContext';
import { useFeatureTranslation } from '@/hooks/useFeatureTranslation';
import { useAuthContext } from '@/context/AuthContext';
import { isFeatureEnabled } from '@/lib/flags';

export const PlansPage: React.FC = () => {
  const { translate: t } = useLanguage();
  const { loaded } = useFeatureTranslation('plans');
  const { user } = useAuthContext();
  const guidanceEnabled = isFeatureEnabled('guidance_planner_enabled', user?.id);

  if (!loaded) {
    return (
      <div className="page-container pt-5 space-y-4">
        <Skeleton height={24} width={100} />
        <Skeleton height={140} />
      </div>
    );
  }

  return (
    <div className="page-container pt-5 space-y-5 fade-in">
      <header>
        <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
          {t('Financial Plans')}
        </h1>
        <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
          {t('Manage your financial goals and commitments')}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/dashboard/plans/available-to-spend" className="block">
          <Card className="hover:border-[var(--color-border-strong)] transition-colors h-full flex flex-col justify-between border-[var(--color-accent)] bg-[var(--color-accent-soft)]">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-accent)] flex items-center justify-center text-white">
                <Wallet size={20} />
              </div>
              <div>
                <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)]">
                  {t('Available to Spend')}
                </h2>
                <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                  {t('Real-time uncommitted spending capacity after bills and protected reserves.')}
                </p>
              </div>
            </div>
            <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
              {t('View Available to Spend')} <ChevronRight size={16} />
            </div>
          </Card>
        </Link>

        <Link to="/dashboard/plans/calendar" className="block">
          <Card className="hover:border-[var(--color-border-strong)] transition-colors h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-info-soft)] flex items-center justify-center text-[var(--color-info)]">
                <CalendarIcon size={20} />
              </div>
              <div>
                <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                  {t('Money Calendar')}
                </h2>
                <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                  {t('Visual calendar of upcoming inflows, bills, loan payments, and commitments.')}
                </p>
              </div>
            </div>
            <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
              {t('Open Money Calendar')} <ChevronRight size={16} />
            </div>
          </Card>
        </Link>

        <Link to="/dashboard/plans/budgets" className="block">
          <Card className="hover:border-[var(--color-border-strong)] transition-colors h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-accent-soft)] flex items-center justify-center">
                <Target size={20} className="text-[var(--color-accent)]" />
              </div>
              <div>
                <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                  {t('Budgets')}
                </h2>
                <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                  {t('Set category expense limits and track progress against spending.')}
                </p>
              </div>
            </div>
            <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
              {t('Manage Budgets')} <ChevronRight size={16} />
            </div>
          </Card>
        </Link>

        <Link to="/dashboard/plans/savings" className="block">
          <Card className="hover:border-[var(--color-border-strong)] transition-colors h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-warning-soft)] flex items-center justify-center">
                <Coins size={20} className="text-[var(--color-warning)]" />
              </div>
              <div>
                <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                  {t('Savings, DPS & FDR')}
                </h2>
                <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                  {t('Deposit pension schemes, bank FDRs, and National Sanchaypatra.')}
                </p>
              </div>
            </div>
            <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
              {t('Manage Savings')} <ChevronRight size={16} />
            </div>
          </Card>
        </Link>

        <Link to="/dashboard/plans/recurring" className="block">
          <Card className="hover:border-[var(--color-border-strong)] transition-colors h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-info-soft)] flex items-center justify-center">
                <RefreshCw size={20} className="text-[var(--color-info)]" />
              </div>
              <div>
                <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                  {t('Recurring')}
                </h2>
                <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                  {t('Track subscriptions and recurring bills.')}
                </p>
              </div>
            </div>
            <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
              {t('Manage Recurring')} <ChevronRight size={16} />
            </div>
          </Card>
        </Link>

        <Link to="/dashboard/plans/goals" className="block">
          <Card className="hover:border-[var(--color-border-strong)] transition-colors h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-positive-soft)] flex items-center justify-center">
                <Trophy size={20} className="text-[var(--color-positive)]" />
              </div>
              <div>
                <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                  {t('Goals')}
                </h2>
                <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                  {t('Set financial goals and track your progress.')}
                </p>
              </div>
            </div>
            <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
              {t('Manage Goals')} <ChevronRight size={16} />
            </div>
          </Card>
        </Link>

        {guidanceEnabled && (
          <Link to="/dashboard/plans/guidance" className="block">
            <Card className="hover:border-[var(--color-border-strong)] transition-colors h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] flex items-center justify-center">
                  <Lightbulb size={20} className="text-[var(--color-accent)]" />
                </div>
                <div>
                  <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                    Financial Guidance
                  </h2>
                  <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                    Explore what-if scenarios and personalised spending options.
                  </p>
                </div>
              </div>
              <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
                Open Guidance <ChevronRight size={16} />
              </div>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
};
