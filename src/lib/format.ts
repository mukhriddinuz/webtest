/** Formatting helpers. All user visible words live in i18n, these return neutral shapes. */
import i18n from '@/i18n';

/** 125 -> "02:05", 3725 -> "1:02:05" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** Splits a remaining duration into calendar-ish parts for countdowns. */
export function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    totalSeconds: total,
  };
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

/**
 * Dates are formatted from the i18n month names rather than by `Intl`.
 * Chromium reports `uz-UZ` as supported but has no Uzbek month names, so it
 * renders "2026 M09 15" — which is what a Telegram Android user would see.
 */
function months(locale: string, style: 'long' | 'short'): string[] {
  const key = style === 'long' ? 'date.months' : 'date.monthsShort';
  const value = i18n.getFixedT(locale)(key, { returnObjects: true });
  return Array.isArray(value) ? (value as string[]) : [];
}

function formatTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  const t = i18n.getFixedT(locale);
  const day = t('date.short', {
    day: date.getDate(),
    month: months(locale, 'short')[date.getMonth()] ?? '',
  });
  return t('date.dateTime', { date: day, time: formatTime(date) });
}

export function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  return i18n.getFixedT(locale)('date.full', {
    day: date.getDate(),
    month: months(locale, 'long')[date.getMonth()] ?? '',
    year: date.getFullYear(),
  });
}

/** Initials for avatar fallbacks. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Stable color index derived from a string, for avatar backgrounds. */
export function hashIndex(value: string, buckets: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % buckets;
}
