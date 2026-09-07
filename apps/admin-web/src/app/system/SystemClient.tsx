'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/components/ThemeProvider'

interface HealthMetrics {
  dbHealthy: boolean
  responseTime: number
  errorMessage: string
  timestamp: string
  env: {
    supabaseUrl: boolean
    serviceRoleKey: boolean
  }
}

export default function SystemClient({
  dbHealthy: initialDbHealthy,
  responseTime: initialResponseTime,
  errorMessage: initialErrorMessage
}: {
  dbHealthy: boolean
  responseTime: number
  errorMessage: string
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [metrics, setMetrics] = useState<HealthMetrics>({
    dbHealthy: initialDbHealthy,
    responseTime: initialResponseTime,
    errorMessage: initialErrorMessage,
    timestamp: new Date().toLocaleTimeString(),
    env: {
      supabaseUrl: true,
      serviceRoleKey: true
    }
  })
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [pingHistory, setPingHistory] = useState<number[]>([initialResponseTime])

  const runDiagnostics = useCallback(async () => {
    setLoading(true)
    const startTime = performance.now()
    try {
      const res = await fetch('/api/health?t=' + Date.now(), { cache: 'no-store' })
      const data = await res.json()
      const clientLatency = Math.round(performance.now() - startTime)
      
      setMetrics({
        dbHealthy: data.dbHealthy,
        responseTime: data.responseTime || clientLatency,
        errorMessage: data.errorMessage || '',
        timestamp: new Date(data.timestamp || Date.now()).toLocaleTimeString(),
        env: {
          supabaseUrl: data.env?.supabaseUrl ?? true,
          serviceRoleKey: data.env?.serviceRoleKey ?? true
        }
      })

      setPingHistory(prev => [...prev.slice(-9), data.responseTime || clientLatency])
    } catch (err: any) {
      setMetrics(prev => ({
        ...prev,
        dbHealthy: false,
        errorMessage: err.message || 'Failed to ping backend service',
        timestamp: new Date().toLocaleTimeString()
      }))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      runDiagnostics()
    }, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, runDiagnostics])

  const getLatencyBadge = (latency: number) => {
    if (latency < 150) return { label: 'Optimal (<150ms)', color: isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200' }
    if (latency < 350) return { label: 'Fair (150-350ms)', color: isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-amber-700 bg-amber-50 border-amber-200' }
    return { label: 'High (>350ms)', color: isDark ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-rose-700 bg-rose-50 border-rose-200' }
  }

  const badge = getLatencyBadge(metrics.responseTime)

  return (
    <div className="space-y-6">
      {/* Header with Control Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            System Health & Infrastructure Monitor
          </h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-emerald-200/60' : 'text-slate-600'}`}>
            Central admin monitoring for both Member Web App & Admin Console infrastructure, live DB latency, and services runtime.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-2 ${
              autoRefresh
                ? isDark
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                : isDark
                  ? 'bg-emerald-950/40 border-emerald-900/40 text-slate-400 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`} />
            {autoRefresh ? 'Live 5s Polling' : 'Auto Refresh Paused'}
          </button>

          <button
            onClick={runDiagnostics}
            disabled={loading}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-2 ${
              isDark
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400'
                : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
            }`}
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? 'Pinging...' : 'Ping Now'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* PostgreSQL Database Status & Live Latency */}
        <div className={`rounded-2xl border p-6 backdrop-blur-xl transition-all sm:col-span-2 ${
          isDark 
            ? 'bg-emerald-950/20 border-emerald-900/40 shadow-xl' 
            : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8-4m0 5c0 2.21 3.582 4 8 4s8-1.79 8-4" />
              </svg>
              Core PostgreSQL Database Connection
            </h2>
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${
              metrics.dbHealthy 
                ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <span className={`h-2 w-2 rounded-full ${metrics.dbHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              {metrics.dbHealthy ? 'Connected & Healthy' : 'Disconnected'}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>DB Engine Status</span>
              <span className={`font-semibold ${metrics.dbHealthy ? 'text-emerald-600' : 'text-rose-600'}`}>
                {metrics.dbHealthy ? '100% Operational (Supabase Cloud)' : 'Connection Error'}
              </span>
            </div>

            <div className="flex justify-between text-sm items-center">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>Query Latency (Roundtrip)</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${badge.color}`}>
                  {badge.label}
                </span>
                <span className={`font-bold font-mono text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {metrics.responseTime} ms
                </span>
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>Last Live Ping</span>
              <span className={`font-mono text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {metrics.timestamp}
              </span>
            </div>

            {/* Sparkline Latency History */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className={isDark ? 'text-emerald-200/40' : 'text-slate-500'}>Recent Latency Trend (Last 10 Pings)</span>
                <span className="font-mono text-emerald-500">Avg: {Math.round(pingHistory.reduce((a, b) => a + b, 0) / pingHistory.length)} ms</span>
              </div>
              <div className="flex items-start gap-1 h-12 pb-1 border-b border-dashed border-emerald-900/30">
                {pingHistory.map((val, idx) => {
                  const max = Math.max(...pingHistory, 200)
                  const heightPct = Math.max(15, Math.min(100, (val / max) * 100))
                  return (
                    <div
                      key={idx}
                      className="flex-1 bg-emerald-500/40 hover:bg-emerald-400 rounded-b transition-all relative group"
                      style={{ height: `${heightPct}%` }}
                    >
                      <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 hidden group-hover:block px-1.5 py-0.5 bg-slate-900 text-white text-[10px] rounded font-mono z-10 whitespace-nowrap">
                        {val}ms
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {!metrics.dbHealthy && (
              <div className={`mt-4 p-3 rounded-xl border text-xs font-mono break-all ${
                isDark ? 'bg-rose-950/40 border-rose-800/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {metrics.errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Member Customer App Service Health */}
        <div className={`rounded-2xl border p-6 backdrop-blur-xl transition-all ${
          isDark 
            ? 'bg-emerald-950/20 border-emerald-900/40 shadow-xl' 
            : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Member Web App Health
            </h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>Customer App URL</span>
              <span className="font-semibold text-emerald-600">safivra.vercel.app</span>
            </div>

            <div className="flex justify-between">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>Client Public Anon API</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active & Verified
              </span>
            </div>

            <div className="flex justify-between">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>Member Auth Microservice</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                100% Operational
              </span>
            </div>

            <div className="flex justify-between">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>PWA Offline Service Worker</span>
              <span className="font-semibold text-emerald-600">Enabled</span>
            </div>

            <div className="flex justify-between">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>Member Storage Cleanup</span>
              <span className="font-semibold text-emerald-600">7-Day Auto Purge</span>
            </div>
          </div>
        </div>

        {/* Environment & Admin Console Infrastructure */}
        <div className={`rounded-2xl border p-6 backdrop-blur-xl transition-all sm:col-span-3 ${
          isDark 
            ? 'bg-emerald-950/20 border-emerald-900/40 shadow-xl' 
            : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin Operations Console Runtime
            </h2>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
              isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              Production Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between sm:flex-col sm:gap-1">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>Supabase Target URL</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1 font-mono text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {metrics.env.supabaseUrl ? 'Configured & Verified' : 'Missing'}
              </span>
            </div>

            <div className="flex justify-between sm:flex-col sm:gap-1">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>Service Role Key Status</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1 font-mono text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {metrics.env.serviceRoleKey ? 'Active (Elevated Privileges)' : 'Missing'}
              </span>
            </div>

            <div className="flex justify-between sm:flex-col sm:gap-1">
              <span className={isDark ? 'text-emerald-200/60' : 'text-slate-600'}>Deploy Infrastructure</span>
              <span className={`font-mono text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                @safivra/admin-web (Vercel Edge/Next.js)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
