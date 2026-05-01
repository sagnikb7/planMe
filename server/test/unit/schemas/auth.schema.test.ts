import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateNameSchema,
  changePasswordSchema,
} from '../../../src/schemas/auth.schema';

describe('registerSchema', () => {
  it('accepts valid input', () => {
    const result = registerSchema.safeParse({ name: 'Alice', email: 'alice@example.com', password: 'Password1!' });
    expect(result.success).toBe(true);
  });

  it('rejects name shorter than 2 chars', () => {
    const result = registerSchema.safeParse({ name: 'A', email: 'a@example.com', password: 'Password1!' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ name: 'Alice', email: 'not-an-email', password: 'Password1!' });
    expect(result.success).toBe(false);
  });

  it('rejects weak password (no uppercase)', () => {
    const result = registerSchema.safeParse({ name: 'Alice', email: 'a@example.com', password: 'password1!' });
    expect(result.success).toBe(false);
  });

  it('rejects weak password (no number)', () => {
    const result = registerSchema.safeParse({ name: 'Alice', email: 'a@example.com', password: 'Password!' });
    expect(result.success).toBe(false);
  });

  it('rejects weak password (no symbol)', () => {
    const result = registerSchema.safeParse({ name: 'Alice', email: 'a@example.com', password: 'Password1' });
    expect(result.success).toBe(false);
  });

  it('trims name and lowercases email', () => {
    const result = registerSchema.safeParse({ name: '  Alice  ', email: 'ALICE@EXAMPLE.COM', password: 'Password1!' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Alice');
      expect(result.data.email).toBe('alice@example.com');
    }
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'not-email' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts valid token and strong password', () => {
    const result = resetPasswordSchema.safeParse({ token: 'a'.repeat(64), password: 'Password1!' });
    expect(result.success).toBe(true);
  });

  it('rejects token shorter than 32 chars', () => {
    const result = resetPasswordSchema.safeParse({ token: 'short', password: 'Password1!' });
    expect(result.success).toBe(false);
  });

  it('rejects weak password', () => {
    const result = resetPasswordSchema.safeParse({ token: 'a'.repeat(64), password: 'weakpassword' });
    expect(result.success).toBe(false);
  });
});

describe('updateNameSchema', () => {
  it('accepts name of 2+ chars', () => {
    expect(updateNameSchema.safeParse({ name: 'Jo' }).success).toBe(true);
  });

  it('rejects name shorter than 2 chars', () => {
    expect(updateNameSchema.safeParse({ name: 'J' }).success).toBe(false);
  });

  it('trims whitespace', () => {
    const result = updateNameSchema.safeParse({ name: '  Jo  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('Jo');
  });
});

describe('changePasswordSchema', () => {
  it('accepts valid current and new password', () => {
    const result = changePasswordSchema.safeParse({ currentPassword: 'OldPass1!', newPassword: 'NewPass1!' });
    expect(result.success).toBe(true);
  });

  it('rejects empty currentPassword', () => {
    const result = changePasswordSchema.safeParse({ currentPassword: '', newPassword: 'NewPass1!' });
    expect(result.success).toBe(false);
  });

  it('rejects weak newPassword', () => {
    const result = changePasswordSchema.safeParse({ currentPassword: 'OldPass1!', newPassword: 'weak' });
    expect(result.success).toBe(false);
  });
});
