import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-svh flex items-center justify-center bg-[var(--color-bg-page)] p-6 fade-in">
      <div className="max-w-md w-full text-center space-y-5 bg-[var(--color-bg-surface)] p-8 rounded-[var(--radius-sheet)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
        <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]">
          <ShieldAlert size={28} />
        </div>
        <div className="space-y-1">
          <h1 className="text-[var(--text-page)] font-bold text-[var(--color-text-primary)]">
            Page Not Found
          </h1>
          <p className="text-[var(--text-body)] text-[var(--color-text-secondary)]">
            The requested page does not exist or has been securely relocated.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <Link to="/">
            <Button fullWidth className="gap-2">
              <Home size={18} /> Return to Dashboard
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full py-2.5 text-[var(--text-button)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium flex items-center justify-center gap-1 transition-colors"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
