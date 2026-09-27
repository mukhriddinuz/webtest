import { getTelegram } from './telegram';

export type Platform = 'ios' | 'base';

/**
 * Telegram does not look the same on every phone, and a Mini App that ignores
 * that looks foreign on one of them: iOS insets its grouped lists into rounded
 * cards and centres its alerts, while every other client runs lists edge to
 * edge and puts the alert buttons in the corner. Following the host is what
 * makes the app read as Telegram rather than as one platform's idea of it.
 *
 * macOS is deliberately not 'ios': the desktop client follows the same
 * edge-to-edge shape as the others.
 */
export function getPlatform(): Platform {
  return getTelegram().getPlatform() === 'ios' ? 'ios' : 'base';
}

export function isApplePlatform(): boolean {
  return getPlatform() === 'ios';
}
