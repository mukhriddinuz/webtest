import { getTelegram } from '@/lib/telegram';

/**
 * Dev affordances (the dev panel and the UI kit route) are always available in
 * a dev build outside Telegram. Inside Telegram they need an explicit
 * `?dev=1` in the URL, so testers never see them by accident.
 */
export function devToolsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const flagged = new URLSearchParams(window.location.search).get('dev') === '1';
  if (getTelegram().isTelegram) return flagged;
  return import.meta.env.DEV || flagged;
}
