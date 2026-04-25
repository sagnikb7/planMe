import { UserModel, IUser } from '../models/user.model';

export class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).lean() as Promise<IUser | null>;
  }

  async findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id).lean() as Promise<IUser | null>;
  }

  async create(data: { name: string; email: string; password: string }): Promise<IUser> {
    return UserModel.create(data);
  }

  async findByResetToken(tokenHash: string): Promise<IUser | null> {
    return UserModel.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });
  }

  async setResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: expiresAt,
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      resetPasswordTokenHash: null,
      resetPasswordExpiresAt: null,
    });
  }
}

export const userRepository = new UserRepository();
