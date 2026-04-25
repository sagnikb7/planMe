import { z } from 'zod';
import { isStrongPassword, passwordPolicyMessage } from '../utils/password-policy';

export const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().refine(isStrongPassword, passwordPolicyMessage),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().refine(isStrongPassword, passwordPolicyMessage),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
