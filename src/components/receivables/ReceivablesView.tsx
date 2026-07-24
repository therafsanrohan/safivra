import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { DueType } from '../../types/finance';
import { HandCoins, ArrowUpRight, ArrowDownRight, Plus, Check, Calendar } from 'lucide-react';

export const ReceivablesView: React.FC = () => {
  const { receivables, addReceivable, settleReceivable, profile } = useFinance();
  const [showAdd, setShowAdd] = useState<boolean>(false);

  const [counterparty, setCounterparty] = useState<string>('');
  const [type, setType] = useState<DueType>('receivable');
  const [amount, setAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  const totalReceivable = receivables.filter((r) => r.type === 'receivable').reduce((s, r) => s + r.balanceDue, 0);
  const totalPayable = receivables.filter((r) => r.type === 'payable' || r.type === 'loan').reduce((s, r) => s + r.balanceDue, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!counterparty || !numAmt || numAmt <= 0) return;

    addReceivable({
      counterparty,
      type,
      totalAmount: numAmt,
      balanceDue: numAmt,
      apr: 0,
      dueDate,
      status: 'pending',
      notes,
    });

    setCounterparty('');
    setAmount('');
    setNotes('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 glow-emerald">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <HandCoins className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-extrabold text-white">Loans, Dues & Receivables Manager</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Track money owed to you (Receivables) vs dues you owe to others (Payables/Loans).
            </p>
          </div>

          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:brightness-110 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add Due / Loan Record
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-4 flex items-center justify-between border-emerald-500/20">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Owed to You (Receivables)</span>
            <span className="text-2xl font-black text-emerald-400">
              {formatCurrency(totalReceivable, profile.currency)}
            </span>
          </div>
          <ArrowUpRight className="w-8 h-8 text-emerald-400/40" />
        </div>

        <div className="glass-panel p-4 flex items-center justify-between border-rose-500/20">
          <div>
            <span className="text-xs text-slate-400 block font-medium">You Owe (Payables & Loans)</span>
            <span className="text-2xl font-black text-rose-400">
              {formatCurrency(totalPayable, profile.currency)}
            </span>
          </div>
          <ArrowDownRight className="w-8 h-8 text-rose-400/40" />
        </div>
      </div>

      {/* Add Record Form */}
      {showAdd && (
        <form onSubmit={handleSubmit} className="glass-panel p-5 space-y-4 animate-fade-in">
          <h3 className="font-bold text-sm text-slate-200">New Loan / Due Entry</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Counterparty / Person</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe / Client Company"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Record Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DueType)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200"
              >
                <option value="receivable">Money Owed to Me (Receivable)</option>
                <option value="payable">Money I Owe (Payable)</option>
                <option value="loan">Personal Loan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Total Amount ($)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 font-bold"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:brightness-110"
          >
            Save Record
          </button>
        </form>
      )}

      {/* Receivables & Payables List */}
      <div className="glass-panel p-5 space-y-3">
        <h3 className="font-bold text-sm text-slate-200">Active Records ({receivables.length})</h3>

        <div className="space-y-2">
          {receivables.map((rec) => (
            <div
              key={rec.id}
              className="p-4 bg-slate-900/70 border border-white/5 rounded-xl flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">{rec.counterparty}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      rec.type === 'receivable'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {rec.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" /> Due Date: {formatDate(rec.dueDate)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-bold text-sm block text-slate-100">
                    {formatCurrency(rec.balanceDue, profile.currency)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Total: {formatCurrency(rec.totalAmount, profile.currency)}</span>
                </div>

                {rec.balanceDue > 0 && (
                  <button
                    onClick={() => settleReceivable(rec.id, rec.balanceDue)}
                    className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold hover:bg-emerald-500/20 text-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Settle
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
