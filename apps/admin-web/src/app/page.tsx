export const dynamic = "force-dynamic";

import { createAdminClient } from '../utils/supabase/server'
import LiveRefreshClock from '../components/LiveRefreshClock'

export default async function OverviewPage() {
  const supabase = createAdminClient()

  // Run multiple read-only queries in parallel for ultra-fast response
  const [
    { count: registeredMembersCount },
    { data: authUsersData },
    { count: activeAdminsCount },
    { count: dailyTransactions },
    { data: recentRegistrations },
    { data: recentAudits },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.auth.admin.listUsers(),
    supabase.from('admin_accounts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase
      .from('ledger_entries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
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

  // Compute Active vs Inactive based on 3 days threshold (3 * 24 * 60 * 60 * 1000 ms)
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
  const now = Date.now()

  let activeUsersCount = 0
  let inactiveUsersCount = 0

  const usersList = authUsersData?.users || []
  usersList.forEach(u => {
    if (u.last_sign_in_at) {
      const lastSignInTime = new Date(u.last_sign_in_at).getTime()
      if (now - lastSignInTime <= THREE_DAYS_MS) {
        activeUsersCount++
      } else {
        inactiveUsersCount++
      }
    } else {
      inactiveUsersCount++
    }
  })

  // Dynamic counts from database
  const totalRegisteredMembers = registeredMembersCount ?? usersList.length ?? 0
  const totalActiveAdmins = (activeAdminsCount && activeAdminsCount > 0) ? activeAdminsCount : 1

  const stats = [
    {
      name: 'Registered Members',
      stat: totalRegisteredMembers,
      badge: 'Database Profiles',
      icon: (
        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      name: 'Active Users (≤3 Days)',
      stat: activeUsersCount,
      badge: 'Active (3 Days)',
      icon: (
        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Inactive Users (>3 Days)',
      stat: inactiveUsersCount,
      badge: 'Inactive (>3 Days)',
      icon: (
        <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Active Admins',
      stat: totalActiveAdmins,
      badge: 'Admin Console',
      icon: (
        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
  ]

  return (
    <div className="space-y-8">
      {/* Dark Theme Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-[#064E3B] rounded-3xl p-6 sm:p-8 text-slate-100 shadow-xl border border-emerald-900/40 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
            System Active
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">Safivra Operations Console</h1>
          <p className="mt-2 text-sm text-emerald-200/70 max-w-xl">
            Real-time active member telemetry, 3-day user inactivity monitoring, Zakat compliance engine, and broadcast notification engine.
          </p>
          <LiveRefreshClock />
        </div>
      </div>


      {/* Grid Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="bg-emerald-950/20 backdrop-blur-xl rounded-2xl p-5 shadow-sm border border-emerald-900/40 hover:border-emerald-800/60 transition-all relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-900/50">
                {item.icon}
              </div>
              <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-900/30 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                {item.badge}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-emerald-200/60 uppercase tracking-wider">{item.name}</p>
              <p className="text-3xl font-bold text-white mt-1">{item.stat.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Registrations */}
        <div className="bg-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-900/40 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-900/40">
              <h2 className="text-lg font-semibold text-white">Recent Registrations</h2>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">Latest 5</span>
            </div>
            <ul role="list" className="divide-y divide-emerald-900/30">
              {recentRegistrations?.map((person) => (
                <li key={person.id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-900/40 border border-emerald-800/40 text-emerald-200 font-bold flex items-center justify-center text-sm shrink-0">
                      {(person.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {person.full_name || 'Unnamed User'}
                      </p>
                      <p className="text-xs text-emerald-200/50 truncate font-mono mt-0.5">
                        {person.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-emerald-200/70 block">
                      {new Date(person.created_at).toLocaleDateString()}
                    </span>
                    {person.is_suspended ? (
                      <span className="text-[10px] font-semibold text-rose-400 uppercase">Suspended</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase">Active</span>
                    )}
                  </div>
                </li>
              ))}
              {(!recentRegistrations || recentRegistrations.length === 0) && (
                <li className="py-6 text-center text-sm text-emerald-200/50">No member registrations found.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="bg-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-900/40 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-900/40">
              <h2 className="text-lg font-semibold text-white">System Audit Trail</h2>
              <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">Live Logs</span>
            </div>
            <ul role="list" className="divide-y divide-emerald-900/30">
              {recentAudits?.map((log) => (
                <li key={log.id} className="py-3.5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-900/40 text-emerald-300 font-mono mb-1 border border-emerald-800/40">
                        {log.action}
                      </span>
                      <p className="text-xs text-emerald-200/60 truncate">
                        Resource: {log.resource_type || 'System'}
                      </p>
                    </div>
                    <span className="text-xs text-emerald-200/50 shrink-0 font-mono">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </li>
              ))}
              {(!recentAudits || recentAudits.length === 0) && (
                <li className="py-6 text-center text-sm text-emerald-200/50">No recent administrative action logged.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}


