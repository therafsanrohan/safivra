import React from 'react';
import { Link } from 'react-router-dom';
import { Target, RefreshCw, Trophy, ChevronRight, Coins, Wallet, Calendar as CalendarIcon, Lightbulb } from 'lucide-react';
import { Card, Skeleton } from '@/components/ui/Card';
import { useLanguage } from '@/context/LanguageContext';
import { useFeatureTranslation } from '@/hooks/useFeatureTranslation';
import { useAuthContext } from '@/context/AuthContext';
import { isFeatureEnabled } from '@/lib/flags';

export const PlansPage: React.FC = () => {
  const { t } = useLanguage();
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
          {t.plans.title}
        </h1>
        <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
          {t.plans.subtitle}
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
                  {t.plans.availableToSpend}
                </h2>
                <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                  {t.plans.availableToSpendDesc}
                </p>
              </div>
            </div>
            <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
              {t.plans.manageAvailableToSpend} <ChevronRight size={16} />
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
                  {t.plans.moneyCalendar}
                </h2>
                <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                  {t.plans.moneyCalendarDesc}
                </p>
              </div>
            </div>
            <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
              {t.plans.manageMoneyCalendar} <ChevronRight size={16} />
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
                  {t.plans.budgets}
                </h2>
                <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                  {t.plans.budgetsDesc}
                </p>
              </div>
            </div>
            <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
              {t.plans.manageBudgets} <ChevronRight size={16} />
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
                  {t.plans.savingsDps}
                </h2>
                <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                  {t.plans.savingsDpsDesc}
                </p>
              </div>
            </div>
            <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
              {t.plans.manageSavings} <ChevronRight size={16} />
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
                  {t.plans.recurring}
                </h2>
                <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                  {t.plans.recurringDesc}
                </p>
              </div>
            </div>
            <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
              {t.plans.manageRecurring} <ChevronRight size={16} />
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
                  {t.plans.goals}
                </h2>
                <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                  {t.plans.goalsDesc}
                </p>
              </div>
            </div>
            <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
              {t.plans.manageGoals} <ChevronRight size={16} />
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
