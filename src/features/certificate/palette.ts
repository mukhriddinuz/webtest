import type { CertificateTier } from './certificate';

/**
 * A certificate is a document, not a screen: it keeps one light, printable
 * paper whatever theme the app is in, and takes its metal from the result —
 * gold for the best, then blue, green and a quiet silver.
 */
export interface CertificateTheme {
  paper: string;
  /** The frame, ribbon and seal. */
  accent: string;
  deep: string;
  light: string;
  /** A wash for large quiet areas. */
  soft: string;
}

export const THEMES: Record<CertificateTier, CertificateTheme> = {
  excellent: {
    paper: '#FFFDF6',
    accent: '#C9962B',
    deep: '#8A6414',
    light: '#F3D27A',
    soft: '#FBF3DC',
  },
  good: {
    paper: '#FAFCFF',
    accent: '#3390EC',
    deep: '#1B5FA6',
    light: '#8EC4F7',
    soft: '#E6F2FD',
  },
  fair: {
    paper: '#FAFDFB',
    accent: '#2FA45A',
    deep: '#1B6E3C',
    light: '#8AD6A5',
    soft: '#E4F5EA',
  },
  participation: {
    paper: '#FBFBFC',
    accent: '#7B8794',
    deep: '#4B5563',
    light: '#C3CAD3',
    soft: '#EEF0F3',
  },
};

export const INK = '#1B2438';
export const BODY = '#4A5363';
export const LABEL = '#6B7482';

export const SERIF = "Georgia, 'Times New Roman', 'Noto Serif', 'DejaVu Serif', serif";
export const SANS = "-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
