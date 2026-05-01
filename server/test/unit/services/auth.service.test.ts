import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// Use cheap rounds so bcrypt doesn't slow down unit tests
vi.mock('../../../src/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/constants')>();
  return { ...actual, BCRYPT_ROUNDS: 4 };
});

vi.mock('../../../src/repositories/user.repository', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    findByResetToken: vi.fn(),
    create: vi.fn(),
    updatePassword: vi.fn(),
    updateName: vi.fn(),
    setResetToken: vi.fn(),
    deleteById: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/idea.repository', () => ({
  ideaRepository: { deleteAllByUser: vi.fn() },
}));

vi.mock('../../../src/repositories/user-session.repository', () => ({
  userSessionRepository: { deleteAllByUser: vi.fn() },
}));

vi.mock('../../../src/utils/email', () => ({
  sendPasswordResetEmail: vi.fn(),
  isSmtpConfigured: vi.fn().mockReturnValue(false),
}));

import { authService, ConflictError, ValidationError } from '../../../src/services/auth.service';
import { userRepository } from '../../../src/repositories/user.repository';
import { ideaRepository } from '../../../src/repositories/idea.repository';
import { userSessionRepository } from '../../../src/repositories/user-session.repository';
import { sendPasswordResetEmail, isSmtpConfigured } from '../../../src/utils/email';

const oid = new Types.ObjectId();
const mockUser = { _id: oid, name: 'Alice', email: 'alice@example.com', password: 'hashed' };

beforeEach(() => vi.clearAllMocks());

describe('register', () => {
  it('throws ConflictError when email already registered', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as never);
    await expect(authService.register('Alice', 'alice@example.com', 'Password1!')).rejects.toThrow(ConflictError);
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('creates user with bcrypt-hashed password and lowercased email', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.create).mockResolvedValue(undefined as never);
    await authService.register('Alice', 'ALICE@EXAMPLE.COM', 'Password1!');
    const arg = vi.mocked(userRepository.create).mock.calls[0][0];
    expect(arg.email).toBe('alice@example.com');
    expect(arg.password).toMatch(/^\$2[ab]\$/);
    expect(arg.password).not.toBe('Password1!');
  });
});

describe('forgotPassword', () => {
  it('returns {} and skips DB for unknown email', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    expect(await authService.forgotPassword('x@x.com')).toEqual({});
    expect(userRepository.setResetToken).not.toHaveBeenCalled();
  });

  it('stores token hash in DB for known email', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as never);
    vi.mocked(userRepository.setResetToken).mockResolvedValue(undefined as never);
    await authService.forgotPassword('alice@example.com');
    expect(userRepository.setResetToken).toHaveBeenCalledOnce();
  });

  it('returns resetUrl in non-production', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as never);
    vi.mocked(userRepository.setResetToken).mockResolvedValue(undefined as never);
    const result = await authService.forgotPassword('alice@example.com');
    expect(result.resetUrl).toMatch(/\/reset-password\?token=/);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('sends email and returns {} in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.mocked(isSmtpConfigured).mockReturnValue(true);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as never);
    vi.mocked(userRepository.setResetToken).mockResolvedValue(undefined as never);
    vi.mocked(sendPasswordResetEmail).mockResolvedValue(undefined as never);
    expect(await authService.forgotPassword('alice@example.com')).toEqual({});
    expect(sendPasswordResetEmail).toHaveBeenCalledOnce();
    vi.mocked(isSmtpConfigured).mockReturnValue(false);
    vi.unstubAllEnvs();
  });
});

describe('resetPassword', () => {
  it('throws ValidationError when token not found', async () => {
    vi.mocked(userRepository.findByResetToken).mockResolvedValue(null);
    await expect(authService.resetPassword('badtoken', 'NewPass1!')).rejects.toThrow(ValidationError);
    expect(userRepository.updatePassword).not.toHaveBeenCalled();
  });

  it('updates password with a new bcrypt hash', async () => {
    vi.mocked(userRepository.findByResetToken).mockResolvedValue(mockUser as never);
    vi.mocked(userRepository.updatePassword).mockResolvedValue(undefined as never);
    await authService.resetPassword('goodtoken', 'NewPass1!');
    const [, hash] = vi.mocked(userRepository.updatePassword).mock.calls[0];
    expect(hash).toMatch(/^\$2[ab]\$/);
    expect(hash).not.toBe('NewPass1!');
  });
});

describe('updateName', () => {
  it('delegates to userRepository', async () => {
    vi.mocked(userRepository.updateName).mockResolvedValue(undefined as never);
    await authService.updateName('uid', 'Bob');
    expect(userRepository.updateName).toHaveBeenCalledWith('uid', 'Bob');
  });
});

describe('changePassword', () => {
  it('throws ValidationError when user not found', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(null);
    await expect(authService.changePassword('id', 'old', 'NewPass1!')).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when current password is wrong', async () => {
    const hashed = await bcrypt.hash('correct', 4);
    vi.mocked(userRepository.findById).mockResolvedValue({ ...mockUser, password: hashed } as never);
    await expect(authService.changePassword('id', 'wrong', 'NewPass1!')).rejects.toThrow(ValidationError);
    expect(userRepository.updatePassword).not.toHaveBeenCalled();
  });

  it('updates password when current password matches', async () => {
    const hashed = await bcrypt.hash('correct', 4);
    vi.mocked(userRepository.findById).mockResolvedValue({ ...mockUser, password: hashed } as never);
    vi.mocked(userRepository.updatePassword).mockResolvedValue(undefined as never);
    await authService.changePassword('id', 'correct', 'NewPass1!');
    expect(userRepository.updatePassword).toHaveBeenCalledOnce();
  });
});

describe('deleteAccount', () => {
  it('deletes ideas and sessions in parallel, then user', async () => {
    vi.mocked(ideaRepository.deleteAllByUser).mockResolvedValue(undefined as never);
    vi.mocked(userSessionRepository.deleteAllByUser).mockResolvedValue(undefined as never);
    vi.mocked(userRepository.deleteById).mockResolvedValue(undefined as never);
    await authService.deleteAccount(oid.toString());
    expect(ideaRepository.deleteAllByUser).toHaveBeenCalledOnce();
    expect(userSessionRepository.deleteAllByUser).toHaveBeenCalledOnce();
    expect(userRepository.deleteById).toHaveBeenCalledWith(oid.toString());
  });
});

describe('sanitize', () => {
  it('strips password and reset token fields', () => {
    const raw = {
      _id: oid,
      name: 'Alice',
      email: 'a@b.com',
      createdAt: new Date(),
      password: 'secret',
      resetPasswordTokenHash: 'hash',
      resetPasswordExpiresAt: new Date(),
    };
    const safe = authService.sanitize(raw);
    expect((safe as Record<string, unknown>).password).toBeUndefined();
    expect((safe as Record<string, unknown>).resetPasswordTokenHash).toBeUndefined();
    expect((safe as Record<string, unknown>).resetPasswordExpiresAt).toBeUndefined();
    expect(safe.name).toBe('Alice');
    expect(safe.email).toBe('a@b.com');
  });
});
