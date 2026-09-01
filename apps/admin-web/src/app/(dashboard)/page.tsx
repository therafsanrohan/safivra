export const dynamic = "force-dynamic";

import { createAdminClient } from '../../utils/supabase/server'

export default async function OverviewPage() {
  const supabase = createAdminClient()

  // Run multiple read-only queries in parallel
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
      .select('id, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('admin_audit_logs')
      .select('id, actor_id, action, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { name: 'Registered Members', stat: registeredMembers || 0 },
    { name: 'Daily Transactions', stat: dailyTransactions || 0 },
    { name: '7-Day Transactions', stat: sevenDayTransactions || 0 },
    { name: 'Active Admins', stat: activeAdmins || 0 },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Overview</h1>
        <p className="mt-2 text-sm text-gray-500">
          Last refreshed: {new Date().toLocaleString()}
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-2xl bg-white px-4 pb-12 pt-5 shadow-sm border border-gray-100 sm:px-6 sm:pt-6"
          >
            <dt>
              <p className="truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="flex items-baseline pb-6 sm:pb-7">
              <p className="text-3xl font-semibold text-gray-900">{item.stat}</p>
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Registrations</h2>
          <div className="flow-root">
            <ul role="list" className="-my-5 divide-y divide-gray-100">
              {recentRegistrations?.map((person) => (
                <li key={person.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {person.full_name || 'Unnamed User'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        Joined {new Date(person.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
              {(!recentRegistrations || recentRegistrations.length === 0) && (
                <li className="py-4 text-sm text-gray-500">No recent registrations.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Audit Activity</h2>
          <div className="flow-root">
            <ul role="list" className="-my-5 divide-y divide-gray-100">
              {recentAudits?.map((log) => (
                <li key={log.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {log.action}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
              {(!recentAudits || recentAudits.length === 0) && (
                <li className="py-4 text-sm text-gray-500">No recent activity.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
