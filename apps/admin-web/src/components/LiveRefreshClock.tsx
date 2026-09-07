'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function LiveRefreshClock() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentTime, setCurrentTime] = useState<string>('')
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('')

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      const formatted = now.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      })
      setCurrentTime(formatted)
      if (!lastRefreshedAt) {
        setLastRefreshedAt(formatted)
      }
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [lastRefreshedAt])

  const handleManualRefresh = () => {
    startTransition(() => {
      router.refresh()
      const nowFormatted = new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      })
      setLastRefreshedAt(nowFormatted)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-emerald-900/40">
      <div className="flex items-center space-x-3 text-xs text-emerald-200/80 font-mono">
        <div className="flex items-center space-x-1.5 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-300">LIVE CLOCK:</span>
          <span className="text-white font-bold">{currentTime || 'Updating...'}</span>
        </div>

        <div className="hidden md:flex items-center space-x-1 text-emerald-300/60">
          <span>(Last telemetry sync: {lastRefreshedAt || 'Just now'})</span>
        </div>
      </div>

      <button
        onClick={handleManualRefresh}
        disabled={isPending}
        className="self-start sm:self-auto flex items-center space-x-2 bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-500/40 transition-all disabled:opacity-50"
        title="Trigger live database re-query"
      >
        <svg 
          className={`w-3.5 h-3.5 text-emerald-400 ${isPending ? 'animate-spin' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>{isPending ? 'Syncing Telemetry...' : 'Refresh Telemetry Now'}</span>
      </button>
    </div>
  )
}
