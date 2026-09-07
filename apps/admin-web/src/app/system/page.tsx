export const dynamic = "force-dynamic";

import { createAdminClient } from '../../utils/supabase/server'
import SystemClient from './SystemClient'

export default async function SystemPage() {
  const supabase = createAdminClient()

  let dbHealthy = false
  let responseTime = 0
  let errorMessage = ''

  try {
    const start = performance.now()
    // Simple fast query to check DB connectivity
    const { error } = await supabase.from('profiles').select('id').limit(1)
    responseTime = Math.round(performance.now() - start)
    if (error) {
      errorMessage = error.message
    } else {
      dbHealthy = true
    }
  } catch (err: any) {
    errorMessage = err.message || 'Unknown connection error'
  }

  return (
    <SystemClient
      dbHealthy={dbHealthy}
      responseTime={responseTime}
      errorMessage={errorMessage}
    />
  )
}


