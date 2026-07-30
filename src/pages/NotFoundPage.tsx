import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/ui/SEO';

export const NotFoundPage: React.FC = () => {
  const { user } = useAuthContext();

  return (
    <>
      <SEO title="Page Not Found" description="The page you are looking for is unavailable." />
      <div className="min-h-svh flex flex-col items-center justify-center p-6 bg-[var(--color-bg-page)] text-center">
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
          Page not found
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] mb-8 max-w-md">
          The page you are looking for is unavailable or may have moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/">
            <Button variant="primary" size="lg">Go to Home</Button>
          </Link>
          {user && (
            <Link to="/dashboard">
              <Button variant="outline" size="lg">Open Dashboard</Button>
            </Link>
          )}
        </div>
      </div>
    </>
  );
};
