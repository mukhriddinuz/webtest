import { svgToDataUrl } from '@/lib/imageStore';
import type { CertificateTier } from './certificate';

export const CERTIFICATE_WIDTH = 1414;
export const CERTIFICATE_HEIGHT = 1000;

/** Everything the drawing says, already in the reader's language. */
export interface CertificateText {
  brand: string;
  title: string;
  certifies: string;
  recipient: string;
  body: string;
  tier: CertificateTier;
  tierLabel: string;
  detail: string | null;
  dateLabel: string;
  dateValue: string;
  authorLabel: string;
  authorValue: string;
  numberLabel: string;
  numberValue: string;
}

/**
 * A certificate is a document, not a screen: it keeps one light, printable
 * palette whatever theme the app is in.
 */
const INK = '#1F2433';
const MUTED = '#707579';
const RULE = '#D9DCE1';
const ACCENT = '#3390EC';

const TIERS: Record<CertificateTier, { color: string; soft: string }> = {
  excellent: { color: '#F59B23', soft: '#FEF3E2' },
  good: { color: '#3390EC', soft: '#E5F1FD' },
  fair: { color: '#31B545', soft: '#E4F6E7' },
  participation: { color: '#707579', soft: '#F0F1F3' },
};

const FONT = "-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

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
  if (name.length <= 22) return 84;
  if (name.length <= 32) return 64;
  return 48;
}

const text = (
  x: number,
  y: number,
  value: string,
  size: number,
  fill: string,
  extra = '',
): string =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="${fill}" ${extra}>${escapeXml(value)}</text>`;

export function certificateSvg(content: CertificateText): string {
  const W = CERTIFICATE_WIDTH;
  const H = CERTIFICATE_HEIGHT;
  const cx = W / 2;
  const tier = TIERS[content.tier];

  const name = ellipsize(content.recipient, 52);
  const bodyLines = wrapText(content.body, 56, 3);

  const bodyText = bodyLines
    .map((line, index) => text(cx, 566 + index * 46, line, 32, MUTED))
    .join('');

  const footer = [
    { x: 270, label: content.dateLabel, value: content.dateValue },
    { x: cx, label: content.authorLabel, value: ellipsize(content.authorValue, 26) },
    { x: W - 270, label: content.numberLabel, value: content.numberValue },
  ]
    .map(
      (column) =>
        text(column.x, 864, column.value, 30, INK, 'font-weight="600"') +
        `<line x1="${column.x - 150}" y1="884" x2="${column.x + 150}" y2="884" stroke="${RULE}" stroke-width="2"/>` +
        text(column.x, 920, column.label, 22, MUTED),
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">
    <defs><clipPath id="paper"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath></defs>
    <rect width="${W}" height="${H}" fill="#FFFFFF"/>
    <g clip-path="url(#paper)">
      <circle cx="${W - 60}" cy="40" r="230" fill="${ACCENT}" opacity="0.07"/>
      <circle cx="60" cy="${H - 30}" r="210" fill="${ACCENT}" opacity="0.07"/>
    </g>
    <rect x="36" y="36" width="${W - 72}" height="${H - 72}" rx="22" fill="none" stroke="${ACCENT}" stroke-width="6"/>
    <rect x="58" y="58" width="${W - 116}" height="${H - 116}" rx="14" fill="none" stroke="${RULE}" stroke-width="2"/>
    ${text(cx, 134, content.brand, 28, ACCENT, 'font-weight="700" letter-spacing="10"')}
    ${text(cx, 252, content.title, 104, INK, 'font-weight="700" letter-spacing="12"')}
    <line x1="${cx - 90}" y1="292" x2="${cx + 90}" y2="292" stroke="${ACCENT}" stroke-width="5" stroke-linecap="round"/>
    ${text(cx, 366, content.certifies, 30, MUTED)}
    ${text(cx, 466, name, nameSize(name), INK, 'font-weight="700"')}
    <line x1="${cx - 380}" y1="496" x2="${cx + 380}" y2="496" stroke="${RULE}" stroke-width="2"/>
    ${bodyText}
    <rect x="${cx - 330}" y="650" width="660" height="${content.detail ? 136 : 104}" rx="${content.detail ? 68 : 52}" fill="${tier.soft}"/>
    ${text(cx, content.detail ? 706 : 717, content.tierLabel, 42, tier.color, 'font-weight="700"')}
    ${content.detail ? text(cx, 756, content.detail, 28, MUTED) : ''}
    <g transform="translate(${W - 190} 724)">
      <circle r="84" fill="${tier.color}"/>
      <circle r="68" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.85"/>
      <path d="M-30 2 L-9 24 L32 -22" fill="none" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    ${footer}
  </svg>`;
}

export const certificateDataUrl = (content: CertificateText): string =>
  svgToDataUrl(certificateSvg(content));

/** Draws the certificate onto a canvas, for saving or sharing as an image. */
export async function certificatePng(content: CertificateText): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('Certificate could not be drawn'));
    element.src = certificateDataUrl(content);
  });

  const canvas = document.createElement('canvas');
  canvas.width = CERTIFICATE_WIDTH;
  canvas.height = CERTIFICATE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context unavailable');
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT);
  context.drawImage(image, 0, 0, CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Certificate could not be saved'))),
      'image/png',
    );
  });
}
