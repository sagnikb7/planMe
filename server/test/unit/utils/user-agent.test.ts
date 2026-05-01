import { describe, it, expect } from 'vitest';
import { parseUserAgent } from '../../../src/utils/user-agent';

describe('parseUserAgent', () => {
  it('returns Unknown device for undefined input', () => {
    expect(parseUserAgent(undefined)).toBe('Unknown device');
  });

  it('returns Unknown device for empty string', () => {
    expect(parseUserAgent('')).toBe('Unknown device');
  });

  it('identifies Chrome on macOS', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(parseUserAgent(ua)).toBe('Chrome on macOS');
  });

  it('identifies Firefox on Windows', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0';
    expect(parseUserAgent(ua)).toBe('Firefox on Windows');
  });

  it('identifies Safari on iOS', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    expect(parseUserAgent(ua)).toBe('Safari on iOS');
  });

  it('identifies Edge on Windows', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
    expect(parseUserAgent(ua)).toBe('Edge on Windows');
  });

  it('identifies Chrome on Android', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    expect(parseUserAgent(ua)).toBe('Chrome on Android');
  });

  it('identifies Chrome on Linux', () => {
    const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(parseUserAgent(ua)).toBe('Chrome on Linux');
  });

  it('returns Unknown browser for unrecognised UA', () => {
    expect(parseUserAgent('SomeBot/1.0')).toContain('Unknown browser');
  });
});
