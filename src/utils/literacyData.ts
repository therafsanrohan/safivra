import type { LiteracyModule } from '../types/finance';

export const INITIAL_LITERACY_MODULES: LiteracyModule[] = [
  {
    id: 'mod-1',
    slug: 'fire-foundations',
    title: 'FIRE Foundations & Safe Withdrawal Rate',
    category: 'Investing',
    durationMinutes: 6,
    xpPoints: 150,
    summary: 'Master the 4% rule, safe withdrawal rates (SWR), and how to calculate your Financial Independence number.',
    content: [
      'Financial Independence, Retire Early (FIRE) is built on accumulating an asset portfolio that produces enough passive yield to cover life expenses indefinitely.',
      'The 4% Safe Withdrawal Rate (SWR) originates from the Trinity Study. It suggests withdrawing 4% of your initial portfolio in year 1 (adjusted for inflation thereafter) gives a 95%+ probability of lasting 30+ years.',
      'Your FIRE Number is calculated as: Annual Living Expenses × 25 (or Annual Expenses ÷ 0.04). If your monthly expenses are $4,000 ($48,000/yr), your target portfolio is $1,200,000.'
    ],
    quiz: {
      question: 'If your annual expenses are $60,000, what is your target portfolio under the 4% Safe Withdrawal Rate rule?',
      options: ['$1,000,000', '$1,500,000', '$2,400,000', '$600,000'],
      correctIndex: 1,
      explanation: 'Target Portfolio = $60,000 × 25 (or $60,000 ÷ 0.04) = $1,500,000.'
    },
    completed: false
  },
  {
    id: 'mod-2',
    slug: 'debt-snowball-vs-avalanche',
    title: 'Debt Avalanche vs. Snowball Strategy',
    category: 'Debt Strategy',
    durationMinutes: 5,
    xpPoints: 120,
    summary: 'Discover the mathematically optimal method (Avalanche) vs the psychological win method (Snowball) to accelerate debt freedom.',
    content: [
      'The Debt Avalanche method focuses on paying minimum payments on all liabilities while routing all excess cash to the highest APR interest rate debt first.',
      'The Debt Snowball method targets the smallest balance first regardless of interest rate. This creates quick behavioral wins and psychological momentum.',
      'While Avalanche mathematically saves the maximum money in total interest, consistency and psychological sticking power often make Snowball effective for high-stress borrowers.'
    ],
    quiz: {
      question: 'Which debt payoff strategy mathematically minimizes the total interest paid over time?',
      options: ['Debt Snowball', 'Debt Avalanche', 'Paying only minimum payments', 'Consolidating without interest reduction'],
      correctIndex: 1,
      explanation: 'Debt Avalanche targets the highest APR debt first, minimizing interest compounding.'
    },
    completed: false
  },
  {
    id: 'mod-3',
    slug: 'emergency-runway',
    title: 'Emergency Fund & Liquidity Protection',
    category: 'Foundation',
    durationMinutes: 4,
    xpPoints: 100,
    summary: 'Build a bulletproof 3-6 month liquid cash runway to prevent forced asset liquidation during market downturns.',
    content: [
      'An emergency fund protects your long-term compound growth by shielding you from withdrawing stocks or real estate during market dips.',
      'Keep your emergency fund in High-Yield Savings Accounts (HYSA) or Money Market Accounts offering peak yield with zero principal risk.',
      'Aim for 3 months if you have stable dual income, or 6-12 months if self-employed or in variable commission roles.'
    ],
    quiz: {
      question: 'Where should your 3-6 month emergency runway cash be stored?',
      options: ['Individual Stock Options', 'High-Yield Savings Account (HYSA)', 'Crypto Tokens', 'Non-liquid Real Estate'],
      correctIndex: 1,
      explanation: 'HYSA provides zero principal risk, daily liquidity, and FDIC insurance protection.'
    },
    completed: false
  },
  {
    id: 'mod-4',
    slug: 'zero-based-503020-budgeting',
    title: 'The 50/30/20 Rule & Zero-Based Budgeting',
    category: 'Foundation',
    durationMinutes: 7,
    xpPoints: 140,
    summary: 'Allocate income into Needs (50%), Wants (30%), and Wealth Building (20%) while accounting for every dollar.',
    content: [
      '50% Needs: Housing, utilities, basic groceries, minimum debt payments, and essential transit.',
      '30% Wants: Dining out, subscriptions, travel, entertainment, lifestyle upgrades.',
      '20% Wealth: Investments, high-yield savings contributions, and extra debt principal payoff.'
    ],
    quiz: {
      question: 'Under the 50/30/20 budget framework, which bucket does extra principal payment on high-interest debt belong to?',
      options: ['Needs (50%)', 'Wants (30%)', 'Wealth & Savings (20%)', 'Unallocated Surplus'],
      correctIndex: 2,
      explanation: 'Accelerated debt payoff reduces liability compound interest, acting as an investment return in the 20% bucket.'
    },
    completed: false
  }
];
