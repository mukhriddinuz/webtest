/**
 * A single, narrow contract for everything the app needs from the host.
 * Two implementations exist: the real Telegram WebApp bridge and the browser
 * mock. Nothing else in the app may touch `window.Telegram` directly.
 */

export type ColorScheme = 'light' | 'dark';
export type HapticImpact = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
export type HapticNotification = 'error' | 'success' | 'warning';

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  photoUrl?: string;
  isPremium?: boolean;
}

export interface Viewport {
  height: number;
  stableHeight: number;
  safeTop: number;
  safeBottom: number;
  isExpanded: boolean;
}

export interface MainButtonState {
  text: string;
  visible: boolean;
  enabled: boolean;
  loading: boolean;
  /** Progress-style secondary look, used for destructive or muted actions. */
  variant?: 'primary' | 'danger' | 'muted';
}

export type Unsubscribe = () => void;

export interface TelegramBridge {
  readonly isTelegram: boolean;
  init(): void;
  getUser(): TelegramUser | null;
  getStartParam(): string | null;

  /** The host client: 'ios', 'android', 'tdesktop', 'web', … */
  getPlatform(): string;

  getColorScheme(): ColorScheme;
  /** Host palette (`bg_color`, `button_color`, …); null outside Telegram. */
  getThemeParams(): Record<string, string> | null;
  onThemeChanged(handler: (scheme: ColorScheme) => void): Unsubscribe;

  getViewport(): Viewport;
  onViewportChanged(handler: (viewport: Viewport) => void): Unsubscribe;
  expand(): void;

  mainButton: {
    /** Returns the state the app *wants*; browser mode renders it itself. */
    set(state: MainButtonState | null): void;
    onClick(handler: () => void): Unsubscribe;
    /** Browser mode only: lets the fallback bar observe requested state. */
    subscribe(handler: (state: MainButtonState | null) => void): Unsubscribe;
    getState(): MainButtonState | null;
    click(): void;
  };

  backButton: {
    setVisible(visible: boolean): void;
    onClick(handler: () => void): Unsubscribe;
  };

  haptic: {
    selection(): void;
    impact(style: HapticImpact): void;
    notification(type: HapticNotification): void;
  };

  /**
   * Paints the Telegram chrome (header, background and bottom bar) with the
   * app background, so no seam shows between them.
   */
  setThemeColors(background: string): void;
  openLink(url: string): void;
  shareUrl(url: string, text?: string): void;
  switchInlineQuery(query: string): boolean;
  close(): void;
}
