import React from 'react';
import type { ActiveTab } from '../../context/FinanceContext';
import { useFinance } from '../../context/FinanceContext';
import { calculateNetWorth, calculateWealthReadinessScore, calculateMonthlyCashflow } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BookOpen,
  HandCoins,
  Flame,
  GraduationCap,
  Settings as SettingsIcon,
  ShieldCheck,
  Zap,
  Sparkles,
  Building2,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { profile, accounts, transactions, activeTab, setActiveTab, activeWorkspace, setIsAuthOpen } = useFinance();
  const { netWorth } = calculateNetWorth(accounts);
  const { expenses, netSavings } = calculateMonthlyCashflow(transactions);
  const savingsRate = netSavings > 0 ? (netSavings / (netSavings + expenses)) * 100 : 0;

  const { totalScore, tier } = calculateWealthReadinessScore(
    netWorth,
    expenses,
    accounts.filter((a) => a.type === 'savings' || a.type === 'checking').reduce((s, a) => s + a.balance, 0),
    accounts.filter((a) => a.isLiability).reduce((s, a) => s + a.balance, 0),
    savingsRate,
    profile.literacyScore
  );

  const desktopTabs: { tab: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { tab: 'transactions', label: 'Activity', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { tab: 'ledger', label: 'Ledger Audit', icon: <BookOpen className="w-4 h-4" /> },
    { tab: 'receivables', label: 'Loans & Dues', icon: <HandCoins className="w-4 h-4" /> },
    { tab: 'wealth', label: 'FIRE & Debt', icon: <Flame className="w-4 h-4" /> },
    { tab: 'literacy', label: 'Literacy', icon: <GraduationCap className="w-4 h-4" /> },
    { tab: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#07090e]/80 backdrop-blur-md border-b border-white/10 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand & Active Workspace */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <Zap className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                SAFIVRA
              </h1>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="text-[10px] font-semibold tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-violet-500/20"
              >
                <Building2 className="w-3 h-3" /> {activeWorkspace.name}
              </button>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              Net Worth:{' '}
              <span className="font-semibold text-slate-200">
                {formatCurrency(netWorth, profile.currency, true)}
              </span>
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 border border-white/10 p-1 rounded-xl">
          {desktopTabs.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Readiness Badge & Profile Auth Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 border border-white/10 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="text-xs">
              <span className="text-slate-400">Score: </span>
              <span className="font-bold text-emerald-400">{totalScore}/100</span>
              <span className="text-slate-500 text-[10px] ml-1.5 font-medium">({tier})</span>
            </div>
          </div>

          <button
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-white/10 p-1.5 rounded-full pr-3 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-xs text-white">
              {profile.fullName.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-medium text-slate-200 leading-tight">{profile.fullName}</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> {profile.literacyScore} XP
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
