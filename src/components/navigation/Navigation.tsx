import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, ReceiptText, Plus, Target, MoreHorizontal,
  Wallet, Landmark, CreditCard, BarChart3, Settings,
  Bell, HandCoins, RefreshCw, BookOpen, X,
} from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { useAuthContext } from '@/context/AuthContext';
import { Sheet } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
export const BottomNav: React.FC = () => {
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/activity', label: 'Activity', icon: ReceiptText },
    { action: () => setAddOpen(true), label: 'Add', icon: Plus, isAction: true },
    { to: '/plans', label: 'Plans', icon: Target },
    { to: '/more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <>
      <nav
        aria-label="Main navigation"
        className={[
          'fixed bottom-0 left-0 right-0 z-30',
          'bg-[var(--color-bg-surface)] border-t border-[var(--color-border)]',
          'h-[var(--nav-height)] flex items-center',
          'pb-[env(safe-area-inset-bottom,0)]',
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
  const primaryActions = [
    { label: 'Expense', icon: ReceiptText, color: 'text-[var(--color-negative)]', bg: 'bg-[var(--color-negative-soft)]', path: '/activity/add?type=expense' },
    { label: 'Income', icon: Wallet, color: 'text-[var(--color-positive)]', bg: 'bg-[var(--color-positive-soft)]', path: '/activity/add?type=income' },
    { label: 'Transfer', icon: HandCoins, color: 'text-[var(--color-info)]', bg: 'bg-[var(--color-info-soft)]', path: '/activity/add?type=transfer' },
    { label: 'Loan Payment', icon: Landmark, color: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning-soft)]', path: '/activity/add?type=loan_payment' },
    { label: 'Card Payment', icon: CreditCard, color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent-soft)]', path: '/activity/add?type=credit_card_payment' },
    { label: 'Adjustment', icon: BarChart3, color: 'text-[var(--color-text-secondary)]', bg: 'bg-[var(--color-bg-subtle)]', path: '/activity/add?type=balance_adjustment' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Add transaction">
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
  const { profile, signOut } = useAuthContext();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'User';

  const navGroups = [
    {
      items: [
        { to: '/', label: 'Dashboard', icon: Home, end: true },
        { to: '/activity', label: 'Activity', icon: ReceiptText },
      ],
    },
    {
      label: 'Manage',
      items: [
        { to: '/accounts', label: 'Accounts', icon: Wallet },
        { to: '/loans', label: 'Loans', icon: Landmark },
        { to: '/credit-cards', label: 'Credit Cards', icon: CreditCard },
        { to: '/recurring', label: 'Recurring', icon: RefreshCw },
      ],
    },
    {
      label: 'Plan',
      items: [
        { to: '/plans', label: 'Plans & Goals', icon: Target },
        { to: '/reports', label: 'Reports', icon: BookOpen },
      ],
    },
  ];

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] bg-[var(--color-bg-surface)] border-r border-[var(--color-border)] z-20 overflow-y-auto"
      aria-label="Sidebar navigation"
    >
      {/* Wordmark */}
      <div className="px-5 py-5 border-b border-[var(--color-border)]">
        <span className="text-[1.125rem] font-semibold tracking-tight text-[var(--color-text-primary)]">
          {APP_CONFIG.name}
        </span>
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
          Notifications
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
          Settings
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
