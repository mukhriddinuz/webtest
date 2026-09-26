/**
 * Maps Telegram's `themeParams` onto our design tokens, so inside Telegram the
 * app is painted with exactly the palette the user chose in the client.
 */

type Rgb = [number, number, number];

function parseHex(value: string | undefined): Rgb | null {
  if (!value) return null;
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  if (!match?.[1]) return null;
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blends `color` over `base` at the given opacity. */
function mix(color: Rgb, base: Rgb, amount: number): Rgb {
  const blend = (i: 0 | 1 | 2) => Math.round(color[i] * amount + base[i] * (1 - amount));
  return [blend(0), blend(1), blend(2)];
}

const channels = (rgb: Rgb) => rgb.join(' ');

/** Every token this module may write, so they can be cleared again. */
const TOKENS = [
  'bg',
  'surface',
  'surface-muted',
  'border',
  'text',
  'text-muted',
  'primary',
  'primary-hover',
  'primary-soft',
  'on-primary',
  'danger',
  'danger-soft',
  'info',
];

export function clearThemeParams(root: HTMLElement = document.documentElement) {
  for (const token of TOKENS) root.style.removeProperty(`--${token}-rgb`);
}

/** Returns false (and leaves the stylesheet palette alone) when params are unusable. */
export function applyThemeParams(
  params: Record<string, string> | null,
  root: HTMLElement = document.documentElement,
): boolean {
  clearThemeParams(root);
  if (!params) return false;

  const bg = parseHex(params.bg_color);
  const text = parseHex(params.text_color);
  const button = parseHex(params.button_color);
  if (!bg || !text || !button) return false;

  const surface = parseHex(params.section_bg_color) ?? bg;
  const backdrop = parseHex(params.secondary_bg_color) ?? mix(text, surface, 0.06);
  const hint = parseHex(params.hint_color) ?? mix(text, surface, 0.5);
  const link = parseHex(params.link_color) ?? button;
  const separator = parseHex(params.section_separator_color) ?? mix(text, surface, 0.12);
  const buttonText = parseHex(params.button_text_color) ?? [255, 255, 255];
  const danger = parseHex(params.destructive_text_color);

  const set = (token: string, rgb: Rgb) => root.style.setProperty(`--${token}-rgb`, channels(rgb));
  set('bg', backdrop);
  set('surface', surface);
  // Must read as a fill on a white card and on the grey backdrop alike.
  set('surface-muted', mix(text, surface, 0.1));
  set('border', separator);
  set('text', text);
  set('text-muted', hint);
  set('primary', button);
  set('primary-hover', mix(text, button, 0.12));
  set('primary-soft', mix(button, surface, 0.14));
  set('on-primary', buttonText);
  set('info', link);
  if (danger) {
    set('danger', danger);
    set('danger-soft', mix(danger, surface, 0.14));
  }
  return true;
}
