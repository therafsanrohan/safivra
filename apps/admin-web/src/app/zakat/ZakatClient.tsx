'use client'

import { useTheme } from '@/components/ThemeProvider'

interface RuleSet {
  id: string
  name: string
  version: string
  zakat_percentage: number
  hawl_days: number
  nisab_standard: string
  scholar_notes?: string
}

interface RateSnapshot {
  id: string
  provider_name: string
  gold_rate_per_gram: number
  silver_rate_per_gram: number
  fetch_timestamp: string
  is_override: boolean
}

export default function ZakatClient({
  activeRule,
  latestSnapshot,
  rateSnapshots,
  totalCalculationsCount
}: {
  activeRule?: RuleSet
  latestSnapshot?: RateSnapshot
  rateSnapshots?: RateSnapshot[]
  totalCalculationsCount: number
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="space-y-8">
      <div>
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Zakat Management
        </h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-emerald-200/60' : 'text-slate-600'}`}>
          Monitor Nisab thresholds, metal exchange rates, global rule parameters, and member calculation statistics.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded-2xl p-5 border transition-all ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800 shadow-sm' 
            : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
        }`}>
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active Nisab Rule</p>
          <h3 className={`text-2xl font-bold mt-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {activeRule?.name || 'Standard Rules'}
          </h3>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Rate: {activeRule?.zakat_percentage ?? 2.5}% • Hawl: {activeRule?.hawl_days ?? 354} Days
          </p>
        </div>

        <div className={`rounded-2xl p-5 border transition-all ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800 shadow-sm' 
            : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
        }`}>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Gold Rate (22K/24K)</p>
          <h3 className={`text-2xl font-bold mt-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            BDT {latestSnapshot?.gold_rate_per_gram ? Number(latestSnapshot.gold_rate_per_gram).toLocaleString() : '9,250'}{' '}
            <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ gram</span>
          </h3>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Provider: {latestSnapshot?.provider_name || 'BAJUS Market'}
          </p>
        </div>

        <div className={`rounded-2xl p-5 border transition-all ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800 shadow-sm' 
            : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
        }`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Silver Rate</p>
          <h3 className={`text-2xl font-bold mt-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            BDT {latestSnapshot?.silver_rate_per_gram ? Number(latestSnapshot.silver_rate_per_gram).toLocaleString() : '105.50'}{' '}
            <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ gram</span>
          </h3>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Updated: {latestSnapshot ? new Date(latestSnapshot.fetch_timestamp).toLocaleDateString() : 'Baseline'}
          </p>
        </div>

        <div className={`rounded-2xl p-5 border transition-all ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800 shadow-sm' 
            : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
        }`}>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Calculations</p>
          <h3 className={`text-2xl font-bold mt-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{totalCalculationsCount || 0}</h3>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Member assessments recorded</p>
        </div>
      </div>

      {/* Active Rule Set Detail */}
      <div className={`rounded-2xl border p-6 space-y-4 transition-all ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800 shadow-sm' 
          : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
      }`}>
        <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Configured Rule Sets</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Scholar-verified compliance guidelines and hawl periods.</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
            isDark 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            v{activeRule?.version || '1.0'} Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Nisab Standard</p>
            <p className={`text-base font-bold capitalize mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{activeRule?.nisab_standard || 'gold'}</p>
          </div>
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Percentage Rate</p>
            <p className={`text-base font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{activeRule?.zakat_percentage ?? 2.5}%</p>
          </div>
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lunar Hawl Days</p>
            <p className={`text-base font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{activeRule?.hawl_days ?? 354} Days</p>
          </div>
        </div>

        {activeRule?.scholar_notes && (
          <div className={`mt-4 p-4 rounded-xl text-xs border ${
            isDark 
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' 
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <span className="font-semibold">Scholar Notes: </span>
            {activeRule.scholar_notes}
          </div>
        )}
      </div>

      {/* Recent Metal Rate Snapshots History Table */}
      <div className={`rounded-2xl border overflow-hidden transition-all ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800 shadow-sm' 
          : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
      }`}>
        <div className={`p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Rate Snapshots History</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Historical gold and silver rates fetched or overridden by admins.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y text-left">
            <thead className={isDark ? 'bg-slate-950/60 border-b border-slate-800' : 'bg-slate-100 border-b border-slate-200'}>
              <tr>
                <th scope="col" className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Timestamp</th>
                <th scope="col" className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Provider</th>
                <th scope="col" className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Gold Rate (/g)</th>
                <th scope="col" className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Silver Rate (/g)</th>
                <th scope="col" className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Type</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-sm ${isDark ? 'divide-slate-800/80' : 'divide-slate-200'}`}>
              {rateSnapshots?.map((snapshot) => (
                <tr key={snapshot.id} className={isDark ? 'hover:bg-slate-800/40 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                  <td className={`px-6 py-4 whitespace-nowrap font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {new Date(snapshot.fetch_timestamp).toLocaleString()}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {snapshot.provider_name}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    BDT {Number(snapshot.gold_rate_per_gram).toLocaleString()}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    BDT {Number(snapshot.silver_rate_per_gram).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      snapshot.is_override
                        ? isDark ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-800 border-amber-200'
                        : isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {snapshot.is_override ? 'Admin Override' : 'Market Sync'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!rateSnapshots || rateSnapshots.length === 0) && (
                <tr>
                  <td colSpan={5} className={`px-6 py-8 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    No rate snapshots recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
