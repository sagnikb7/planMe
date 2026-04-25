export const passwordPolicyMessage =
  'Password must be at least 8 characters and include an uppercase letter, a number, and a symbol';

export function isStrongPassword(password) {
  return (
    password.length >= 8
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password)
  );
}
