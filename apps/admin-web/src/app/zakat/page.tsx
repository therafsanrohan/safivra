export const dynamic = "force-dynamic";

import { createAdminClient } from '../../utils/supabase/server'
import ZakatClient from './ZakatClient'

export default async function ZakatAdminPage() {
  const supabase = createAdminClient()

  // Fetch active rule sets, rate snapshots, and calculation summary in parallel
  const [
    { data: ruleSets },
    { data: rateSnapshots },
    { count: totalCalculationsCount }
  ] = await Promise.all([
    supabase
      .from('zakat_rule_sets')
      .select('*')
      .order('version', { ascending: false }),
    supabase
      .from('zakat_rate_snapshots')
      .select('*')
      .order('fetch_timestamp', { ascending: false })
      .limit(10),
    supabase
      .from('zakat_calculations')
      .select('id', { count: 'exact', head: true })
  ])

  const activeRule = ruleSets?.[0]
  const latestSnapshot = rateSnapshots?.[0]

  return (
    <ZakatClient
      activeRule={activeRule}
      latestSnapshot={latestSnapshot}
      rateSnapshots={rateSnapshots || []}
      totalCalculationsCount={totalCalculationsCount || 0}
    />
  )
}

