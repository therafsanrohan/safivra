import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Landmark, CreditCard, RefreshCw, BookOpen,
  Settings, Bell, LogOut, ChevronRight, Coins, Languages,
} from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { APP_CONFIG } from '@/config/app';
import { Card } from '@/components/ui/Card';

export const MorePage: React.FC = () => {
  const { profile, signOut } = useAuthContext();
  const { t, toggleLocale, locale } = useLanguage();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'User';

  const menuSections = [
    {
      title: t.more.financialAccounts,
      items: [
        { to: '/accounts', label: t.more.accountsWallets, icon: Wallet },
        { to: '/loans', label: t.more.loansDebts, icon: Landmark },
        { to: '/credit-cards', label: t.creditCards.title, icon: CreditCard },
      ],
    },
    {
      title: t.more.planningAnalytics,
      items: [
        { to: '/plans/savings', label: t.more.savingsDps, icon: Coins },
        { to: '/plans/recurring', label: t.more.recurringCommitments, icon: RefreshCw },
        { to: '/reports', label: t.more.reportsExports, icon: BookOpen },
        { to: '/notifications', label: t.nav.notifications, icon: Bell },
      ],
    },
    {
      title: t.more.appSection,
      items: [
        { to: '/settings', label: t.nav.settings, icon: Settings },
      ],
    },
  ];

  return (
    <div className="page-container pt-5 space-y-5 fade-in">
      {/* User Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center">
          <span className="text-lg font-semibold text-[var(--color-accent)]">
            {firstName[0]?.toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
            {profile?.full_name || 'User'}
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
            {APP_CONFIG.name} Member
          </p>
        </div>
      </div>

      {/* Navigation Sections */}
      {menuSections.map((section, sIdx) => (
        <div key={sIdx} className="space-y-2">
          <p className="px-1 text-[var(--text-label)] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
            {section.title}
          </p>
          <Card padding="none">
            <div className="divide-y divide-[var(--color-border)]" role="list">
              {section.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                  role="listitem"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-[var(--color-text-secondary)]" />
                    <span className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      ))}

      {/* Language Switcher */}
      <Card padding="none">
        <button
          onClick={toggleLocale}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Languages size={18} className="text-[var(--color-text-secondary)]" />
            <span className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">
              {t.settings.language}
            </span>
          </div>
          <span className="text-[var(--text-secondary)] font-medium text-[var(--color-accent)]">
            {locale === 'en' ? 'বাংলা' : 'English'}
          </span>
        </button>
      </Card>

      {/* Sign Out Button */}
      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 p-3.5 rounded-[var(--radius-button)] bg-[var(--color-negative-soft)] text-[var(--color-negative)] font-medium hover:bg-red-100 transition-colors"
      >
        <LogOut size={18} /> {t.more.signOut}
      </button>
    </div>
  );
};
