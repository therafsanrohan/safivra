'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../utils/supabase/server'
import { createClient } from '../../utils/supabase/server'
import { cookies } from 'next/headers'

export async function toggleUserSuspension(userId: string, suspend: boolean, reason?: string) {
  if (!userId) {
    return { error: 'Invalid user ID' }
  }

  const supabaseAdmin = createAdminClient()
  const supabaseUser = createClient(await cookies())

  // Verify caller is an active admin
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized request' }
  }

  const { data: adminAccount } = await supabaseAdmin
    .from('admin_accounts')
    .select('status')
    .eq('id', user.id)
    .single()

  if (!adminAccount || adminAccount.status !== 'active') {
    return { error: 'Unauthorized: Active admin status required' }
  }

  // Update profile suspension status
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      is_suspended: suspend,
      suspension_reason: suspend ? (reason || 'Suspended by admin') : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Log in admin audit logs
  await supabaseAdmin
    .from('admin_audit_logs')
    .insert({
      actor_id: user.id,
      action: suspend ? 'MEMBER_SUSPENDED' : 'MEMBER_REACTIVATED',
      resource_type: 'profiles',
      resource_id: userId,
      reason: reason || (suspend ? 'Account suspended by administrator' : 'Account reactivated by administrator')
    })

  revalidatePath('/users')
  revalidatePath('/')
  return { success: true }
}
