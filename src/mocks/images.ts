import { putImage, svgToDataUrl } from '@/lib/imageStore';

/**
 * All seed artwork is inline SVG — no external requests. It is rendered through
 * an `<img>`, so it cannot read the app's CSS variables; instead each drawing
 * carries its own palette and flips it with `prefers-color-scheme`.
 *
 * That query follows the device, not the theme picker in Profile, so a phone
 * set to light while the app is forced dark still gets the light artwork.
 * Inside Telegram the two nearly always agree, and a webview too old for the
 * query keeps the light palette — exactly what it rendered before.
 */
const PALETTE = `
  <style>
    svg {
      --plate: #FFFFFF;
      --ink: #1F2433;
      --muted: #707579;
      --grid: #E1E1E6;
      --accent: #3390EC;
      --accent-soft: #E5F1FD;
      --warn: #E53935;
      --warn-soft: #FCE8E7;
      --ok: #31B545;
      --ok-soft: #E4F6E7;
      --gold: #F59B23;
      --gold-soft: #FEF3E2;
    }
    @media (prefers-color-scheme: dark) {
      svg {
        --plate: #17212B;
        --ink: #F5F5F5;
        --muted: #708499;
        --grid: #283442;
        --accent: #6AB3F3;
        --accent-soft: #203246;
        --warn: #EC7B75;
        --warn-soft: #3C1F26;
        --ok: #4FBE63;
        --ok-soft: #1D3629;
        --gold: #EEA648;
        --gold-soft: #382D20;
      }
    }
  </style>`;

const FRAME = (body: string, width = 360, height = 220) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${PALETTE}
    <rect width="${width}" height="${height}" fill="var(--plate)"/>
    <g fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
       font-family="-apple-system, Roboto, sans-serif" font-size="13">
      ${body}
    </g>
  </svg>`;

const LABEL = (x: number, y: number, text: string, anchor = 'middle') =>
  `<text x="${x}" y="${y}" fill="var(--ink)" stroke="none" text-anchor="${anchor}">${text}</text>`;

/* --------------------------- physics illustrations ------------------------ */

const velocityGraph = FRAME(`
  <path d="M40 180 L330 180" stroke="var(--muted)"/>
  <path d="M40 180 L40 30" stroke="var(--muted)"/>
  <path d="M40 180 L160 90 L280 90" stroke="var(--accent)" stroke-width="2.4"/>
  <circle cx="160" cy="90" r="3.5" fill="var(--accent)" stroke="none"/>
  <path d="M40 90 L160 90" stroke="var(--grid)" stroke-dasharray="4 4"/>
  ${LABEL(24, 95, 'v', 'middle')}
  ${LABEL(335, 196, 't', 'middle')}
  ${LABEL(100, 200, '0-4 s', 'middle')}
  ${LABEL(220, 200, '4-8 s', 'middle')}
  ${LABEL(180, 40, 'v-t grafigi', 'middle')}
`);

const inclinedPlane = FRAME(`
  <path d="M40 180 L300 180 L300 70 Z" stroke="var(--accent)" stroke-width="2.2"/>
  <rect x="200" y="96" width="34" height="24" rx="4" transform="rotate(-23 217 108)" fill="var(--accent-soft)" stroke="var(--accent)"/>
  <path d="M300 180 L300 150" stroke="var(--muted)" stroke-dasharray="4 4"/>
  <path d="M70 180 A 40 40 0 0 0 78 160" stroke="var(--warn)"/>
  ${LABEL(92, 174, 'a', 'middle')}
  ${LABEL(232, 88, 'm', 'middle')}
  ${LABEL(170, 200, 'Qiya tekislik', 'middle')}
`);

const pulley = FRAME(`
  <circle cx="180" cy="60" r="26" stroke="var(--accent)" stroke-width="2.2"/>
  <circle cx="180" cy="60" r="4" fill="var(--accent)" stroke="none"/>
  <path d="M154 60 L154 150" stroke="var(--muted)"/>
  <path d="M206 60 L206 120" stroke="var(--muted)"/>
  <rect x="134" y="150" width="40" height="30" rx="4" fill="var(--accent-soft)" stroke="var(--accent)"/>
  <rect x="186" y="120" width="40" height="30" rx="4" fill="var(--gold-soft)" stroke="var(--gold)"/>
  ${LABEL(154, 170, 'm1')}
  ${LABEL(206, 140, 'm2')}
