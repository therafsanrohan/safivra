import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  UserProfile,
  Account,
  Category,
  Transaction,
  DebtItem,
  LiteracyModule,
  DebtPayoffStrategy,
  Workspace,
  JournalEntry,
  ReceivablePayableItem,
} from '../types/finance';
import {
  INITIAL_PROFILE,
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_DEBTS,
  INITIAL_WORKSPACES,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_RECEIVABLES,
} from '../utils/initialData';
import { INITIAL_LITERACY_MODULES } from '../utils/literacyData';
import { queueOfflineAction } from '../utils/pwaOutbox';

export type ActiveTab = 'dashboard' | 'transactions' | 'ledger' | 'receivables' | 'wealth' | 'literacy' | 'settings';

interface FinanceContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  setActiveWorkspace: (ws: Workspace) => void;
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id'>) => void;
  categories: Category[];
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  journalEntries: JournalEntry[];
  reverseJournalEntry: (id: string) => void;
  receivables: ReceivablePayableItem[];
  addReceivable: (item: Omit<ReceivablePayableItem, 'id'>) => void;
  settleReceivable: (id: string, amount: number) => void;
  debts: DebtItem[];
  extraDebtPayment: number;
  setExtraDebtPayment: (amount: number) => void;
  updateDebtStrategy: (strategy: DebtPayoffStrategy) => void;
  literacyModules: LiteracyModule[];
  submitQuizAnswer: (moduleId: string, answerIndex: number) => boolean;
  resetAllData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'safivra_state_v2';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [extraDebtPayment, setExtraDebtPayment] = useState<number>(300);

  const [workspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(INITIAL_WORKSPACES[0]);

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

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_journal`);
    return saved ? JSON.parse(saved) : INITIAL_JOURNAL_ENTRIES;
  });

  const [receivables, setReceivables] = useState<ReceivablePayableItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_receivables`);
    return saved ? JSON.parse(saved) : INITIAL_RECEIVABLES;
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
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_journal`, JSON.stringify(journalEntries));
  }, [journalEntries]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_receivables`, JSON.stringify(receivables));
  }, [receivables]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_debts`, JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_literacy`, JSON.stringify(literacyModules));
  }, [literacyModules]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const addAccount = (newAcc: Omit<Account, 'id'>) => {
    const created: Account = { ...newAcc, id: `acc-${Date.now()}` };
    setAccounts((prev) => [...prev, created]);
    queueOfflineAction('CREATE_ACCOUNT', created);
  };

  const addTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const txId = `tx-${Date.now()}`;
    const tx: Transaction = { ...newTx, id: txId, workspaceId: activeWorkspace.id };

    setTransactions((prev) => [tx, ...prev]);
    queueOfflineAction('ADD_TRANSACTION', tx);

    // Update Account Balances
    const sourceAcc = accounts.find((a) => a.id === tx.accountId);
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

    // Automatic Double-Entry Journal Creation (Sprint 4)
    const newJe: JournalEntry = {
      id: `je-${Date.now()}`,
      entryNumber: 1000 + journalEntries.length + 1,
      date: tx.date,
      memo: tx.description,
      isReversed: false,
      lines: [
        {
          id: `jl-${Date.now()}-1`,
          journalEntryId: `je-${Date.now()}`,
          accountId: tx.accountId,
          accountName: sourceAcc ? sourceAcc.name : 'Account',
          debit: tx.type === 'income' ? tx.amount : 0,
          credit: tx.type === 'expense' ? tx.amount : 0,
          description: tx.description,
        },
        {
          id: `jl-${Date.now()}-2`,
          journalEntryId: `je-${Date.now()}`,
          accountId: tx.categoryId || 'contra-1',
          accountName: tx.type === 'income' ? 'Income Revenue' : 'Expense Category',
          debit: tx.type === 'expense' ? tx.amount : 0,
          credit: tx.type === 'income' ? tx.amount : 0,
          description: tx.merchant || 'Journal Balancing Line',
        },
      ],
    };

    setJournalEntries((prev) => [newJe, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    setTransactions((prev) => prev.filter((t) => t.id !== id));

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

  const reverseJournalEntry = (id: string) => {
    setJournalEntries((prev) =>
      prev.map((je) => {
        if (je.id === id) {
          return { ...je, isReversed: true };
        }
        return je;
      })
    );
  };

  const addReceivable = (item: Omit<ReceivablePayableItem, 'id'>) => {
    const created: ReceivablePayableItem = { ...item, id: `rec-${Date.now()}` };
    setReceivables((prev) => [created, ...prev]);
  };

  const settleReceivable = (id: string, amount: number) => {
    setReceivables((prev) =>
      prev.map((rec) => {
        if (rec.id === id) {
          const newBal = Math.max(0, rec.balanceDue - amount);
          return { ...rec, balanceDue: newBal, status: newBal === 0 ? 'paid' : 'pending' };
        }
        return rec;
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
            updateProfile({ literacyScore: profile.literacyScore + mod.xpPoints });
          }
          return { ...mod, completed: isCorrect || mod.completed, userScore: isCorrect ? 100 : 0 };
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
    setJournalEntries(INITIAL_JOURNAL_ENTRIES);
    setReceivables(INITIAL_RECEIVABLES);
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
        isAuthOpen,
        setIsAuthOpen,
        isAuthenticated,
        setIsAuthenticated,
        workspaces,
        activeWorkspace,
        setActiveWorkspace,
        profile,
        updateProfile,
        accounts,
        addAccount,
        categories,
        transactions,
        addTransaction,
        deleteTransaction,
        journalEntries,
        reverseJournalEntry,
        receivables,
        addReceivable,
        settleReceivable,
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
