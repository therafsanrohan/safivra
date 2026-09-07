export const dynamic = "force-dynamic";

import { createAdminClient } from '../../utils/supabase/server'

export default async function SystemPage() {
  const supabase = createAdminClient()

  let dbHealthy = false
  let responseTime = 0
  let errorMessage = ''

  try {
    const start = performance.now()
    // Simple fast query to check DB connectivity
    const { error } = await supabase.from('profiles').select('id').limit(1)
    responseTime = Math.round(performance.now() - start)
    if (error) {
      errorMessage = error.message
    } else {
      dbHealthy = true
    }
  } catch (err: any) {
    errorMessage = err.message || 'Unknown connection error'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white tracking-tight">System Health</h1>
        <p className="mt-2 text-sm text-emerald-200/60">
          Backend services, database latency, and environment runtime verification.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Database Status */}
        <div className="bg-emerald-950/20 rounded-2xl border border-emerald-900/40 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21 3.582 4 8 4s8-1.79 8-4" />
              </svg>
              Database Connection
            </h2>
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${dbHealthy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              <span className={`h-2 w-2 rounded-full ${dbHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {dbHealthy ? 'Connected' : 'Error'}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-emerald-200/60">Status</span>
              <span className={`font-medium ${dbHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
                {dbHealthy ? 'Healthy' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-200/60">Query Latency</span>
              <span className="font-medium text-white font-mono">{responseTime} ms</span>
            </div>
            {!dbHealthy && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs font-mono break-all">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Environment Status */}
        <div className="bg-emerald-950/20 rounded-2xl border border-emerald-900/40 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Environment Checks
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-emerald-200/60">Supabase URL</span>
              <span className="font-medium text-emerald-400">
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-200/60">Service Role Key</span>
              <span className="font-medium text-emerald-400">
                {process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-200/60">Deploy Target</span>
              <span className="font-medium text-white font-mono">safivra-admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