`);

/* -------------------------- geometry illustrations ------------------------ */

const triangle = FRAME(`
  <path d="M60 180 L300 180 L120 50 Z" stroke="var(--accent)" stroke-width="2.2"/>
  <path d="M60 180 L60 164 L76 164" stroke="var(--warn)"/>
  <path d="M96 180 A 36 36 0 0 0 92 158" stroke="var(--gold)"/>
  ${LABEL(52, 194, 'A', 'middle')}
  ${LABEL(306, 194, 'C', 'middle')}
  ${LABEL(114, 42, 'B', 'middle')}
  ${LABEL(180, 196, 'b', 'middle')}
  ${LABEL(78, 110, 'c', 'middle')}
  ${LABEL(220, 108, 'a', 'middle')}
`);

const circleGeometry = FRAME(`
  <circle cx="180" cy="110" r="72" stroke="var(--accent)" stroke-width="2.2"/>
  <circle cx="180" cy="110" r="3.5" fill="var(--accent)" stroke="none"/>
  <path d="M180 110 L252 110" stroke="var(--gold)" stroke-width="2.2"/>
  <path d="M108 110 L252 110" stroke="var(--muted)" stroke-dasharray="5 4"/>
  <path d="M180 110 L231 59" stroke="var(--ok)" stroke-width="2.2"/>
  ${LABEL(216, 102, 'R', 'middle')}
  ${LABEL(180, 200, 'Aylana', 'middle')}
  ${LABEL(214, 74, 'r', 'middle')}
`);

/* ------------------------------- test covers ------------------------------ */

/**
 * A cover tints its own accent over the theme's own plate, so the same file
 * reads as a pale card by day and a deep one by night — a fixed pale plate
 * turned these into glaring white dots on a dark list.
 */
const cover = (title: string, accent: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    ${PALETTE}
    <rect width="240" height="240" fill="var(--plate)"/>
    <rect width="240" height="240" fill="${accent}" opacity="0.12"/>
    <circle cx="200" cy="44" r="72" fill="${accent}" opacity="0.18"/>
    <circle cx="40" cy="210" r="56" fill="${accent}" opacity="0.14"/>
    <text x="120" y="132" text-anchor="middle" font-size="64" font-weight="600"
          font-family="-apple-system, Roboto, sans-serif" fill="${accent}">${title}</text>
  </svg>`;

export const SEED_IMAGES: Record<string, string> = {
  img_phys_graph: velocityGraph,
  img_phys_incline: inclinedPlane,
  img_phys_pulley: pulley,
  img_geo_triangle: triangle,
  img_geo_circle: circleGeometry,
  img_cover_algebra: cover('ax²', '#3390EC'),
  img_cover_physics: cover('F=ma', '#F59B23'),
  img_cover_english: cover('EN', '#2A9EF1'),
  img_cover_geometry: cover('△', '#31B545'),
  img_cover_history: cover('XIV', '#E53935'),
  img_cover_chemistry: cover('H₂O', '#8B5CF6'),
  img_cover_biology: cover('DNK', '#31B545'),
  img_cover_geography: cover('GEO', '#0EA5E9'),
  img_cover_it: cover('</>', '#6366F1'),
  img_cover_literature: cover('Ad', '#EC4899'),
  img_cover_astronomy: cover('★', '#F59B23'),
  img_cover_uzbek: cover('Aa', '#14B8A6'),
  img_cover_russian: cover('Ру', '#E53935'),
  img_cover_logic: cover('?', '#8B5CF6'),
  img_cover_trig: cover('sin', '#3390EC'),
  img_cover_log: cover('log', '#F59B23'),
  img_cover_contest: cover('#1', '#F59B23'),
  img_cover_live: cover('LIVE', '#E53935'),
  img_cover_quiz: cover('Q', '#2A9EF1'),
  img_cover_dtm: cover('DTM', '#3390EC'),
  img_cover_milliy: cover('MS', '#31B545'),
};

/** Writes every seed illustration into IndexedDB under its stable id. */
export async function seedImages(): Promise<void> {
  await Promise.all(
    Object.entries(SEED_IMAGES).map(([id, svg]) => putImage(svgToDataUrl(svg), id)),
  );
}
