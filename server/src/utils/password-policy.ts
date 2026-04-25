import { PASSWORD_POLICY } from '../constants';

export const passwordPolicyMessage = PASSWORD_POLICY.message;

export function isStrongPassword(password: string): boolean {
  if (password.length < PASSWORD_POLICY.minLength) return false;
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) return false;
  if (PASSWORD_POLICY.requireNumber && !/[0-9]/.test(password)) return false;
  if (PASSWORD_POLICY.requireSymbol && !/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}
