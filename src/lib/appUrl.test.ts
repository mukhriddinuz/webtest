import { afterEach, describe, expect, it, vi } from 'vitest';
import { appUrl } from './appUrl';

afterEach(() => vi.unstubAllEnvs());

describe('appUrl', () => {
  it('uses the address the app is served from by default', () => {
    vi.stubEnv('VITE_PUBLIC_URL', '');
    expect(appUrl('/t/t_algebra')).toBe(`${window.location.origin}/t/t_algebra`);
  });

  it('prefers the configured public address, whatever its trailing slashes', () => {
    vi.stubEnv('VITE_PUBLIC_URL', 'https://app.example.com//');
    expect(appUrl('/t/t_algebra')).toBe('https://app.example.com/t/t_algebra');
  });
});
