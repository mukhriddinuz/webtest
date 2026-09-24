import { createMockBridge, type MockBridge } from './mockTelegram';
import { createWebAppBridge } from './webAppBridge';
import { DEFAULT_DEV_USER } from '@/mocks/users';
import type { TelegramBridge, TelegramUser } from './types';

export * from './types';
export type { MockBridge };

function toTelegramUser(): TelegramUser {
  return {
    id: DEFAULT_DEV_USER.telegramId,
    firstName: DEFAULT_DEV_USER.firstName,
    lastName: DEFAULT_DEV_USER.lastName,
    username: DEFAULT_DEV_USER.username,
    languageCode: DEFAULT_DEV_USER.languageCode,
  };
}

let bridge: TelegramBridge | null = null;

/**
 * Resolves the host bridge once. Inside Telegram the real WebApp is used;
 * everywhere else the mock takes over so the app is fully usable in a browser.
 */
export function getTelegram(): TelegramBridge {
  if (bridge) return bridge;
  const raw = typeof window === 'undefined' ? undefined : window.Telegram?.WebApp;
  // `initData` is empty when the page is merely served with the script tag.
  const insideTelegram = Boolean(raw && raw.initData !== '');
  bridge = insideTelegram && raw ? createWebAppBridge(raw) : createMockBridge(toTelegramUser());
  bridge.init();
  return bridge;
}

/** Narrow helper for dev-only affordances. */
export function getMockBridge(): MockBridge | null {
  const current = getTelegram();
  return current.isTelegram ? null : (current as MockBridge);
}

export function isTelegramEnvironment(): boolean {
  return getTelegram().isTelegram;
}
