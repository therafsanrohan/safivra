import React, { useState } from 'react';
import type { TransactionType } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Check } from 'lucide-react';

export const QuickActionModal: React.FC = () => {
  const { isQuickAddOpen, setIsQuickAddOpen, accounts, categories, addTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [destinationAccountId, setDestinationAccountId] = useState<string>(accounts[1]?.id || '');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  if (!isQuickAddOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) return;

    addTransaction({
      accountId,
      destinationAccountId: type === 'transfer' ? destinationAccountId : undefined,
      categoryId: type === 'expense' ? categoryId : '',
      type,
      amount: numAmount,
      description: description || (type === 'income' ? 'Income' : type === 'expense' ? 'Expense' : 'Transfer'),
      merchant,
      date,
      isRecurring: false,
    });

    // Reset & Close
    setAmount('');
    setDescription('');
    setMerchant('');
    setIsQuickAddOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm transition-all animate-fade-in">
      <div className="w-full sm:max-w-lg bg-[#0d111a] border border-white/10 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Add Transaction
          </h2>
          <button
            onClick={() => setIsQuickAddOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Segmented Toggle */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-medium text-xs transition-all ${
              type === 'expense'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" /> Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-medium text-xs transition-all ${
              type === 'income'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> Income
          </button>
          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-medium text-xs transition-all ${
              type === 'transfer'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" /> Transfer
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Big Amount Field */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-4 py-3 text-2xl font-bold text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Account Selector */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">
                {type === 'transfer' ? 'From Account' : 'Account'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (${acc.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Account (if transfer) or Category */}
            {type === 'transfer' ? (
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">To Account</label>
                <select
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (${acc.balance.toFixed(2)})
                      </option>
                    ))}
                </select>
              </div>
            ) : type === 'expense' ? (
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.bucket.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Description */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Description</label>
              <input
                type="text"
                placeholder="e.g. Grocery restock"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Merchant */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Merchant / Payee</label>
              <input
                type="text"
                placeholder="e.g. Whole Foods"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5 stroke-[3]" /> Save Transaction
          </button>
        </form>
      </div>
    </div>
  );
};
