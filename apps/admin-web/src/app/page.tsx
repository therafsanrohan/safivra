import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-8 text-emerald-400">Safivra Admin</h1>
        <nav className="flex-1 space-y-2">
          <a href="/" className="block px-4 py-2 bg-slate-800 rounded-md font-medium text-emerald-300">Dashboard</a>
          <a href="/zakat" className="block px-4 py-2 hover:bg-slate-800 rounded-md text-gray-300 transition-colors">Zakat Settings</a>
          <a href="/users" className="block px-4 py-2 hover:bg-slate-800 rounded-md text-gray-300 transition-colors">Users & Roles</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">System Dashboard</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">Phase 3: Backend Boundary Live</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Total Registered Users</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Daily Transactions</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">System Status</h3>
            <p className="text-3xl font-bold text-emerald-600 mt-2">Healthy</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Audit Logs</h3>
          <p className="text-gray-500 text-sm">No recent admin activity found in public.admin_audit_logs.</p>
        </div>
      </main>
    </div>
  );
}
