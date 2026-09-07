export const dynamic = "force-dynamic";

import { createAdminClient } from '../utils/supabase/server'
import OverviewClient from './OverviewClient'

export default async function OverviewPage() {
  const supabase = createAdminClient()

  // Run multiple read-only queries in parallel for ultra-fast response
  const [
    { count: registeredMembersCount },
    { data: authUsersData },
    { count: activeAdminsCount },
    { data: recentRegistrations },
    { data: recentAudits },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.auth.admin.listUsers(),
    supabase.from('admin_accounts').select('*', { count: 'exact', head: true }).not('role_id', 'is', null).eq('status', 'active'),
    supabase
      .from('profiles')
      .select('id, full_name, created_at, currency, is_suspended')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('admin_audit_logs')
      .select('id, actor_id, action, resource_type, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Compute Active vs Inactive based on 3 days threshold (3 * 24 * 60 * 60 * 1000 ms)
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
  const now = Date.now()

  let activeUsersCount = 0
  let inactiveUsersCount = 0

  const usersList = authUsersData?.users || []
  usersList.forEach(u => {
    if (u.last_sign_in_at) {
      const lastSignInTime = new Date(u.last_sign_in_at).getTime()
      if (now - lastSignInTime <= THREE_DAYS_MS) {
        activeUsersCount++
      } else {
        inactiveUsersCount++
      }
    } else {
      inactiveUsersCount++
    }
  })

  // Registered members = total customer accounts (usersList length or profiles count)
  const totalRegisteredMembers = Math.max(registeredMembersCount ?? 0, usersList.length ?? 0)
  
  // Active Admins = actual system administrators with admin roles (defaulting to 1 for active Super Admin)
  const totalActiveAdmins = (activeAdminsCount && activeAdminsCount > 0) ? activeAdminsCount : 1


  const stats = [
    {
      name: 'Registered Members',
      stat: totalRegisteredMembers,
      badge: 'Database Profiles',
      icon: (
        <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      name: 'Active Users (≤3 Days)',
      stat: activeUsersCount,
      badge: 'Active (3 Days)',
      icon: (
        <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Inactive Users (>3 Days)',
      stat: inactiveUsersCount,
      badge: 'Inactive (>3 Days)',
      icon: (
        <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Active Admins',
      stat: totalActiveAdmins,
      badge: 'Admin Console',
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
  ]

  return (
    <OverviewClient
      stats={stats}
      recentRegistrations={recentRegistrations || []}
      recentAudits={recentAudits || []}
    />
  )
}



