import { describe, it, expect, vi } from 'vitest';
import { Types } from 'mongoose';
import {
  ensureAuthenticated,
  ensurePending,
  ensureAuthOrPending,
  getRequestUserId,
} from '../../../src/middleware/auth';

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    isAuthenticated: vi.fn(() => false),
    session: { pendingUserId: undefined as string | undefined },
    user: undefined as { _id: Types.ObjectId } | undefined,
    ...overrides,
  } as unknown as Parameters<typeof ensureAuthenticated>[0];
}

function mockRes() {
  const res = { status: vi.fn(), json: vi.fn() } as unknown as Parameters<typeof ensureAuthenticated>[1];
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return res;
}

describe('ensureAuthenticated', () => {
  it('calls next() when authenticated', () => {
    const req = mockReq({ isAuthenticated: vi.fn(() => true) });
    const res = mockRes();
    const next = vi.fn();
    ensureAuthenticated(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when not authenticated', () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    ensureAuthenticated(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthenticated' });
  });
});

describe('ensurePending', () => {
  it('calls next() when pendingUserId is set', () => {
    const req = mockReq({ session: { pendingUserId: 'someid' } });
    const res = mockRes();
    const next = vi.fn();
    ensurePending(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 401 when no pendingUserId', () => {
    const req = mockReq({ session: { pendingUserId: undefined } });
    const res = mockRes();
    const next = vi.fn();
    ensurePending(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('ensureAuthOrPending', () => {
  it('calls next() when fully authenticated', () => {
    const req = mockReq({ isAuthenticated: vi.fn(() => true) });
    const next = vi.fn();
    ensureAuthOrPending(req, mockRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('calls next() when pending session exists', () => {
    const req = mockReq({ session: { pendingUserId: 'uid' } });
    const next = vi.fn();
    ensureAuthOrPending(req, mockRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 401 when neither', () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    ensureAuthOrPending(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('getRequestUserId', () => {
  it('returns user._id when fully authenticated', () => {
    const oid = new Types.ObjectId();
    const req = mockReq({ isAuthenticated: vi.fn(() => true), user: { _id: oid } });
    expect(getRequestUserId(req)).toEqual(oid);
  });

  it('returns ObjectId from pendingUserId when pending', () => {
    const oid = new Types.ObjectId();
    const req = mockReq({ session: { pendingUserId: oid.toString() } });
    const result = getRequestUserId(req);
    expect(result.toString()).toBe(oid.toString());
  });

  it('throws when neither authenticated nor pending', () => {
    const req = mockReq();
    expect(() => getRequestUserId(req)).toThrow();
  });
});
