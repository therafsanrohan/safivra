export const dynamic = "force-dynamic";

import { createAdminClient } from '../../utils/supabase/server'

export default async function ZakatAdminPage() {
  const supabase = createAdminClient()

  // Fetch active rule sets, rate snapshots, and calculation summary in parallel
  const [
    { data: ruleSets },
    { data: rateSnapshots },
    { data: recentCalculations, count: totalCalculationsCount }
  ] = await Promise.all([
    supabase
      .from('zakat_rule_sets')
      .select('*')
      .order('version', { ascending: false }),
    supabase
      .from('zakat_rate_snapshots')
      .select('*')
      .order('fetch_timestamp', { ascending: false })
      .limit(10),
    supabase
      .from('zakat_calculations')
      .select('id, user_id, status, net_zakatable_wealth, estimated_zakat_amount, currency, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5)
  ])

  const activeRule = ruleSets?.[0]
  const latestSnapshot = rateSnapshots?.[0]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">Zakat Management</h1>
        <p className="mt-1 text-sm text-slate-400">
          Monitor Nisab thresholds, metal exchange rates, global rule parameters, and member calculation statistics.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-slate-900/90 rounded-2xl p-5 shadow-sm border border-slate-800">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Active Nisab Rule</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-2">{activeRule?.name || 'Standard Rules'}</h3>
          <p className="text-xs text-slate-400 mt-1">Rate: {activeRule?.zakat_percentage ?? 2.5}% • Hawl: {activeRule?.hawl_days ?? 354} Days</p>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-5 shadow-sm border border-slate-800">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Gold Rate (22K/24K)</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-2">
            BDT {latestSnapshot?.gold_rate_per_gram ? Number(latestSnapshot.gold_rate_per_gram).toLocaleString() : '9,250'} <span className="text-xs font-normal text-slate-400">/ gram</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">Provider: {latestSnapshot?.provider_name || 'BAJUS Market'}</p>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-5 shadow-sm border border-slate-800">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Silver Rate</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-2">
            BDT {latestSnapshot?.silver_rate_per_gram ? Number(latestSnapshot.silver_rate_per_gram).toLocaleString() : '105.50'} <span className="text-xs font-normal text-slate-400">/ gram</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">Updated: {latestSnapshot ? new Date(latestSnapshot.fetch_timestamp).toLocaleDateString() : 'Baseline'}</p>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-5 shadow-sm border border-slate-800">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Total Calculations</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-2">{totalCalculationsCount || 0}</h3>
          <p className="text-xs text-slate-400 mt-1">Member assessments recorded</p>
        </div>
      </div>

      {/* Active Rule Set Detail */}
      <div className="bg-slate-900/90 rounded-2xl shadow-sm border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Configured Rule Sets</h2>
            <p className="text-sm text-slate-400">Scholar-verified compliance guidelines and hawl periods.</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            v{activeRule?.version || '1.0'} Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-400">Nisab Standard</p>
            <p className="text-base font-bold text-slate-100 capitalize mt-1">{activeRule?.nisab_standard || 'gold'}</p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-400">Percentage Rate</p>
            <p className="text-base font-bold text-slate-100 mt-1">{activeRule?.zakat_percentage ?? 2.5}%</p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-400">Lunar Hawl Days</p>
            <p className="text-base font-bold text-slate-100 mt-1">{activeRule?.hawl_days ?? 354} Days</p>
          </div>
        </div>

        {activeRule?.scholar_notes && (
          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <span className="font-semibold">Scholar Notes: </span>
            {activeRule.scholar_notes}
          </div>
        )}
      </div>

      {/* Recent Metal Rate Snapshots History Table */}
      <div className="bg-slate-900/90 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">Rate Snapshots History</h2>
          <p className="text-sm text-slate-400">Historical gold and silver rates fetched or overridden by admins.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-left">
            <thead className="bg-slate-950/60">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Provider</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Gold Rate (/g)</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Silver Rate (/g)</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {rateSnapshots?.map((snapshot) => (
                <tr key={snapshot.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-100 font-medium">
                    {new Date(snapshot.fetch_timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {snapshot.provider_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-100 font-semibold">
                    BDT {Number(snapshot.gold_rate_per_gram).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-100 font-semibold">
                    BDT {Number(snapshot.silver_rate_per_gram).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      snapshot.is_override ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30'
                    }`}>
                      {snapshot.is_override ? 'Admin Override' : 'Market Sync'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!rateSnapshots || rateSnapshots.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
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
