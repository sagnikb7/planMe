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

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return UserModel.findOne({ googleId }).lean() as Promise<IUser | null>;
  }

  async attachGoogleId(userId: string, googleId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { googleId });
  }

  async createGoogleUser(data: { name: string; email: string; googleId: string }): Promise<IUser> {
    return UserModel.create({ ...data, password: null, authProvider: 'google' });
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

  async updateName(userId: string, name: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { name });
  }

  async deleteById(userId: string): Promise<void> {
    await UserModel.findByIdAndDelete(userId);
  }
}

export const userRepository = new UserRepository();
