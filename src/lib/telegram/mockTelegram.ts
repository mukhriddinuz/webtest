import { createEmitter } from './emitter';
import type { ColorScheme, MainButtonState, TelegramBridge, TelegramUser, Viewport } from './types';

export interface MockBridge extends TelegramBridge {
  /** Dev panel hooks — available only in browser mode. */
  setUser(user: TelegramUser | null): void;
  setColorScheme(scheme: ColorScheme | 'system'): void;
  getHapticLog(): string[];
  /** Lets tests see whether the app asked to confirm before closing. */
  isClosingConfirmationOn(): boolean;
}

const SYSTEM_DARK = '(prefers-color-scheme: dark)';

/**
 * Browser fallback. Implements the exact same contract as the real bridge so
 * every screen behaves identically outside Telegram.
 */
export function createMockBridge(defaultUser: TelegramUser | null): MockBridge {
  const themeEmitter = createEmitter<ColorScheme>();
  const viewportEmitter = createEmitter<Viewport>();
  const mainStateEmitter = createEmitter<MainButtonState | null>();
  const clickEmitter = createEmitter<void>();
  const backEmitter = createEmitter<void>();

  let user = defaultUser;
  let preference: ColorScheme | 'system' = 'system';
  let mainState: MainButtonState | null = null;
  const hapticLog: string[] = [];
  let closingConfirmation = false;

  // Older webviews (and test environments) may not expose matchMedia.
  const mediaQuery = (): MediaQueryList | null =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(SYSTEM_DARK)
      : null;

  const systemScheme = (): ColorScheme => (mediaQuery()?.matches ? 'dark' : 'light');

  const resolveScheme = (): ColorScheme => (preference === 'system' ? systemScheme() : preference);

  const readViewport = (): Viewport => ({
    height: typeof window === 'undefined' ? 800 : window.innerHeight,
    stableHeight: typeof window === 'undefined' ? 800 : window.innerHeight,
    safeTop: 0,
    safeBottom: 0,
    isExpanded: true,
  });

  const logHaptic = (event: string) => {
    hapticLog.push(event);
    if (hapticLog.length > 20) hapticLog.shift();
  };

  return {
    isTelegram: false,

    init() {
      if (typeof window === 'undefined') return;
      mediaQuery()?.addEventListener('change', () => {
        if (preference === 'system') themeEmitter.emit(systemScheme());
      });
      window.addEventListener('resize', () => viewportEmitter.emit(readViewport()));
    },

    getUser: () => user,
    getStartParam: () => new URLSearchParams(window.location.search).get('tgWebAppStartParam'),

    getPlatform: () => 'web',
    getColorScheme: resolveScheme,
    getThemeParams: () => null,
    onThemeChanged: (handler) => themeEmitter.on(handler),

    getViewport: readViewport,
    onViewportChanged: (handler) => viewportEmitter.on(handler),
    expand: () => undefined,

    mainButton: {
      set(state) {
        mainState = state;
        mainStateEmitter.emit(state);
      },
      onClick: (handler) => clickEmitter.on(handler),
      subscribe: (handler) => mainStateEmitter.on(handler),
      getState: () => mainState,
      click: () => clickEmitter.emit(),
    },

    backButton: {
      // In browser mode the in-app header renders its own back control,
      // so visibility is a no-op here; click routing still works.
      setVisible: () => undefined,
      onClick: (handler) => backEmitter.on(handler),
    },

    haptic: {
      selection: () => logHaptic('selection'),
      impact: (style) => logHaptic(`impact:${style}`),
      notification: (type) => logHaptic(`notification:${type}`),
    },

    // A browser has no Telegram camera; tests exercise the real bridge instead.
    canScanQr: () => false,
    scanQr: () => Promise.resolve(null),
    setClosingConfirmation(enabled) {
      closingConfirmation = enabled;
    },
    isClosingConfirmationOn: () => closingConfirmation,
    setThemeColors: () => undefined,
    openLink: (url) => window.open(url, '_blank', 'noopener'),
    shareUrl(url, text) {
      const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text ?? '')}`;
      window.open(share, '_blank', 'noopener');
    },
    switchInlineQuery: () => false,
    close: () => undefined,

    setUser(next) {
      user = next;
    },
    setColorScheme(next) {
      preference = next;
      themeEmitter.emit(resolveScheme());
    },
    getHapticLog: () => [...hapticLog],
  };
}
