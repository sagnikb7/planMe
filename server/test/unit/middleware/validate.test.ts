import { describe, it, expect, vi } from 'vitest';
import { validate } from '../../../src/middleware/validate';
import { registerSchema } from '../../../src/schemas/auth.schema';
import { z } from 'zod';

function mockReq(body: unknown) {
  return { body } as unknown as Parameters<ReturnType<typeof validate>>[0];
}

function mockRes() {
  const res = { status: vi.fn(), json: vi.fn() } as unknown as Parameters<ReturnType<typeof validate>>[1];
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return res;
}

const simpleSchema = z.object({ name: z.string().min(1) });

describe('validate middleware', () => {
  it('calls next() and sets req.body to parsed data on valid input', () => {
    const middleware = validate(simpleSchema);
    const req = mockReq({ name: 'Alice' });
    const res = mockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: 'Alice' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 with fieldErrors on invalid input', () => {
    const middleware = validate(simpleSchema);
    const req = mockReq({ name: '' });
    const res = mockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ errors: expect.any(Object) }),
    );
  });

  it('returns 400 when required field is missing', () => {
    const middleware = validate(simpleSchema);
    const req = mockReq({});
    const res = mockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('strips extra fields via registerSchema (passthrough is false by default)', () => {
    const middleware = validate(registerSchema);
    const req = mockReq({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password1!',
      __injected: true,
    });
    const res = mockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect((req.body as Record<string, unknown>).__injected).toBeUndefined();
  });

  it('normalizes email to lowercase via registerSchema', () => {
    const middleware = validate(registerSchema);
    const req = mockReq({
      name: 'Alice',
      email: 'Alice@Example.COM',
      password: 'Password1!',
    });
    const res = mockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect((req.body as Record<string, unknown>).email).toBe('alice@example.com');
  });
});
