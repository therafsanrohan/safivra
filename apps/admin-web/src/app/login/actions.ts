'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/server'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = createClient(await cookies())

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Verify if they are an active admin
  const { data: adminAccount, error: adminError } = await supabase
    .from('admin_accounts')
    .select('status')
    .eq('id', data.user.id)
    .single()

  if (adminError || !adminAccount || adminAccount.status !== 'active') {
    await supabase.auth.signOut()
    return { error: 'Unauthorized. Active admin account required.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = createClient(await cookies())
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
