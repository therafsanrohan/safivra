export const dynamic = "force-dynamic";

import { createAdminClient } from '../../utils/supabase/server'
import AuditClient from './AuditClient'

export default async function AuditPage() {
  const supabase = createAdminClient()

  // Get audit logs, ordered by most recent first
  const { data: logs } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return <AuditClient logs={logs || []} />
}


