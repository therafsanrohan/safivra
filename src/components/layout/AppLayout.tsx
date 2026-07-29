import React, { useEffect } from 'react';
   import { Outlet, useNavigate, useLocation } from 'react-router-dom';
   import { BottomNav, Sidebar } from '@/components/navigation/Navigation';
   import { usePlatform } from '@/context/PlatformContext';

   /**
    * Main application layout shell.
    * - Mobile: content + fixed bottom nav
    * - Desktop: fixed sidebar + scrollable content area
    */
   export const AppLayout: React.FC = () => {
     const platform = usePlatform();
     const navigate = useNavigate();
     const location = useLocation();

     useEffect(() => {
       if (!platform.lifecycle.onBackButton) return;

       const removeListener = platform.lifecycle.onBackButton(() => {
         // Handle back button clicks:
         // 1. If we are on the dashboard root path "/", let the app default exit or do nothing
         if (location.pathname === '/') {
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
