export const dynamic = "force-dynamic";

import { createAdminClient } from '../../utils/supabase/server'

export default async function AuditPage() {
  const supabase = createAdminClient()

  // Get audit logs, ordered by most recent first
  const { data: logs } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white tracking-tight">Audit Trail</h1>
        <p className="mt-2 text-sm text-emerald-200/60">
          A secure, immutable record of all administrative actions and account governance events.
        </p>
      </div>

      <div className="bg-emerald-950/20 rounded-2xl border border-emerald-900/40 overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-emerald-900/40">
            <thead className="bg-emerald-950/40">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Actor (Admin ID)
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Action
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Resource
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/30 text-sm">
              {logs?.map((log) => (
                <tr key={log.id} className="hover:bg-emerald-900/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-emerald-200/70">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-emerald-300/80 font-mono bg-emerald-900/40 px-2 py-1 rounded w-fit border border-emerald-800/40">
                      {log.actor_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                    {log.resource_type} ({log.resource_id || 'N/A'})
                  </td>
                </tr>
              ))}
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-emerald-200/50">
                    No audit logs recorded yet.
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

