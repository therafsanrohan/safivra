export const dynamic = "force-dynamic";

import { createAdminClient } from '../utils/supabase/server'

export default async function OverviewPage() {
  const supabase = createAdminClient()

  // Run multiple read-only queries in parallel for ultra-fast response
  const [
    { count: registeredMembers },
    { count: dailyTransactions },
    { count: sevenDayTransactions },
    { count: activeAdmins },
    { data: recentRegistrations },
    { data: recentAudits },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('ledger_entries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase
      .from('ledger_entries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('admin_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('profiles')
      .select('id, full_name, created_at, currency, is_suspended')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('admin_audit_logs')
      .select('id, actor_id, action, resource_type, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    {
      name: 'Registered Members',
      stat: registeredMembers || 0,
      badge: 'Active Accounts',
      icon: (
        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      name: 'Daily Transactions',
      stat: dailyTransactions || 0,
      badge: 'Today',
      icon: (
        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      name: '7-Day Transactions',
      stat: sevenDayTransactions || 0,
      badge: 'Past Week',
      icon: (
        <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: 'Active Admins',
      stat: activeAdmins || 0,
      badge: 'Secured',
      icon: (
        <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
  ]

  return (
    <div className="space-y-8">
      {/* Dark Theme Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-[#064E3B] rounded-3xl p-6 sm:p-8 text-slate-100 shadow-xl border border-slate-800/90 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
            System Active
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Safivra Operations Console</h1>
          <p className="mt-2 text-sm text-slate-300 max-w-xl">
            Real-time telemetry, member directory control, Zakat compliance monitoring, and immutable audit logs.
          </p>
          <div className="mt-4 text-xs text-slate-400 font-mono">
            Refreshed at: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Grid Stats (Dark Mode, SVG Icons) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="bg-slate-900/90 rounded-2xl p-5 shadow-sm border border-slate-800 hover:border-slate-700 transition-all relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                {item.icon}
              </div>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700/50">
                {item.badge}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.name}</p>
              <p className="text-3xl font-bold text-slate-100 mt-1">{item.stat.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Registrations */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-slate-100">Recent Registrations</h2>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">Latest 5</span>
            </div>
            <ul role="list" className="divide-y divide-slate-800/80">
              {recentRegistrations?.map((person) => (
                <li key={person.id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center text-sm shrink-0">
                      {(person.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {person.full_name || 'Unnamed User'}
                      </p>
                      <p className="text-xs text-slate-500 truncate font-mono mt-0.5">
                        {person.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 block">
                      {new Date(person.created_at).toLocaleDateString()}
                    </span>
                    {person.is_suspended ? (
                      <span className="text-[10px] font-semibold text-red-400 uppercase">Suspended</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase">Active</span>
                    )}
                  </div>
                </li>
              ))}
              {(!recentRegistrations || recentRegistrations.length === 0) && (
                <li className="py-6 text-center text-sm text-slate-500">No member registrations found.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-slate-100">System Audit Trail</h2>
              <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">Live Logs</span>
            </div>
            <ul role="list" className="divide-y divide-slate-800/80">
              {recentAudits?.map((log) => (
                <li key={log.id} className="py-3.5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 font-mono mb-1 border border-slate-700">
                        {log.action}
                      </span>
                      <p className="text-xs text-slate-400 truncate">
                        Resource: {log.resource_type || 'System'}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0 font-mono">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </li>
              ))}
              {(!recentAudits || recentAudits.length === 0) && (
                <li className="py-6 text-center text-sm text-slate-500">No recent administrative action logged.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
