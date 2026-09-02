import React, { useState } from 'react';
import { Calculator, Landmark, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { DpsEstimator } from './DpsEstimator';
import { EmiEstimator } from './EmiEstimator';

export const ToolsPage: React.FC = () => {
  const { locale } = useLanguage();
  const isBn = locale === 'bn';
  const [activeTab, setActiveTab] = useState<'dps' | 'emi'>('dps');

  return (
    <div className="page-container pt-5 space-y-6 pb-20 fade-in">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Calculator className="text-emerald-500" />
          {isBn ? 'ফাইন্যান্সিয়াল টুলস' : 'Financial Tools'}
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm">
          {isBn ? 'আপনার সঞ্চয় এবং লোনের প্ল্যানিং করুন খুব সহজে।' : 'Calculate and plan your savings and loans easily.'}
        </p>
      </header>

      {/* Custom Tab Navigation */}
      <div className="flex bg-[var(--color-bg-surface)] p-1.5 rounded-xl border border-[var(--color-border)] shadow-sm max-w-sm">
        <button
          onClick={() => setActiveTab('dps')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'dps'
              ? 'bg-emerald-50 text-emerald-700 shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-slate-50'
          }`}
        >
          <Sparkles size={18} />
          {isBn ? 'ডিপিএস ক্যালকুলেটর' : 'DPS Estimator'}
        </button>
        <button
          onClick={() => setActiveTab('emi')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'emi'
              ? 'bg-emerald-50 text-emerald-700 shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-slate-50'
          }`}
        >
          <Landmark size={18} />
          {isBn ? 'লোন ইএমআই' : 'Loan EMI'}
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'dps' ? <DpsEstimator /> : <EmiEstimator />}
      </div>
    </div>
  );
};

export default ToolsPage;
