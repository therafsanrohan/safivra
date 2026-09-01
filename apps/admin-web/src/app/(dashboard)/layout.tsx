'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '../login/actions'
import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { name: 'Overview', href: '/' },
    { name: 'Members', href: '/users' },
    { name: 'Audit Trail', href: '/audit' },
    { name: 'System', href: '/system' },
    { name: 'Zakat Preview', href: '/zakat' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#1E4D40] text-white p-4 flex justify-between items-center">
        <div className="font-semibold text-xl tracking-tight">Safivra Admin</div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        ${mobileMenuOpen ? 'block' : 'hidden'} 
        md:block w-full md:w-64 bg-[#1E4D40] text-emerald-50 shrink-0 md:min-h-screen
      `}>
        <div className="p-6 hidden md:block">
          <div className="font-semibold text-2xl tracking-tight text-white">Safivra Admin</div>
          <div className="text-emerald-200/80 text-xs mt-1 uppercase tracking-wider font-medium">Operations Console</div>
        </div>

        <nav className="mt-2 md:mt-6 px-4 pb-4 md:pb-0 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  block px-4 py-3 rounded-xl transition-colors text-sm font-medium
                  ${isActive 
                    ? 'bg-white/10 text-white shadow-sm' 
                    : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'}
                `}
              >
                {item.name}
              </Link>
            )
          })}

          <form action={logout} className="pt-4 mt-4 border-t border-emerald-800/50">
            <button
              type="submit"
              className="w-full text-left px-4 py-3 rounded-xl transition-colors text-sm font-medium text-red-300 hover:bg-red-900/30"
            >
              Sign Out
            </button>
          </form>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
