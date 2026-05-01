import { describe, it, expect } from 'vitest';
import { getClientIp } from '../../../src/utils/ip';
import type { Request } from 'express';

function makeReq(overrides: Partial<Record<string, unknown>> = {}): Request {
  return {
    headers: {},
    ip: undefined,
    socket: { remoteAddress: undefined },
    ...overrides,
  } as unknown as Request;
}

describe('getClientIp', () => {
  it('returns the first IP from a single x-forwarded-for header', () => {
    const req = makeReq({ headers: { 'x-forwarded-for': '1.2.3.4' } });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('returns the first IP from a comma-separated x-forwarded-for chain', () => {
    const req = makeReq({ headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12' } });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('handles x-forwarded-for as an array (takes first element)', () => {
    const req = makeReq({ headers: { 'x-forwarded-for': ['1.2.3.4', '5.6.7.8'] } });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('trims whitespace from the extracted IP', () => {
    const req = makeReq({ headers: { 'x-forwarded-for': '  1.2.3.4  , 5.6.7.8' } });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('falls back to req.ip when x-forwarded-for is absent', () => {
    const req = makeReq({ ip: '9.9.9.9' });
    expect(getClientIp(req)).toBe('9.9.9.9');
  });

  it('falls back to req.socket.remoteAddress when req.ip is absent', () => {
    const req = makeReq({ socket: { remoteAddress: '10.0.0.1' } });
    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('returns Unknown when no IP source is available', () => {
    const req = makeReq();
    expect(getClientIp(req)).toBe('Unknown');
  });
});
