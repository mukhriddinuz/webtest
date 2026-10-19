import type { CertificateTheme } from './palette';

/** A number, kept short: the drawing has thousands of them. */
const n = (value: number): string => String(Math.round(value * 10) / 10);

/* -------------------------------- guilloche ------------------------------- */

/**
 * One sine-like wave along the x axis, built from quadratic curves: each `T`
 * mirrors the previous control point, so the line alternates up and down
 * without a long list of points.
 */
function wave(length: number, amplitude: number, wavelength: number, shift: number): string {
  const half = wavelength / 2;
  let d = `M${n(-shift)} 0Q${n(-shift + half / 2)} ${n(-amplitude * 2)} ${n(-shift + half)} 0`;
  for (let x = -shift + wavelength; x <= length + wavelength; x += half) d += `T${n(x)} 0`;
  return d;
}

/**
 * The woven band that runs round the edge of a banknote: a few waves of the
 * same size, each a third of a wavelength out of step with the last.
 */
export function guillocheBand(length: number, theme: CertificateTheme): string {
  const wavelength = 56;
  return [0, 1, 2]
    .map(
      (index) =>
        `<path d="${wave(length, 13, wavelength, (index * wavelength) / 3)}" fill="none" stroke="${theme.accent}" stroke-width="1.5" opacity="${index === 0 ? 0.85 : 0.55}"/>`,
    )
    .join('');
}

/* --------------------------------- frame ---------------------------------- */

const FRAME_BAND = { from: 56, to: 96 } as const;

/** Frame, woven band, corner knots and the thin rules inside them. */
export function frame(width: number, height: number, theme: CertificateTheme): string {
  const mid = (FRAME_BAND.from + FRAME_BAND.to) / 2;
  const horizontal = width - FRAME_BAND.from * 2;
  const vertical = height - FRAME_BAND.from * 2;
  const band = FRAME_BAND.to - FRAME_BAND.from;

  const side = (id: string, x: number, y: number, w: number, h: number) =>
    `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`;

  const clips = [
    side('band-top', FRAME_BAND.from, FRAME_BAND.from, horizontal, band),
    side('band-bottom', FRAME_BAND.from, height - FRAME_BAND.to, horizontal, band),
    side('band-left', FRAME_BAND.from, FRAME_BAND.from, band, vertical),
    side('band-right', width - FRAME_BAND.to, FRAME_BAND.from, band, vertical),
  ].join('');

  const bandTop = guillocheBand(horizontal, theme);
  const bandSide = guillocheBand(vertical, theme);

  const knot = (x: number, y: number) =>
    `<g transform="translate(${x} ${y})">
       <rect x="-19" y="-19" width="38" height="38" transform="rotate(45)" fill="${theme.paper}" stroke="url(#frame)" stroke-width="2.5"/>
       <rect x="-9" y="-9" width="18" height="18" transform="rotate(45)" fill="url(#frame)"/>
     </g>`;

  return `
    <defs>${clips}</defs>
    <rect x="22" y="22" width="${width - 44}" height="${height - 44}" rx="18" fill="none" stroke="url(#frame)" stroke-width="10"/>
    <rect x="40" y="40" width="${width - 80}" height="${height - 80}" rx="10" fill="none" stroke="${theme.accent}" stroke-width="2"/>
    <g clip-path="url(#band-top)"><g transform="translate(${FRAME_BAND.from} ${mid})">${bandTop}</g></g>
    <g clip-path="url(#band-bottom)"><g transform="translate(${FRAME_BAND.from} ${height - mid})">${bandTop}</g></g>
    <g clip-path="url(#band-left)"><g transform="translate(${mid} ${FRAME_BAND.from}) rotate(90)">${bandSide}</g></g>
    <g clip-path="url(#band-right)"><g transform="translate(${width - mid} ${FRAME_BAND.from}) rotate(90)">${bandSide}</g></g>
    <rect x="${FRAME_BAND.to + 4}" y="${FRAME_BAND.to + 4}" width="${width - (FRAME_BAND.to + 4) * 2}" height="${height - (FRAME_BAND.to + 4) * 2}" fill="none" stroke="${theme.accent}" stroke-width="2"/>
    <rect x="${FRAME_BAND.to + 12}" y="${FRAME_BAND.to + 12}" width="${width - (FRAME_BAND.to + 12) * 2}" height="${height - (FRAME_BAND.to + 12) * 2}" fill="none" stroke="${theme.accent}" stroke-width="1" opacity="0.5"/>
    ${knot(mid, mid)}${knot(width - mid, mid)}${knot(mid, height - mid)}${knot(width - mid, height - mid)}`;
}

/* ------------------------------- background ------------------------------- */

