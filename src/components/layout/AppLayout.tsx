import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav, Sidebar } from '@/components/navigation/Navigation';

/**
 * Main application layout shell.
 * - Mobile: content + fixed bottom nav
 * - Desktop: fixed sidebar + scrollable content area
 */
export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-svh bg-[var(--color-bg-page)]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main
        id="main-content"
        className="lg:ml-[var(--sidebar-width)]"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
