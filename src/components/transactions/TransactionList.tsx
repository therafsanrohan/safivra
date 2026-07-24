import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Trash2, Search } from 'lucide-react';

export const TransactionList: React.FC = () => {
  const { transactions, accounts, categories, deleteTransaction, profile } = useFinance();
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      (tx.merchant && tx.merchant.toLowerCase().includes(search.toLowerCase()));

    const matchesType = selectedType === 'all' || tx.type === selectedType;
    const matchesAccount = selectedAccount === 'all' || tx.accountId === selectedAccount;

    return matchesSearch && matchesType && matchesAccount;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filters Header */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2 bg-slate-900/90 border border-white/10 px-3 py-2 rounded-xl">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search description, merchant, or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
            <option value="transfer">Transfers</option>
          </select>

          {/* Account Filter */}
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass-panel p-4 space-y-2">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="font-bold text-sm text-slate-200">Transaction History</h3>
          <span className="text-xs text-slate-400">{filtered.length} entries</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No transactions found matching your filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((tx) => {
              const acc = accounts.find((a) => a.id === tx.accountId);
              const cat = categories.find((c) => c.id === tx.categoryId);

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : tx.type === 'expense'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : tx.type === 'expense' ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : (
                        <ArrowLeftRight className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-100">{tx.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{tx.merchant || acc?.name}</span>
                        {cat && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full border border-white/10"
                            style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                          >
                            {cat.name}
                          </span>
                        )}
                        <span className="text-slate-500 text-[10px]">{formatDate(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold text-sm ${
                        tx.type === 'income'
                          ? 'text-emerald-400'
                          : tx.type === 'expense'
                          ? 'text-slate-200'
                          : 'text-indigo-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                      {formatCurrency(tx.amount, profile.currency)}
                    </span>

                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="Delete Transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
