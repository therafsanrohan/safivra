export const dynamic = "force-dynamic";

import { createAdminClient } from '../../utils/supabase/server'
import MembersClientList from './MemberActions'

export default async function MembersPage() {
  const supabaseAdmin = createAdminClient()

  // Fetch profiles and auth users in parallel for full data join
  const [
    { data: profiles },
    { data: authUsersData }
  ] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('id, full_name, created_at, onboarding_status, currency, phone, date_of_birth, is_suspended, suspension_reason')
      .order('created_at', { ascending: false })
      .limit(100),
    supabaseAdmin.auth.admin.listUsers()
  ])

  const emailMap = new Map<string, string>()
  authUsersData?.users?.forEach(u => {
    if (u.id && u.email) {
      emailMap.set(u.id, u.email)
    }
  })

  const membersList = (profiles || []).map(p => ({
    id: p.id,
    full_name: p.full_name,
    email: emailMap.get(p.id) || null,
    phone: p.phone || null,
    date_of_birth: p.date_of_birth || null,
    created_at: p.created_at,
    onboarding_status: p.onboarding_status,
    currency: p.currency,
    is_suspended: p.is_suspended || false,
    suspension_reason: p.suspension_reason || null
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">Members Directory</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage member profiles, view verified contact details, monitor onboarding, and enforce account suspensions.
        </p>
      </div>

      <MembersClientList members={membersList} />
    </div>
  )
}
