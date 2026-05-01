import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';

vi.mock('../../../src/repositories/user-session.repository', () => ({
  userSessionRepository: {
    create: vi.fn(),
    countActive: vi.fn(),
    findAllByUser: vi.fn(),
    findByIdAndUser: vi.fn(),
    deleteById: vi.fn(),
    deleteBySessionId: vi.fn(),
    promoteToActive: vi.fn(),
  },
}));

vi.mock('../../../src/utils/geo', () => ({
  lookupLocation: vi.fn(),
}));

import { sessionService } from '../../../src/services/session.service';
import { userSessionRepository } from '../../../src/repositories/user-session.repository';
import { lookupLocation } from '../../../src/utils/geo';

const userId = new Types.ObjectId();
const docId = new Types.ObjectId();

const mockDoc = {
  _id: docId,
  userId,
  sessionId: 'express-session-id',
  ip: '1.2.3.4',
  device: 'Chrome on macOS',
  createdAt: new Date('2026-01-01'),
  isPending: false,
};

beforeEach(() => vi.clearAllMocks());

describe('createSession', () => {
  it('delegates to repository', async () => {
    vi.mocked(userSessionRepository.create).mockResolvedValue(undefined as never);
    const data = { userId, sessionId: 'sid', ip: '1.2.3.4', userAgent: 'ua', device: 'Chrome', isPending: false };
    await sessionService.createSession(data);
    expect(userSessionRepository.create).toHaveBeenCalledWith(data);
  });
});

describe('countActiveSessions', () => {
  it('delegates to repository', async () => {
    vi.mocked(userSessionRepository.countActive).mockResolvedValue(3);
    expect(await sessionService.countActiveSessions(userId)).toBe(3);
  });
});

describe('listSessions', () => {
  it('maps docs to SessionInfo shape with location from geo', async () => {
    vi.mocked(userSessionRepository.findAllByUser).mockResolvedValue([mockDoc] as never);
    vi.mocked(lookupLocation).mockReturnValue('Mountain View, CA');
    const [session] = await sessionService.listSessions(userId, undefined);
    expect(session).toMatchObject({
      id: docId.toString(),
      ip: '1.2.3.4',
      device: 'Chrome on macOS',
      location: 'Mountain View, CA',
      isCurrent: false,
    });
    expect(session.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('marks the session as isCurrent when sessionId matches', async () => {
    vi.mocked(userSessionRepository.findAllByUser).mockResolvedValue([mockDoc] as never);
    vi.mocked(lookupLocation).mockReturnValue('Local');
    const [session] = await sessionService.listSessions(userId, 'express-session-id');
    expect(session.isCurrent).toBe(true);
  });

  it('marks the session as not current when sessionId differs', async () => {
    vi.mocked(userSessionRepository.findAllByUser).mockResolvedValue([mockDoc] as never);
    vi.mocked(lookupLocation).mockReturnValue('Local');
    const [session] = await sessionService.listSessions(userId, 'other-session-id');
    expect(session.isCurrent).toBe(false);
  });
});

describe('terminateSession', () => {
  it('does nothing when session not found', async () => {
    vi.mocked(userSessionRepository.findByIdAndUser).mockResolvedValue(null);
    await sessionService.terminateSession('nonexistent', userId);
    expect(userSessionRepository.deleteById).not.toHaveBeenCalled();
  });

  it('deletes the doc when found', async () => {
    vi.mocked(userSessionRepository.findByIdAndUser).mockResolvedValue(mockDoc as never);
    vi.mocked(userSessionRepository.deleteById).mockResolvedValue(undefined as never);
    await sessionService.terminateSession(docId.toString(), userId);
    expect(userSessionRepository.deleteById).toHaveBeenCalledWith(docId);
  });
});

describe('deleteBySessionId', () => {
  it('delegates to repository', async () => {
    vi.mocked(userSessionRepository.deleteBySessionId).mockResolvedValue(undefined as never);
    await sessionService.deleteBySessionId('sid');
    expect(userSessionRepository.deleteBySessionId).toHaveBeenCalledWith('sid');
  });
});

describe('promoteToActive', () => {
  it('delegates to repository', async () => {
    vi.mocked(userSessionRepository.promoteToActive).mockResolvedValue(undefined as never);
    await sessionService.promoteToActive('sid');
    expect(userSessionRepository.promoteToActive).toHaveBeenCalledWith('sid');
  });
});
