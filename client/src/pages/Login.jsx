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
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <Logo className="text-xl" />
        <p className="text-xs tracking-wide text-[var(--ds-color-text-muted)]">
          Where sparks become plans.
        </p>
      </div>

      <div className="auth-card">
        <h1 className="mb-1 text-base font-semibold text-[var(--ds-color-text)]">Sign in</h1>
        <p className="mb-6 text-sm text-[var(--ds-color-text-muted)]">
          Welcome back.
        </p>

        {location.state?.registered && (
          <p className="feedback-success mb-4 px-3 py-2 text-sm">Account created. You can log in now.</p>
        )}
        {location.state?.passwordReset && (
          <p className="feedback-success mb-4 px-3 py-2 text-sm">Password updated.</p>
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

        <div className="mt-5 flex items-center justify-between text-sm text-[var(--ds-color-text-muted)]">
          <Link to="/register" className="link-accent underline-offset-4 hover:underline">Create account</Link>
          <Link to="/forgot-password" className="link-accent underline-offset-4 hover:underline">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}
