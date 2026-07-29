import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/Card';

interface AuthGuardProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

/**
 * Protects routes that require authentication.
 * Redirects unauthenticated users to sign-in.
 * Redirects users who haven't completed onboarding to /onboarding.
 * Stores the requested path for redirect after sign-in.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireOnboarding = true,
}) => {
  const { user, profile, loading, initialized } = useAuthContext();
  const location = useLocation();

  if (!initialized || loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-[var(--color-bg-page)]">
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) {
    // Safe redirect — preserve intended destination
    return (
      <Navigate
        to="/auth/sign-in"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (requireOnboarding && profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

/**
 * Redirects authenticated users away from auth pages.
 */
export const GuestGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, initialized } = useAuthContext();
  const location = useLocation();

  if (!initialized || loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-[var(--color-bg-page)]">
        <Spinner size={32} />
      </div>
    );
  }

  if (user) {
    const from = (location.state as { from?: string })?.from ?? '/';
    // Prevent open redirect: only allow relative paths
    const safePath = from.startsWith('/') ? from : '/';
    return <Navigate to={safePath} replace />;
  }

  return <>{children}</>;
};
