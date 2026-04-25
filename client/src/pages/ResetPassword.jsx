import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isStrongPassword, passwordPolicyMessage } from '@/lib/passwordPolicy';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/components/ui/password-field';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
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
    <div className="mx-auto flex min-h-screen max-w-[var(--ds-size-container)] items-center px-4 py-6 md:px-6">
      <div className="grid w-full gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="surface-panel hidden overflow-hidden px-8 py-10 lg:flex lg:min-h-[620px] lg:flex-col lg:justify-between">
          <div>
            <div className="mb-4 inline-flex rounded-[var(--ds-radius-pill)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-strong)] px-3 py-2 text-xs uppercase tracking-[0.14em] text-[var(--ds-color-text-soft)]">
              Secure reset
            </div>
            <h1 className="font-[var(--font-display)] text-[clamp(2.4rem,5.4vw,4.2rem)] leading-[0.95] tracking-[-0.05em] text-[var(--ds-color-text)]">
              Set a stronger password and get back to work.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--ds-color-text-muted)]">
              Choose a password that is easy for you to keep and difficult for anyone else to guess. The system will reject weak credentials before they are saved.
            </p>
          </div>
          <div className="surface-card p-5">
            <p className="text-sm text-[var(--ds-color-text-muted)]">{passwordPolicyMessage}</p>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle>Choose a new password</CardTitle>
              <CardDescription>Use a new password with at least 8 characters.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errors.root && (
                  <p className="feedback-error px-3 py-2 text-sm">
                    {errors.root.message}
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="password">New password</Label>
                  <PasswordField id="password" {...register('password')} />
                  {errors.password && <p className="text-xs text-[var(--ds-color-danger)]">{errors.password.message}</p>}
                  {!errors.password && (
                    <p className="text-xs text-[var(--ds-color-text-muted)]">{passwordPolicyMessage}</p>
                  )}
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
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-sm text-[var(--ds-color-text-muted)]">
                Need a new link?{' '}
                <Link to="/forgot-password" className="link-accent underline-offset-4 hover:underline">Start over</Link>
              </p>
            </CardFooter>
          </Card>
        </section>
      </div>
    </div>
  );
}
