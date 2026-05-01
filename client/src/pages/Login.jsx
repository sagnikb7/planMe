import './auth-layout.css';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordField } from '@/components/ui/password-field';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/ui/loader';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const result = await login(data.email, data.password, data.rememberMe);
      if (result?.sessionLimited) {
        navigate('/session-limit', { replace: true });
      } else {
        navigate('/ideas');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      setError('root', { message: msg });
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

        <h1 className="mb-0.5 text-xl font-semibold text-[var(--ds-color-text)]">Sign in</h1>
        <p className="mb-5 text-sm text-[var(--ds-color-text-muted)]">Welcome back.</p>

        {location.state?.registered && (
          <p className="feedback-success mb-4 px-3 py-2 text-sm">Account created. You can log in now.</p>
        )}
        {location.state?.passwordReset && (
          <p className="feedback-success mb-4 px-3 py-2 text-sm">Password updated.</p>
        )}
        {new URLSearchParams(location.search).get('error') === 'google' && (
          <p className="feedback-error mb-4 px-3 py-2 text-sm">Google sign-in failed. Please try again.</p>
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
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordField id="password" placeholder="Password" {...register('password')} />
            {errors.password && <p className="text-xs text-[var(--ds-color-danger)]">{errors.password.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              type="checkbox"
              className="h-3.5 w-3.5 rounded-sm accent-[var(--ds-color-glow)] cursor-pointer"
              {...register('rememberMe')}
            />
            <label htmlFor="rememberMe" className="text-xs text-[var(--ds-color-text-muted)] cursor-pointer select-none">
              Remember me for 30 days
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <><Loader /> Signing in</> : 'Sign in'}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--ds-color-border)]" />
          <span className="text-xs text-[var(--ds-color-text-soft)]">or</span>
          <div className="h-px flex-1 bg-[var(--ds-color-border)]" />
        </div>

        <a
          href="/api/auth/google"
          className="flex w-full items-center justify-center gap-2.5 rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface-strong)] px-4 py-2.5 text-sm font-medium text-[var(--ds-color-text)] transition-colors hover:bg-[var(--ds-color-surface)]"
        >
          <GoogleIcon />
          Continue with Google
        </a>

        <div className="mt-5 flex items-center justify-between text-sm text-[var(--ds-color-text-muted)]">
          <Link to="/register" className="link-accent underline-offset-4 hover:underline">Create account</Link>
          <Link to="/forgot-password" className="link-accent underline-offset-4 hover:underline">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}