/** A fine weave over the paper and the mark of the platform, huge and faint. */
export function backdrop(width: number, height: number, theme: CertificateTheme): string {
  const cx = width / 2;
  const cy = height / 2 + 10;
  const rings = [90, 150, 210, 270, 330, 390]
    .map(
      (r) =>
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.accent}" stroke-width="1.5" opacity="0.06"/>`,
    )
    .join('');
  return `
    <defs>
      <pattern id="weave" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="12" stroke="${theme.accent}" stroke-width="1" opacity="0.07"/>
      </pattern>
    </defs>
    <rect width="${width}" height="${height}" fill="${theme.paper}"/>
    <rect width="${width}" height="${height}" fill="url(#weave)"/>
    ${rings}
    <g transform="translate(${cx} ${cy}) scale(5)" opacity="0.03">
      <rect x="-22" y="-28" width="44" height="56" rx="7" fill="${theme.deep}"/>
      <path d="M-10 0l7 7 14-16" fill="none" stroke="${theme.paper}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
}

/* -------------------------------- ornaments ------------------------------- */

/** A rule broken by a small diamond. */
export function divider(cx: number, y: number, half: number, theme: CertificateTheme): string {
  return `
    <path d="M${cx - half} ${y}H${cx - 18}M${cx + 18} ${y}H${cx + half}" stroke="${theme.accent}" stroke-width="2" stroke-linecap="round"/>
    <path d="M${cx} ${y - 8}L${cx + 8} ${y}L${cx} ${y + 8}L${cx - 8} ${y}Z" fill="url(#frame)"/>
    <circle cx="${cx - half - 8}" cy="${y}" r="3" fill="${theme.accent}"/>
    <circle cx="${cx + half + 8}" cy="${y}" r="3" fill="${theme.accent}"/>`;
}

/** A line that fades out at both ends, for under the name. */
export function fadingRule(cx: number, y: number, half: number): string {
  return `<rect x="${cx - half}" y="${y}" width="${half * 2}" height="2.5" rx="1.25" fill="url(#fade)"/>`;
}

/** The platform's own mark: a sheet with a tick. */
export function logoMark(x: number, y: number, size: number, theme: CertificateTheme): string {
  const k = size / 56;
  return `
    <g transform="translate(${x} ${y}) scale(${k})">
      <rect width="56" height="56" rx="14" fill="url(#ribbon)"/>
      <rect x="15" y="10" width="26" height="36" rx="5" fill="#FFFFFF"/>
      <path d="M21 28l5 5 10-12" fill="none" stroke="${theme.deep}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
}

/* --------------------------------- ribbon --------------------------------- */

/** A banner with folded, notched tails; the result's name is printed on it. */
export function ribbon(cx: number, y: number, width: number, theme: CertificateTheme): string {
  const h = 56;
  const left = cx - width / 2;
  const right = cx + width / 2;
  const tail = 46;
  const fold = 10;
  return `
    <path d="M${left - tail} ${y + 12}H${left + fold}V${y + h + fold + 4}H${left - tail}L${left - tail + 24} ${y + 12 + (h + fold - 8) / 2}Z" fill="${theme.deep}"/>
    <path d="M${right + tail} ${y + 12}H${right - fold}V${y + h + fold + 4}H${right + tail}L${right + tail - 24} ${y + 12 + (h + fold - 8) / 2}Z" fill="${theme.deep}"/>
    <path d="M${left} ${y + h}L${left + fold} ${y + h + fold + 4}V${y + h}Z" fill="#000000" opacity="0.32"/>
    <path d="M${right} ${y + h}L${right - fold} ${y + h + fold + 4}V${y + h}Z" fill="#000000" opacity="0.32"/>
    <rect x="${left}" y="${y}" width="${width}" height="${h}" fill="url(#ribbon)"/>
    <rect x="${left}" y="${y}" width="${width}" height="2" fill="#FFFFFF" opacity="0.35"/>`;
}

/* ---------------------------------- seal ---------------------------------- */

function polygon(cx: number, cy: number, points: number, outer: number, inner: number): string {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    out.push(`${n(cx + Math.cos(angle) * radius)},${n(cy + Math.sin(angle) * radius)}`);
  }
  return out.join(' ');
}

/** A serrated wax-style seal with two ribbon tails behind it. */
export function seal(
  cx: number,
  cy: number,
  radius: number,
  icon: 'star' | 'check',
  theme: CertificateTheme,
): string {
  const tail = (dx: number, angle: number) =>
    `<g transform="translate(${cx + dx} ${cy + radius * 0.55}) rotate(${angle})">
       <path d="M-17 0H17V${radius * 0.85}L0 ${radius * 0.85 - 16}L-17 ${radius * 0.85}Z" fill="${theme.deep}"/>
       <path d="M-17 0H17V6H-17Z" fill="#000000" opacity="0.18"/>
     </g>`;

  const glyph =
    icon === 'star'
      ? `<polygon points="${polygon(cx, cy + 1, 5, radius * 0.42, radius * 0.17)}" fill="#FFFFFF"/>`
      : `<path d="M${cx - radius * 0.26} ${cy + 2}L${cx - radius * 0.07} ${cy + radius * 0.2}L${cx + radius * 0.3} ${cy - radius * 0.2}" fill="none" stroke="#FFFFFF" stroke-width="${radius * 0.15}" stroke-linecap="round" stroke-linejoin="round"/>`;

  return `
    ${tail(-radius * 0.42, 14)}${tail(radius * 0.42, -14)}
    <polygon points="${polygon(cx, cy, 32, radius, radius - 7)}" fill="url(#seal)" stroke="${theme.deep}" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="${radius - 14}" fill="none" stroke="${theme.light}" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy}" r="${radius - 21}" fill="url(#sealInner)"/>
    <circle cx="${cx}" cy="${cy}" r="${radius - 25}" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.6"/>
    ${glyph}`;
}

/* ----------------------------------- qr ----------------------------------- */

export interface QrMatrix {
  size: number;
  /** Row by row, `true` for a dark module. */
  dark: boolean[];
}

/** The dark modules as one path, a run of neighbours per rectangle. */
export function qrPath(matrix: QrMatrix): string {
  let d = '';
  for (let row = 0; row < matrix.size; row += 1) {
    let column = 0;
    while (column < matrix.size) {
      if (!matrix.dark[row * matrix.size + column]) {
        column += 1;
        continue;
      }
      const start = column;
      while (column < matrix.size && matrix.dark[row * matrix.size + column]) column += 1;
      d += `M${start} ${row}h${column - start}v1h${start - column}z`;
    }
  }
  return d;
}

/** Module size in pixels for a code that should fill about `target`. */
export const qrScale = (matrix: QrMatrix, target: number): number =>
  Math.max(2, Math.floor(target / matrix.size));
