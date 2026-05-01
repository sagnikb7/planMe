import { describe, it, expect } from 'vitest';
import { lookupLocation } from '../../../src/utils/geo';

describe('lookupLocation', () => {
  it('returns a non-empty, non-Local result for a known public IP', () => {
    const result = lookupLocation('8.8.8.8');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('Local');
    expect(result).not.toBe('Unknown location');
  });

  it('returns Local for IPv4 loopback', () => {
    expect(lookupLocation('127.0.0.1')).toBe('Local');
  });

  it('returns Local for IPv6 loopback', () => {
    expect(lookupLocation('::1')).toBe('Local');
  });

  it('returns Local for private 192.168.x.x', () => {
    expect(lookupLocation('192.168.1.1')).toBe('Local');
  });

  it('returns Local for private 10.x.x.x', () => {
    expect(lookupLocation('10.0.0.1')).toBe('Local');
  });

  it('returns Local for private 172.16.x.x', () => {
    expect(lookupLocation('172.16.0.1')).toBe('Local');
  });

  it('returns Unknown location for empty string', () => {
    expect(lookupLocation('')).toBe('Unknown location');
  });
});
