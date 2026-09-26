import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatDuration, initials } from './format';

const iso = new Date(2026, 8, 15, 14, 5).toISOString();

describe('formatDate', () => {
  // Chromium has no Uzbek month names, so these must come from i18n.
  it('spells the month out in Uzbek', () => {
    expect(formatDate(iso, 'uz')).toBe('15-sentabr, 2026');
  });

  it('uses the Russian genitive month', () => {
    expect(formatDate(iso, 'ru')).toBe('15 сентября 2026');
  });
});

describe('formatDateTime', () => {
  it('shortens the month and keeps a 24-hour clock', () => {
    expect(formatDateTime(iso, 'uz')).toBe('15-sen, 14:05');
    expect(formatDateTime(iso, 'ru')).toBe('15 сен, 14:05');
  });
});

describe('formatDuration', () => {
  it('drops the hour when there is none', () => {
    expect(formatDuration(125)).toBe('02:05');
    expect(formatDuration(3725)).toBe('1:02:05');
  });
});

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('Aziz Rahimov')).toBe('AR');
  });
});
