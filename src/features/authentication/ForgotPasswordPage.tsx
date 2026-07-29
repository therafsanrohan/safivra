import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordData } from '@/lib/validation/schemas';
import { useAuthContext } from '@/context/AuthContext';
import { APP_CONFIG } from '@/config/app';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CheckCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { sendPasswordReset } = useAuthContext();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordData>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordData) => {
    setServerError('');
    const result = await sendPasswordReset(data.email);
    if (result.error) {
      setServerError(result.error);
    } else {
      // Always show success to avoid email enumeration
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-[var(--color-bg-page)] px-5 py-12 text-center">
        <div className="w-full max-w-sm">
          <CheckCircle size={48} className="text-[var(--color-positive)] mx-auto mb-6" aria-hidden="true" />
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)] mb-2">
            Reset link sent
          </h1>
          <p className="text-[var(--text-body)] text-[var(--color-text-secondary)]">
            If that email address is registered, you will receive a password reset link shortly.
          </p>
          <Link to="/auth/sign-in" className="block mt-8">
            <Button variant="secondary" fullWidth>Return to sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-[var(--color-bg-page)] px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {APP_CONFIG.name}
          </span>
        </div>

        <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)] mb-1">
          Reset password
        </h1>
        <p className="text-[var(--text-body)] text-[var(--color-text-secondary)] mb-8">
          Enter your email address and we will send you a reset link.
        </p>

        {serverError && (
          <div role="alert" className="mb-5 p-3 rounded-[var(--radius-input)] bg-[var(--color-negative-soft)] text-[var(--color-negative)] text-[var(--text-secondary)]">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            required
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            Send reset link
          </Button>
        </form>

        <p className="text-center text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-6">
          <Link to="/auth/sign-in" className="text-[var(--color-accent)] font-semibold">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
