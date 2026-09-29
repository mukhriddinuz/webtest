import { createEmitter } from './emitter';
import { versionAtLeast } from './version';
import type { RawTelegramWebApp } from './webAppTypes';
import type {
  ColorScheme,
  HapticImpact,
  HapticNotification,
  MainButtonState,
  TelegramBridge,
  TelegramUser,
  Viewport,
} from './types';

/** Real bridge, backed by telegram-web-app.js. */
export function createWebAppBridge(app: RawTelegramWebApp): TelegramBridge {
  const themeEmitter = createEmitter<ColorScheme>();
  const viewportEmitter = createEmitter<Viewport>();
  const mainStateEmitter = createEmitter<MainButtonState | null>();
  const clickEmitter = createEmitter<void>();

  let mainState: MainButtonState | null = null;
  let backHandlerCount = 0;
  const backEmitter = createEmitter<void>();

  const readViewport = (): Viewport => ({
    height: app.viewportHeight,
    stableHeight: app.viewportStableHeight,
    safeTop: app.contentSafeAreaInset?.top ?? app.safeAreaInset?.top ?? 0,
    safeBottom: app.safeAreaInset?.bottom ?? 0,
    isExpanded: app.isExpanded,
  });

  const forwardMainClick = () => clickEmitter.emit();
  const forwardBackClick = () => backEmitter.emit();

  return {
    isTelegram: true,

    init() {
      app.ready();
      app.expand();
      app.disableVerticalSwipes?.();
      app.MainButton.onClick(forwardMainClick);
      app.BackButton.onClick(forwardBackClick);
      app.onEvent('themeChanged', () => themeEmitter.emit(app.colorScheme));
      app.onEvent('viewportChanged', () => viewportEmitter.emit(readViewport()));
    },

    getUser(): TelegramUser | null {
      const raw = app.initDataUnsafe.user;
      if (!raw) return null;
      return {
        id: raw.id,
        firstName: raw.first_name,
        lastName: raw.last_name,
        username: raw.username,
        languageCode: raw.language_code,
        photoUrl: raw.photo_url,
        isPremium: raw.is_premium,
      };
    },

    getStartParam: () => app.initDataUnsafe.start_param ?? null,

    getPlatform: () => app.platform ?? 'unknown',
    getColorScheme: () => app.colorScheme,
    getThemeParams: () => app.themeParams ?? null,
    onThemeChanged: (handler) => themeEmitter.on(handler),

    getViewport: readViewport,
    onViewportChanged: (handler) => viewportEmitter.on(handler),
    expand: () => app.expand(),

    mainButton: {
      set(state) {
        mainState = state;
        mainStateEmitter.emit(state);
        if (!state || !state.visible) {
          app.MainButton.hide();
          return;
        }
        app.MainButton.setParams({ text: state.text, is_active: state.enabled, is_visible: true });
        if (state.loading) app.MainButton.showProgress(true);
        else app.MainButton.hideProgress();
      },
      onClick: (handler) => clickEmitter.on(handler),
      subscribe: (handler) => mainStateEmitter.on(handler),
      getState: () => mainState,
      click: () => clickEmitter.emit(),
    },

    backButton: {
      setVisible(visible) {
        if (visible) app.BackButton.show();
        else app.BackButton.hide();
      },
      onClick(handler) {
        backHandlerCount += 1;
        const off = backEmitter.on(handler);
        return () => {
          backHandlerCount -= 1;
          off();
          if (backHandlerCount <= 0) app.BackButton.hide();
        };
      },
    },

    haptic: {
      selection: () => app.HapticFeedback.selectionChanged(),
      impact: (style: HapticImpact) => app.HapticFeedback.impactOccurred(style),
      notification: (type: HapticNotification) => app.HapticFeedback.notificationOccurred(type),
    },

    canScanQr: () =>
      typeof app.showScanQrPopup === 'function' &&
      // Older clients lack the method entirely, but some expose a stub that
      // does nothing; the version is the reliable signal.
      (app.isVersionAtLeast ? app.isVersionAtLeast('6.4') : versionAtLeast(app.version, '6.4')),

    scanQr(prompt) {
      return new Promise<string | null>((resolve) => {
        if (typeof app.showScanQrPopup !== 'function') {
          resolve(null);
          return;
        }

        // A promise settles once, and the first thing to finish it also drops the
        // listener, so a "closed" that follows a reading never gets to override it.
        const finish = (value: string | null) => {
          app.offEvent('scanQrPopupClosed', onClosed);
          resolve(value);
        };
        // Closing the scanner without a reading raises this, and only this.
        const onClosed = () => finish(null);
        app.onEvent('scanQrPopupClosed', onClosed);

        try {
          app.showScanQrPopup({ text: prompt }, (data) => {
            finish(data);
            // Returning true closes the scanner: one reading is all that is wanted.
            return true;
          });
        } catch {
          // Already open, or refused: there is nothing to wait for.
          finish(null);
        }
      });
    },

    setClosingConfirmation(enabled) {
      // Only exists from Bot API 6.2; older clients simply do not ask.
      if (enabled) app.enableClosingConfirmation?.();
      else app.disableClosingConfirmation?.();
    },

    setThemeColors(background) {
      // setBottomBarColor only exists from Bot API 7.10 onwards.
      app.setHeaderColor(background);
      app.setBackgroundColor(background);
      app.setBottomBarColor?.(background);
    },
    openLink: (url) => app.openLink(url),
    shareUrl(url, text) {
      const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text ?? '')}`;
      app.openTelegramLink(share);
    },
    switchInlineQuery(query) {
      if (!app.switchInlineQuery) return false;
      app.switchInlineQuery(query, ['users', 'groups', 'channels']);
      return true;
    },
    close: () => app.close(),
  };
}
