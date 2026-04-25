import { Types } from 'mongoose';
import { userSessionRepository } from '../repositories/user-session.repository';
import type { IUserSession } from '../models/user-session.model';

export interface SessionInfo {
  id: string;
  ip: string;
  device: string;
  location: string;
  createdAt: string;
  isCurrent: boolean;
}

function toSessionInfo(doc: IUserSession, currentSessionId: string | undefined): SessionInfo {
  return {
    id: String(doc._id),
    ip: doc.ip,
    device: doc.device,
    location: 'Unknown location',
    createdAt: doc.createdAt.toISOString(),
    isCurrent: !!currentSessionId && doc.sessionId === currentSessionId,
  };
}

export class SessionService {
  async createSession(data: {
    userId: Types.ObjectId;
    sessionId: string;
    ip: string;
    userAgent: string;
    device: string;
    isPending: boolean;
  }): Promise<void> {
    await userSessionRepository.create(data);
  }

  async countActiveSessions(userId: Types.ObjectId): Promise<number> {
    return userSessionRepository.countActive(userId);
  }

  async listSessions(userId: Types.ObjectId, currentSessionId?: string): Promise<SessionInfo[]> {
    const docs = await userSessionRepository.findAllByUser(userId);
    return docs.map((doc) => toSessionInfo(doc, currentSessionId));
  }

  /**
   * Terminate a session by its opaque UserSession._id.
   * Returns the raw express sessionId so the caller can destroy it from the store.
   * Returns null if not found or not owned by userId.
   */
  async terminateSession(id: string, userId: Types.ObjectId): Promise<string | null> {
    const doc = await userSessionRepository.findByIdAndUser(id, userId);
    if (!doc) return null;
    const rawSessionId = doc.sessionId;
    await userSessionRepository.deleteById(doc._id);
    return rawSessionId;
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    await userSessionRepository.deleteBySessionId(sessionId);
  }

  async promoteToActive(sessionId: string): Promise<void> {
    await userSessionRepository.promoteToActive(sessionId);
  }
}

export const sessionService = new SessionService();
