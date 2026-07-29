// src/lib/i18n/translations.ts
// All UI strings for Safivra in English (en) and Bengali (bn)

export type Locale = 'en' | 'bn';

export const translations = {
  en: {
    // ─── App ───────────────────────────────────────────────────────────────
    appName: 'Safivra',

    // ─── Navigation ────────────────────────────────────────────────────────
    nav: {
      home: 'Home',
      activity: 'Activity',
      add: 'Add',
      plans: 'Plans',
      more: 'More',
      dashboard: 'Dashboard',
      accounts: 'Accounts',
      loans: 'Loans',
      creditCards: 'Credit Cards',
      recurring: 'Recurring',
      plansGoals: 'Plans & Goals',
      reports: 'Reports',
      notifications: 'Notifications',
      settings: 'Settings',
      manage: 'Manage',
      plan: 'Plan',
    },

    // ─── Add Transaction Sheet ──────────────────────────────────────────────
    addTransaction: {
      title: 'Add Transaction',
      expense: 'Expense',
      income: 'Income',
      transfer: 'Transfer',
      loanPayment: 'Loan Payment',
      cardPayment: 'Card Payment',
      adjustment: 'Adjustment',
    },

    // ─── Dashboard ─────────────────────────────────────────────────────────
    dashboard: {
      totalBalance: 'Total Balance',
      monthlyIncome: 'Monthly Income',
      monthlyExpenses: 'Monthly Expenses',
      netSavings: 'Net Savings',
      recentTransactions: 'Recent Transactions',
      seeAll: 'See All',
      noTransactions: 'No transactions yet',
      addFirst: 'Add your first transaction',
      thisMonth: 'This Month',
    },

    // ─── Activity / Transactions ────────────────────────────────────────────
    activity: {
      title: 'Activity',
      all: 'All',
      income: 'Income',
      expense: 'Expense',
      transfers: 'Transfers',
      noActivity: 'No transactions found',
      filter: 'Filter',
    },

    // ─── Accounts ──────────────────────────────────────────────────────────
    accounts: {
      title: 'Accounts & Wallets',
      totalAssets: 'Total Assets',
      addAccount: 'Add Account',
      noAccounts: 'No accounts found',
      balance: 'Balance',
      type: 'Account Type',
    },

    // ─── Loans ─────────────────────────────────────────────────────────────
    loans: {
      title: 'Loans & Debts',
      addLoan: 'Add Loan',
      outstanding: 'Outstanding',
      paid: 'Paid',
      noLoans: 'No loans found',
      totalOwed: 'Total Owed',
    },

    // ─── Credit Cards ───────────────────────────────────────────────────────
    creditCards: {
      title: 'Credit Cards',
      addCard: 'Add Card',
      totalLimit: 'Total Limit',
      totalUsed: 'Total Used',
      noCards: 'No credit cards found',
    },

    // ─── Plans ─────────────────────────────────────────────────────────────
    plans: {
      title: 'Financial Plans',
      subtitle: 'Manage your financial goals and commitments',
      budgets: 'Budgets',
      budgetsDesc: 'Set category expense limits and track progress against spending.',
      manageBudgets: 'Manage Budgets',
      savingsDps: 'Savings, DPS & FDR',
      savingsDpsDesc: 'Deposit pension schemes, bank FDRs, and National Sanchaypatra.',
      manageSavings: 'Manage Savings',
      recurring: 'Recurring',
      recurringDesc: 'Track subscriptions and recurring bills.',
      manageRecurring: 'Manage Recurring',
      goals: 'Goals',
      goalsDesc: 'Set financial goals and track your progress.',
      manageGoals: 'Manage Goals',
    },

    // ─── Savings / DPS / FDR ───────────────────────────────────────────────
    savings: {
      pageTitle: 'Savings, DPS & FDR',
      pageSubtitle: 'Track Deposit Pension Schemes, Fixed Deposits, and Sanchaypatra',
      addScheme: 'Add Scheme',
      totalDeposit: 'Total Deposit',
      maturityEstimate: 'Maturity Estimate',
      tabAll: 'All',
      tabDps: 'DPS',
      tabFdr: 'FDR',
      tabSanchaypatra: 'Sanchaypatra',
      noSchemes: 'No schemes found',
      noSchemesDesc: 'Add your DPS installments, bank FDRs, or National Sanchaypatra to monitor growth.',
      dialogTitle: 'Add Savings Scheme',
      dialogDesc: 'Register a new DPS, FDR or Sanchaypatra',
      schemeTitle: 'Scheme Title',
      schemeTitlePlaceholder: 'e.g. City Bank 5-Yr DPS, BRAC FDR',
      schemeType: 'Scheme Type',
      institution: 'Bank / Financial Institution',
      institutionPlaceholder: 'e.g. City Bank, BRAC Bank, National Savings Bureau',
      monthlyDeposit: 'Monthly Deposit Amount',
      principalAmount: 'Principal Investment Amount',
      maturityValue: 'Estimated Maturity Value',
      interestRate: 'Interest Rate (% p.a.)',
      startDate: 'Start Date',
      maturityDate: 'Maturity Date',
      saveScheme: 'Save Scheme',
      perMonth: '/mo',
      estimated: 'Est.',
      maturesOn: 'Maturity Date:',
      profit: '% p.a.',
      noProfit: 'No interest',
      statusActive: 'active',
      statusMatured: 'matured',
      statusClosed: 'closed',
      dpsLabel: 'DPS (Deposit Pension Scheme)',
      fdrLabel: 'FDR (Fixed Deposit Receipt)',
      sanchaypataLabel: 'Sanchaypatra (National Savings Certificate)',
      savingsLabel: 'High Yield Savings Account',
      backToPlans: 'Plans',
    },

    // ─── Recurring ─────────────────────────────────────────────────────────
    recurring: {
      pageTitle: 'Recurring Commitments',
      pageSubtitle: 'Subscriptions, bills, rent, and scheduled income',
      addRecurring: 'Add Recurring',
      noCommitments: 'No recurring commitments',
      noCommitmentsDesc: 'Add monthly internet bills, house rent, or streaming subscriptions to receive timely reminders.',
      addItem: 'Add Item',
      dialogTitle: 'Add Recurring Commitment',
      dialogDesc: 'Schedule a bill, rent payment, or subscription',
      titleLabel: 'Title',
      titlePlaceholder: 'e.g. Internet Bill, House Rent, Netflix',
      amountLabel: 'Amount',
      frequencyLabel: 'Frequency',
      nextDueLabel: 'Next Due Date',
      saveCommitment: 'Save Commitment',
      typeLabel: 'Transaction Type',
      accountLabel: 'Account',
      categoryLabel: 'Category',
      autoPostLabel: 'Auto Post',
      autoPostDesc: 'Automatically record transaction on due date',
      toastAdded: 'Recurring Item Added',
      toastAddedDesc: '{name} set for {amount}.',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      expense: 'Expense',
      income: 'Income',
      nextDue: 'Next due',
      backToPlans: 'Plans',
      deleteItem: 'Delete',
      deleteConfirm: 'Are you sure you want to delete this recurring commitment?',
      toastDeleted: 'Recurring Item Deleted',
      toastDeletedDesc: 'Successfully removed recurring item.',
      noAccountWarning: 'You must create a financial account first to schedule a recurring commitment.',
      createAccountBtn: 'Create Account',
    },

    // ─── More Menu ─────────────────────────────────────────────────────────
    more: {
      title: 'More',
      financialAccounts: 'Financial Accounts',
      planningAnalytics: 'Planning & Analytics',
      appSection: 'App',
      accountsWallets: 'Accounts & Wallets',
      loansDebts: 'Loans & Debts',
      savingsDps: 'Savings, DPS & FDR',
      recurringCommitments: 'Recurring Commitments',
      reportsExports: 'Reports & Exports',
      signOut: 'Sign Out',
    },

    // ─── Settings ──────────────────────────────────────────────────────────
    settings: {
      title: 'Settings',
      language: 'Language',
      theme: 'Theme',
      currency: 'Currency',
      account: 'Account',
    },

    // ─── Reports ───────────────────────────────────────────────────────────
    reports: {
      title: 'Reports',
    },

    // ─── Notifications ─────────────────────────────────────────────────────
    notifications: {
      title: 'Notifications',
    },

    // ─── Common ────────────────────────────────────────────────────────────
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      close: 'Close',
      back: 'Back',
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Try again',
      optional: 'optional',
      required: 'required',
      switchLang: 'বাংলা',
      updateAvailable: 'Update Available',
      updateAvailableDesc: 'A new Safivra version is available. Update now?',
      updateNow: 'Update now',
      later: 'Later',
      readyOffline: 'Ready Offline',
      readyOfflineDesc: 'App is ready to work offline.',
    },
  },

  bn: {
    // ─── App ───────────────────────────────────────────────────────────────
    appName: 'সেফিভ্রা',

    // ─── Navigation ────────────────────────────────────────────────────────
    nav: {
      home: 'হোম',
      activity: 'লেনদেন',
      add: 'যোগ',
      plans: 'পরিকল্পনা',
      more: 'আরও',
      dashboard: 'ড্যাশবোর্ড',
      accounts: 'হিসাব',
      loans: 'ঋণ',
      creditCards: 'ক্রেডিট কার্ড',
      recurring: 'নিয়মিত',
      plansGoals: 'পরিকল্পনা ও লক্ষ্য',
      reports: 'প্রতিবেদন',
      notifications: 'বিজ্ঞপ্তি',
      settings: 'সেটিংস',
      manage: 'ব্যবস্থাপনা',
      plan: 'পরিকল্পনা',
    },

    // ─── Add Transaction Sheet ──────────────────────────────────────────────
    addTransaction: {
      title: 'লেনদেন যোগ করুন',
      expense: 'খরচ',
      income: 'আয়',
      transfer: 'ট্রান্সফার',
      loanPayment: 'ঋণ পরিশোধ',
      cardPayment: 'কার্ড পেমেন্ট',
      adjustment: 'সমন্বয়',
    },

    // ─── Dashboard ─────────────────────────────────────────────────────────
    dashboard: {
      totalBalance: 'মোট ব্যালেন্স',
      monthlyIncome: 'মাসিক আয়',
      monthlyExpenses: 'মাসিক খরচ',
      netSavings: 'নিট সঞ্চয়',
      recentTransactions: 'সাম্প্রতিক লেনদেন',
      seeAll: 'সব দেখুন',
      noTransactions: 'এখনো কোন লেনদেন নেই',
      addFirst: 'প্রথম লেনদেন যোগ করুন',
      thisMonth: 'এই মাসে',
    },

    // ─── Activity / Transactions ────────────────────────────────────────────
    activity: {
      title: 'লেনদেন',
      all: 'সব',
      income: 'আয়',
      expense: 'খরচ',
      transfers: 'ট্রান্সফার',
      noActivity: 'কোন লেনদেন পাওয়া যায়নি',
      filter: 'ফিল্টার',
    },

    // ─── Accounts ──────────────────────────────────────────────────────────
    accounts: {
      title: 'হিসাব ও ওয়ালেট',
      totalAssets: 'মোট সম্পদ',
      addAccount: 'হিসাব যোগ করুন',
      noAccounts: 'কোন হিসাব পাওয়া যায়নি',
      balance: 'ব্যালেন্স',
      type: 'হিসাবের ধরন',
    },

    // ─── Loans ─────────────────────────────────────────────────────────────
    loans: {
      title: 'ঋণ ও দেনা',
      addLoan: 'ঋণ যোগ করুন',
      outstanding: 'বকেয়া',
      paid: 'পরিশোধিত',
      noLoans: 'কোন ঋণ পাওয়া যায়নি',
      totalOwed: 'মোট বকেয়া',
    },

    // ─── Credit Cards ───────────────────────────────────────────────────────
    creditCards: {
      title: 'ক্রেডিট কার্ড',
      addCard: 'কার্ড যোগ করুন',
      totalLimit: 'মোট সীমা',
      totalUsed: 'ব্যবহৃত',
      noCards: 'কোন ক্রেডিট কার্ড নেই',
    },

    // ─── Plans ─────────────────────────────────────────────────────────────
    plans: {
      title: 'আর্থিক পরিকল্পনা',
      subtitle: 'আপনার আর্থিক লক্ষ্য ও প্রতিশ্রুতি পরিচালনা করুন',
      budgets: 'বাজেট',
      budgetsDesc: 'ক্যাটাগরি অনুযায়ী খরচের সীমা নির্ধারণ করুন এবং অগ্রগতি ট্র্যাক করুন।',
      manageBudgets: 'বাজেট পরিচালনা',
      savingsDps: 'সঞ্চয়, ডিপিএস ও এফডিআর',
      savingsDpsDesc: 'ডিপোজিট পেনশন স্কিম, ব্যাংক এফডিআর এবং সঞ্চয়পত্র।',
      manageSavings: 'সঞ্চয় পরিচালনা',
      recurring: 'নিয়মিত খরচ',
      recurringDesc: 'সাবস্ক্রিপশন ও নিয়মিত বিল ট্র্যাক করুন।',
      manageRecurring: 'নিয়মিত পরিচালনা',
      goals: 'লক্ষ্য',
      goalsDesc: 'আর্থিক লক্ষ্য নির্ধারণ করুন এবং অগ্রগতি ট্র্যাক করুন।',
      manageGoals: 'লক্ষ্য পরিচালনা',
    },

    // ─── Savings / DPS / FDR ───────────────────────────────────────────────
    savings: {
      pageTitle: 'সঞ্চয়, ডিপিএস ও এফডিআর',
      pageSubtitle: 'আপনার সঞ্চয়পত্র, ডিপিএস এবং এফডিআর ট্র্যাক করুন',
      addScheme: 'সঞ্চয় যোগ করুন',
      totalDeposit: 'মোট জমা',
      maturityEstimate: 'সম্ভাব্য মেয়াদপূর্তি',
      tabAll: 'সব',
      tabDps: 'ডিপিএস',
      tabFdr: 'এফডিআর',
      tabSanchaypatra: 'সঞ্চয়পত্র',
      noSchemes: 'কোন সঞ্চয় পাওয়া যায়নি',
      noSchemesDesc: 'আপনার ডিপিএস কিস্তি, ব্যাংক এফডিআর বা জাতীয় সঞ্চয়পত্র যোগ করুন।',
      dialogTitle: 'নতুন সঞ্চয় যোগ করুন',
      dialogDesc: 'নতুন ডিপিএস, এফডিআর বা সঞ্চয়পত্র নিবন্ধন করুন',
      schemeTitle: 'সঞ্চয়ের নাম',
      schemeTitlePlaceholder: 'যেমন: City Bank 5-Yr DPS, BRAC FDR',
      schemeType: 'সঞ্চয়ের ধরন',
      institution: 'ব্যাংক / আর্থিক প্রতিষ্ঠান',
      institutionPlaceholder: 'যেমন: City Bank, BRAC Bank, জাতীয় সঞ্চয় অধিদপ্তর',
      monthlyDeposit: 'মাসিক কিস্তি',
      principalAmount: 'বিনিয়োগকৃত অর্থ',
      maturityValue: 'সম্ভাব্য মেয়াদপূর্তি মূল্য',
      interestRate: 'মুনাফার হার (% বার্ষিক)',
      startDate: 'শুরুর তারিখ',
      maturityDate: 'মেয়াদপূর্তির তারিখ',
      saveScheme: 'সংরক্ষণ করুন',
      perMonth: '/মাস',
      estimated: 'মেয়াদান্তে',
      maturesOn: 'মেয়াদপূর্তি:',
      profit: '% মুনাফা',
      noProfit: 'মুনাফা নেই',
      statusActive: 'চলমান',
      statusMatured: 'মেয়াদ শেষ',
      statusClosed: 'বন্ধ',
      dpsLabel: 'ডিপিএস (ডিপোজিট পেনশন স্কিম)',
      fdrLabel: 'এফডিআর (ফিক্সড ডিপোজিট রিসিপ্ট)',
      sanchaypataLabel: 'সঞ্চয়পত্র (জাতীয় সঞ্চয় সার্টিফিকেট)',
      savingsLabel: 'উচ্চ সুদে সঞ্চয়ী হিসাব',
      backToPlans: 'পরিকল্পনা',
    },

    // ─── Recurring ─────────────────────────────────────────────────────────
    recurring: {
      pageTitle: 'নিয়মিত প্রতিশ্রুতি',
      pageSubtitle: 'সাবস্ক্রিপশন, বিল, ভাড়া এবং নির্ধারিত আয়',
      addRecurring: 'নিয়মিত যোগ করুন',
      noCommitments: 'কোন নিয়মিত প্রতিশ্রুতি নেই',
      noCommitmentsDesc: 'সময়মত অনুস্মারক পেতে মাসিক ইন্টারনেট বিল, ঘর ভাড়া বা স্ট্রিমিং সাবস্ক্রিপশন যোগ করুন।',
      addItem: 'আইটেম যোগ করুন',
      dialogTitle: 'নিয়মিত প্রতিশ্রুতি যোগ করুন',
      dialogDesc: 'একটি বিল, ভাড়া প্রদান বা সাবস্ক্রিপশন নির্ধারণ করুন',
      titleLabel: 'শিরোনাম',
      titlePlaceholder: 'যেমন: ইন্টারনেট বিল, ঘর ভাড়া, নেটফ্লিক্স',
      amountLabel: 'পরিমাণ',
      frequencyLabel: 'ফ্রিকোয়েন্সি',
      nextDueLabel: 'পরবর্তী নির্ধারিত তারিখ',
      saveCommitment: 'প্রতিশ্রুতি সংরক্ষণ করুন',
      typeLabel: 'লেনদেনের ধরন',
      accountLabel: 'হিসাব',
      categoryLabel: 'ক্যাটাগরি',
      autoPostLabel: 'অটো পোস্ট',
      autoPostDesc: 'নির্ধারিত তারিখে স্বয়ংক্রিয়ভাবে লেনদেন রেকর্ড করুন',
      toastAdded: 'নিয়মিত আইটেম যোগ করা হয়েছে',
      toastAddedDesc: '{amount} এর জন্য {name} সেট করা হয়েছে।',
      weekly: 'সাপ্তাহিক',
      monthly: 'মাসিক',
      yearly: 'বার্ষিক',
      expense: 'খরচ',
      income: 'আয়',
      nextDue: 'পরবর্তী বকেয়া',
      backToPlans: 'পরিকল্পনা',
      deleteItem: 'মুছুন',
      deleteConfirm: 'আপনি কি নিশ্চিত যে আপনি এই নিয়মিত প্রতিশ্রুতিটি মুছতে চান?',
      toastDeleted: 'নিয়মিত আইটেম মুছে ফেলা হয়েছে',
      toastDeletedDesc: 'নিয়মিত আইটেমটি সফলভাবে মুছে ফেলা হয়েছে।',
      noAccountWarning: 'নিয়মিত প্রতিশ্রুতি নির্ধারণ করতে আপনাকে প্রথমে একটি আর্থিক হিসাব তৈরি করতে হবে।',
      createAccountBtn: 'হিসাব তৈরি করুন',
    },

    // ─── More Menu ─────────────────────────────────────────────────────────
    more: {
      title: 'আরও',
      financialAccounts: 'আর্থিক হিসাব',
      planningAnalytics: 'পরিকল্পনা ও বিশ্লেষণ',
      appSection: 'অ্যাপ',
      accountsWallets: 'হিসাব ও ওয়ালেট',
      loansDebts: 'ঋণ ও দেনা',
      savingsDps: 'সঞ্চয়, ডিপিএস ও এফডিআর',
      recurringCommitments: 'নিয়মিত প্রতিশ্রুতি',
      reportsExports: 'প্রতিবেদন ও রপ্তানি',
      signOut: 'সাইন আউট',
    },

    // ─── Settings ──────────────────────────────────────────────────────────
    settings: {
      title: 'সেটিংস',
      language: 'ভাষা',
      theme: 'থিম',
      currency: 'মুদ্রা',
      account: 'অ্যাকাউন্ট',
    },

    // ─── Reports ───────────────────────────────────────────────────────────
    reports: {
      title: 'প্রতিবেদন',
    },

    // ─── Notifications ─────────────────────────────────────────────────────
    notifications: {
      title: 'বিজ্ঞপ্তি',
    },

    // ─── Common ────────────────────────────────────────────────────────────
    common: {
      save: 'সংরক্ষণ',
      cancel: 'বাতিল',
      delete: 'মুছুন',
      edit: 'সম্পাদনা',
      add: 'যোগ করুন',
      close: 'বন্ধ',
      back: 'পিছনে',
      loading: 'লোড হচ্ছে...',
      error: 'কিছু একটা ভুল হয়েছে',
      retry: 'আবার চেষ্টা করুন',
      optional: 'ঐচ্ছিক',
      required: 'আবশ্যক',
      switchLang: 'English',
      updateAvailable: 'আপডেট উপলব্ধ',
      updateAvailableDesc: 'সাফিব্রার একটি নতুন সংস্করণ উপলব্ধ। এখনই আপডেট করবেন?',
      updateNow: 'এখনই আপডেট করুন',
      later: 'পরে',
      readyOffline: 'অফলাইনে প্রস্তুত',
      readyOfflineDesc: 'অ্যাপটি অফলাইনে কাজ করার জন্য প্রস্তুত।',
    },
  },
} as const;

type DeepStringify<T> = T extends string
  ? string
  : T extends object
  ? { [K in keyof T]: DeepStringify<T[K]> }
  : T;

export type TranslationKeys = DeepStringify<typeof translations.en>;
