import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { CurrencyCode, AccountType } from '../../types/finance';
import { Settings, User, Database, RotateCcw, Plus, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { profile, updateProfile, accounts, addAccount, resetAllData } = useFinance();

  const [fullName, setFullName] = useState<string>(profile.fullName);
  const [currency, setCurrency] = useState<CurrencyCode>(profile.currency);
  const [targetFireAge, setTargetFireAge] = useState<number>(profile.targetFireAge);

  // New Account Form State
  const [showAddAccount, setShowAddAccount] = useState<boolean>(false);
  const [newAccName, setNewAccName] = useState<string>('');
  const [newAccType, setNewAccType] = useState<AccountType>('checking');
  const [newAccInst, setNewAccInst] = useState<string>('');
  const [newAccBal, setNewAccBal] = useState<string>('0');
  const [newAccIsLiability, setNewAccIsLiability] = useState<boolean>(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName,
      currency,
      targetFireAge,
    });
    alert('Profile settings updated successfully.');
  };

  const handleAccountCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName) return;

    addAccount({
      name: newAccName,
      type: newAccType,
      institution: newAccInst || 'Bank',
      balance: parseFloat(newAccBal) || 0,
      isLiability: newAccIsLiability,
      color: newAccIsLiability ? '#EF4444' : '#10B981',
    });

    setNewAccName('');
    setNewAccInst('');
    setNewAccBal('0');
    setShowAddAccount(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-300" />
          <h2 className="text-xl font-extrabold text-white">System Settings & Accounts</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Customize currency, user profile, wealth targets, and linked financial accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile & Currency Settings */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 border-b border-white/10 pb-3">
            <User className="w-4 h-4 text-emerald-400" /> User Profile & Parameters
          </h3>

          <form onSubmit={handleProfileSave} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Base Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (CA$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Target FIRE Age</label>
                <input
                  type="number"
                  value={targetFireAge}
                  onChange={(e) => setTargetFireAge(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" /> Update Profile
            </button>
          </form>
        </div>

        {/* Linked Financial Accounts Manager */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-400" /> Linked Accounts ({accounts.length})
            </h3>
            <button
              onClick={() => setShowAddAccount(!showAddAccount)}
              className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/30 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 hover:bg-violet-500/20"
            >
              <Plus className="w-3.5 h-3.5" /> Add Account
            </button>
          </div>

          {showAddAccount && (
            <form onSubmit={handleAccountCreate} className="bg-slate-900/90 p-4 rounded-xl border border-white/10 space-y-3">
              <input
                type="text"
                placeholder="Account Name (e.g. Fidelity Roth IRA)"
                required
                value={newAccName}
                onChange={(e) => setNewAccName(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newAccType}
                  onChange={(e) => {
                    const t = e.target.value as AccountType;
                    setNewAccType(t);
                    setNewAccIsLiability(t === 'credit_card' || t === 'loan');
                  }}
                  className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">High Yield Savings</option>
                  <option value="investment">Investment Brokerage</option>
                  <option value="credit_card">Credit Card (Liability)</option>
                  <option value="loan">Personal/Auto Loan (Liability)</option>
                </select>

                <input
                  type="number"
                  step="0.01"
                  placeholder="Starting Balance"
                  value={newAccBal}
                  onChange={(e) => setNewAccBal(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-violet-500 text-white font-bold text-xs rounded-lg hover:brightness-110"
              >
                Create Account
              </button>
            </form>
          )}

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {accounts.map((acc) => (
              <div key={acc.id} className="p-3 bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-200">{acc.name}</p>
                  <p className="text-slate-500 text-[10px] uppercase">{acc.type} • {acc.institution}</p>
                </div>
                <span className={`font-bold ${acc.isLiability ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ${acc.balance.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reset System Storage */}
      <div className="glass-panel p-6 border-rose-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-rose-400 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" /> Reset Factory State
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Restores initial seed portfolio accounts, demo transactions, and literacy scores.
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset all data back to factory demonstration mode?')) {
                resetAllData();
              }
            }}
            className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold hover:bg-rose-500/20 transition-all"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
};
