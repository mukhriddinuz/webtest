import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPlatform } from './platform';
import * as telegram from './telegram';

function hostReporting(platform: string) {
  return vi
    .spyOn(telegram, 'getTelegram')
    .mockReturnValue({ getPlatform: () => platform } as ReturnType<typeof telegram.getTelegram>);
}

afterEach(() => vi.restoreAllMocks());

describe('getPlatform', () => {
  it('follows the iOS client', () => {
    hostReporting('ios');
    expect(getPlatform()).toBe('ios');
  });

  it.each(['android', 'tdesktop', 'web', 'weba', 'unknown'])(
    'treats %s as the edge-to-edge shape',
    (platform) => {
      hostReporting(platform);
      expect(getPlatform()).toBe('base');
    },
  );

  it('does not take macOS for iOS: the desktop client is not inset', () => {
    hostReporting('macos');
    expect(getPlatform()).toBe('base');
  });
});
