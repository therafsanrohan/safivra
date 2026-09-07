'use client'

import { useTheme } from '@/components/ThemeProvider'

interface AuditLog {
  id: string
  created_at: string
  actor_id: string
  action: string
  resource_type: string
  resource_id?: string
}

export default function AuditClient({ logs }: { logs: AuditLog[] }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Audit Trail
        </h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-emerald-200/60' : 'text-slate-600'}`}>
          A secure, immutable record of all administrative actions and account governance events.
        </p>
      </div>

      <div className={`rounded-2xl border overflow-hidden backdrop-blur-xl transition-all ${
        isDark 
          ? 'bg-emerald-950/20 border-emerald-900/40 shadow-xl' 
          : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
      }`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y text-left">
            <thead className={isDark ? 'bg-emerald-950/40 border-b border-emerald-900/40' : 'bg-slate-100 border-b border-slate-200'}>
              <tr>
                <th scope="col" className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-700'}`}>
                  Timestamp
                </th>
                <th scope="col" className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-700'}`}>
                  Actor (Admin ID)
                </th>
                <th scope="col" className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-700'}`}>
                  Action
                </th>
                <th scope="col" className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-700'}`}>
                  Resource
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y text-sm ${isDark ? 'divide-emerald-900/30' : 'divide-slate-200'}`}>
              {logs?.map((log) => (
                <tr key={log.id} className={isDark ? 'hover:bg-emerald-900/20 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                  <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-xs font-mono px-2 py-1 rounded w-fit border ${
                      isDark 
                        ? 'bg-emerald-900/40 text-emerald-300 border-emerald-800/40' 
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {log.actor_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      isDark 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {log.resource_type} ({log.resource_id || 'N/A'})
                  </td>
                </tr>
              ))}
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={4} className={`px-6 py-12 text-center ${isDark ? 'text-emerald-200/50' : 'text-slate-500'}`}>
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
