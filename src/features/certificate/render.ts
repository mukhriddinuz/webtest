import { svgToDataUrl } from '@/lib/imageStore';
import type { CertificateTier } from './certificate';
import {
  backdrop,
  divider,
  fadingRule,
  frame,
  logoMark,
  qrPath,
  qrScale,
  ribbon,
  seal,
  type QrMatrix,
} from './ornaments';
import { BODY, INK, LABEL, SANS, SERIF, THEMES } from './palette';

export const CERTIFICATE_WIDTH = 1414;
export const CERTIFICATE_HEIGHT = 1000;

export interface CertificateStat {
  value: string;
  label: string;
}

/** Everything the drawing says, already in the reader's language. */
export interface CertificateText {
  brand: string;
  title: string;
  certifies: string;
  recipient: string;
  body: string;
  tier: CertificateTier;
  tierLabel: string;
  /** Up to three figures under the ribbon; none when the result is hidden. */
  stats: CertificateStat[];
  dateLabel: string;
  dateValue: string;
  authorLabel: string;
  authorValue: string;
  numberLabel: string;
  numberValue: string;
  /** A code that opens the test; left out when it could not be made. */
  qr: QrMatrix | null;
  qrCaption: string;
}

export const escapeXml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ellipsize = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;

/** Breaks text into at most `maxLines` lines of about `maxChars`, cutting with an ellipsis. */
export function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars || line === '') {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = ellipsize(lines.slice(maxLines - 1).join(' '), maxChars);
    return kept.map((item) => ellipsize(item, maxChars));
  }
  return lines.map((item) => ellipsize(item, maxChars));
}

/** Long names shrink rather than run off the page. */
export function nameSize(name: string): number {
  if (name.length <= 16) return 96;
  if (name.length <= 22) return 84;
  if (name.length <= 30) return 68;
  if (name.length <= 40) return 54;
  return 44;
}

/** The signature is a smaller line of the same kind. */
export function signatureSize(name: string): number {
  if (name.length <= 18) return 44;
  if (name.length <= 26) return 36;
  return 30;
}

interface TextOptions {
  size: number;
  fill: string;
  font?: string;
  weight?: number;
  italic?: boolean;
  spacing?: number;
  anchor?: 'start' | 'middle' | 'end';
}

const text = (x: number, y: number, value: string, options: TextOptions): string =>
  `<text x="${x}" y="${y}" text-anchor="${options.anchor ?? 'middle'}" font-family="${options.font ?? SERIF}" font-size="${options.size}" fill="${options.fill}"${
    options.weight ? ` font-weight="${options.weight}"` : ''
  }${options.italic ? ' font-style="italic"' : ''}${
    options.spacing ? ` letter-spacing="${options.spacing}"` : ''
  }>${escapeXml(value)}</text>`;

