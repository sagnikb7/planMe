import './auth-layout.css';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { isStrongPassword, passwordPolicyMessage } from '@/lib/passwordPolicy';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/components/ui/password-field';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/ui/loader';

const schema = z.object({
  password: z.string().refine(isStrongPassword, passwordPolicyMessage),
  confirmPassword: z.string().min(8, 'Confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    if (!token) {
      setError('root', { message: 'Missing reset token' });
      return;
    }

    try {
      await resetPassword(token, data.password);
      navigate('/login', { replace: true, state: { passwordReset: true } });
    } catch (err) {
      setError('root', { message: err.response?.data?.error || 'Failed to reset password' });
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="mb-1 flex items-center gap-2">
          <Logo className="text-lg" />
        </div>
        <p className="text-xs tracking-wide text-[var(--ds-color-text-muted)]">
          Where sparks become plans.
        </p>

        <div className="auth-card-divider" />

        <h1 className="mb-0.5 text-xl font-semibold text-[var(--ds-color-text)]">Choose a new password</h1>
        <p className="mb-5 text-sm text-[var(--ds-color-text-muted)]">
          {passwordPolicyMessage}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && (
            <p className="feedback-error px-3 py-2 text-sm">{errors.root.message}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <PasswordField id="password" {...register('password')} />
            {errors.password && <p className="text-xs text-[var(--ds-color-danger)]">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordField id="confirmPassword" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-xs text-[var(--ds-color-danger)]">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <><Loader /> Resetting</> : 'Reset password'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--ds-color-text-muted)]">
          Need a new link?{' '}
          <Link to="/forgot-password" className="link-accent underline-offset-4 hover:underline">Start over</Link>
        </p>
      </div>
    </div>
  );
}
