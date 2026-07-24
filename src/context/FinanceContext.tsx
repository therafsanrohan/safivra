import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  UserProfile,
  Account,
  Category,
  Transaction,
  DebtItem,
  LiteracyModule,
  DebtPayoffStrategy,
} from '../types/finance';
import {
  INITIAL_PROFILE,
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_DEBTS,
} from '../utils/initialData';
import { INITIAL_LITERACY_MODULES } from '../utils/literacyData';

export type ActiveTab = 'dashboard' | 'transactions' | 'wealth' | 'literacy' | 'settings';

interface FinanceContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id'>) => void;
  categories: Category[];
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  debts: DebtItem[];
  extraDebtPayment: number;
  setExtraDebtPayment: (amount: number) => void;
  updateDebtStrategy: (strategy: DebtPayoffStrategy) => void;
  literacyModules: LiteracyModule[];
  submitQuizAnswer: (moduleId: string, answerIndex: number) => boolean;
  resetAllData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'safivra_state_v1';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [extraDebtPayment, setExtraDebtPayment] = useState<number>(300);

  // Initialize State from LocalStorage or Defaults
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_profile`);
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_accounts`);
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_transactions`);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [debts, setDebts] = useState<DebtItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_debts`);
    return saved ? JSON.parse(saved) : INITIAL_DEBTS;
  });

  const [literacyModules, setLiteracyModules] = useState<LiteracyModule[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_literacy`);
    return saved ? JSON.parse(saved) : INITIAL_LITERACY_MODULES;
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_profile`, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_accounts`, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_transactions`, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_debts`, JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_literacy`, JSON.stringify(literacyModules));
  }, [literacyModules]);

  // Handler functions
  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const addAccount = (newAcc: Omit<Account, 'id'>) => {
    const created: Account = {
      ...newAcc,
      id: `acc-${Date.now()}`,
    };
    setAccounts((prev) => [...prev, created]);
  };

  const addTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const txId = `tx-${Date.now()}`;
    const tx: Transaction = { ...newTx, id: txId };

    setTransactions((prev) => [tx, ...prev]);

    // Update corresponding Account Balances
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.id === tx.accountId) {
          const delta = tx.type === 'income' ? tx.amount : tx.type === 'expense' ? -tx.amount : -tx.amount;
          return { ...acc, balance: acc.balance + delta };
        }
        if (tx.type === 'transfer' && acc.id === tx.destinationAccountId) {
          return { ...acc, balance: acc.balance + tx.amount };
        }
        return acc;
      })
    );

    // Also update matching Debt items if expense/payoff
    if (tx.type === 'expense' || tx.type === 'transfer') {
      setDebts((prevDebts) =>
        prevDebts.map((d) => {
          if (d.accountId === tx.accountId || d.accountId === tx.destinationAccountId) {
            return { ...d, balance: Math.max(0, d.balance - tx.amount) };
          }
          return d;
        })
      );
    }
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // Reverse account balance effect
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.id === tx.accountId) {
          const delta = tx.type === 'income' ? -tx.amount : tx.amount;
          return { ...acc, balance: acc.balance + delta };
        }
        if (tx.type === 'transfer' && acc.id === tx.destinationAccountId) {
          return { ...acc, balance: acc.balance - tx.amount };
        }
        return acc;
      })
    );
  };

  const updateDebtStrategy = (strategy: DebtPayoffStrategy) => {
    setProfile((prev) => ({ ...prev, debtStrategy: strategy }));
  };

  const submitQuizAnswer = (moduleId: string, answerIndex: number): boolean => {
    let isCorrect = false;

    setLiteracyModules((prev) =>
      prev.map((mod) => {
        if (mod.id === moduleId) {
          isCorrect = mod.quiz.correctIndex === answerIndex;
          if (isCorrect && !mod.completed) {
            // Reward profile with literacy score XP
            updateProfile({ literacyScore: profile.literacyScore + mod.xpPoints });
          }
          return {
            ...mod,
            completed: isCorrect || mod.completed,
            userScore: isCorrect ? 100 : 0,
          };
        }
        return mod;
      })
    );

    return isCorrect;
  };

  const resetAllData = () => {
    localStorage.clear();
    setProfile(INITIAL_PROFILE);
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setDebts(INITIAL_DEBTS);
    setLiteracyModules(INITIAL_LITERACY_MODULES);
  };

  return (
    <FinanceContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isQuickAddOpen,
        setIsQuickAddOpen,
        profile,
        updateProfile,
        accounts,
        addAccount,
        categories,
        transactions,
        addTransaction,
        deleteTransaction,
        debts,
        extraDebtPayment,
        setExtraDebtPayment,
        updateDebtStrategy,
        literacyModules,
        submitQuizAnswer,
        resetAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
