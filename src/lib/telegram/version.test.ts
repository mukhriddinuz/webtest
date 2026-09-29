import { describe, expect, it } from 'vitest';
import { versionAtLeast } from './version';

describe('versionAtLeast', () => {
  it('accepts an equal or newer version', () => {
    expect(versionAtLeast('6.4', '6.4')).toBe(true);
    expect(versionAtLeast('7.10', '6.4')).toBe(true);
    expect(versionAtLeast('8.0', '6.4')).toBe(true);
  });

  it('refuses an older one', () => {
    expect(versionAtLeast('6.3', '6.4')).toBe(false);
    expect(versionAtLeast('5.9', '6.4')).toBe(false);
  });

  it('compares numerically, not as text', () => {
    // As strings "6.10" < "6.9"; as versions it is the newer.
    expect(versionAtLeast('6.10', '6.9')).toBe(true);
    expect(versionAtLeast('6.9', '6.10')).toBe(false);
  });

  it('treats a missing part as zero', () => {
    expect(versionAtLeast('7', '6.4')).toBe(true);
    expect(versionAtLeast('6', '6.0')).toBe(true);
    expect(versionAtLeast('6', '6.4')).toBe(false);
  });

  it('reads an absent or garbled version as too old', () => {
    expect(versionAtLeast(undefined, '6.4')).toBe(false);
    expect(versionAtLeast('', '6.4')).toBe(false);
    expect(versionAtLeast('abc', '6.4')).toBe(false);
  });
});
