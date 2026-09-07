'use client'

import { useState } from 'react'
import { toggleUserSuspension } from './actions'
import { useTheme } from '../../components/ThemeProvider'

interface Member {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  date_of_birth: string | null
  created_at: string
  last_sign_in_at?: string | null
  onboarding_status: string | null
  currency: string | null
  is_suspended?: boolean
  suspension_reason?: string | null
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

export default function MembersClientList({ members: initialMembers }: { members: Member[] }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Security PII Masking Toggle (Email, Phone, Date of Birth)
  const [showPII, setShowPII] = useState<boolean>(false)

  const now = Date.now()

  const isUserActive = (m: Member) => {
    if (!m.last_sign_in_at) return false
    return (now - new Date(m.last_sign_in_at).getTime()) <= THREE_DAYS_MS
  }

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      (m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (m.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (m.phone?.includes(searchTerm) || false) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase())

    const isSuspended = m.is_suspended ?? false
    const active = isUserActive(m)

    if (selectedStatus === 'active') return matchesSearch && active && !isSuspended
    if (selectedStatus === 'inactive') return matchesSearch && !active && !isSuspended
    if (selectedStatus === 'suspended') return matchesSearch && isSuspended
    return matchesSearch
  })

  async function handleToggle(member: Member) {
    const isCurrentlySuspended = member.is_suspended ?? false
    const newSuspendedState = !isCurrentlySuspended
    const reason = newSuspendedState ? 'Suspended by admin from operations console' : undefined

    // ⚡ Optimistic UI update: Instantly reflect changes in 0ms without waiting for network!
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_suspended: newSuspendedState, suspension_reason: reason || null } : m))
    setLoadingId(member.id)
    setErrorMsg(null)

    const result = await toggleUserSuspension(member.id, newSuspendedState, reason)
    if (result.error) {
      // Revert optimistic state on failure
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_suspended: isCurrentlySuspended } : m))
      setErrorMsg(result.error)
    }
    setLoadingId(null)
  }

  const totalCount = members.length
  const activeCount = members.filter(m => isUserActive(m) && !m.is_suspended).length
  const inactiveCount = members.filter(m => !isUserActive(m) && !m.is_suspended).length
  const suspendedCount = members.filter(m => m.is_suspended).length

  // Helper renderer for sensitive PII data (Email, Phone, Date of Birth)
  const renderSensitiveData = (value: string | null, fallback: string = 'Not Provided') => {
    if (!value) return <span className="opacity-40">{fallback}</span>
    if (showPII) {
      return <span className="font-medium text-emerald-400 select-all">{value}</span>
    }
    return (
      <span 
        onClick={() => setShowPII(true)} 
        title="Click Eye button in header or click here to reveal sensitive details"
        className={`select-none blur-[4.5px] hover:blur-none transition-all cursor-pointer inline-block px-1.5 py-0.5 rounded border ${
          isDark 
            ? 'bg-slate-800/80 border-slate-700/60 text-slate-300' 
            : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}
      >
        {value}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Stat Cards (Active vs Inactive 3-day Threshold) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded-2xl p-5 border shadow-sm flex items-center justify-between transition-all ${
          isDark ? 'bg-emerald-950/20 backdrop-blur-xl border-emerald-900/40' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-emerald-200/60' : 'text-slate-500'}`}>Total Members</p>
            <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalCount}</p>
          </div>
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
            isDark ? 'bg-emerald-900/40 border-emerald-800/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className={`rounded-2xl p-5 border shadow-sm flex items-center justify-between transition-all ${
          isDark ? 'bg-emerald-950/20 backdrop-blur-xl border-emerald-900/40' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Active Users (≤3 Days)</p>
            <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{activeCount}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className={`rounded-2xl p-5 border shadow-sm flex items-center justify-between transition-all ${
          isDark ? 'bg-emerald-950/20 backdrop-blur-xl border-emerald-900/40' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Inactive Users (&gt;3 Days)</p>
            <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{inactiveCount}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className={`rounded-2xl p-5 border shadow-sm flex items-center justify-between transition-all ${
          isDark ? 'bg-emerald-950/20 backdrop-blur-xl border-emerald-900/40' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Suspended Accounts</p>
            <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>{suspendedCount}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200 text-xs uppercase font-bold">Dismiss</button>
        </div>
      )}

      {/* Filter and Search Bar with Privacy Eye Toggle */}
      <div className={`rounded-2xl p-4 border flex flex-col sm:flex-row gap-4 items-center justify-between transition-all ${
        isDark ? 'bg-emerald-950/20 backdrop-blur-xl border-emerald-900/40' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone, ID..."
              className={`w-full rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                isDark 
                  ? 'bg-emerald-950/60 border border-emerald-800/50 text-white placeholder-emerald-400/40' 
                  : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            <svg className={`w-4 h-4 absolute left-3.5 top-3.5 ${isDark ? 'text-emerald-400/50' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Eye Toggle for Email, Phone & DOB Privacy */}
          <button
            onClick={() => setShowPII(!showPII)}
            title={showPII ? "Hide Sensitive Details (Email, Phone, DOB)" : "Show Sensitive Details (Email, Phone, DOB)"}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 shrink-0 ${
              showPII
                ? isDark
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : isDark
                  ? 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {showPII ? (
              <>
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>PII Visible</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.016 10.016 0 015.68-.823c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
                </svg>
                <span>PII Blurred (Protected)</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedStatus === 'all'
                ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : isDark ? 'text-emerald-200/60 hover:text-white hover:bg-emerald-900/30' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Members ({totalCount})
          </button>
          <button
            onClick={() => setSelectedStatus('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedStatus === 'active'
                ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : isDark ? 'text-emerald-200/60 hover:text-white hover:bg-emerald-900/30' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Active ≤3 Days ({activeCount})
          </button>
          <button
            onClick={() => setSelectedStatus('inactive')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedStatus === 'inactive'
                ? isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-amber-50 text-amber-800 border border-amber-300'
                : isDark ? 'text-emerald-200/60 hover:text-white hover:bg-emerald-900/30' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Inactive &gt;3 Days ({inactiveCount})
          </button>
          <button
            onClick={() => setSelectedStatus('suspended')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedStatus === 'suspended'
                ? isDark ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-rose-50 text-rose-800 border border-rose-300'
                : isDark ? 'text-emerald-200/60 hover:text-white hover:bg-emerald-900/30' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Suspended ({suspendedCount})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className={`rounded-2xl border overflow-hidden transition-all ${
        isDark ? 'bg-emerald-950/20 backdrop-blur-xl border-emerald-900/40 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y text-left">
            <thead className={isDark ? 'bg-emerald-950/60' : 'bg-slate-50'}>
              <tr>
                <th scope="col" className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-600'}`}>
                  Member Profile
                </th>
                <th scope="col" className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-600'}`}>
                  <div className="flex items-center gap-1.5">
                    <span>Email Address</span>
                    {!showPII && <span className="text-[10px] text-amber-400 font-mono low-opacity">(Blurred)</span>}
                  </div>
                </th>
                <th scope="col" className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-600'}`}>
                  <div className="flex items-center gap-1.5">
                    <span>Phone Number</span>
                    {!showPII && <span className="text-[10px] text-amber-400 font-mono low-opacity">(Blurred)</span>}
                  </div>
                </th>
                <th scope="col" className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-600'}`}>
                  <div className="flex items-center gap-1.5">
                    <span>Date of Birth</span>
                    {!showPII && <span className="text-[10px] text-amber-400 font-mono low-opacity">(Blurred)</span>}
                  </div>
                </th>
                <th scope="col" className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-600'}`}>
                  Activity Status
                </th>
                <th scope="col" className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-600'}`}>
                  Administrative Action
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y text-sm ${isDark ? 'divide-emerald-900/30' : 'divide-slate-100'}`}>
              {filteredMembers.map((person) => {
                const isSuspended = person.is_suspended ?? false
                const active = isUserActive(person)
                const isLoading = loadingId === person.id
                const formattedDob = person.date_of_birth ? new Date(person.date_of_birth).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : null

                return (
                  <tr key={person.id} className={isDark ? 'hover:bg-emerald-900/20 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-10 h-10 rounded-full border font-bold flex items-center justify-center text-sm shrink-0 ${
                          isDark ? 'bg-emerald-900/40 border-emerald-800/40 text-emerald-200' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          {(person.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{person.full_name || 'Unnamed Member'}</div>
                          <div className={`text-xs font-mono mt-0.5 truncate ${isDark ? 'text-emerald-200/50' : 'text-slate-400'}`}>{person.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap font-mono text-xs ${isDark ? 'text-emerald-200/80' : 'text-slate-700'}`}>
                      {renderSensitiveData(person.email, 'No Email')}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap font-mono text-xs ${isDark ? 'text-emerald-200/80' : 'text-slate-700'}`}>
                      {renderSensitiveData(person.phone, 'Not Provided')}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-xs ${isDark ? 'text-emerald-200/80' : 'text-slate-700'}`}>
                      {renderSensitiveData(formattedDob, 'Not Provided')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isSuspended ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                          isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
                          Suspended
                        </span>
                      ) : active ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                          isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                          Active (≤3 Days)
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                          isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
                          Inactive (&gt;3 Days)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                      <button
                        onClick={() => handleToggle(person)}
                        disabled={isLoading}
                        className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 ${
                          isSuspended
                            ? isDark ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : isDark ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40' : 'bg-rose-600 text-white hover:bg-rose-700'
                        }`}
                      >
                        {isLoading ? 'Updating...' : isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={6} className={`px-6 py-12 text-center text-sm ${isDark ? 'text-emerald-200/50' : 'text-slate-400'}`}>
                    No matching member accounts found.
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
