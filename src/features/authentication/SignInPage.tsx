import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { signInSchema, type SignInData } from '@/lib/validation/schemas';
import { useAuthContext } from '@/context/AuthContext';
import { APP_CONFIG } from '@/config/app';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const SignInPage: React.FC = () => {
  const { signIn } = useAuthContext();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInData) => {
    setServerError('');
    const result = await signIn(data.email, data.password);
    if (result.error) {
      setServerError(result.error);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-[var(--color-bg-page)] px-5 py-12">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-10 text-center">
          <span className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {APP_CONFIG.name}
          </span>
        </div>

        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)] mb-1">
            Welcome back
          </h1>
          <p className="text-[var(--text-body)] text-[var(--color-text-secondary)] mb-8">
            Sign in to continue managing your finances.
          </p>

          {serverError && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-[var(--radius-input)] bg-[var(--color-negative-soft)] text-[var(--color-negative)] text-[var(--text-secondary)]"
            >
              {serverError}
            </div>
          )}

          <div className="mb-6 p-3.5 rounded-[var(--radius-card)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[var(--color-text-primary)]">Demo Account Credentials:</span>
              <button
                type="button"
                onClick={() => {
                  setValue('email', 'demo@safivra.com');
                  setValue('password', 'Demo1234');
                }}
                className="text-[var(--color-accent)] font-semibold underline"
              >
                Auto-fill
              </button>
            </div>
            <p className="text-[var(--color-text-secondary)]">
              Email: <code className="font-mono text-[var(--color-text-primary)]">demo@safivra.com</code>
            </p>
            <p className="text-[var(--color-text-secondary)]">
              Password: <code className="font-mono text-[var(--color-text-primary)]">Demo1234</code>
            </p>
          </div>

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

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                error={errors.password?.message}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="p-0.5"
                  >
                    {showPassword ? (
                      <EyeOff size={16} aria-hidden="true" />
                    ) : (
                      <Eye size={16} aria-hidden="true" />
                    )}
                  </button>
                }
                {...register('password')}
              />
              <div className="text-right mt-1.5">
                <Link
                  to="/auth/forgot-password"
                  className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isSubmitting}
              className="mt-2"
            >
              Sign in
            </Button>
          </form>

          <p className="text-center text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/auth/sign-up" className="font-semibold text-[var(--color-accent)]">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
