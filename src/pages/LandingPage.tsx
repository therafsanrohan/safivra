import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/ui/SEO';
import {
  Cloud,
  Shield,
  Smartphone,
  CheckCircle,
  PieChart,
  Activity,
  CreditCard,
  Target,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  TrendingUp,
  Landmark,
  Wallet,
  Sparkles,
  Layers,
  Calculator,
  Lock,
  Zap,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency/formatter';

export const LandingPage: React.FC = () => {
  const { user } = useAuthContext();
  const { locale } = useLanguage();
  const isBn = locale === 'bn';

  // Interactive Live Preview Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'cards' | 'loans' | 'savings'>('overview');

  // Interactive Live DPS/EMI Calculator State
  const [calcType, setCalcType] = useState<'dps' | 'loan'>('dps');
  const [dpsMonthly, setDpsMonthly] = useState<number>(5000);
  const [dpsYears, setDpsYears] = useState<number>(5);
  const [dpsRate, setDpsRate] = useState<number>(8.5);

  const [loanAmount, setLoanAmount] = useState<number>(200000);
  const [loanMonths, setLoanMonths] = useState<number>(24);
  const [loanRate, setLoanRate] = useState<number>(9.5);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Calculate DPS Estimated Total
  const totalDpsDeposit = dpsMonthly * (dpsYears * 12);
  const dpsInterestEarned = Math.round(totalDpsDeposit * ((dpsRate / 100) * (dpsYears / 2)));
  const dpsMaturity = totalDpsDeposit + dpsInterestEarned;

  // Calculate Loan EMI
  const monthlyRate = loanRate / 12 / 100;
  const loanEmi = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanMonths)) /
    (Math.pow(1 + monthlyRate, loanMonths) - 1)
  ) || 0;
  const totalLoanRepayment = loanEmi * loanMonths;

  return (
    <>
      <SEO />
      <div className="w-full flex flex-col items-center overflow-x-hidden">
        {/* Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-24 sm:pb-20 text-center relative">
          {/* Subtle Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm mb-6 text-xs sm:text-sm font-medium text-[var(--color-text-secondary)]">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {isBn ? 'বাংলাদেশের জন্য আধুনিক পার্সোনাল ফাইন্যান্স' : 'Modern Personal Finance for Bangladesh'}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-6 max-w-4xl mx-auto leading-[1.12]">
            {isBn ? 'আপনার টাকার সঠিক হিসাব, সহজ ও স্পষ্ট।' : 'Your money, finally makes complete sense.'}
          </h1>

          <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            {isBn
              ? 'ব্যাংক অ্যাকাউন্ট, নগদ/বিকাশ, ক্রেডিট কার্ড, লোন, ডিপিএস এবং খরচের হিসাব—সবকিছু এক নিরাপদ প্ল্যাটফর্মে।'
              : 'Seamlessly track liquid accounts, credit cards, loans, DPS, budgets, and investments without double-counted confusion.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-16">
            <Link to="/auth/sign-up" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 gap-2 shadow-lg shadow-emerald-500/20">
                {isBn ? 'ফ্রি অ্যাকাউন্ট খুলুন' : 'Get Started Free'} <ArrowRight size={18} />
              </Button>
            </Link>
            <a href="#interactive-preview" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-7">
                {isBn ? 'লাইভ ডেমো দেখুন' : 'Explore Interactive Demo'}
              </Button>
            </a>
          </div>

          {/* Interactive Dynamic App Showcase */}
          <div id="interactive-preview" className="max-w-5xl mx-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-2xl overflow-hidden text-left transition-all">
            {/* Window Header */}
            <div className="px-5 py-3.5 bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                <span className="text-xs font-medium text-[var(--color-text-muted)] ml-2">app.safivra.com</span>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 bg-[var(--color-bg-surface)] p-1 rounded-lg border border-[var(--color-border)]">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'overview'
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {isBn ? 'ড্যাশবোর্ড' : 'Overview'}
                </button>
                <button
                  onClick={() => setActiveTab('cards')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'cards'
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {isBn ? 'ক্রেডিট কার্ড' : 'Credit Cards'}
                </button>
                <button
                  onClick={() => setActiveTab('loans')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'loans'
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {isBn ? 'লোন ও ইএমআই' : 'Loans & EMI'}
                </button>
                <button
                  onClick={() => setActiveTab('savings')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'savings'
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {isBn ? 'সঞ্চয় ও ডিপিএস' : 'DPS & Savings'}
                </button>
              </div>
            </div>

            {/* Interactive Screen Content */}
            <div className="p-6 sm:p-8 bg-gradient-to-b from-[var(--color-bg-surface)] to-[var(--color-bg-page)]">
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm">
                      <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{isBn ? 'মোট নেট সম্পদ' : 'Total Net Assets'}</span>
                      <p className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mt-1 tabular-nums" data-financial>{formatCurrency(485250, { forceEnglish: true })}</p>
                      <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">↑ +12.4% {isBn ? 'এই মাসে বৃদ্ধি' : 'this month'}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm">
                      <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{isBn ? 'মোট আয়' : 'Monthly Income'}</span>
                      <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1 tabular-nums" data-financial>{formatCurrency(120000, { forceEnglish: true })}</p>
                      <span className="text-xs text-[var(--color-text-muted)] mt-1 inline-block">{isBn ? 'বেতন ও ফ্রিল্যান্স' : 'Salary & Freelancing'}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm">
                      <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{isBn ? 'মোট খরচ' : 'Monthly Expenses'}</span>
                      <p className="text-2xl sm:text-3xl font-bold text-rose-600 mt-1 tabular-nums" data-financial>{formatCurrency(52400, { forceEnglish: true })}</p>
                      <span className="text-xs text-[var(--color-text-muted)] mt-1 inline-block">{isBn ? 'বাজেটের 68%' : '68% of Budget'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                      <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                        <Wallet size={16} className="text-emerald-500" /> {isBn ? 'সংযুক্ত অ্যাকাউন্টসমূহ' : 'Connected Accounts'}
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-sm py-1.5 border-b border-[var(--color-border)]">
                          <span className="font-medium text-[var(--color-text-primary)]">City Bank Salary Account</span>
                          <span className="font-semibold text-emerald-600 tabular-nums" data-financial>{formatCurrency(245000, { forceEnglish: true })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm py-1.5 border-b border-[var(--color-border)]">
                          <span className="font-medium text-[var(--color-text-primary)]">bKash Personal Wallet</span>
                          <span className="font-semibold text-emerald-600 tabular-nums" data-financial>{formatCurrency(18500, { forceEnglish: true })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm py-1.5">
                          <span className="font-medium text-[var(--color-text-primary)]">BRAC Bank Savings</span>
                          <span className="font-semibold text-emerald-600 tabular-nums" data-financial>{formatCurrency(221750, { forceEnglish: true })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                      <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                        <Activity size={16} className="text-teal-500" /> {isBn ? 'সাম্প্রতিক লেনদেন' : 'Recent Transactions'}
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-sm py-1.5 border-b border-[var(--color-border)]">
                          <div>
                            <p className="font-medium text-[var(--color-text-primary)]">Shwapno Supermarket</p>
                            <p className="text-xs text-[var(--color-text-muted)]">Groceries · City Bank</p>
                          </div>
                          <span className="font-semibold text-rose-600 tabular-nums" data-financial>-{formatCurrency(4200, { forceEnglish: true })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm py-1.5">
                          <div>
                            <p className="font-medium text-[var(--color-text-primary)]">Monthly Salary</p>
                            <p className="text-xs text-[var(--color-text-muted)]">Income · Direct Deposit</p>
                          </div>
                          <span className="font-semibold text-emerald-600 tabular-nums" data-financial>+{formatCurrency(120000, { forceEnglish: true })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'cards' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold tracking-wider text-slate-300">CITY GEMINI TITANIUM</span>
                        <CreditCard size={20} className="text-amber-400" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">{isBn ? 'ব্যবহৃত ব্যালেন্স' : 'Current Outstanding'}</span>
                        <p className="text-3xl font-bold text-rose-400 mt-0.5 tabular-nums" data-financial>{formatCurrency(28500, { forceEnglish: true })}</p>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-300 pt-2 border-t border-slate-700/60">
                        <span>{isBn ? 'লিমিট: ' : 'Limit: '}{formatCurrency(150000, { forceEnglish: true })}</span>
                        <span>{isBn ? 'ডিউ ডেট: 15ই প্রতি মাস' : 'Due: 15th monthly'}</span>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex flex-col justify-center space-y-3">
                      <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{isBn ? 'ক্রেডিট ব্যবহার হার' : 'Credit Utilization'}</span>
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-bold text-[var(--color-text-primary)]">19.0%</span>
                        <span className="text-xs text-emerald-600 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40">Healthy (&lt;30%)</span>
                      </div>
                      <div className="w-full bg-[var(--color-border)] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[19%]" />
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)]">{isBn ? 'বিল পরিশোধ করলে মূল ব্যালেন্স থেকে ডাবল হিসাব ছাড়া নির্ভুল অ্যাডজাস্ট হয়।' : 'Single-source ledger adjustments prevent double-counted statements.'}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'loans' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">Home Appliance Loan</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40">ACTIVE</span>
                      </div>
                      <div>
                        <span className="text-xs text-[var(--color-text-muted)]">{isBn ? 'বাকি আসল ঋণ' : 'Remaining Principal'}</span>
                        <p className="text-3xl font-bold text-rose-600 mt-0.5 tabular-nums" data-financial>{formatCurrency(45000, { forceEnglish: true })}</p>
                        <span className="text-xs text-[var(--color-text-muted)]">{isBn ? 'মূল ঋণ: ' : 'Original: '}{formatCurrency(100000, { forceEnglish: true })}</span>
                      </div>
                      <div className="w-full bg-[var(--color-border)] h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[55%]" />
                      </div>
                      <p className="text-xs text-emerald-600 font-medium">55% {isBn ? 'পরিশোধ সম্পন্ন' : 'Principal Repaid'}</p>
                    </div>

                    <div className="p-5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex flex-col justify-center space-y-3">
                      <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{isBn ? 'মাসিক কিস্তি (EMI)' : 'Monthly Installment'}</span>
                      <p className="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums" data-financial>{formatCurrency(5250, { forceEnglish: true })}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {isBn ? 'প্রতি কিস্তির আসল এবং সুদের অংশ স্বয়ংক্রিয়ভাবে আলাদা হিসাব করা হয়।' : 'Accurately separates principal repayment from interest expense.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'savings' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">BRAC Bank 5-Year DPS</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">MATURING 2028</span>
                      </div>
                      <div>
                        <span className="text-xs text-[var(--color-text-muted)]">{isBn ? 'মোট জমাকৃত টাকা' : 'Total Accumulated'}</span>
                        <p className="text-3xl font-bold text-emerald-600 mt-0.5 tabular-nums" data-financial>{formatCurrency(180000, { forceEnglish: true })}</p>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)]">{isBn ? 'মাসিক কিস্তি: ' : 'Monthly: '}{formatCurrency(5000, { forceEnglish: true })} · Rate: 8.5%</p>
                    </div>

                    <div className="p-5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex flex-col justify-center space-y-3">
                      <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{isBn ? 'মেয়াদান্তে সম্ভাব্য লাভ' : 'Maturity Target Value'}</span>
                      <p className="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums" data-financial>{formatCurrency(364000, { forceEnglish: true })}</p>
                      <p className="text-xs text-emerald-600 font-medium">{formatCurrency(64000, { forceEnglish: true })} {isBn ? 'মুনাফা বা লাভ' : 'Estimated Return'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Live Interactive DPS & Loan Estimator */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 sm:p-10 shadow-lg">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-xs font-semibold mb-3">
                <Calculator size={14} /> {isBn ? 'ইন্টারেক্টিভ ক্যালকুলেটর' : 'Interactive Financial Tool'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
                {isBn ? 'আপনার সঞ্চয় ও ঋণের কিস্তি হিসাব করুন' : 'Calculate Your Savings & Loan Estimates'}
              </h2>
            </div>

            <div className="flex justify-center gap-2 mb-8">
              <button
                onClick={() => setCalcType('dps')}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                  calcType === 'dps'
                    ? 'bg-[var(--color-primary)] text-white shadow-md'
                    : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {isBn ? 'ডিপিএস সঞ্চয় হিসাব (DPS)' : 'DPS Savings Estimator'}
              </button>
              <button
                onClick={() => setCalcType('loan')}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                  calcType === 'loan'
                    ? 'bg-[var(--color-primary)] text-white shadow-md'
                    : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {isBn ? 'লোন ও ইএমআই হিসাব (Loan EMI)' : 'Loan EMI Estimator'}
              </button>
            </div>

            {calcType === 'dps' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      <span>{isBn ? 'মাসিক জমা' : 'Monthly Deposit'}</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(dpsMonthly, { forceEnglish: true })}</span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="50000"
                      step="1000"
                      value={dpsMonthly}
                      onChange={(e) => setDpsMonthly(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      <span>{isBn ? 'সময়কাল (বছর)' : 'Tenure (Years)'}</span>
                      <span className="font-bold">{dpsYears} {isBn ? 'বছর' : 'Years'}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={dpsYears}
                      onChange={(e) => setDpsYears(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      <span>{isBn ? 'বার্ষিক সুদের হার (%)' : 'Interest Rate (%)'}</span>
                      <span className="font-bold">{dpsRate}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="14"
                      step="0.5"
                      value={dpsRate}
                      onChange={(e) => setDpsRate(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border)] space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">{isBn ? 'মোট জমাকৃত আসল' : 'Total Deposited'}</span>
                    <p className="text-xl font-bold text-[var(--color-text-primary)]">{formatCurrency(totalDpsDeposit, { forceEnglish: true })}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">{isBn ? 'সম্ভাব্য মুনাফা' : 'Estimated Return'}</span>
                    <p className="text-xl font-bold text-emerald-600">+{formatCurrency(dpsInterestEarned, { forceEnglish: true })}</p>
                  </div>
                  <div className="pt-3 border-t border-[var(--color-border)]">
                    <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">{isBn ? 'মেয়াদান্তে মোট প্রাপ্তি' : 'Maturity Amount'}</span>
                    <p className="text-3xl font-extrabold text-[var(--color-primary)]">{formatCurrency(dpsMaturity, { forceEnglish: true })}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      <span>{isBn ? 'লোনের পরিমাণ' : 'Loan Amount'}</span>
                      <span className="font-bold text-rose-600">{formatCurrency(loanAmount, { forceEnglish: true })}</span>
                    </div>
                    <input
                      type="range"
                      min="50000"
                      max="2000000"
                      step="25000"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      <span>{isBn ? 'পরিশোধের মেয়াদ (মাস)' : 'Tenure (Months)'}</span>
                      <span className="font-bold">{loanMonths} {isBn ? 'মাস' : 'Months'}</span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="60"
                      step="6"
                      value={loanMonths}
                      onChange={(e) => setLoanMonths(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      <span>{isBn ? 'সুদের হার (%)' : 'Interest Rate (%)'}</span>
                      <span className="font-bold">{loanRate}%</span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="18"
                      step="0.5"
                      value={loanRate}
                      onChange={(e) => setLoanRate(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border)] space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">{isBn ? 'মাসিক কিস্তি (EMI)' : 'Monthly EMI'}</span>
                    <p className="text-3xl font-extrabold text-[var(--color-text-primary)]">{formatCurrency(loanEmi, { forceEnglish: true })}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">{isBn ? 'মোট পরিশোধযোগ্য টাকা' : 'Total Repayment'}</span>
                    <p className="text-xl font-bold text-rose-600">{formatCurrency(totalLoanRepayment, { forceEnglish: true })}</p>
                  </div>
                  <div className="pt-3 border-t border-[var(--color-border)]">
                    <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">{isBn ? 'মোট অতিরিক্ত সুদ' : 'Total Interest'}</span>
                    <p className="text-xl font-bold text-[var(--color-text-muted)]">{formatCurrency(totalLoanRepayment - loanAmount, { forceEnglish: true })}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] mb-4">
              {isBn ? 'আপনার আর্থিক জীবনের পূর্ণ নিয়ন্ত্রণ' : 'Built for Everyday Financial Clarity'}
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)]">
              {isBn
                ? 'জটিল এক্সেল বা ডাবল ক্যালকুলেশন ছাড়াই আপনার সমস্ত সম্পদ ও দায়ের নিখুঁত রেকর্ড।'
                : 'Say goodbye to messy spreadsheets and flawed accounting logic.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-emerald-500/50 transition-all shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                <Landmark size={24} />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{isBn ? 'অ্যাকাউন্ট ও ওয়ালেটস' : 'Accounts & Wallets'}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {isBn ? 'ক্যাশ, ব্যাংক এবং বিকাশ/নগদের ব্যালেন্স একসাথে পর্যবেক্ষণ করুন।' : 'Track liquid cash, multi-bank accounts, and mobile wallets in real time.'}
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-emerald-500/50 transition-all shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600">
                <CreditCard size={24} />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{isBn ? 'ক্রেডিট কার্ড ও লোন' : 'Credit Cards & Loans'}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {isBn ? 'আসল টাকা ও সুদের আলাদা হিসাব এবং ডিউ ডেট রিমাইন্ডার।' : 'Never miss a due date. Clear principal vs interest separation.'}
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-emerald-500/50 transition-all shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
                <PieChart size={24} />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{isBn ? 'ডাইনামিক অ্যানালিটিক্স' : 'Dynamic Reports & CSV'}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {isBn ? 'মাসিক ও বাৎসরিক আয়ের খাতভিত্তিক বিশ্লেষণ ও এক ক্লিকে সিএসভি এক্সপোর্ট।' : 'Filter by month or year, view category breakdowns and export data cleanly.'}
              </p>
            </div>
          </div>
        </section>

        {/* Security & Privacy */}
        <section className="w-full bg-[var(--color-bg-surface)] border-y border-[var(--color-border)] py-16">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mx-auto">
              <Lock size={22} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
              {isBn ? 'আপনার আর্থিক তথ্যের শতভাগ নিরাপত্তা' : 'Bank-Grade Security & User Privacy'}
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              {isBn
                ? 'রো-লেভেল সিকিউরিটি (RLS) এবং এনক্রিপশনের মাধ্যমে আপনার আর্থিক ডেটা শুধুমাত্র আপনার কাছেই সুরক্ষিত থাকে।'
                : 'Protected with PostgreSQL Row Level Security (RLS) and strict authenticated access controls.'}
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-8 text-center">
            {isBn ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-3.5">
            {[
              {
                q: isBn ? 'Safivra কি সম্পূর্ণ ফ্রি?' : 'Is Safivra free to use?',
                a: isBn ? 'হ্যাঁ, Safivra-র কোর পার্সোনাল ফাইন্যান্স ফিচারসমূহ সম্পূর্ণ বিনামূল্যে ব্যবহার করতে পারবেন।' : 'Yes, Safivra core personal financial management features are completely free.'
              },
              {
                q: isBn ? 'বাংলাদেশি টাকা (BDT) কি পুরোপুরি সাপোর্ট করে?' : 'Does it support Bangladeshi Taka (BDT)?',
                a: isBn ? 'হ্যাঁ, বাংলাদেশি টাকা (৳) এবং দেশীয় হিসাব ব্যবস্থা (যেমন: ডিপিএস, ব্যাংক লোন, বিকাশ/নগদ) কেন্দ্রিক ডিজাইন করা।' : 'Yes, Safivra is built from the ground up tailored for BDT (৳) and Bangladeshi financial instruments.'
              },
              {
                q: isBn ? 'ট্রানজ্যাকশন ডাটা কি এক্সপোর্ট করা যাবে?' : 'Can I export my financial data?',
                a: isBn ? 'হ্যাঁ! Reports পেজ থেকে যেকোনো সময় সম্পূর্ণ বিস্তারিত সিএসভি (CSV) ফাইল এক ক্লিকে ডাউনলোড করতে পারবেন।' : 'Yes! You can export your full transaction records to CSV at any time from the Reports tab.'
              },
            ].map((faq, index) => (
              <FAQItem key={index} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </section>

        {/* Final Call to Action */}
        <section className="w-full bg-gradient-to-b from-[var(--color-bg-page)] to-emerald-500/10 border-t border-[var(--color-border)] py-20 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] mb-4">
              {isBn ? 'আজই শুরু করুন আপনার আর্থিক স্বচ্ছতা' : 'Take Control of Your Finances Today'}
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] mb-8 max-w-xl mx-auto">
              {isBn ? 'একটি অ্যাকাউন্ট যুক্ত করে পরিষ্কার ও নির্ভুল হিসাব উপভোগ করুন।' : 'Start in less than 2 minutes. Free and secure.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/auth/sign-up">
                <Button size="lg" className="px-8 shadow-lg shadow-emerald-500/20">
                  {isBn ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create Free Account'}
                </Button>
              </Link>
              <Link to="/auth/sign-in">
                <Button variant="secondary" size="lg" className="px-8">
                  {isBn ? 'লগইন করুন' : 'Sign In'}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 text-sm text-[var(--color-text-secondary)]">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Safivra</h3>
                <p className="max-w-xs leading-relaxed">
                  {isBn ? 'আপনার ব্যক্তিগত অর্থের হিসাব রাখার বিশ্বস্ত সঙ্গী।' : 'Your trusted companion for personal financial management.'}
                </p>
                <p>
                  <span className="font-semibold">{isBn ? 'নির্মাতা' : 'Developed by'}</span> <a href="https://www.creatiancy.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Creatiancy</a>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold text-[var(--color-text-primary)]">{isBn ? 'প্রোডাক্ট' : 'Product'}</h4>
                  <ul className="space-y-2">
                    <li><a href="#features" className="hover:text-[var(--color-text-primary)]">{isBn ? 'ফিচারসমূহ' : 'Features'}</a></li>
                    <li><Link to="/security" className="hover:text-[var(--color-text-primary)]">{isBn ? 'নিরাপত্তা' : 'Security'}</Link></li>
                    <li><a href="#faq" className="hover:text-[var(--color-text-primary)]">{isBn ? 'সাধারণ জিজ্ঞাসা' : 'FAQ'}</a></li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-[var(--color-text-primary)]">{isBn ? 'লিগ্যাল' : 'Legal'}</h4>
                  <ul className="space-y-2">
                    <li><Link to="/privacy-policy" className="hover:text-[var(--color-text-primary)]">{isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</Link></li>
                    <li><Link to="/terms-of-use" className="hover:text-[var(--color-text-primary)]">{isBn ? 'ব্যবহারের শর্তাবলী' : 'Terms of Use'}</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex flex-col md:flex-row items-center justify-between gap-4">
              <p>&copy; {new Date().getFullYear()} Safivra. {isBn ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'}</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)] overflow-hidden transition-colors">
      <button 
        className="w-full text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] flex justify-between items-center focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        {isOpen ? <ChevronUp size={18} className="text-[var(--color-text-muted)]" /> : <ChevronDown size={18} className="text-[var(--color-text-muted)]" />}
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};
