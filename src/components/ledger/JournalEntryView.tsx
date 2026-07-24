import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { BookOpen, RefreshCw, FileText } from 'lucide-react';

export const JournalEntryView: React.FC = () => {
  const { journalEntries, accounts, reverseJournalEntry, profile } = useFinance();
  const [filterMemo, setFilterMemo] = useState<string>('');

  const filteredEntries = journalEntries.filter((je) =>
    je.memo.toLowerCase().includes(filterMemo.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 glow-violet">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-violet-400" />
              <h2 className="text-xl font-extrabold text-white">Double-Entry Ledger & Chart of Accounts</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Immutable accounting audit trail with debits, credits, and journal reversal integrity.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-white/10 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Journal Entries</span>
            <span className="text-xl font-black text-violet-400">{journalEntries.length}</span>
          </div>
        </div>
      </div>

      {/* Chart of Accounts Summary */}
      <div className="glass-panel p-5 space-y-3">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 border-b border-white/10 pb-2">
          <FileText className="w-4 h-4 text-emerald-400" /> Chart of Accounts Ledger Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
            <span className="text-xs text-slate-400 block">Assets & Checking</span>
            <span className="text-base font-bold text-emerald-400">
              {formatCurrency(
                accounts.filter((a) => !a.isLiability).reduce((s, a) => s + a.balance, 0),
                profile.currency
              )}
            </span>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
            <span className="text-xs text-slate-400 block">Liabilities & Payables</span>
            <span className="text-base font-bold text-rose-400">
              {formatCurrency(
                accounts.filter((a) => a.isLiability).reduce((s, a) => s + a.balance, 0),
                profile.currency
              )}
            </span>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
            <span className="text-xs text-slate-400 block">Equity Balance</span>
            <span className="text-base font-bold text-violet-400">
              {formatCurrency(
                accounts.reduce((s, a) => s + (a.isLiability ? -a.balance : a.balance), 0),
                profile.currency
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Journal Entries Audit Trail */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-200">Immutable Audit Trail</h3>
          <input
            type="text"
            placeholder="Search memo or entry..."
            value={filterMemo}
            onChange={(e) => setFilterMemo(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1 text-xs text-slate-200 focus:outline-none"
          />
        </div>

        <div className="space-y-4">
          {filteredEntries.map((je) => (
            <div
              key={je.id}
              className={`p-4 rounded-xl border space-y-3 transition-all ${
                je.isReversed
                  ? 'bg-rose-500/5 border-rose-500/20 opacity-60'
                  : 'bg-slate-900/80 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-violet-400">JE #{je.entryNumber}</span>
                  <span className="text-slate-200 font-semibold">{je.memo}</span>
                  {je.isReversed && (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      REVERSED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{formatDate(je.date)}</span>
                  {!je.isReversed && (
                    <button
                      onClick={() => reverseJournalEntry(je.id)}
                      className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded"
                    >
                      <RefreshCw className="w-3 h-3" /> Reverse Entry
                    </button>
                  )}
                </div>
              </div>

              {/* Debit & Credit Lines Table */}
              <div className="divide-y divide-white/5 text-xs">
                <div className="grid grid-cols-12 py-1 font-semibold text-slate-400 text-[11px]">
                  <span className="col-span-6">Account & Description</span>
                  <span className="col-span-3 text-right">Debit</span>
                  <span className="col-span-3 text-right">Credit</span>
                </div>
                {je.lines.map((line) => (
                  <div key={line.id} className="grid grid-cols-12 py-1.5 text-slate-300">
                    <div className="col-span-6 font-medium">
                      <span>{line.accountName}</span>
                      <span className="block text-[10px] text-slate-500">{line.description}</span>
                    </div>
                    <span className="col-span-3 text-right font-mono text-emerald-400 font-bold">
                      {line.debit > 0 ? formatCurrency(line.debit, profile.currency) : '-'}
                    </span>
                    <span className="col-span-3 text-right font-mono text-violet-400 font-bold">
                      {line.credit > 0 ? formatCurrency(line.credit, profile.currency) : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
