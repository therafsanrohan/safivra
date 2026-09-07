'use server'

import { createAdminClient } from '../../utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface SendNotificationParams {
  title: string
  body: string
  targetAudience: 'all' | 'active' | 'specific'
  specificUserId?: string
}

export async function sendAdminNotification({
  title,
  body,
  targetAudience,
  specificUserId
}: SendNotificationParams) {
  const supabase = createAdminClient()

  if (!title.trim() || !body.trim()) {
    return { error: 'Both Title and Notification Body are required.' }
  }

  try {
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    
    let targetUserIds: string[] = []

    if (targetAudience === 'specific') {
      if (!specificUserId) {
        return { error: 'Please select a specific member.' }
      }
      targetUserIds = [specificUserId]
    } else if (targetAudience === 'active') {
      // Active in last 3 days
      const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
      const now = Date.now()

      const { data: authUsersData } = await supabase.auth.admin.listUsers()
      const activeIds: string[] = []

      authUsersData?.users?.forEach(u => {
        if (u.id && u.last_sign_in_at) {
          if (now - new Date(u.last_sign_in_at).getTime() <= THREE_DAYS_MS) {
            activeIds.push(u.id)
          }
        }
      })

      targetUserIds = activeIds
    } else {
      // All registered members from profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')

      targetUserIds = (profiles || []).map(p => p.id)
    }

    if (targetUserIds.length === 0) {
      return { error: 'No recipient members found for the selected target audience.' }
    }

    // Insert notifications for each target user
    const notificationsToInsert = targetUserIds.map(userId => ({
      user_id: userId,
      notification_type: 'upcoming_bill', // Standard supported type for customer app
      title: title.trim(),
      body: body.trim(),
      related_type: 'admin_broadcast',
      is_read: false
    }))

    // Batch insert notifications
    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationsToInsert)

    if (insertError) {
      return { error: `Failed to insert notifications: ${insertError.message}` }
    }

    // Log admin audit log
    await supabase.from('admin_audit_logs').insert({
      actor_id: adminUser?.id || null,
      action: 'ADMIN_BROADCAST_NOTIFICATION_SENT',
      resource_type: 'notifications',
      resource_id: `${targetUserIds.length}_recipients`,
      details: {
        title,
        body,
        targetAudience,
        recipientCount: targetUserIds.length
      }
    })

    revalidatePath('/notifications')
    revalidatePath('/audit')

    return { 
      success: `Successfully pushed broadcast notification to ${targetUserIds.length} member account(s)!` 
    }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred while sending notifications.' }
  }
}
