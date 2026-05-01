import './auth-layout.css';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { isStrongPassword, passwordPolicyMessage } from '@/lib/passwordPolicy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordField } from '@/components/ui/password-field';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/ui/loader';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().refine(isStrongPassword, passwordPolicyMessage),
});

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await registerUser(data.name, data.email, data.password);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
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
        <h1 className="mb-1 text-base font-semibold text-[var(--ds-color-text)]">Create account</h1>
        <p className="mb-6 text-sm text-[var(--ds-color-text-muted)]">
          Free, private, no fluff.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && (
            <p className="feedback-error px-3 py-2 text-sm">{errors.root.message}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Your name" {...register('name')} />
            {errors.name && <p className="text-xs text-[var(--ds-color-danger)]">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="text-xs text-[var(--ds-color-danger)]">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordField id="password" placeholder="Min 8 chars, uppercase, number, symbol" {...register('password')} />
            {errors.password
              ? <p className="text-xs text-[var(--ds-color-danger)]">{errors.password.message}</p>
              : <p className="text-xs text-[var(--ds-color-text-soft)]">{passwordPolicyMessage}</p>
            }
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <><Loader /> Creating account</> : 'Create account'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--ds-color-text-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="link-accent underline-offset-4 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
