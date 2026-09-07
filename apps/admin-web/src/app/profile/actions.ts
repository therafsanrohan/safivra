'use server'

import { createAdminClient } from '../../utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAdminProfile(formData: FormData) {
  const supabase = createAdminClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Admin session not found. Please log in again.' }
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: password
    })

    if (error) {
      return { error: error.message }
    }

    // Log action to audit trail
    await supabase.from('admin_audit_logs').insert({
      actor_id: user.id,
      action: 'ADMIN_PASSWORD_UPDATED',
      resource_type: 'admin_account',
      resource_id: user.id,
      details: { timestamp: new Date().toISOString() }
    })

    revalidatePath('/profile')
    return { success: 'Password updated successfully!' }
  } catch (err: any) {
    return { error: err.message || 'Failed to update admin profile.' }
  }
}
