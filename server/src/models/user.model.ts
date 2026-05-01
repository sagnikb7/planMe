import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string | null;
  googleId?: string | null;
  authProvider: 'local' | 'google';
  resetPasswordTokenHash: string | null;
  resetPasswordExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, default: null },
    googleId: { type: String, sparse: true, unique: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpiresAt: { type: Date,   default: null },
  },
  { timestamps: true }
);

export const UserModel = model<IUser>('User', userSchema);
