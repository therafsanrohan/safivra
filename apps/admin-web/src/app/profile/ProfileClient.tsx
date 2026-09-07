'use client'

import { useState } from 'react'
import { updateAdminProfile } from './actions'
import { useTheme } from '@/components/ThemeProvider'

interface AdminUser {
  id: string
  email: string
  role: string
  created_at: string
  last_sign_in_at: string | null
}

export default function ProfileClient({ admin }: { admin: AdminUser }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setMessage(null)
    setError(null)

    const res = await updateAdminProfile(formData)
    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setMessage(res.success)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className={`rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 shadow-xl border border-emerald-900/40' 
          : 'bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 shadow-lg shadow-emerald-700/20 border border-emerald-500/30'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-2xl font-bold text-white shadow-inner">
              {(admin.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">{admin.email}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                  {admin.role}
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-1 font-mono">
                Admin Identifier: {admin.id}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-emerald-100/90 block">Account Status</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-300 mr-2 animate-pulse" />
              Active System Administrator
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile Info Cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`rounded-2xl border p-6 backdrop-blur-xl transition-colors ${
            isDark 
              ? 'bg-emerald-950/20 border-emerald-900/40' 
              : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Admin Information
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <span className={`text-xs font-medium uppercase tracking-wider block ${isDark ? 'text-emerald-200/60' : 'text-slate-500'}`}>Email Address</span>
                <span className={`font-mono font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{admin.email}</span>
              </div>
              <div>
                <span className={`text-xs font-medium uppercase tracking-wider block ${isDark ? 'text-emerald-200/60' : 'text-slate-500'}`}>Role Level</span>
                <span className="text-emerald-600 font-semibold">{admin.role}</span>
              </div>
              <div>
                <span className={`text-xs font-medium uppercase tracking-wider block ${isDark ? 'text-emerald-200/60' : 'text-slate-500'}`}>Member Since</span>
                <span className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {new Date(admin.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div>
                <span className={`text-xs font-medium uppercase tracking-wider block ${isDark ? 'text-emerald-200/60' : 'text-slate-500'}`}>Last Active Login</span>
                <span className={`font-mono text-xs ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {admin.last_sign_in_at ? new Date(admin.last_sign_in_at).toLocaleString() : 'Current Session'}
                </span>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-6 backdrop-blur-xl transition-colors ${
            isDark 
              ? 'bg-emerald-950/20 border-emerald-900/40' 
              : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
          }`}>
            <h2 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Security Policy
            </h2>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>
              As a System Administrator, your credentials grant full operational access to member data, audit records, and Zakat compliance engine settings. Multi-factor authentication & password strength policies are enforced.
            </p>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="lg:col-span-2">
          <div className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-xl transition-colors ${
            isDark 
              ? 'bg-emerald-950/20 border-emerald-900/40' 
              : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
          }`}>
            <h2 className={`text-xl font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security & Credentials Management
            </h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-emerald-200/60' : 'text-slate-600'}`}>
              Update your administrative account password securely.
            </p>

            {message && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 border ${
                isDark 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 border ${
                isDark 
                  ? 'bg-rose-950/60 border-rose-800/80 text-rose-300' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form action={handleSubmit} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-emerald-200/80' : 'text-slate-700'}`}>
                  New Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="Enter new password (min 6 chars)"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    isDark 
                      ? 'bg-emerald-950/60 border-emerald-800/50 text-white placeholder-emerald-400/40' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-emerald-200/80' : 'text-slate-700'}`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={6}
                  placeholder="Confirm new password"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    isDark 
                      ? 'bg-emerald-950/60 border-emerald-800/50 text-white placeholder-emerald-400/40' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {loading ? 'Updating Credentials...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

