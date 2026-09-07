'use client'

import { useState } from 'react'
import { sendAdminNotification } from './actions'

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
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetAudience, setTargetAudience] = useState<'all' | 'active' | 'specific'>('all')
  const [specificUserId, setSpecificUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Push Notifications to Customers</h1>
        <p className="mt-1 text-sm text-emerald-200/60">
          Send live system announcements, news, or payment alerts directly to customer dashboards.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Form Container */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-900/40 p-6 sm:p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Compose Broadcast Message
            </h2>

            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-sm font-medium flex items-center gap-2">
                <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-emerald-200/80 mb-2">
                  Target Audience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetAudience('all')}
                    className={`px-4 py-3 rounded-xl text-xs font-semibold border transition-all text-left flex flex-col gap-1 ${
                      targetAudience === 'all'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30'
                        : 'bg-emerald-950/40 text-emerald-200/60 border-emerald-900/40 hover:bg-emerald-900/30'
                    }`}
                  >
                    <span className="font-bold text-sm text-white">All Members</span>
                    <span>Broadcast to every customer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('active')}
                    className={`px-4 py-3 rounded-xl text-xs font-semibold border transition-all text-left flex flex-col gap-1 ${
                      targetAudience === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30'
                        : 'bg-emerald-950/40 text-emerald-200/60 border-emerald-900/40 hover:bg-emerald-900/30'
                    }`}
                  >
                    <span className="font-bold text-sm text-white">Active (≤3 Days)</span>
                    <span>Recent active members only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('specific')}
                    className={`px-4 py-3 rounded-xl text-xs font-semibold border transition-all text-left flex flex-col gap-1 ${
                      targetAudience === 'specific'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30'
                        : 'bg-emerald-950/40 text-emerald-200/60 border-emerald-900/40 hover:bg-emerald-900/30'
                    }`}
                  >
                    <span className="font-bold text-sm text-white">Single Member</span>
                    <span>Target one specific user</span>
                  </button>
                </div>
              </div>

              {targetAudience === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-emerald-200/80 mb-2">
                    Select Member
                  </label>
                  <select
                    value={specificUserId}
                    onChange={(e) => setSpecificUserId(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value="" className="bg-slate-900 text-slate-400">Choose a member profile...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                        {m.full_name || 'Unnamed'} ({m.email || m.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-emerald-200/80 mb-2">
                  Notification Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g., Scheduled Maintenance / System Announcement"
                  className="w-full px-4 py-3 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-white placeholder-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-200/80 mb-2">
                  Notification Message Body
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={4}
                  placeholder="Enter message text that will display on the customer dashboard..."
                  className="w-full px-4 py-3 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-white placeholder-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
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
          <div className="bg-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-900/40 p-6">
            <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Customer App Preview
            </h2>

            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
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

      {/* Past Broadcast History */}
      <div className="bg-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-900/40 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-white mb-4">Past Broadcast Log</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-emerald-900/40 text-left text-sm">
            <thead className="bg-emerald-950/60">
              <tr>
                <th className="px-6 py-3.5 text-xs font-medium text-emerald-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3.5 text-xs font-medium text-emerald-400 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3.5 text-xs font-medium text-emerald-400 uppercase tracking-wider">Recipients</th>
                <th className="px-6 py-3.5 text-xs font-medium text-emerald-400 uppercase tracking-wider">Title & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/30 text-xs">
              {pastBroadcasts.map(log => (
                <tr key={log.id} className="hover:bg-emerald-900/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-emerald-200/70">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white font-semibold">
                    {log.details?.recipientCount ? `${log.details.recipientCount} Users` : 'Broadcast'}
                  </td>
                  <td className="px-6 py-4 text-slate-200">
                    <span className="font-semibold text-white">{log.details?.title || 'Notification'}</span>
                    {log.details?.body && <p className="text-emerald-200/60 text-[11px] truncate max-w-xs">{log.details.body}</p>}
                  </td>
                </tr>
              ))}
              {pastBroadcasts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-emerald-200/50">
                    No broadcast notifications sent yet.
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
