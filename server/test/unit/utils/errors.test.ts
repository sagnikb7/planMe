import { describe, it, expect } from 'vitest';
import { AppError } from '../../../src/utils/errors';

describe('AppError', () => {
  it('is an instance of Error', () => {
    expect(new AppError(400, 'bad')).toBeInstanceOf(Error);
  });

  it('sets name to AppError', () => {
    expect(new AppError(404, 'not found').name).toBe('AppError');
  });

  it('exposes the status code', () => {
    expect(new AppError(422, 'invalid').statusCode).toBe(422);
  });

  it('exposes the message', () => {
    expect(new AppError(500, 'server error').message).toBe('server error');
  });

  it('preserves different status codes', () => {
    expect(new AppError(200, 'ok').statusCode).toBe(200);
    expect(new AppError(409, 'conflict').statusCode).toBe(409);
  });
});
