import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { userRepository } from '../repositories/user.repository';
import { env } from '../config/env';
import { RESET_TOKEN_TTL_MS, BCRYPT_ROUNDS } from '../constants';

function sanitizeUser(user: { _id: unknown; name: string; email: string; createdAt?: Date; password?: string; resetPasswordTokenHash?: unknown; resetPasswordExpiresAt?: unknown }) {
  const { password: _p, resetPasswordTokenHash: _t, resetPasswordExpiresAt: _e, ...safe } = user;
  return safe;
}

export class AuthService {
  async register(name: string, email: string, password: string) {
    const normalizedEmail = email.toLowerCase();
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) throw new ConflictError('Email already registered');

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await userRepository.create({ name, email: normalizedEmail, password: hashed });
  }

  async forgotPassword(email: string): Promise<{ resetUrl?: string }> {
    const user = await userRepository.findByEmail(email.toLowerCase());
    if (!user) return {};

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await userRepository.setResetToken(String(user._id), tokenHash, expiresAt);

    if (!env.isProd) {
      return { resetUrl: `${env.clientOrigin}/reset-password?token=${token}` };
    }
    return {};
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await userRepository.findByResetToken(tokenHash);
    if (!user) throw new ValidationError('Invalid or expired reset token');

    const hashed = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(String(user._id), hashed);
  }

  sanitize(user: Parameters<typeof sanitizeUser>[0]) {
    return sanitizeUser(user);
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const authService = new AuthService();
