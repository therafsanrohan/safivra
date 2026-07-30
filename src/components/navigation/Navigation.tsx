import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, ReceiptText, Plus, Target, MoreHorizontal,
  Wallet, Landmark, CreditCard, BarChart3, Settings,
  Bell, HandCoins, RefreshCw, BookOpen, Languages,
} from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Dialog';
import { Logo } from '@/components/ui/Logo';

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
export const BottomNav: React.FC = () => {
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const navItems = [
    { to: '/', label: t.nav.home, icon: Home, end: true },
    { to: '/activity', label: t.nav.activity, icon: ReceiptText },
    { action: () => setAddOpen(true), label: t.nav.add, icon: Plus, isAction: true },
    { to: '/plans', label: t.nav.plans, icon: Target },
    { to: '/more', label: t.nav.more, icon: MoreHorizontal },
  ];

  return (
    <>
      <nav
        aria-label="Main navigation"
        className={[
          'fixed bottom-0 left-0 right-0 z-30',
          'bg-[var(--color-bg-surface)] border-t border-[var(--color-border)]',
          'h-[var(--nav-height)] flex items-center',
          'pb-[env(safe-area-inset-bottom,0px)]',
          'lg:hidden',
        ].join(' ')}
      >
        <div className="flex w-full justify-around items-center px-2">
          {navItems.map((item) => {
            if (item.isAction) {
              return (
                <button
                  key="add"
                  onClick={item.action}
                  aria-label={item.label}
                  className={[
                    'flex flex-col items-center justify-center gap-0.5',
                    'w-[var(--touch-target)] h-[var(--touch-target)]',
                    'text-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)]',
                    'rounded-[var(--radius-button)]',
                    'hover:text-[var(--color-accent)]',
                    'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)]',
                  ].join(' ')}
                >
                  <div className="w-8 h-8 rounded-[var(--radius-button)] bg-[var(--color-accent)] flex items-center justify-center">
                    <Plus size={18} className="text-white" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
                </button>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to!}
                end={item.end}
                aria-label={item.label}
                className={({ isActive }) =>
                  [
                    'flex flex-col items-center justify-center gap-0.5',
                    'w-[var(--touch-target)] h-[var(--touch-target)] rounded-[var(--radius-button)]',
                    'transition-colors duration-[var(--duration-fast)]',
                    'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)]',
                    isActive
                      ? 'text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 1.75}
                      aria-hidden="true"
                    />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <AddTransactionSheet open={addOpen} onOpenChange={setAddOpen} navigate={navigate} />
    </>
  );
};

// ─── Quick Add Sheet ──────────────────────────────────────────────────────────
const AddTransactionSheet: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  navigate: ReturnType<typeof useNavigate>;
}> = ({ open, onOpenChange, navigate }) => {
  const { t } = useLanguage();

  const primaryActions = [
    { label: t.addTransaction.expense, icon: ReceiptText, color: 'text-[var(--color-negative)]', bg: 'bg-[var(--color-negative-soft)]', path: '/activity/add?type=expense' },
    { label: t.addTransaction.income, icon: Wallet, color: 'text-[var(--color-positive)]', bg: 'bg-[var(--color-positive-soft)]', path: '/activity/add?type=income' },
    { label: t.addTransaction.transfer, icon: HandCoins, color: 'text-[var(--color-info)]', bg: 'bg-[var(--color-info-soft)]', path: '/activity/add?type=transfer' },
    { label: t.addTransaction.loanPayment, icon: Landmark, color: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning-soft)]', path: '/activity/add?type=loan_payment' },
    { label: t.addTransaction.cardPayment, icon: CreditCard, color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent-soft)]', path: '/activity/add?type=credit_card_payment' },
    { label: t.addTransaction.adjustment, icon: BarChart3, color: 'text-[var(--color-text-secondary)]', bg: 'bg-[var(--color-bg-subtle)]', path: '/activity/add?type=balance_adjustment' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t.addTransaction.title}>
      <div className="grid grid-cols-3 gap-3">
        {primaryActions.map((action) => (
          <button
            key={action.label}
            onClick={() => {
              onOpenChange(false);
              navigate(action.path);
            }}
            className={[
              'flex flex-col items-center gap-2 p-4 rounded-[var(--radius-card)]',
              'transition-colors duration-[var(--duration-fast)]',
              'border border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
              'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)]',
            ].join(' ')}
          >
            <div className={['w-10 h-10 rounded-[var(--radius-button)] flex items-center justify-center', action.bg].join(' ')}>
              <action.icon size={20} className={action.color} aria-hidden="true" />
            </div>
            <span className="text-[var(--text-secondary)] font-medium text-[var(--color-text-primary)] text-center leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  );
};

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
export const Sidebar: React.FC = () => {
  const { profile } = useAuthContext();
  const { t, toggleLocale, locale } = useLanguage();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'User';

  const navGroups = [
    {
      items: [
        { to: '/', label: t.nav.dashboard, icon: Home, end: true },
        { to: '/activity', label: t.nav.activity, icon: ReceiptText },
      ],
    },
    {
      label: t.nav.manage,
      items: [
        { to: '/accounts', label: t.nav.accounts, icon: Wallet },
        { to: '/loans', label: t.nav.loans, icon: Landmark },
        { to: '/credit-cards', label: t.nav.creditCards, icon: CreditCard },
        { to: '/plans/recurring', label: t.nav.recurring, icon: RefreshCw },
      ],
    },
    {
      label: t.nav.plan,
      items: [
        { to: '/plans', label: t.nav.plansGoals, icon: Target },
        { to: '/reports', label: t.nav.reports, icon: BookOpen },
      ],
    },
  ];

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] bg-[var(--color-bg-surface)] border-r border-[var(--color-border)] z-20 overflow-y-auto"
      aria-label="Sidebar navigation"
    >
      {/* Wordmark + Language toggle */}
      <div className="px-5 py-5 border-b border-[var(--color-border)] flex items-center justify-between">
        <Logo textClassName="text-[1.125rem] tracking-tight" />
        <button
          onClick={toggleLocale}
          aria-label={locale === 'en' ? 'Switch to Bengali' : 'Switch to English'}
          className={[
            'flex items-center gap-1 px-2 py-0.5',
            'rounded-full border border-[var(--color-border)]',
            'text-[11px] font-semibold text-[var(--color-text-secondary)]',
            'transition-colors hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]',
          ].join(' ')}
        >
          <Languages size={11} />
          {t.common.switchLang}
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-2 mb-1 text-[var(--text-label)] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5" role="list">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={(item as { to: string; label: string; icon: React.ElementType; end?: boolean }).end}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-2.5 px-2 py-2 rounded-[var(--radius-button)]',
                        'text-[var(--text-body)] transition-colors duration-[var(--duration-fast)]',
                        'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)]',
                        isActive
                          ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]',
                      ].join(' ')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={18}
                          strokeWidth={isActive ? 2.25 : 1.75}
                          aria-hidden="true"
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[var(--color-border)] space-y-1">
        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            [
              'flex items-center gap-2.5 px-2 py-2 rounded-[var(--radius-button)]',
              'text-[var(--text-body)] transition-colors',
              isActive
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]',
            ].join(' ')
          }
        >
          <Bell size={18} strokeWidth={1.75} aria-hidden="true" />
          {t.nav.notifications}
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            [
              'flex items-center gap-2.5 px-2 py-2 rounded-[var(--radius-button)]',
              'text-[var(--text-body)] transition-colors',
              isActive
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]',
            ].join(' ')
          }
        >
          <Settings size={18} strokeWidth={1.75} aria-hidden="true" />
          {t.nav.settings}
        </NavLink>

        {/* User */}
        <div className="flex items-center gap-2.5 px-2 py-2 mt-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center shrink-0">
            <span className="text-[var(--text-label)] font-semibold text-[var(--color-accent)]">
              {firstName[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--text-secondary)] font-medium text-[var(--color-text-primary)] truncate">
              {firstName}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
