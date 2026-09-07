export const dynamic = "force-dynamic";

import { createAdminClient } from '../../utils/supabase/server'
import MembersClientList from './MemberActions'

export default async function MembersPage() {
  const supabaseAdmin = createAdminClient()

  // Fetch profiles and auth users in parallel for complete dataset join
  const [
    { data: profiles },
    { data: authUsersData }
  ] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('id, full_name, created_at, onboarding_status, currency, phone, date_of_birth, is_suspended, suspension_reason'),
    supabaseAdmin.auth.admin.listUsers()
  ])

  const profileMap = new Map<string, any>()
  profiles?.forEach(p => {
    if (p.id) profileMap.set(p.id, p)
  })

  const usersList = authUsersData?.users || []

  // Combine auth.users + profiles to ensure 100% of all registered accounts (old and new) are collected
  const membersList = usersList.map(u => {
    const prof = profileMap.get(u.id) || {}
    const meta = u.user_metadata || {}

    return {
      id: u.id,
      full_name: prof.full_name || meta.full_name || meta.name || null,
      email: u.email || prof.email || null,
      phone: prof.phone || u.phone || meta.phone || null,
      date_of_birth: prof.date_of_birth || meta.date_of_birth || meta.dob || null,
      created_at: prof.created_at || u.created_at || new Date().toISOString(),
      last_sign_in_at: u.last_sign_in_at || null,
      onboarding_status: prof.onboarding_status || 'completed',
      currency: prof.currency || 'BDT',
      is_suspended: prof.is_suspended || false,
      suspension_reason: prof.suspension_reason || null
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Members Directory</h1>
        <p className="mt-1 text-sm text-emerald-200/60">
          Manage member profiles, monitor 3-day activity status, view verified contact details, and enforce account suspensions.
        </p>
      </div>

      <MembersClientList members={membersList} />
    </div>
  )
}


