import React from 'react';
import { Link } from 'react-router-dom';
import { Target, RefreshCw, Trophy, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const PlansPage: React.FC = () => {
  return (
    <div className="page-container pt-5 space-y-5 fade-in">
      <header>
        <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
          Financial Plans
        </h1>
        <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
          Budgets, recurring commitments, and savings goals
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/plans/budgets" className="block">
          <Card className="hover:border-[var(--color-border-strong)] transition-colors h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-accent-soft)] flex items-center justify-center">
                <Target size={20} className="text-[var(--color-accent)]" />
              </div>
              <div>
                <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                  Monthly Budgets
                </h2>
                <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                  Set category expense limits and track progress against spending.
                </p>
              </div>
            </div>
            <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
              Manage Budgets <ChevronRight size={16} />
            </div>
          </Card>
        </Link>

        <Link to="/plans/recurring" className="block">
          <Card className="hover:border-[var(--color-border-strong)] transition-colors h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-info-soft)] flex items-center justify-center">
                <RefreshCw size={20} className="text-[var(--color-info)]" />
              </div>
              <div>
                <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                  Recurring Commitments
                </h2>
                <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                  Subscriptions, utility bills, rent, and recurring income schedules.
                </p>
              </div>
            </div>
            <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
              Manage Commitments <ChevronRight size={16} />
            </div>
          </Card>
        </Link>

        <Link to="/plans/goals" className="block">
          <Card className="hover:border-[var(--color-border-strong)] transition-colors h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-positive-soft)] flex items-center justify-center">
                <Trophy size={20} className="text-[var(--color-positive)]" />
              </div>
              <div>
                <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                  Savings Goals
                </h2>
                <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
                  Emergency funds, Hajj/Umrah savings, gadget funds, and target dates.
                </p>
              </div>
            </div>
            <div className="flex items-center text-[var(--color-accent)] font-semibold text-[var(--text-secondary)] mt-4">
              Manage Goals <ChevronRight size={16} />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};
