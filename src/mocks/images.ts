import { putImage, svgToDataUrl } from '@/lib/imageStore';

/**
 * All seed artwork is inline SVG — no external requests, and it stays crisp in
 * both themes because it paints its own light background.
 */
const FRAME = (body: string, width = 360, height = 220) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#FFFFFF"/>
    <g fill="none" stroke="#1F2433" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
       font-family="Inter, sans-serif" font-size="13">
      ${body}
    </g>
  </svg>`;

const LABEL = (x: number, y: number, text: string, anchor = 'middle') =>
  `<text x="${x}" y="${y}" fill="#1F2433" stroke="none" text-anchor="${anchor}">${text}</text>`;

/* --------------------------- physics illustrations ------------------------ */

const velocityGraph = FRAME(`
  <path d="M40 180 L330 180" stroke="#6B7080"/>
  <path d="M40 180 L40 30" stroke="#6B7080"/>
  <path d="M40 180 L160 90 L280 90" stroke="#2B4C8C" stroke-width="2.4"/>
  <circle cx="160" cy="90" r="3.5" fill="#2B4C8C" stroke="none"/>
  <path d="M40 90 L160 90" stroke="#E6E1D6" stroke-dasharray="4 4"/>
  ${LABEL(24, 95, 'v', 'middle')}
  ${LABEL(335, 196, 't', 'middle')}
  ${LABEL(100, 200, '0-4 s', 'middle')}
  ${LABEL(220, 200, '4-8 s', 'middle')}
  ${LABEL(180, 40, 'v-t grafigi', 'middle')}
`);

const inclinedPlane = FRAME(`
  <path d="M40 180 L300 180 L300 70 Z" stroke="#2B4C8C" stroke-width="2.2"/>
  <rect x="200" y="96" width="34" height="24" rx="4" transform="rotate(-23 217 108)" fill="#E8EEF8" stroke="#2B4C8C"/>
  <path d="M300 180 L300 150" stroke="#6B7080" stroke-dasharray="4 4"/>
  <path d="M70 180 A 40 40 0 0 0 78 160" stroke="#C4473A"/>
  ${LABEL(92, 174, 'a', 'middle')}
  ${LABEL(232, 88, 'm', 'middle')}
  ${LABEL(170, 200, 'Qiya tekislik', 'middle')}
`);

const pulley = FRAME(`
  <circle cx="180" cy="60" r="26" stroke="#2B4C8C" stroke-width="2.2"/>
  <circle cx="180" cy="60" r="4" fill="#2B4C8C" stroke="none"/>
  <path d="M154 60 L154 150" stroke="#6B7080"/>
  <path d="M206 60 L206 120" stroke="#6B7080"/>
  <rect x="134" y="150" width="40" height="30" rx="4" fill="#E8EEF8" stroke="#2B4C8C"/>
  <rect x="186" y="120" width="40" height="30" rx="4" fill="#FBF1DA" stroke="#E0A526"/>
  ${LABEL(154, 170, 'm1')}
  ${LABEL(206, 140, 'm2')}
`);

/* -------------------------- geometry illustrations ------------------------ */

const triangle = FRAME(`
  <path d="M60 180 L300 180 L120 50 Z" stroke="#2B4C8C" stroke-width="2.2"/>
  <path d="M60 180 L60 164 L76 164" stroke="#C4473A"/>
  <path d="M96 180 A 36 36 0 0 0 92 158" stroke="#E0A526"/>
  ${LABEL(52, 194, 'A', 'middle')}
  ${LABEL(306, 194, 'C', 'middle')}
  ${LABEL(114, 42, 'B', 'middle')}
  ${LABEL(180, 196, 'b', 'middle')}
  ${LABEL(78, 110, 'c', 'middle')}
  ${LABEL(220, 108, 'a', 'middle')}
`);

const circleGeometry = FRAME(`
  <circle cx="180" cy="110" r="72" stroke="#2B4C8C" stroke-width="2.2"/>
  <circle cx="180" cy="110" r="3.5" fill="#2B4C8C" stroke="none"/>
  <path d="M180 110 L252 110" stroke="#E0A526" stroke-width="2.2"/>
  <path d="M108 110 L252 110" stroke="#6B7080" stroke-dasharray="5 4"/>
  <path d="M180 110 L231 59" stroke="#2F8F5B" stroke-width="2.2"/>
  ${LABEL(216, 102, 'R', 'middle')}
  ${LABEL(180, 200, 'Aylana', 'middle')}
  ${LABEL(214, 74, 'r', 'middle')}
`);

/* ------------------------------- test covers ------------------------------ */

const cover = (title: string, accent: string, soft: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <rect width="240" height="240" fill="${soft}"/>
    <circle cx="200" cy="44" r="72" fill="${accent}" opacity="0.18"/>
    <circle cx="40" cy="210" r="56" fill="${accent}" opacity="0.14"/>
    <text x="120" y="130" text-anchor="middle" font-family="Georgia, serif" font-size="64"
          font-weight="600" fill="${accent}">${title}</text>
  </svg>`;

export const SEED_IMAGES: Record<string, string> = {
  img_phys_graph: velocityGraph,
  img_phys_incline: inclinedPlane,
  img_phys_pulley: pulley,
  img_geo_triangle: triangle,
  img_geo_circle: circleGeometry,
  img_cover_algebra: cover('ax²', '#2B4C8C', '#E8EEF8'),
  img_cover_physics: cover('F=ma', '#E0A526', '#FBF1DA'),
  img_cover_english: cover('EN', '#3E7CB1', '#E8EEF8'),
  img_cover_geometry: cover('△', '#2F8F5B', '#E3F3EA'),
  img_cover_history: cover('XIV', '#C4473A', '#F9E5E2'),
  img_cover_chemistry: cover('H₂O', '#2B4C8C', '#E8EEF8'),
};

/** Writes every seed illustration into IndexedDB under its stable id. */
export async function seedImages(): Promise<void> {
  await Promise.all(
    Object.entries(SEED_IMAGES).map(([id, svg]) => putImage(svgToDataUrl(svg), id)),
  );
}
