import React from 'react';
import { Link, useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/ui/SEO';

export const ErrorPage: React.FC = () => {
  const error = useRouteError();
  
  // Log securely to console. Do not render this in the UI.
  console.error('Unhandled Route Error:', error);

  return (
    <>
      <SEO title="Error" description="An unexpected error occurred." />
      <div className="min-h-svh flex flex-col items-center justify-center p-6 bg-[var(--color-bg-page)] text-center">
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
          Something went wrong
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] mb-8 max-w-md">
          Safivra could not complete this request. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="primary" size="lg" onClick={() => window.location.reload()}>
            Try Again
          </Button>
          <Link to="/">
            <Button variant="outline" size="lg">Go to Home</Button>
          </Link>
        </div>
      </div>
    </>
  );
};
