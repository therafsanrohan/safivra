'use client'

import { usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import { ThemeProvider, useTheme } from './ThemeProvider'

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme } = useTheme()

  if (pathname === '/login') {
    return <>{children}</>
  }

  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen flex flex-col md:flex-row antialiased transition-colors duration-200 selection:bg-emerald-500 selection:text-white ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ShellContent>{children}</ShellContent>
    </ThemeProvider>
  )
}

