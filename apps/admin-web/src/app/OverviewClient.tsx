'use client'

import React from 'react'
import { useTheme } from '../components/ThemeProvider'
import LiveRefreshClock from '../components/LiveRefreshClock'

interface StatItem {
  name: string
  stat: number
  badge: string
  icon: React.ReactNode
}

interface Registration {
  id: string
  full_name: string | null
  created_at: string
  is_suspended?: boolean
}

interface AuditLog {
  id: string
  action: string
  resource_type: string | null
  created_at: string
}

export default function OverviewClient({
  stats,
  recentRegistrations,
  recentAudits
}: {
  stats: StatItem[]
  recentRegistrations: Registration[]
  recentAudits: AuditLog[]
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className={`rounded-3xl p-6 sm:p-8 text-white shadow-xl border relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-[#064E3B] border-emerald-900/40' 
          : 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 border-emerald-600'
      }`}>
        <div className="relative z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 mb-3 backdrop-blur-md">
            System Active
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">Safivra Operations Console</h1>
          <p className="mt-2 text-sm text-emerald-100/90 max-w-xl">
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
            className={`rounded-2xl p-5 border transition-all relative overflow-hidden ${
              isDark 
                ? 'bg-emerald-950/20 backdrop-blur-xl border-emerald-900/40 hover:border-emerald-800/60 shadow-sm' 
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-xl border ${
                isDark ? 'bg-emerald-950/60 border-emerald-900/50' : 'bg-slate-50 border-slate-200'
              }`}>
                {item.icon}
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                isDark 
                  ? 'text-emerald-300 bg-emerald-900/30 border-emerald-800/40' 
                  : 'text-emerald-800 bg-emerald-50 border-emerald-200'
              }`}>
                {item.badge}
              </span>
            </div>
            <div className="mt-4">
              <p className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-emerald-200/60' : 'text-slate-500'
              }`}>
                {item.name}
              </p>
              <p className={`text-3xl font-bold mt-1 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {item.stat.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Registrations */}
        <div className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
          isDark 
            ? 'bg-emerald-950/20 backdrop-blur-xl border-emerald-900/40 shadow-sm' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className={`flex items-center justify-between mb-4 pb-3 border-b ${
              isDark ? 'border-emerald-900/40' : 'border-slate-100'
            }`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent Registrations</h2>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>Latest 5</span>
            </div>
            <ul role="list" className={`divide-y ${isDark ? 'divide-emerald-900/30' : 'divide-slate-100'}`}>
              {recentRegistrations?.map((person) => (
                <li key={person.id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-full border font-bold flex items-center justify-center text-sm shrink-0 ${
                      isDark ? 'bg-emerald-900/40 border-emerald-800/40 text-emerald-200' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      {(person.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {person.full_name || 'Unnamed User'}
                      </p>
                      <p className={`text-xs truncate font-mono mt-0.5 ${isDark ? 'text-emerald-200/50' : 'text-slate-400'}`}>
                        {person.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs block ${isDark ? 'text-emerald-200/70' : 'text-slate-500'}`}>
                      {new Date(person.created_at).toLocaleDateString()}
                    </span>
                    {person.is_suspended ? (
                      <span className="text-[10px] font-semibold text-rose-500 uppercase">Suspended</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-500 uppercase">Active</span>
                    )}
                  </div>
                </li>
              ))}
              {(!recentRegistrations || recentRegistrations.length === 0) && (
                <li className={`py-6 text-center text-sm ${isDark ? 'text-emerald-200/50' : 'text-slate-400'}`}>No member registrations found.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
          isDark 
            ? 'bg-emerald-950/20 backdrop-blur-xl border-emerald-900/40 shadow-sm' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className={`flex items-center justify-between mb-4 pb-3 border-b ${
              isDark ? 'border-emerald-900/40' : 'border-slate-100'
            }`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>System Audit Trail</h2>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                isDark ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-blue-700 bg-blue-50 border-blue-200'
              }`}>Live Logs</span>
            </div>
            <ul role="list" className={`divide-y ${isDark ? 'divide-emerald-900/30' : 'divide-slate-100'}`}>
              {recentAudits?.map((log) => (
                <li key={log.id} className="py-3.5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono mb-1 border ${
                        isDark 
                          ? 'bg-emerald-900/40 text-emerald-300 border-emerald-800/40' 
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {log.action}
                      </span>
                      <p className={`text-xs truncate ${isDark ? 'text-emerald-200/60' : 'text-slate-500'}`}>
                        Resource: {log.resource_type || 'System'}
                      </p>
                    </div>
                    <span className={`text-xs shrink-0 font-mono ${isDark ? 'text-emerald-200/50' : 'text-slate-400'}`}>
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </li>
              ))}
              {(!recentAudits || recentAudits.length === 0) && (
                <li className={`py-6 text-center text-sm ${isDark ? 'text-emerald-200/50' : 'text-slate-400'}`}>No recent administrative action logged.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
