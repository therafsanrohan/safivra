import type { ActiveTab } from '../../context/FinanceContext';
import { useFinance } from '../../context/FinanceContext';
import { LayoutDashboard, ArrowLeftRight, BookOpen, HandCoins, Flame, GraduationCap, Settings, Plus } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsQuickAddOpen } = useFinance();

  const navItems: { tab: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { tab: 'transactions', label: 'Activity', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { tab: 'ledger', label: 'Ledger', icon: <BookOpen className="w-4 h-4" /> },
    { tab: 'receivables', label: 'Loans', icon: <HandCoins className="w-4 h-4" /> },
    { tab: 'wealth', label: 'FIRE', icon: <Flame className="w-4 h-4" /> },
    { tab: 'literacy', label: 'Literacy', icon: <GraduationCap className="w-4 h-4" /> },
    { tab: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#07090e]/95 backdrop-blur-xl border-t border-white/10 px-2 py-2">
      <div className="max-w-lg mx-auto flex items-center justify-between relative">
        {navItems.slice(0, 3).map((item) => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="text-[9px]">{item.label}</span>
            </button>
          );
        })}

        {/* Floating Action Button (FAB) */}
        <div className="relative -top-5 flex-shrink-0">
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all border-4 border-[#07090e]"
            aria-label="Add transaction"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {navItems.slice(3).map((item) => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="text-[9px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
