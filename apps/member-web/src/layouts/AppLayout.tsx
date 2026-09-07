import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BottomNav, Sidebar } from '@/components/navigation/Navigation';
import { usePlatform } from '@/context/PlatformContext';
import { useAuthContext } from '@/context/AuthContext';
import { syncNotifications } from '@/lib/notifications/sync';
import { trackFeatureUsage } from '@/lib/analytics/tracker';

/**
 * Main application layout shell.
 * - Mobile: content + fixed bottom nav
 * - Desktop: fixed sidebar + scrollable content area
 */
export const AppLayout: React.FC = () => {
  const platform = usePlatform();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();

  useEffect(() => {
    if (user) {
      syncNotifications(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !location.pathname) return;
    const path = location.pathname;
    let featureName = 'Dashboard';
    if (path.includes('/activity')) featureName = 'Transactions & Activity';
    else if (path.includes('/accounts')) featureName = 'Accounts & Wallets';
    else if (path.includes('/loans')) featureName = 'Loans & Debts';
    else if (path.includes('/credit-cards')) featureName = 'Credit Cards';
    else if (path.includes('/plans/savings') || path.includes('/savings')) featureName = 'Savings & DPS';
    else if (path.includes('/plans/budgets')) featureName = 'Budgets & Expense Planning';
    else if (path.includes('/plans/recurring')) featureName = 'Recurring Commitments';
    else if (path.includes('/zakat')) featureName = 'Zakat Intelligence';
    else if (path.includes('/tools')) featureName = 'Financial Calculators & Tools';
    else if (path.includes('/reports')) featureName = 'Financial Reports & Exports';
    else if (path.includes('/notifications')) featureName = 'Notifications & Alerts';
    else if (path.includes('/settings')) featureName = 'Settings & Profile';
    else if (path.includes('/system-health')) featureName = 'System Health Diagnostics';

    trackFeatureUsage(featureName, 'view', { path });
  }, [user, location.pathname]);

     useEffect(() => {
       if (!platform.lifecycle.onBackButton) return;

       const removeListener = platform.lifecycle.onBackButton(() => {
         // Handle back button clicks:
         // 1. If we are on the dashboard root path "/", let the app default exit or do nothing
         if (location.pathname === '/dashboard') {
           return;
         }
         // 2. Otherwise navigate back in the React Router history stack
         navigate(-1);
       });

       return () => {
         removeListener();
       };
     }, [platform, navigate, location]);

     return (
       <div className="min-h-svh bg-[var(--color-bg-page)] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
         {/* Desktop Sidebar */}
         <Sidebar />

         {/* Main content */}
         <main
           id="main-content"
           className="lg:ml-[var(--sidebar-width)] pb-[var(--nav-height)] lg:pb-0"
           tabIndex={-1}
         >
           <Outlet />
         </main>

         {/* Mobile Bottom Navigation */}
         <BottomNav />
       </div>
     );
   };
