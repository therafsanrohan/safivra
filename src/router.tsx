import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard, GuestGuard } from '@/features/authentication/AuthGuard';
import { SignInPage } from '@/features/authentication/SignInPage';
import { SignUpPage } from '@/features/authentication/SignUpPage';
import { ForgotPasswordPage } from '@/features/authentication/ForgotPasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { Spinner } from '@/components/ui/Card';

// Lazy-loaded routes to reduce initial bundle
const ResetPasswordPage   = lazy(() => import('@/features/authentication/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage     = lazy(() => import('@/features/authentication/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));
const OnboardingPage      = lazy(() => import('@/features/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const ActivityPage        = lazy(() => import('@/features/transactions/ActivityPage').then((m) => ({ default: m.ActivityPage })));
const AddTransactionPage  = lazy(() => import('@/features/transactions/AddTransactionPage').then((m) => ({ default: m.AddTransactionPage })));
const TransactionDetail   = lazy(() => import('@/features/transactions/TransactionDetailPage').then((m) => ({ default: m.TransactionDetailPage })));
const AccountsPage        = lazy(() => import('@/features/accounts/AccountsPage').then((m) => ({ default: m.AccountsPage })));
const AccountDetailPage   = lazy(() => import('@/features/accounts/AccountDetailPage').then((m) => ({ default: m.AccountDetailPage })));
const AddAccountPage      = lazy(() => import('@/features/accounts/AddAccountPage').then((m) => ({ default: m.AddAccountPage })));
const LoansPage           = lazy(() => import('@/features/loans/LoansPage').then((m) => ({ default: m.LoansPage })));
const LoanDetailPage      = lazy(() => import('@/features/loans/LoanDetailPage').then((m) => ({ default: m.LoanDetailPage })));
const AddLoanPage         = lazy(() => import('@/features/loans/AddLoanPage').then((m) => ({ default: m.AddLoanPage })));
const CreditCardsPage     = lazy(() => import('@/features/credit-cards/CreditCardsPage').then((m) => ({ default: m.CreditCardsPage })));
const CardDetailPage      = lazy(() => import('@/features/credit-cards/CardDetailPage').then((m) => ({ default: m.CardDetailPage })));
const AddCardPage         = lazy(() => import('@/features/credit-cards/AddCardPage').then((m) => ({ default: m.AddCardPage })));
const PlansPage           = lazy(() => import('@/features/plans/PlansPage').then((m) => ({ default: m.PlansPage })));
const BudgetsPage         = lazy(() => import('@/features/budgets/BudgetsPage').then((m) => ({ default: m.BudgetsPage })));
const RecurringPage       = lazy(() => import('@/features/recurring/RecurringPage').then((m) => ({ default: m.RecurringPage })));
const GoalsPage           = lazy(() => import('@/features/goals/GoalsPage').then((m) => ({ default: m.GoalsPage })));
const ReportsPage         = lazy(() => import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const NotificationsPage   = lazy(() => import('@/features/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const SettingsPage        = lazy(() => import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const MorePage            = lazy(() => import('@/features/more/MorePage').then((m) => ({ default: m.MorePage })));

const PageLoader: React.FC = () => (
  <div className="min-h-svh flex items-center justify-center bg-[var(--color-bg-page)]">
    <Spinner size={28} />
  </div>
);

const router = createBrowserRouter([
  // Guest-only auth routes
  {
    path: '/auth',
    children: [
      {
        path: 'sign-in',
        element: <GuestGuard><SignInPage /></GuestGuard>,
      },
      {
        path: 'sign-up',
        element: <GuestGuard><SignUpPage /></GuestGuard>,
      },
      {
        path: 'forgot-password',
        element: <GuestGuard><ForgotPasswordPage /></GuestGuard>,
      },
      {
        path: 'reset-password',
        element: <Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>,
      },
      {
        path: 'verify-email',
        element: <Suspense fallback={<PageLoader />}><VerifyEmailPage /></Suspense>,
      },
    ],
  },

  // Onboarding
  {
    path: '/onboarding',
    element: (
      <AuthGuard requireOnboarding={false}>
        <Suspense fallback={<PageLoader />}>
          <OnboardingPage />
        </Suspense>
      </AuthGuard>
    ),
  },

  // Main authenticated app
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },

      // Activity / Transactions
      {
        path: 'activity',
        element: <Suspense fallback={<PageLoader />}><ActivityPage /></Suspense>,
      },
      {
        path: 'activity/add',
        element: <Suspense fallback={<PageLoader />}><AddTransactionPage /></Suspense>,
      },
      {
        path: 'activity/:id',
        element: <Suspense fallback={<PageLoader />}><TransactionDetail /></Suspense>,
      },

      // Accounts
      { path: 'accounts', element: <Suspense fallback={<PageLoader />}><AccountsPage /></Suspense> },
      { path: 'accounts/add', element: <Suspense fallback={<PageLoader />}><AddAccountPage /></Suspense> },
      { path: 'accounts/:id', element: <Suspense fallback={<PageLoader />}><AccountDetailPage /></Suspense> },

      // Loans
      { path: 'loans', element: <Suspense fallback={<PageLoader />}><LoansPage /></Suspense> },
      { path: 'loans/add', element: <Suspense fallback={<PageLoader />}><AddLoanPage /></Suspense> },
      { path: 'loans/:id', element: <Suspense fallback={<PageLoader />}><LoanDetailPage /></Suspense> },

      // Credit Cards
      { path: 'credit-cards', element: <Suspense fallback={<PageLoader />}><CreditCardsPage /></Suspense> },
      { path: 'credit-cards/add', element: <Suspense fallback={<PageLoader />}><AddCardPage /></Suspense> },
      { path: 'credit-cards/:id', element: <Suspense fallback={<PageLoader />}><CardDetailPage /></Suspense> },

      // Plans
      { path: 'plans', element: <Suspense fallback={<PageLoader />}><PlansPage /></Suspense> },
      { path: 'plans/budgets', element: <Suspense fallback={<PageLoader />}><BudgetsPage /></Suspense> },
      { path: 'plans/recurring', element: <Suspense fallback={<PageLoader />}><RecurringPage /></Suspense> },
      { path: 'plans/goals', element: <Suspense fallback={<PageLoader />}><GoalsPage /></Suspense> },

      // Reports
      { path: 'reports', element: <Suspense fallback={<PageLoader />}><ReportsPage /></Suspense> },

      // Notifications
      { path: 'notifications', element: <Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense> },

      // Settings
      { path: 'settings', element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },
      { path: 'settings/:section', element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },

      // More (mobile menu)
      { path: 'more', element: <Suspense fallback={<PageLoader />}><MorePage /></Suspense> },

      // Fallback
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },

  // Root fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);

export const AppRouter: React.FC = () => <RouterProvider router={router} />;
