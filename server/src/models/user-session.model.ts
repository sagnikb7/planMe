import { Schema, model, Document, Types } from 'mongoose';
import { SESSION_MAX_AGE_MS } from '../constants';

export interface IUserSession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  sessionId: string;
  ip: string;
  userAgent: string;
  device: string;
  isPending: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSessionSchema = new Schema<IUserSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, unique: true },
    ip: { type: String, default: 'Unknown' },
    userAgent: { type: String, default: '' },
    device: { type: String, default: 'Unknown device' },
    isPending: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index: MongoDB auto-deletes expired session records
userSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UserSessionModel = model<IUserSession>('UserSession', userSessionSchema);
