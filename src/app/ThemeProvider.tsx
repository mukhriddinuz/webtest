import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getMockBridge, getTelegram } from '@/lib/telegram';
import { useUiStore } from '@/store/ui';

/**
 * Reads the current `--bg` token and returns it as the hex string Telegram
 * expects, so the chrome always matches whatever the stylesheet defines.
 */
function backgroundHex(): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--bg-rgb').trim();
  const channels = raw.split(/\s+/).map((value) => Number(value));
  if (channels.length !== 3 || channels.some((value) => Number.isNaN(value))) return '#FAF8F4';
  return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/**
 * Keeps `data-theme`, the language, the Telegram chrome colors and the safe
 * area CSS variables in sync with both the store and the host environment.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const preference = useUiStore((state) => state.themePreference);
  const language = useUiStore((state) => state.language);
  const setResolvedTheme = useUiStore((state) => state.setResolvedTheme);

  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
    document.documentElement.lang = language;
  }, [language, i18n]);

  useEffect(() => {
    const telegram = getTelegram();
    const mock = getMockBridge();

    const apply = (scheme: 'light' | 'dark') => {
      document.documentElement.dataset.theme = scheme;
      const background = backgroundHex();
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background);
      if (telegram.isTelegram) telegram.setThemeColors(background);
      setResolvedTheme(scheme);
    };

    // In the browser the mock bridge owns the light/dark decision so the dev
    // panel and the profile screen stay in agreement.
    mock?.setColorScheme(preference);
    apply(preference === 'system' ? telegram.getColorScheme() : preference);

    if (preference !== 'system') return;
    return telegram.onThemeChanged(apply);
  }, [preference, setResolvedTheme]);

  useEffect(() => {
    const telegram = getTelegram();
    const applyViewport = () => {
      const viewport = telegram.getViewport();
      const root = document.documentElement.style;
      root.setProperty('--viewport-height', `${viewport.height}px`);
      // Outside Telegram the stylesheet's env() values are the accurate ones.
      if (!telegram.isTelegram) return;
      root.setProperty('--safe-top', `${viewport.safeTop}px`);
      root.setProperty('--safe-bottom', `${viewport.safeBottom}px`);
    };
    applyViewport();
    return telegram.onViewportChanged(applyViewport);
  }, []);

  return <>{children}</>;
}
