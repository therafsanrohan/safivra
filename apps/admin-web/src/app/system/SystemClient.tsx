'use client'

import { useTheme } from '@/components/ThemeProvider'

export default function SystemClient({
  dbHealthy,
  responseTime,
  errorMessage
}: {
  dbHealthy: boolean
  responseTime: number
  errorMessage: string
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          System Health
        </h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-emerald-200/60' : 'text-slate-600'}`}>
          Backend services, database latency, and environment runtime verification.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Database Status */}
        <div className={`rounded-2xl border p-6 backdrop-blur-xl transition-all ${
          isDark 
            ? 'bg-emerald-950/20 border-emerald-900/40 shadow-xl' 
            : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21 3.582 4 8 4s8-1.79 8-4" />
              </svg>
              Database Connection
            </h2>
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${
              dbHealthy 
                ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <span className={`h-2 w-2 rounded-full ${dbHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              {dbHealthy ? 'Connected' : 'Error'}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>Status</span>
              <span className={`font-medium ${dbHealthy ? 'text-emerald-600' : 'text-rose-600'}`}>
                {dbHealthy ? 'Healthy' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>Query Latency</span>
              <span className={`font-medium font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{responseTime} ms</span>
            </div>
            {!dbHealthy && (
              <div className={`mt-4 p-3 rounded-xl border text-xs font-mono break-all ${
                isDark ? 'bg-rose-950/40 border-rose-800/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Environment Status */}
        <div className={`rounded-2xl border p-6 backdrop-blur-xl transition-all ${
          isDark 
            ? 'bg-emerald-950/20 border-emerald-900/40 shadow-xl' 
            : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Environment Checks
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>Supabase URL</span>
              <span className="font-medium text-emerald-600">
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>Service Role Key</span>
              <span className="font-medium text-emerald-600">
                {process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>Deploy Target</span>
              <span className={`font-medium font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>safivra-admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
