export const dynamic = "force-dynamic";

import { createAdminClient } from '../../../utils/supabase/server'

export default async function SystemPage() {
  const supabase = createAdminClient()

  let dbHealthy = false
  let responseTime = 0
  let errorMessage = ''

  try {
    const start = performance.now()
    // Simple fast query to check DB connectivity
    const { error } = await supabase.from('roles').select('id').limit(1)
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
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">System Health</h1>
        <p className="mt-2 text-sm text-gray-500">
          Connectivity and backend configuration status.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Database Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Database Connection</h2>
            <div className={`h-3 w-3 rounded-full ${dbHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium ${dbHealthy ? 'text-green-600' : 'text-red-600'}`}>
                {dbHealthy ? 'Healthy' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Latency</span>
              <span className="font-medium text-gray-900">{responseTime}ms</span>
            </div>
            {!dbHealthy && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-mono break-all">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Environment Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Environment Checks</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Supabase URL</span>
              <span className="font-medium text-gray-900">
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Service Role Key</span>
              <span className="font-medium text-gray-900">
                {process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Deploy Target</span>
              <span className="font-medium text-gray-900">safivra-admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
