export const dynamic = "force-dynamic";

import { createAdminClient } from '../../utils/supabase/server'
import ProfileClient from './ProfileClient'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = createAdminClient()

  // Fetch current session 
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // If not authenticated, default to safe admin fallback or redirect to login
    redirect('/login')
  }

  const adminData = {
    id: user.id,
    email: user.email || 'admin@safivra.com',
    role: 'Super Admin',
    created_at: user.created_at || new Date().toISOString(),
    last_sign_in_at: user.last_sign_in_at || null
  }

  return <ProfileClient admin={adminData} />
}
