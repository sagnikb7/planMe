import { describe, it, expect } from 'vitest';
import { isStrongPassword } from '../../../src/utils/password-policy';

describe('isStrongPassword', () => {
  it('accepts a valid strong password', () => {
    expect(isStrongPassword('Password1!')).toBe(true);
  });

  it('rejects password shorter than 8 chars', () => {
    expect(isStrongPassword('P1!')).toBe(false);
  });

  it('rejects password with no uppercase letter', () => {
    expect(isStrongPassword('password1!')).toBe(false);
  });

  it('rejects password with no number', () => {
    expect(isStrongPassword('Password!')).toBe(false);
  });

  it('rejects password with no symbol', () => {
    expect(isStrongPassword('Password1')).toBe(false);
  });

  it('accepts password with multiple special chars', () => {
    expect(isStrongPassword('Sup3r$ecure!')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isStrongPassword('')).toBe(false);
  });
});
