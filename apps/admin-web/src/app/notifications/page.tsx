export const dynamic = "force-dynamic";

import { createAdminClient } from '../../utils/supabase/server'
import NotificationClient from './NotificationClient'

export default async function NotificationsPage() {
  const supabaseAdmin = createAdminClient()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

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
      .select('id, action, created_at, details, after_snapshot')
      .eq('action', 'ADMIN_BROADCAST_NOTIFICATION_SENT')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(50)
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

  const pastBroadcasts = (auditLogs || []).map(log => ({
    id: log.id,
    action: log.action,
    created_at: log.created_at,
    details: log.details || log.after_snapshot || {}
  }))

  return (
    <NotificationClient 
      members={memberOptions}
      pastBroadcasts={pastBroadcasts}
    />
  )
}

