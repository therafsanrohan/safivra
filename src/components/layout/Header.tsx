import React from 'react';
import type { ActiveTab } from '../../context/FinanceContext';
import { useFinance } from '../../context/FinanceContext';
import { calculateNetWorth, calculateWealthReadinessScore, calculateMonthlyCashflow } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { LayoutDashboard, ArrowLeftRight, Flame, GraduationCap, Settings as SettingsIcon, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const { profile, accounts, transactions, activeTab, setActiveTab } = useFinance();
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
    { tab: 'wealth', label: 'FIRE & Debt', icon: <Flame className="w-4 h-4" /> },
    { tab: 'literacy', label: 'Literacy', icon: <GraduationCap className="w-4 h-4" /> },
    { tab: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#07090e]/80 backdrop-blur-md border-b border-white/10 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand & Ticker */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <Zap className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                SAFIVRA
              </h1>
              <span className="text-[10px] font-semibold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                OS 2.0
              </span>
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
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-white/10 p-1 rounded-xl">
          {desktopTabs.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

        {/* Readiness Badge & Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 border border-white/10 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="text-xs">
              <span className="text-slate-400">Score: </span>
              <span className="font-bold text-emerald-400">{totalScore}/100</span>
              <span className="text-slate-500 text-[10px] ml-1.5 font-medium">({tier})</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 border border-white/10 p-1.5 rounded-full pr-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-xs text-white">
              {profile.fullName.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-medium text-slate-200 leading-tight">{profile.fullName}</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> {profile.literacyScore} XP
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
