import { Types } from 'mongoose';
import { UserSessionModel, IUserSession } from '../models/user-session.model';
import { SESSION_MAX_AGE_MS, PENDING_SESSION_TTL_MS } from '../constants';

interface CreateSessionData {
  userId: Types.ObjectId;
  sessionId: string;
  ip: string;
  userAgent: string;
  device: string;
  isPending: boolean;
}

export class UserSessionRepository {
  async create(data: CreateSessionData): Promise<IUserSession> {
    const ttl = data.isPending ? PENDING_SESSION_TTL_MS : SESSION_MAX_AGE_MS;
    return UserSessionModel.create({
      ...data,
      expiresAt: new Date(Date.now() + ttl),
    });
  }

  async countActive(userId: Types.ObjectId): Promise<number> {
    return UserSessionModel.countDocuments({ userId, isPending: false });
  }

  async findAllByUser(userId: Types.ObjectId): Promise<IUserSession[]> {
    return UserSessionModel.find({ userId, isPending: false })
      .sort({ createdAt: -1 })
      .lean() as Promise<IUserSession[]>;
  }

  async findByIdAndUser(id: string, userId: Types.ObjectId): Promise<IUserSession | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return UserSessionModel.findOne({ _id: id, userId }).lean() as Promise<IUserSession | null>;
  }

  async findBySessionId(sessionId: string): Promise<IUserSession | null> {
    return UserSessionModel.findOne({ sessionId }).lean() as Promise<IUserSession | null>;
  }

  async deleteById(id: Types.ObjectId): Promise<void> {
    await UserSessionModel.deleteOne({ _id: id });
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    await UserSessionModel.deleteOne({ sessionId });
  }

  async promoteToActive(sessionId: string): Promise<void> {
    await UserSessionModel.updateOne(
      { sessionId },
      { $set: { isPending: false, expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS) } }
    );
  }
}

export const userSessionRepository = new UserSessionRepository();
