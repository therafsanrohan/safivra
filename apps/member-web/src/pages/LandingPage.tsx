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

export const LandingPage: React.FC = () => {
  const { user } = useAuthContext();
  const { locale } = useLanguage();
  const isBn = locale === 'bn';

  // Interactive Live Preview Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'cards' | 'loans' | 'savings'>('overview');

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <SEO 
        title={isBn ? 'Safivra - সুরক্ষিত পার্সোনাল ফাইন্যান্স' : 'Safivra - Secure Personal Finance'} 
        description={isBn ? 'আপনার আয়-ব্যয়, লোন, এবং সঞ্চয়ের সম্পূর্ণ হিসাব রাখুন এক জায়গায়, সম্পূর্ণ নিরাপদে।' : 'Track your income, expenses, loans, and savings in one place with bank-grade security.'}
      />
      <div className="w-full flex flex-col items-center overflow-x-hidden">
        {/* Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-24 sm:pb-20 text-center relative">
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
            <a href="#security" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-7">
                {isBn ? 'নিরাপত্তা সম্পর্কে জানুন' : 'Learn about Security'}
              </Button>
            </a>
          </div>

          {/* Interactive Dynamic App Showcase (Anonymized) */}
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
              </div>
            </div>

            {/* Interactive Screen Content */}
            <div className="p-6 sm:p-8 bg-gradient-to-b from-[var(--color-bg-surface)] to-[var(--color-bg-page)]">
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm">
                      <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{isBn ? 'মোট নেট সম্পদ' : 'Total Net Assets'}</span>
                      <p className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mt-1 tabular-nums" data-financial>৳ **,***</p>
                      <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">↑ +**.*% {isBn ? 'এই মাসে বৃদ্ধি' : 'this month'}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm">
                      <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{isBn ? 'মোট আয়' : 'Monthly Income'}</span>
                      <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1 tabular-nums" data-financial>৳ **,***</p>
                      <span className="text-xs text-[var(--color-text-muted)] mt-1 inline-block">{isBn ? 'বেতন ও অন্যান্য' : 'Salary & Other'}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm">
                      <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{isBn ? 'মোট খরচ' : 'Monthly Expenses'}</span>
                      <p className="text-2xl sm:text-3xl font-bold text-rose-600 mt-1 tabular-nums" data-financial>৳ **,***</p>
                      <span className="text-xs text-[var(--color-text-muted)] mt-1 inline-block">{isBn ? 'বাজেটের **%' : '**% of Budget'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                      <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                        <Wallet size={16} className="text-emerald-500" /> {isBn ? 'সংযুক্ত অ্যাকাউন্টসমূহ' : 'Connected Accounts'}
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-sm py-1.5 border-b border-[var(--color-border)]">
                          <span className="font-medium text-[var(--color-text-primary)]">Primary Salary Account</span>
                          <span className="font-semibold text-emerald-600 tabular-nums" data-financial>৳ **,***</span>
                        </div>
                        <div className="flex justify-between items-center text-sm py-1.5 border-b border-[var(--color-border)]">
                          <span className="font-medium text-[var(--color-text-primary)]">Personal Mobile Wallet</span>
                          <span className="font-semibold text-emerald-600 tabular-nums" data-financial>৳ **,***</span>
                        </div>
                        <div className="flex justify-between items-center text-sm py-1.5">
                          <span className="font-medium text-[var(--color-text-primary)]">Savings Deposit</span>
                          <span className="font-semibold text-emerald-600 tabular-nums" data-financial>৳ **,***</span>
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
                            <p className="font-medium text-[var(--color-text-primary)]">Supermarket Checkout</p>
                            <p className="text-xs text-[var(--color-text-muted)]">Groceries · Primary Bank</p>
                          </div>
                          <span className="font-semibold text-rose-600 tabular-nums" data-financial>-৳ *,***</span>
                        </div>
                        <div className="flex justify-between items-center text-sm py-1.5">
                          <div>
                            <p className="font-medium text-[var(--color-text-primary)]">Monthly Salary</p>
                            <p className="text-xs text-[var(--color-text-muted)]">Income · Direct Deposit</p>
                          </div>
                          <span className="font-semibold text-emerald-600 tabular-nums" data-financial>+৳ **,***</span>
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
                        <span className="text-xs font-semibold tracking-wider text-slate-300">PREMIUM CREDIT CARD</span>
                        <CreditCard size={20} className="text-amber-400" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">{isBn ? 'ব্যবহৃত ব্যালেন্স' : 'Current Outstanding'}</span>
                        <p className="text-3xl font-bold text-rose-400 mt-0.5 tabular-nums" data-financial>৳ **,***</p>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-300 pt-2 border-t border-slate-700/60">
                        <span>{isBn ? 'লিমিট: ' : 'Limit: '}৳ ***,***</span>
                        <span>{isBn ? 'ডিউ ডেট: 15ই প্রতি মাস' : 'Due: 15th monthly'}</span>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex flex-col justify-center space-y-3">
                      <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{isBn ? 'ক্রেডিট ব্যবহার হার' : 'Credit Utilization'}</span>
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-bold text-[var(--color-text-primary)]">**.0%</span>
                        <span className="text-xs text-emerald-600 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40">Healthy (&lt;30%)</span>
                      </div>
                      <div className="w-full bg-[var(--color-border)] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '19%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Security Section (NEW) */}
        <section id="security" className="w-full bg-slate-900 py-20 text-white border-y border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Shield className="mx-auto h-16 w-16 text-emerald-400 mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {isBn ? 'ব্যাংক-গ্রেড নিরাপত্তা' : 'Bank-Grade Security'}
            </h2>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-12">
              {isBn 
                ? 'আপনার আর্থিক ডেটা শুধুমাত্র আপনারই। আমরা আধুনিক প্রযুক্তির মাধ্যমে সর্বোচ্চ নিরাপত্তা নিশ্চিত করি।' 
                : 'Your financial data is strictly yours. We employ state-of-the-art security measures to ensure absolute privacy and protection.'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors">
                <Lock className="h-10 w-10 text-emerald-400 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2">{isBn ? 'AES-256 এনক্রিপশন' : 'AES-256 Encryption'}</h3>
                <p className="text-slate-400 text-sm">
                  {isBn 
                    ? 'ডেটাবেসে সংরক্ষণ করার সময় আপনার সকল সংবেদনশীল তথ্য শক্তিশালি এনক্রিপশন অ্যালগরিদম দিয়ে সুরক্ষিত থাকে।' 
                    : 'All sensitive financial data is encrypted at rest using industry-standard AES-256 encryption algorithms.'}
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors">
                <Shield className="h-10 w-10 text-emerald-400 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2">{isBn ? 'কোনো ডেটা শেয়ারিং নেই' : 'No Data Selling'}</h3>
                <p className="text-slate-400 text-sm">
                  {isBn 
                    ? 'আপনার ডেটা আমরা তৃতীয় কোনো পক্ষের কাছে বিক্রি করি না। আপনার প্রাইভেসির সাথে কোনো আপস নয়।' 
                    : 'We never sell, rent, or share your personal financial data with third-party advertisers or data brokers.'}
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors">
                <Layers className="h-10 w-10 text-emerald-400 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2">{isBn ? 'কঠোর অডিট ট্রেইল' : 'Immutable Audit Trails'}</h3>
                <p className="text-slate-400 text-sm">
                  {isBn 
                    ? 'প্রতিটি ট্রানজেকশন এবং লগইনের হিসাব ব্যাকএন্ডে কঠোরভাবে নিরীক্ষণ করা হয় যেন কোনো অননুমোদিত কাজ না ঘটে।' 
                    : 'Every critical action is logged immutably, ensuring accountability and preventing unauthorized modifications.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              {isBn ? 'কেন Safivra ব্যবহার করবেন?' : 'Why choose Safivra?'}
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              {isBn
                ? 'মানি ম্যানেজমেন্ট অ্যাপের প্রচলিত সমস্যাগুলো দূর করে, আমরা এনেছি সঠিক ডাবল-এন্ট্রি হিসাব ব্যবস্থা।'
                : 'Built to solve the flaws of traditional expense trackers with true double-entry accuracy.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-emerald-500/30 transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Landmark size={24} />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                {isBn ? 'সঠিক হিসাব' : 'True Accounting'}
              </h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm sm:text-base">
                {isBn
                  ? 'ডাবল-এন্ট্রি সিস্টেমের মাধ্যমে একটি টাকাও হারিয়ে যাবে না। ট্রান্সফার করলে খরচ হিসেবে দেখাবে না।'
                  : 'Double-entry ledger ensures zero missing funds. Transfers between accounts are never counted as expenses.'}
              </p>
            </div>
            
            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-blue-500/30 transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <CreditCard size={24} />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                {isBn ? 'ক্রেডিট কার্ড ম্যানেজমেন্ট' : 'Credit Card Logic'}
              </h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm sm:text-base">
                {isBn
                  ? 'কার্ড দিয়ে কেনাকাটা করলে আপনার নেট সম্পদ কমে, কিন্তু ক্যাশ কমে না। বিল পেমেন্টের সময় সঠিক হিসাব হয়।'
                  : 'Spending on credit doesn\'t reduce your cash balance immediately. Pay your statement with zero double-counting.'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-purple-500/30 transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <PieChart size={24} />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                {isBn ? 'নেট ওয়েলথ ট্র্যাকিং' : 'Net Worth Tracking'}
              </h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm sm:text-base">
                {isBn
                  ? 'সম্পদ এবং দায়ের সঠিক পার্থক্যের মাধ্যমে আপনার রিয়েল-টাইম ফাইন্যান্সিয়াল হেলথ জানুন।'
                  : 'Get a real-time, accurate picture of your financial health by properly contrasting assets and liabilities.'}
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-[var(--color-border)] py-12 bg-[var(--color-bg-surface)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                <Wallet className="text-white h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-[var(--color-text-primary)]">Safivra</span>
            </div>
            <div className="text-[var(--color-text-muted)] text-sm">
              © {new Date().getFullYear()} Safivra. {isBn ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