export function certificateSvg(content: CertificateText): string {
  const W = CERTIFICATE_WIDTH;
  const H = CERTIFICATE_HEIGHT;
  const cx = W / 2;
  const left = 140;
  const right = W - 140;
  const theme = THEMES[content.tier];

  const name = ellipsize(content.recipient, 52);
  const bodyLines = wrapText(content.body, 64, 2);
  const hasStats = content.stats.length > 0;
  const ribbonY = hasStats ? 584 : 622;
  const ribbonWidth = Math.min(780, Math.max(420, content.tierLabel.length * 24 + 120));

  const header = `
    ${logoMark(left, 122, 56, theme)}
    ${text(left + 72, 160, content.brand, { size: 26, fill: theme.deep, font: SANS, weight: 700, spacing: 6, anchor: 'start' })}
    ${text(right, 130, content.dateLabel, { size: 15, fill: LABEL, font: SANS, spacing: 3, anchor: 'end' })}
    ${text(right, 156, content.dateValue, { size: 26, fill: INK, weight: 700, anchor: 'end' })}
    ${text(right, 182, content.numberLabel, { size: 15, fill: LABEL, font: SANS, spacing: 3, anchor: 'end' })}
    ${text(right, 208, content.numberValue, { size: 26, fill: INK, font: SANS, weight: 700, spacing: 2, anchor: 'end' })}`;

  const bodyText = bodyLines
    .map((line, index) => text(cx, 514 + index * 40, line, { size: 28, fill: BODY }))
    .join('');

  const stats = content.stats
    .map((stat, index) => {
      const x = cx + (index - (content.stats.length - 1) / 2) * 290;
      const rule =
        index > 0
          ? `<line x1="${x - 145}" y1="668" x2="${x - 145}" y2="742" stroke="${theme.light}" stroke-width="2"/>`
          : '';
      return (
        rule +
        text(x, 706, stat.value, { size: 50, fill: theme.deep, weight: 700 }) +
        text(x, 736, stat.label, { size: 16, fill: LABEL, font: SANS, spacing: 3 })
      );
    })
    .join('');

  const signature = `
    ${text(cx, 820, ellipsize(content.authorValue, 30), { size: signatureSize(content.authorValue), fill: INK, italic: true })}
    <line x1="${cx - 170}" y1="838" x2="${cx + 170}" y2="838" stroke="${theme.accent}" stroke-width="2"/>
    ${text(cx, 868, content.authorLabel, { size: 16, fill: LABEL, font: SANS, spacing: 3 })}`;

  let qr = '';
  if (content.qr) {
    const scale = qrScale(content.qr, 84);
    const size = content.qr.size * scale;
    const pad = 9;
    const box = size + pad * 2;
    const boxX = right - box;
    const boxY = 776;
    const lines = wrapText(content.qrCaption, 22, 3);
    const first = boxY + box / 2 - ((lines.length - 1) * 24) / 2 + 6;
    qr = `
      <rect x="${boxX}" y="${boxY}" width="${box}" height="${box}" rx="10" fill="#FFFFFF" stroke="${theme.accent}" stroke-width="2"/>
      <g transform="translate(${boxX + pad} ${boxY + pad}) scale(${scale})"><path d="${qrPath(content.qr)}" fill="${INK}"/></g>
      ${lines.map((line, index) => text(boxX - 18, first + index * 24, line, { size: 17, fill: LABEL, font: SANS, anchor: 'end' })).join('')}`;
  }

  const icon = content.tier === 'excellent' || content.tier === 'good' ? 'star' : 'check';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs>
      <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${theme.light}"/><stop offset="0.3" stop-color="${theme.accent}"/>
        <stop offset="0.65" stop-color="${theme.deep}"/><stop offset="1" stop-color="${theme.accent}"/>
      </linearGradient>
      <linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${theme.accent}"/><stop offset="1" stop-color="${theme.deep}"/>
      </linearGradient>
      <radialGradient id="seal" cx="0.35" cy="0.3" r="0.9">
        <stop offset="0" stop-color="${theme.light}"/><stop offset="0.55" stop-color="${theme.accent}"/>
        <stop offset="1" stop-color="${theme.deep}"/>
      </radialGradient>
      <radialGradient id="sealInner" cx="0.65" cy="0.7" r="0.9">
        <stop offset="0" stop-color="${theme.light}"/><stop offset="0.5" stop-color="${theme.accent}"/>
        <stop offset="1" stop-color="${theme.deep}"/>
      </radialGradient>
      <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${theme.accent}" stop-opacity="0"/>
        <stop offset="0.5" stop-color="${theme.accent}"/>
        <stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${backdrop(W, H, theme)}
    ${frame(W, H, theme)}
    ${header}
    ${text(cx, 268, content.title, { size: 78, fill: INK, weight: 700, spacing: 12 })}
    ${divider(cx, 298, 150, theme)}
    ${text(cx, 350, content.certifies, { size: 30, fill: BODY, italic: true })}
    ${text(cx, 436, name, { size: nameSize(name), fill: INK, weight: 700, italic: true })}
    ${fadingRule(cx, 462, 420)}
    ${bodyText}
    ${ribbon(cx, ribbonY, ribbonWidth, theme)}
    ${text(cx, ribbonY + 37, content.tierLabel, { size: 32, fill: '#FFFFFF', weight: 700, spacing: 2 })}
    ${stats}
    ${seal(236, 818, 54, icon, theme)}
    ${signature}
    ${qr}
  </svg>`;
}

export const certificateDataUrl = (content: CertificateText): string =>
  svgToDataUrl(certificateSvg(content));

/** The code's modules, or null if the generator cannot be loaded. */
export async function qrMatrix(value: string): Promise<QrMatrix | null> {
  try {
    const { default: QRCode } = await import('qrcode');
    const code = QRCode.create(value, { errorCorrectionLevel: 'M' });
    return { size: code.modules.size, dark: Array.from(code.modules.data, (bit) => bit === 1) };
  } catch {
    return null;
  }
}

/** Twice the on-screen size, so a print stays sharp. */
const EXPORT_SCALE = 2;

/** Draws the certificate onto a canvas, for saving or sharing as an image. */
export async function certificatePng(content: CertificateText): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('Certificate could not be drawn'));
    element.src = certificateDataUrl(content);
  });

  const width = CERTIFICATE_WIDTH * EXPORT_SCALE;
  const height = CERTIFICATE_HEIGHT * EXPORT_SCALE;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context unavailable');
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Certificate could not be saved'))),
      'image/png',
    );
  });
}
