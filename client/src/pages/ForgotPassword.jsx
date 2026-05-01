import './auth-layout.css';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/ui/loader';

const schema = z.object({
  email: z.string().email('Invalid email'),
});

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [result, setResult] = useState(null);
  const resetPath = result?.resetUrl ? new URL(result.resetUrl).pathname + new URL(result.resetUrl).search : '';
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await forgotPassword(data.email);
      setResult(response);
    } catch (err) {
      setError('root', { message: err.response?.data?.error || 'Failed to start password reset' });
    }
  };

  return (
    <div className="auth-root">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <Logo className="text-xl" />
        <p className="text-xs tracking-wide text-[var(--ds-color-text-muted)]">
          Where sparks become plans.
        </p>
      </div>

      <div className="auth-card">
        <h1 className="mb-1 text-base font-semibold text-[var(--ds-color-text)]">Reset password</h1>
        <p className="mb-6 text-sm text-[var(--ds-color-text-muted)]">
          Enter your email to receive a reset link.
        </p>

        {result && (
          <div className="mb-4 space-y-2">
            <p className="feedback-success px-3 py-2 text-sm">{result.message}</p>
            {result.resetUrl && (
              <p className="break-all text-xs text-[var(--ds-color-text-muted)]">
                Dev link:{' '}
                <Link to={resetPath} className="link-accent underline-offset-4 hover:underline">
                  {result.resetUrl}
                </Link>
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && (
            <p className="feedback-error px-3 py-2 text-sm">{errors.root.message}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="text-xs text-[var(--ds-color-danger)]">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <><Loader /> Sending</> : 'Send reset link'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--ds-color-text-muted)]">
          <Link to="/login" className="link-accent underline-offset-4 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
