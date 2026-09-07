'use client'

import { useState } from 'react'
import { sendAdminNotification } from './actions'
import { useTheme } from '@/components/ThemeProvider'

interface MemberOption {
  id: string
  full_name: string | null
  email: string | null
}

interface AuditLog {
  id: string
  action: string
  created_at: string
  details?: any
}

export default function NotificationClient({
  members,
  pastBroadcasts
}: {
  members: MemberOption[]
  pastBroadcasts: AuditLog[]
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetAudience, setTargetAudience] = useState<'all' | 'active' | 'specific'>('all')
  const [specificUserId, setSpecificUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [isLogExpanded, setIsLogExpanded] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    const res = await sendAdminNotification({
      title,
      body,
      targetAudience,
      specificUserId: targetAudience === 'specific' ? specificUserId : undefined
    })

    if (res.error) {
      setErrorMsg(res.error)
    } else if (res.success) {
      setSuccessMsg(res.success)
      setTitle('')
      setBody('')
    }

    setLoading(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Push Notifications to Customers
        </h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-emerald-200/60' : 'text-slate-600'}`}>
          Send live system announcements, news, or payment alerts directly to customer dashboards.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Form Container */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-xl transition-colors ${
            isDark 
              ? 'bg-emerald-950/20 border-emerald-900/40 shadow-xl' 
              : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
          }`}>
            <h2 className={`text-xl font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Compose Broadcast Message
            </h2>

            {successMsg && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 border ${
                isDark 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 border ${
                isDark 
                  ? 'bg-rose-950/60 border-rose-800/80 text-rose-300' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-emerald-200/80' : 'text-slate-700'}`}>
                  Target Audience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetAudience('all')}
                    className={`px-4 py-3 rounded-xl text-xs font-semibold border transition-all text-left flex flex-col gap-1 ${
                      targetAudience === 'all'
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400'
                        : isDark
                          ? 'bg-emerald-950/40 text-emerald-200/60 border-emerald-900/40 hover:bg-emerald-900/30'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>All Members</span>
                    <span>Broadcast to every customer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('active')}
                    className={`px-4 py-3 rounded-xl text-xs font-semibold border transition-all text-left flex flex-col gap-1 ${
                      targetAudience === 'active'
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400'
                        : isDark
                          ? 'bg-emerald-950/40 text-emerald-200/60 border-emerald-900/40 hover:bg-emerald-900/30'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Active (≤3 Days)</span>
                    <span>Recent active members only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('specific')}
                    className={`px-4 py-3 rounded-xl text-xs font-semibold border transition-all text-left flex flex-col gap-1 ${
                      targetAudience === 'specific'
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400'
                        : isDark
                          ? 'bg-emerald-950/40 text-emerald-200/60 border-emerald-900/40 hover:bg-emerald-900/30'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Single Member</span>
                    <span>Target one specific user</span>
                  </button>
                </div>
              </div>

              {targetAudience === 'specific' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-emerald-200/80' : 'text-slate-700'}`}>
                    Select Member
                  </label>
                  <select
                    value={specificUserId}
                    onChange={(e) => setSpecificUserId(e.target.value)}
                    required
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                      isDark 
                        ? 'bg-emerald-950/60 border-emerald-800/50 text-white' 
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="" className={isDark ? "bg-slate-900 text-slate-400" : "bg-white text-slate-500"}>
                      Choose a member profile...
                    </option>
                    {members.map(m => (
                      <option key={m.id} value={m.id} className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>
                        {m.full_name || 'Unnamed'} ({m.email || m.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-emerald-200/80' : 'text-slate-700'}`}>
                  Notification Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g., Scheduled Maintenance / System Announcement"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    isDark 
                      ? 'bg-emerald-950/60 border-emerald-800/50 text-white placeholder-emerald-400/40' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-emerald-200/80' : 'text-slate-700'}`}>
                  Notification Message Body
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={4}
                  placeholder="Enter message text that will display on the customer dashboard..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    isDark 
                      ? 'bg-emerald-950/60 border-emerald-800/50 text-white placeholder-emerald-400/40' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Pushing Notification...'
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Push Live Notification</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`rounded-2xl border p-6 backdrop-blur-xl transition-colors ${
            isDark 
              ? 'bg-emerald-950/20 border-emerald-900/40' 
              : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
          }`}>
            <h2 className={`text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Customer App Preview
            </h2>

            <div className={`rounded-2xl p-4 border shadow-xl space-y-3 ${
              isDark 
                ? 'bg-slate-900 border-slate-800' 
                : 'bg-slate-900 text-white border-slate-800 shadow-slate-300/40'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                    S
                  </div>
                  <span className="text-xs font-semibold text-white">Safivra Notification</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Just Now</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {title || 'Sample Title Text'}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {body || 'This is how your broadcast message will appear inside the customer dashboard notifications center.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Past Broadcast History - Collapsible & Minimized by default */}
      <div className={`rounded-2xl border transition-colors ${
        isDark 
          ? 'bg-emerald-950/20 border-emerald-900/40 shadow-lg' 
          : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
      }`}>
        <button
          type="button"
          onClick={() => setIsLogExpanded(!isLogExpanded)}
          className={`w-full p-6 flex items-center justify-between transition-colors rounded-2xl text-left ${
            isDark ? 'hover:bg-emerald-900/10' : 'hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Past Broadcast Log
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-normal ${
                  isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {pastBroadcasts.length} Recorded (Auto-purged after 30 days)
                </span>
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-emerald-200/60' : 'text-slate-500'}`}>
                {isLogExpanded ? 'Click to minimize history panel' : 'Click to expand historical broadcast records'}
              </p>
            </div>
          </div>

          <div className={`p-2 rounded-lg border transition-transform duration-200 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
          } ${isLogExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isLogExpanded && (
          <div className="px-6 pb-6 pt-0 border-t border-slate-200/50 dark:border-emerald-900/30">
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y text-left text-sm">
                <thead className={isDark ? 'bg-emerald-950/60 border-b border-emerald-900/40' : 'bg-slate-100 border-b border-slate-200'}>
                  <tr>
                    <th className={`px-6 py-3.5 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-700'}`}>Timestamp</th>
                    <th className={`px-6 py-3.5 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-700'}`}>Action</th>
                    <th className={`px-6 py-3.5 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-700'}`}>Recipients</th>
                    <th className={`px-6 py-3.5 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-700'}`}>Title & Details</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs ${isDark ? 'divide-emerald-900/30' : 'divide-slate-200'}`}>
                  {pastBroadcasts.map(log => (
                    <tr key={log.id} className={isDark ? 'hover:bg-emerald-900/20 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                      <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full border font-mono ${
                          isDark 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {log.details?.recipientCount ? `${log.details.recipientCount} Users` : 'Broadcast'}
                      </td>
                      <td className={`px-6 py-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{log.details?.title || 'Notification'}</span>
                        {log.details?.body && <p className={`text-[11px] truncate max-w-xs ${isDark ? 'text-emerald-200/60' : 'text-slate-500'}`}>{log.details.body}</p>}
                      </td>
                    </tr>
                  ))}
                  {pastBroadcasts.length === 0 && (
                    <tr>
                      <td colSpan={4} className={`px-6 py-8 text-center ${isDark ? 'text-emerald-200/50' : 'text-slate-500'}`}>
                        No broadcast notifications sent in the last 30 days.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
