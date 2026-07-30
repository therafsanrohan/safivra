import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Check } from 'lucide-react';
import { signUpSchema, type SignUpData } from '@/lib/validation/schemas';
import { useAuthContext } from '@/context/AuthContext';
import { APP_CONFIG } from '@/config/app';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const PasswordRequirement: React.FC<{ met: boolean; label: string }> = ({ met, label }) => (
  <li className="flex items-center gap-1.5 text-[var(--text-secondary)]">
    <span
      className={met ? 'text-[var(--color-positive)]' : 'text-[var(--color-text-muted)]'}
      aria-hidden="true"
    >
      <Check size={12} strokeWidth={3} />
    </span>
    <span className={met ? 'text-[var(--color-positive)]' : 'text-[var(--color-text-muted)]'}>
      {label}
    </span>
  </li>
);


export const SignUpPage: React.FC = () => {
  const { signUp } = useAuthContext();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
  });

  const password = watch('password', '');
  const hasLength = password.length >= 8;
  const hasUpper  = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const onSubmit = async (data: SignUpData) => {
    setServerError('');
    const result = await signUp(data.email, data.password, data.full_name);
    if (result.error) {
      setServerError(result.error);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-[var(--color-bg-page)] px-5 py-12 text-center">
        <div className="w-full max-w-sm">
          <div className="w-14 h-14 rounded-full bg-[var(--color-positive-soft)] flex items-center justify-center mx-auto mb-6">
            <Check size={28} className="text-[var(--color-positive)]" aria-hidden="true" />
          </div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)] mb-2">
            Check your inbox
          </h1>
          <p className="text-[var(--text-body)] text-[var(--color-text-secondary)]">
            We sent a confirmation link to your email address. Click the link to activate your account, then sign in.
          </p>
          <Button
            variant="secondary"
            fullWidth
            className="mt-8"
            onClick={() => navigate('/auth/sign-in')}
          >
            Return to sign in
          </Button>
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
          Create account
        </h1>
        <p className="text-[var(--text-body)] text-[var(--color-text-secondary)] mb-8">
          Start tracking your finances privately.
        </p>

        {serverError && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-[var(--radius-input)] bg-[var(--color-negative-soft)] text-[var(--color-negative)] text-[var(--text-secondary)]"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label="Full name"
            type="text"
            autoComplete="name"
            required
            error={errors.full_name?.message}
            {...register('full_name')}
          />

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
              autoComplete="new-password"
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
            <ul className="mt-2 space-y-1 pl-0 list-none" aria-label="Password requirements">
              <PasswordRequirement met={hasLength} label="At least 8 characters" />
              <PasswordRequirement met={hasUpper}  label="One uppercase letter" />
              <PasswordRequirement met={hasNumber} label="One number" />
            </ul>
          </div>

          <Input
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            error={errors.confirm_password?.message}
            {...register('confirm_password')}
          />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded accent-[var(--color-accent)]"
              {...register('agreed')}
            />
            <span className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
              I agree to the{' '}
              <Link to="/terms" className="text-[var(--color-accent)]">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-[var(--color-accent)]">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreed && (
            <p role="alert" className="text-[var(--text-secondary)] text-[var(--color-negative)] -mt-2">
              {errors.agreed.message}
            </p>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Create account
          </Button>
        </form>

        <p className="text-center text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-6">
          Already have an account?{' '}
          <Link to="/auth/sign-in" className="font-semibold text-[var(--color-accent)]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
