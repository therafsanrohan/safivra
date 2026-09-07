export const dynamic = "force-dynamic";

import { createAdminClient } from '../../../utils/supabase/server'

export default async function MembersPage() {
  const supabase = createAdminClient()

  // Get members list, ordered by most recent first
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, created_at, onboarding_status, currency')
    .order('created_at', { ascending: false })
    .limit(50)

  const totalMembers = members?.length || 0
  const completedCount = members?.filter(m => m.onboarding_status === 'completed').length || 0
  const pendingCount = totalMembers - completedCount

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">Members Directory</h1>
        <p className="mt-1 text-sm text-slate-500">
          A read-only view of registered Safivra members and onboarding statuses.
        </p>
      </div>

      {/* Responsive Stat Badges */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Listed</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalMembers}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 font-bold text-sm">
            👥
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed Onboarding</p>
            <p className="text-2xl font-bold text-emerald-900 mt-0.5">{completedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">
            ✓
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending / Draft</p>
            <p className="text-2xl font-bold text-amber-900 mt-0.5">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-sm">
            ⏳
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-800">Member Accounts</h2>
          <span className="text-xs text-slate-500">Showing top 50 recent accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Member Details
                </th>
                <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Onboarding
                </th>
                <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Currency
                </th>
                <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Joined Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 text-sm">
              {members?.map((person) => (
                <tr key={person.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                        {(person.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{person.full_name || 'Unnamed Member'}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">{person.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      person.onboarding_status === 'completed' 
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' 
                        : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                    }`}>
                      {person.onboarding_status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-600 uppercase text-xs">
                    {person.currency || 'BDT'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">
                    {new Date(person.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
              {(!members || members.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">
                    No registered members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

