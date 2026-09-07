export const dynamic = "force-dynamic";

import { createAdminClient } from '../../utils/supabase/server';
import FeaturesClient from './FeaturesClient';

export interface FeatureStats {
  id: string;
  name: string;
  category: 'Financial Core' | 'Planning & Goals' | 'Zakat & Taxes' | 'Tools & System';
  totalUsage: number;
  uniqueUsers: number;
  lastUsedAt: string | null;
  description: string;
  iconType: string;
}

export default async function FeaturesAnalyticsPage() {
  const supabase = createAdminClient();

  // Helper for direct table counts and max timestamp
  const fetchTableStats = async (tableName: string) => {
    try {
      const { count } = await (supabase.from(tableName as any) as any)
        .select('*', { count: 'exact', head: true });

      const { data: latestData } = await (supabase.from(tableName as any) as any)
        .select('created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(100);

      const latestTime = latestData?.[0]?.created_at ?? null;
      const uniqueUsersSet = new Set((latestData ?? []).map((row: any) => row.user_id).filter(Boolean));

      return {
        total: count || 0,
        uniqueUsers: uniqueUsersSet.size,
        lastUsedAt: latestTime
      };
    } catch {
      return { total: 0, uniqueUsers: 0, lastUsedAt: null };
    }
  };

  // Fetch live stats for all feature entities from DB
  const [
    transactions,
    accounts,
    loans,
    creditCards,
    zakat,
    budgets,
    recurring,
    savings,
    notifications
  ] = await Promise.all([
    fetchTableStats('transactions'),
    fetchTableStats('accounts'),
    fetchTableStats('loans'),
    fetchTableStats('credit_cards'),
    fetchTableStats('zakat_calculations'),
    fetchTableStats('budgets'),
    fetchTableStats('recurring_transactions'),
    fetchTableStats('savings_goals'),
    fetchTableStats('notifications')
  ]);

  // Fetch logged views from user_feature_logs table
  let featureLogs: any[] = [];
  try {
    const { data } = await (supabase.from('user_feature_logs') as any)
      .select('feature_name, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(1000);
    featureLogs = data || [];
  } catch {
    featureLogs = [];
  }

  const getLogStats = (featureName: string) => {
    const matching = featureLogs.filter(row => row.feature_name === featureName);
    const unique = new Set(matching.map(row => row.user_id).filter(Boolean)).size;
    const lastTime = matching[0]?.created_at || null;
    return {
      total: matching.length,
      uniqueUsers: unique,
      lastUsedAt: lastTime
    };
  };

  const toolLogs = getLogStats('Financial Calculators & Tools');
  const reportLogs = getLogStats('Financial Reports & Exports');
  const systemHealthLogs = getLogStats('System Health Diagnostics');

  const featureList: FeatureStats[] = [
    {
      id: 'transactions',
      name: 'Transactions & Income/Expenses',
      category: 'Financial Core',
      totalUsage: transactions.total,
      uniqueUsers: transactions.uniqueUsers,
      lastUsedAt: transactions.lastUsedAt,
      description: 'Daily cashflow, income, expense entries, and transaction categorizations',
      iconType: 'transaction'
    },
    {
      id: 'accounts',
      name: 'Bank Accounts & Mobile Wallets',
      category: 'Financial Core',
      totalUsage: accounts.total,
      uniqueUsers: accounts.uniqueUsers,
      lastUsedAt: accounts.lastUsedAt,
      description: 'Bkash, Nagad, bank account balances and multi-wallet management',
      iconType: 'wallet'
    },
    {
      id: 'loans',
      name: 'Loans & Debt Management',
      category: 'Financial Core',
      totalUsage: loans.total,
      uniqueUsers: loans.uniqueUsers,
      lastUsedAt: loans.lastUsedAt,
      description: 'Borrowing, lending, interest-free loans, and repayment tracking',
      iconType: 'loan'
    },
    {
      id: 'credit_cards',
      name: 'Credit Cards Tracker',
      category: 'Financial Core',
      totalUsage: creditCards.total,
      uniqueUsers: creditCards.uniqueUsers,
      lastUsedAt: creditCards.lastUsedAt,
      description: 'Credit limits, bill statement due dates, and card balance tracking',
      iconType: 'card'
    },
    {
      id: 'zakat',
      name: 'Zakat Intelligence & Calculator',
      category: 'Zakat & Taxes',
      totalUsage: zakat.total,
      uniqueUsers: zakat.uniqueUsers,
      lastUsedAt: zakat.lastUsedAt,
      description: 'Nisab threshold calculations, gold/cash assets evaluation, and Zakat history',
      iconType: 'zakat'
    },
    {
      id: 'budgets',
      name: 'Budgets & Expense Control',
      category: 'Planning & Goals',
      totalUsage: budgets.total,
      uniqueUsers: budgets.uniqueUsers,
      lastUsedAt: budgets.lastUsedAt,
      description: 'Monthly category budget caps, threshold alerts, and spending limits',
      iconType: 'budget'
    },
    {
      id: 'savings',
      name: 'Savings Goals & DPS Tracker',
      category: 'Planning & Goals',
      totalUsage: savings.total,
      uniqueUsers: savings.uniqueUsers,
      lastUsedAt: savings.lastUsedAt,
      description: 'Target savings progress, emergency funds, and DPS installment tracking',
      iconType: 'savings'
    },
    {
      id: 'recurring',
      name: 'Recurring Subscriptions & Bills',
      category: 'Planning & Goals',
      totalUsage: recurring.total,
      uniqueUsers: recurring.uniqueUsers,
      lastUsedAt: recurring.lastUsedAt,
      description: 'Utility bills, internet, rent, and recurring automated commitments',
      iconType: 'recurring'
    },
    {
      id: 'tools',
      name: 'Financial Calculators & Tools',
      category: 'Tools & System',
      totalUsage: toolLogs.total,
      uniqueUsers: toolLogs.uniqueUsers,
      lastUsedAt: toolLogs.lastUsedAt,
      description: 'Currency converter, loan EMI calculators, and financial tools usage',
      iconType: 'tool'
    },
    {
      id: 'reports',
      name: 'Financial Reports & Exports',
      category: 'Tools & System',
      totalUsage: reportLogs.total,
      uniqueUsers: reportLogs.uniqueUsers,
      lastUsedAt: reportLogs.lastUsedAt,
      description: 'Monthly financial summary views and PDF/Excel export reports',
      iconType: 'report'
    },
    {
      id: 'notifications',
      name: 'Notifications & Announcements',
      category: 'Tools & System',
      totalUsage: notifications.total,
      uniqueUsers: notifications.uniqueUsers,
      lastUsedAt: notifications.lastUsedAt,
      description: 'System reminders, admin broadcast alerts, and member notification center',
      iconType: 'notification'
    },
    {
      id: 'system_health',
      name: 'System Health Diagnostics',
      category: 'Tools & System',
      totalUsage: systemHealthLogs.total,
      uniqueUsers: systemHealthLogs.uniqueUsers,
      lastUsedAt: systemHealthLogs.lastUsedAt,
      description: 'Client side database latency checks and system diagnostics page views',
      iconType: 'system'
    }
  ];

  return <FeaturesClient features={featureList} recentLogs={featureLogs.slice(0, 35)} />;
}
