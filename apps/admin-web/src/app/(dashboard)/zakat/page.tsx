export const dynamic = "force-dynamic";

import { createAdminClient } from '../../../utils/supabase/server'

export default async function ZakatPage() {
  const supabase = createAdminClient()

  // Zakat is typically 2.5% of eligible wealth
  const ZAKAT_RATE = 0.025

  // For this read-only preview, we approximate net worth by summing all positive balances
  // in real accounting, this requires complex ledger resolution, but for preview we can
  // show the raw aggregate from profiles or ledger. Since we don't have a materialized
  // balance column in profiles (unless we do), we will just list the members for now.
  
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name')
    .limit(50)

  // NOTE: True Zakat calculation requires a materialized view of current net balances 
  // per user, which might be expensive to run on the fly without a dedicated RPC.
  // We will show a placeholder UI for the preview.

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Zakat Policy Preview</h1>
        <p className="mt-2 text-sm text-gray-500">
          Preview estimated Zakat obligations. No financial records are modified.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-emerald-50/50">
          <h2 className="text-lg font-medium text-gray-900">Global Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Current applied rate: 2.5%</p>
        </div>
        
        <div className="p-8 text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Advanced Calculation Required</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
            Real-time Zakat calculation requires querying the full double-entry ledger for each user. 
            This feature is currently in preview mode.
          </p>
        </div>
      </div>
    </div>
  )
}
