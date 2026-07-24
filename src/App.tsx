import React from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { QuickActionModal } from './components/layout/QuickActionModal';
import { NetWorthCard } from './components/dashboard/NetWorthCard';
import { HealthScoreBadge } from './components/dashboard/HealthScoreBadge';
import { BudgetOverview } from './components/dashboard/BudgetOverview';
import { CashflowChart } from './components/dashboard/CashflowChart';
import { QuickStats } from './components/dashboard/QuickStats';
import { TransactionList } from './components/transactions/TransactionList';
import { FIRECalculator } from './components/wealth/FIRECalculator';
import { DebtPayoffSimulator } from './components/wealth/DebtPayoffSimulator';
import { LiteracyHub } from './components/literacy/LiteracyHub';
import { SettingsView } from './components/settings/SettingsView';

const MainContent: React.FC = () => {
  const { activeTab } = useFinance();

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 pb-28 space-y-6">
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Net Worth Core Banner */}
          <NetWorthCard />

          {/* Quick Metrics Grid */}
          <QuickStats />

          {/* Health Score & Budget Allocation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HealthScoreBadge />
            <BudgetOverview />
          </div>

          {/* Monthly Cashflow Visual Chart */}
          <CashflowChart />
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="animate-fade-in">
          <TransactionList />
        </div>
      )}

      {activeTab === 'wealth' && (
        <div className="space-y-6 animate-fade-in">
          <FIRECalculator />
          <DebtPayoffSimulator />
        </div>
      )}

      {activeTab === 'literacy' && (
        <div className="animate-fade-in">
          <LiteracyHub />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="animate-fade-in">
          <SettingsView />
        </div>
      )}
    </main>
  );
};

export function App() {
  return (
    <FinanceProvider>
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
        <Header />
        <MainContent />
        <QuickActionModal />
        <BottomNav />
      </div>
    </FinanceProvider>
  );
}

export default App;
