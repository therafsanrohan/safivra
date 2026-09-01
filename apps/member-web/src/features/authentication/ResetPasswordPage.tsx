import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordData } from '@/lib/validation/schemas';
import { useAuthContext } from '@/context/AuthContext';
import { APP_CONFIG } from '@/config/app';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CheckCircle } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const { updatePassword } = useAuthContext();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordData) => {
    setServerError('');
    const result = await updatePassword(data.password);
    if (result.error) { setServerError(result.error); } else { setDone(true); }
  };

  if (done) return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-[var(--color-bg-page)] px-5 py-12 text-center">
      <div className="w-full max-w-sm">
        <CheckCircle size={48} className="text-[var(--color-positive)] mx-auto mb-6" />
        <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)] mb-2">Password updated</h1>
        <p className="text-[var(--text-body)] text-[var(--color-text-secondary)]">Your password has been changed. You can now sign in with your new password.</p>
        <Button variant="secondary" fullWidth className="mt-8" onClick={() => navigate('/auth/sign-in')}>Sign in</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-[var(--color-bg-page)] px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center flex justify-center">
          <Logo textClassName="text-2xl tracking-tight" />
        </div>
        <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)] mb-2">Set new password</h1>
        <p className="text-[var(--text-body)] text-[var(--color-text-secondary)] mb-8">Enter and confirm your new password.</p>
        {serverError && <div role="alert" className="mb-5 p-3 rounded-[var(--radius-input)] bg-[var(--color-negative-soft)] text-[var(--color-negative)] text-[var(--text-secondary)]">{serverError}</div>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input label="New password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required error={errors.password?.message} rightElement={<button type="button" onClick={() => setShowPassword(v => !v)} aria-label="Toggle">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>} {...register('password')} />
          <Input label="Confirm password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required error={errors.confirm_password?.message} {...register('confirm_password')} />
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>Set new password</Button>
        </form>
      </div>
    </div>
  );
};
