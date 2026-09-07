export const dynamic = "force-dynamic";

import { createAdminClient } from '../../utils/supabase/server'
import NotificationClient from './NotificationClient'

export default async function NotificationsPage() {
  const supabaseAdmin = createAdminClient()

  const [
    { data: profiles },
    { data: authUsersData },
    { data: auditLogs }
  ] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .limit(100),
    supabaseAdmin.auth.admin.listUsers(),
    supabaseAdmin
      .from('admin_audit_logs')
      .select('id, action, created_at, details')
      .eq('action', 'ADMIN_BROADCAST_NOTIFICATION_SENT')
      .order('created_at', { ascending: false })
      .limit(20)
  ])

  const emailMap = new Map<string, string>()
  authUsersData?.users?.forEach(u => {
    if (u.id && u.email) emailMap.set(u.id, u.email)
  })

  const memberOptions = (profiles || []).map(p => ({
    id: p.id,
    full_name: p.full_name,
    email: emailMap.get(p.id) || null
  }))

  return (
    <NotificationClient 
      members={memberOptions}
      pastBroadcasts={auditLogs || []}
    />
  )
}
