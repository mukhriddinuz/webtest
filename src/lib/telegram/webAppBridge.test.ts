import { describe, expect, it, vi } from 'vitest';
import { createWebAppBridge } from './webAppBridge';
import type { RawTelegramWebApp } from './webAppTypes';

type Handlers = Map<string, Set<() => void>>;

/** Just enough of the WebApp object for the scanner methods. */
function fakeApp(overrides: Partial<RawTelegramWebApp> = {}) {
  const handlers: Handlers = new Map();
  const app = {
    version: '7.0',
    initDataUnsafe: {},
    onEvent: (event: string, handler: () => void) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)?.add(handler);
    },
    offEvent: (event: string, handler: () => void) => handlers.get(event)?.delete(handler),
    ...overrides,
  } as unknown as RawTelegramWebApp;

  return {
    app,
    listeners: (event: string) => handlers.get(event)?.size ?? 0,
    emit: (event: string) => handlers.get(event)?.forEach((handler) => handler()),
  };
}

describe('scanQr', () => {
  it('resolves with what was read and asks Telegram to close the scanner', async () => {
    let callback: ((data: string) => boolean | void) | undefined;
    const { app, listeners } = fakeApp({
      showScanQrPopup: vi.fn((_params, cb) => {
        callback = cb;
      }),
    });
    const bridge = createWebAppBridge(app);

    const pending = bridge.scanQr('Kodni kameraga qarating');
    expect(app.showScanQrPopup).toHaveBeenCalledWith(
      { text: 'Kodni kameraga qarating' },
      expect.any(Function),
    );

    const closes = callback?.('482913');
    await expect(pending).resolves.toBe('482913');
    // Returning true is what makes Telegram close the scanner.
    expect(closes).toBe(true);
    // And nothing is left listening once it is over.
    expect(listeners('scanQrPopupClosed')).toBe(0);
  });

  it('resolves null when the user closes the scanner without a reading', async () => {
    const { app, emit, listeners } = fakeApp({ showScanQrPopup: vi.fn() });
    const bridge = createWebAppBridge(app);

    const pending = bridge.scanQr();
    expect(listeners('scanQrPopupClosed')).toBe(1);
    emit('scanQrPopupClosed');

    await expect(pending).resolves.toBeNull();
    expect(listeners('scanQrPopupClosed')).toBe(0);
  });

  it('keeps the reading when the closing event follows it', async () => {
    let callback: ((data: string) => boolean | void) | undefined;
    const { app, emit } = fakeApp({
      showScanQrPopup: vi.fn((_params, cb) => {
        callback = cb;
      }),
    });
    const pending = createWebAppBridge(app).scanQr();

    callback?.('482913');
    // Telegram raises "closed" for the scanner it just closed for us.
    emit('scanQrPopupClosed');

    await expect(pending).resolves.toBe('482913');
  });

  it('resolves null, and cleans up, when the scanner cannot be opened', async () => {
    const { app, listeners } = fakeApp({
      showScanQrPopup: vi.fn(() => {
        throw new Error('WebAppScanQrPopupOpened');
      }),
    });

    await expect(createWebAppBridge(app).scanQr()).resolves.toBeNull();
    expect(listeners('scanQrPopupClosed')).toBe(0);
  });

  it('resolves null on a client with no scanner at all', async () => {
    const { app } = fakeApp();
    await expect(createWebAppBridge(app).scanQr()).resolves.toBeNull();
  });
});

describe('canScanQr', () => {
  it('is on from Bot API 6.4', () => {
    const { app } = fakeApp({ version: '6.4', showScanQrPopup: vi.fn() });
    expect(createWebAppBridge(app).canScanQr()).toBe(true);
  });

  it('is off below 6.4 even when the method exists as a stub', () => {
    const { app } = fakeApp({ version: '6.3', showScanQrPopup: vi.fn() });
    expect(createWebAppBridge(app).canScanQr()).toBe(false);
  });

  it('is off when the method is missing', () => {
    const { app } = fakeApp({ version: '8.0' });
    expect(createWebAppBridge(app).canScanQr()).toBe(false);
  });

  it('defers to the client’s own version check when it has one', () => {
    const isVersionAtLeast = vi.fn(() => false);
    const { app } = fakeApp({ version: '8.0', showScanQrPopup: vi.fn(), isVersionAtLeast });

    expect(createWebAppBridge(app).canScanQr()).toBe(false);
    expect(isVersionAtLeast).toHaveBeenCalledWith('6.4');
  });

  it('compares "6.10" as newer than "6.4"', () => {
    const { app } = fakeApp({ version: '6.10', showScanQrPopup: vi.fn() });
    expect(createWebAppBridge(app).canScanQr()).toBe(true);
  });
});
