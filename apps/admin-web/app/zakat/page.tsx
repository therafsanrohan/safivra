'use client';
import React, { useState } from 'react';

export default function ZakatSettings() {
  const [goldPrice, setGoldPrice] = useState('11000'); // BDT per gram (dummy default)
  const [silverPrice, setSilverPrice] = useState('150'); // BDT per gram (dummy default)
  
  const goldNisab = parseFloat(goldPrice) * 85;
  const silverNisab = parseFloat(silverPrice) * 595;
  const activeNisab = Math.min(goldNisab, silverNisab);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would POST to /api/v1/zakat/config 
    alert(`Nisab updated to ${activeNisab.toLocaleString()} BDT. \n(Note: Connect to NestJS API to persist)`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-8 text-emerald-400">Safivra Admin</h1>
        <nav className="flex-1 space-y-2">
          <a href="/" className="block px-4 py-2 hover:bg-slate-800 rounded-md text-gray-300 transition-colors">Dashboard</a>
          <a href="/zakat" className="block px-4 py-2 bg-slate-800 rounded-md font-medium text-emerald-300">Zakat Settings</a>
          <a href="/users" className="block px-4 py-2 hover:bg-slate-800 rounded-md text-gray-300 transition-colors">Users & Roles</a>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Zakat Policy Engine Configuration</h2>
          <p className="text-gray-500 mt-2">Manage live metal prices to adjust global Nisab thresholds dynamically across the platform.</p>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl">
          <form onSubmit={handleSave} className="space-y-6">
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">Current Market Prices</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gold Price per Gram (BDT)</label>
                  <input 
                    type="number" 
                    value={goldPrice}
                    onChange={(e) => setGoldPrice(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Based on 24k Gold (85 grams)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Silver Price per Gram (BDT)</label>
                  <input 
                    type="number" 
                    value={silverPrice}
                    onChange={(e) => setSilverPrice(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Based on pure Silver (595 grams)</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-4">Calculated Nisab Thresholds</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex justify-between">
                  <span>Gold Nisab (85g):</span>
                  <span className="font-medium text-slate-900">৳{goldNisab.toLocaleString()}</span>
                </li>
                <li className="flex justify-between">
                  <span>Silver Nisab (595g):</span>
                  <span className="font-medium text-slate-900">৳{silverNisab.toLocaleString()}</span>
                </li>
                <li className="flex justify-between pt-3 border-t border-slate-200 mt-3 text-emerald-700 font-bold text-lg">
                  <span>Active Live Nisab:</span>
                  <span>৳{activeNisab.toLocaleString()}</span>
                </li>
              </ul>
            </div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors">
              Update Live Policy
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
