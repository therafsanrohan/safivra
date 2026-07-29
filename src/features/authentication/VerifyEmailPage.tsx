import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="page-container pt-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[var(--color-text-secondary)] mb-6 hover:text-[var(--color-text-primary)]" aria-label="Go back">
        <ArrowLeft size={18} /> Back
      </button>
      <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)] mb-2">VerifyEmail</h1>
      <p className="text-[var(--color-text-secondary)]">Check your email to verify your account.</p>
      <p className="mt-4 text-[var(--text-secondary)] text-[var(--color-text-muted)]">Full implementation in progress.</p>
    </div>
  );
};
