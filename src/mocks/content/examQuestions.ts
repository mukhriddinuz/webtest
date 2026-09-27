/**
 * Question generators for the seeded exam variants.
 *
 * Every question here is written for this project. Real DTM and Milliy
 * sertifikat papers are somebody else's work, so none of them is copied: the
 * shape of the paper is reproduced, the content is our own.
 *
 * The numbers come out of the formula rather than out of a table, so a
 * template cannot drift away from its own answer key. Parameters are derived
 * from the question index, which keeps a variant identical on every device.
 */

import { formula, options as textOptions, text, type QuestionSpec } from '../builders';

/* --------------------------------- helpers -------------------------------- */

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Formats a number the way a pupil would write it: 2.5, not 2.50. */
const num = (value: number) => String(round2(value));

/**
 * Four options with the correct one among them. Wrong candidates that collide
 * with the answer (or with each other) are dropped, and the order is derived
 * from the question index so a variant looks the same every time.
 */
function choices(seed: number, correct: number, candidates: number[]): string[] {
  const seen = new Set([round2(correct)]);
  const wrong: number[] = [];
  for (const candidate of candidates) {
    const value = round2(candidate);
    if (seen.has(value) || !Number.isFinite(value)) continue;
    seen.add(value);
    wrong.push(value);
    if (wrong.length === 3) break;
  }
  // A template whose distractors all collided still needs a full set. The
  // filler keeps the shape of the answer: a fractional option next to three
  // whole numbers would give the question away.
  const whole = Number.isInteger(round2(correct)) && wrong.every(Number.isInteger);
  const step = whole ? Math.max(1, Math.round(Math.abs(correct) * 0.1)) : 0.5;
  let filler = 1;
  while (wrong.length < 3) {
    const value = round2(correct + filler * step);
    if (!seen.has(value)) {
      seen.add(value);
      wrong.push(value);
    }
    filler += 1;
  }

  const all = [`*${num(correct)}`, ...wrong.map(num)];
  const at = seed % 4;
  // Rotate rather than shuffle: the correct answer still lands in every slot.
  return [...all.slice(all.length - at), ...all.slice(0, all.length - at)];
}

/** Writes x² + bx + c = 0 the way a paper would: no "+ 0x", no "− 0". */
function quadratic(b: number, c: number): string {
  const term = (value: number, suffix: string) =>
    value === 0 ? '' : ` ${value > 0 ? '+' : '−'} ${Math.abs(value)}${suffix}`;
  return `x^2${term(b, 'x')}${term(c, '')} = 0`;
}

const single = (
  content: QuestionSpec['content'],
  seed: number,
  correct: number,
  candidates: number[],
): QuestionSpec => ({
  type: 'single',
  content,
  options: textOptions(...choices(seed, correct, candidates)),
});

const numeric = (content: QuestionSpec['content'], correct: number): QuestionSpec => ({
  type: 'numeric',
  content,
  numeric: { value: round2(correct), tolerance: 0.01 },
});

/* ------------------------------- mathematics ------------------------------ */

/** Each template turns an index into a question and its own answer. */
const MATH_TEMPLATES: ((k: number) => QuestionSpec)[] = [
  // Vieta: the paper asks for the sum of the roots of (x − p)(x − q) = 0.
  (k) => {
    const p = 2 + (k % 7);
    const q = -3 - (k % 5);
    const b = -(p + q);
    const c = p * q;
    return single(
      [text('Tenglama ildizlarining yigʻindisini toping:'), formula(quadratic(b, c), true)],
      k,
      p + q,
      [p * q, p - q, -(p + q)],
    );
  },

  // A linear equation with an integer root.
  (k) => {
    const a = 2 + (k % 6);
    const root = -4 + (k % 9);
    const b = 3 + (k % 11);
    const c = a * root + b;
    return single(
      [
        text('Tenglamani yeching:'),
        formula(`${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)} = ${c}`, true),
      ],
      k,
      root,
      [root + a, c / a, root - b],
    );
  },

  // Percentage of a round number.
  (k) => {
    const percent = [5, 12, 15, 20, 25, 40, 60, 75][k % 8] as number;
    const base = 80 + (k % 12) * 20;
    return single([text(`${base} sonining ${percent}% ini toping.`)], k, (base * percent) / 100, [
      (base * percent) / 1000,
      base - percent,
      (base * (100 - percent)) / 100,
    ]);
  },

  // Arithmetic progression.
  (k) => {
    const first = 3 + (k % 9);
    const step = 2 + (k % 6);
    const n = 8 + (k % 13);
    return single(
      [
        text(
          `Arifmetik progressiyaning birinchi hadi ${first}, ayirmasi ${step}. ${n}-hadini toping.`,
        ),
      ],
      k,
      first + (n - 1) * step,
      [first + n * step, first * step, first + (n - 1) * (step + 1)],
    );
  },

  // Geometric progression.
  (k) => {
    const first = 2 + (k % 4);
    const ratio = 2 + (k % 2);
    const n = 4 + (k % 4);
    return single(
      [
        text(
          `Geometrik progressiyaning birinchi hadi ${first}, maxraji ${ratio}. ${n}-hadini toping.`,
        ),
      ],
      k,
      first * ratio ** (n - 1),
      [first * ratio ** n, first * ratio * n, first + ratio ** (n - 1)],
    );
  },

  // Area of a triangle.
  (k) => {
    const base = 6 + (k % 15) * 2;
    const height = 4 + (k % 11);
    return single(
      [
        text(`Uchburchakning asosi ${base} sm, shu asosga tushirilgan balandligi ${height} sm.`),
        text('Uning yuzini (sm²) toping.'),
      ],
      k,
      (base * height) / 2,
      [base * height, base + height, (base * height) / 3],
    );
  },

  // Powers of two.
  (k) => {
    const exponent = 4 + (k % 7);
    return single(
      [text('Ifodaning qiymatini toping:'), formula(`2^{${exponent}}`, true)],
      k,
      2 ** exponent,
      [2 * exponent, 2 ** (exponent - 1), 2 ** exponent + 2],
    );
  },

  // Circumference of a circle, taking π as 3.14.
  (k) => {
    const radius = 3 + (k % 10);
    return single(
      [text(`Radiusi ${radius} sm boʻlgan aylananing uzunligini toping (π ≈ 3,14).`)],
      k,
      round2(2 * 3.14 * radius),
      [round2(3.14 * radius), round2(3.14 * radius * radius), round2(2 * radius)],
    );
  },
];

const MATH_NUMERIC_TEMPLATES: ((k: number) => QuestionSpec)[] = [
  (k) => {
    const a = 12 + (k % 17);
    const b = 5 + (k % 9);
    return numeric([text(`${a} va ${b} sonlarining koʻpaytmasini toping.`)], a * b);
  },
  (k) => {
    const side = 5 + (k % 14);
    return numeric(
      [text(`Tomoni ${side} sm boʻlgan kvadratning yuzini (sm²) toping.`)],
      side * side,
    );
  },
  (k) => {
    const total = 120 + (k % 9) * 30;
    const part = [10, 20, 25, 50][k % 4] as number;
    return numeric([text(`${total} sonining ${part}% i nechaga teng?`)], (total * part) / 100);
  },
  (k) => {
    const a = 3 + (k % 8);
    const b = 4 + (k % 6);
    return numeric(
      [
        text('Toʻgʻri burchakli uchburchakning katetlari ' + a + ' va ' + b + ' ga teng.'),
        text('Uning yuzini toping.'),
      ],
      (a * b) / 2,
    );
  },
  (k) => {
    const x = 2 + (k % 7);
    return numeric(
      [text('Ifodaning qiymatini toping:'), formula(`${x}^3 + ${x}^2`, true)],
      x ** 3 + x ** 2,
    );
  },
];

/* --------------------------------- physics -------------------------------- */

const G = 10;

const PHYSICS_TEMPLATES: ((k: number) => QuestionSpec)[] = [
  // Uniform motion.
  (k) => {
    const speed = 10 + (k % 16) * 5;
    const time = 2 + (k % 7);
    return single(
      [
        text(
          `Jism ${speed} m/s tezlik bilan ${time} s harakatlandi. Bosib oʻtgan yoʻlini (m) toping.`,
        ),
      ],
      k,
      speed * time,
      [speed / time, speed + time, speed * time * 2],
    );
  },

  // Acceleration.
  (k) => {
    const from = 4 + (k % 9);
    const to = from + 6 + (k % 13);
    const time = 2 + (k % 5);
    return single(
      [
        text(
          `Jismning tezligi ${time} s ichida ${from} m/s dan ${to} m/s gacha ortdi. Tezlanishini (m/s²) toping.`,
        ),
      ],
      k,
      round2((to - from) / time),
      [round2(to / time), round2((to + from) / time), to - from],
    );
  },

  // Newton's second law.
  (k) => {
    const mass = 2 + (k % 12);
    const acceleration = 2 + (k % 8);
    return single(
      [
        text(
          `Massasi ${mass} kg boʻlgan jismga ${acceleration} m/s² tezlanish berilgan. Kuchni (N) toping.`,
        ),
      ],
      k,
      mass * acceleration,
      [mass + acceleration, mass / acceleration, mass * G],
    );
  },

  // Weight.
  (k) => {
    const mass = 3 + (k % 15);
    return single(
      [text(`Massasi ${mass} kg boʻlgan jismning ogʻirligini (N) toping. g = 10 m/s².`)],
      k,
      mass * G,
      [mass, mass / G, mass * G * 2],
    );
  },

  // Pressure.
  (k) => {
    const force = 100 + (k % 10) * 50;
    const area = [2, 4, 5, 10][k % 4] as number;
    return single(
      [text(`Yuza ${area} m² ga ${force} N kuch taʼsir qilmoqda. Bosimni (Pa) toping.`)],
      k,
      force / area,
      [force * area, force - area, force / (area * 2)],
    );
  },

  // Work.
  (k) => {
    const force = 20 + (k % 9) * 10;
    const distance = 3 + (k % 8);
    return single(
      [
        text(
          `${force} N kuch jismni ${distance} m masofaga siljitdi. Bajarilgan ishni (J) toping.`,
        ),
      ],
      k,
      force * distance,
      [force / distance, force + distance, (force * distance) / 2],
    );
  },

  // Kinetic energy.
  (k) => {
    const mass = 2 + (k % 8);
    const speed = 2 + (k % 6);
    return single(
      [
        text(
          `Massasi ${mass} kg boʻlgan jism ${speed} m/s tezlik bilan harakatlanmoqda. Kinetik energiyasini (J) toping.`,
        ),
      ],
      k,
      (mass * speed * speed) / 2,
      [mass * speed, (mass * speed) / 2, mass * speed * speed],
    );
  },

  // Potential energy.
  (k) => {
    const mass = 2 + (k % 9);
    const height = 3 + (k % 12);
    return single(
      [
        text(
          `Massasi ${mass} kg boʻlgan jism ${height} m balandlikda turibdi. Potensial energiyasini (J) toping. g = 10 m/s².`,
        ),
      ],
      k,
      mass * G * height,
      [mass * height, mass * G, (mass * G * height) / 2],
    );
  },

  // Density.
  (k) => {
    const volume = [2, 4, 5, 10][k % 4] as number;
    const density = 800 + (k % 8) * 100;
    const mass = volume * density;
    return single(
      [text(`Hajmi ${volume} m³ boʻlgan jismning massasi ${mass} kg. Zichligini (kg/m³) toping.`)],
      k,
      density,
      [mass * volume, mass + volume, density / 2],
    );
  },

  // Ohm's law.
  (k) => {
    const resistance = 2 + (k % 10);
    const current = 2 + (k % 6);
    const voltage = resistance * current;
    return single(
      [
        text(
          `Qarshiligi ${resistance} Ω boʻlgan oʻtkazgichdagi kuchlanish ${voltage} V. Tok kuchini (A) toping.`,
        ),
      ],
      k,
      current,
      [voltage * resistance, voltage + resistance, voltage / (resistance * 2)],
    );
  },
];

/* ----------------------------- humanities sets ---------------------------- */

/** Native language: grammar and literature a school leaver is expected to know. */
const NATIVE_LANGUAGE: QuestionSpec[] = [
  {
    type: 'single',
    content: [text('“Oʻtkan kunlar” romani muallifi kim?')],
    options: textOptions('*Abdulla Qodiriy', 'Choʻlpon', 'Oybek', 'Abdulla Qahhor'),
  },
  {
    type: 'single',
    content: [text('Qaysi qatorda soʻz tarkibi toʻgʻri ajratilgan?')],
    options: textOptions('*kitob-lar-im-da', 'kitobl-ar-imda', 'kito-blar-imda', 'kitobla-rim-da'),
  },
  {
    type: 'single',
    content: [text('“Baxtiyor” soʻzining maʼnodoshini toping.')],
    options: textOptions('*Saodatmand', 'Gʻamgin', 'Beparvo', 'Sabrli'),
  },
  {
    type: 'single',
    content: [text('Qaysi gapda ega va kesim mos kelgan?')],
    options: textOptions(
      '*Bolalar maktabga bordilar.',
      'Bolalar maktabga bordi edim.',
      'Bolalar maktabga borasan.',
      'Bolalar maktabga borgansiz.',
    ),
  },
  {
    type: 'single',
    content: [text('Alisher Navoiyning “Xamsa” asariga kirmagan dostonni toping.')],
    options: textOptions(
      '*Lison ut-tayr',
      'Farhod va Shirin',
      'Layli va Majnun',
      'Saddi Iskandariy',
    ),
  },
  {
    type: 'single',
    content: [text('Qaysi soʻzda unli tovush koʻp?')],
    options: textOptions('*Oilaviy', 'Kitob', 'Daftar', 'Qalam'),
  },
  {
    type: 'single',
    content: [text('“Oʻzbek tilining izohli lugʻati” nimani izohlaydi?')],
    options: textOptions(
      '*Soʻzlarning maʼnosini',
      'Soʻzlarning kelib chiqishini',
      'Soʻzlarning talaffuzini',
      'Soʻzlarning yozilishini',
    ),
  },
  {
    type: 'single',
    content: [text('Qaysi qatordagi soʻzlar qoʻshma soʻz?')],
    options: textOptions(
      '*Beshbarmoq, otboqar',
      'Kitoblar, daftarlar',
      'Yozdi, keldi',
      'Yaxshi, chiroyli',
    ),
  },
  {
    type: 'single',
    content: [text('Ergash gapli qoʻshma gapni toping.')],
    options: textOptions(
      '*Kim tirishsa, u yutadi.',
      'Kun issiq, havo tiniq.',
      'Bahor keldi.',
      'U kitob oʻqidi va uxladi.',
    ),
  },
  {
    type: 'single',
    content: [text('“Sadoqat” soʻzining zid maʼnolisini toping.')],
    options: textOptions('*Xiyonat', 'Mehr', 'Samimiyat', 'Vafo'),
  },
];

/** History: dates and facts taught in the school syllabus. */
const HISTORY: QuestionSpec[] = [
  {
    type: 'single',
    content: [text('Oʻzbekiston Respublikasi mustaqilligi qachon eʼlon qilingan?')],
    options: textOptions(
      '*1991-yil 31-avgust',
      '1991-yil 1-sentabr',
      '1990-yil 20-iyun',
      '1992-yil 8-dekabr',
    ),
  },
  {
    type: 'single',
    content: [text('Oʻzbekiston Respublikasi Konstitutsiyasi qachon qabul qilingan?')],
    options: textOptions(
      '*1992-yil 8-dekabr',
      '1991-yil 31-avgust',
      '1993-yil 8-dekabr',
      '1995-yil 1-may',
    ),
  },
  {
    type: 'single',
    content: [text('Amir Temur davlatining poytaxti qaysi shahar edi?')],
    options: textOptions('*Samarqand', 'Buxoro', 'Shahrisabz', 'Toshkent'),
  },
  {
    type: 'single',
    content: [text('Mirzo Ulugʻbek rasadxonasi qaysi shaharda qurilgan?')],
    options: textOptions('*Samarqandda', 'Buxoroda', 'Xivada', 'Qoʻqonda'),
  },
  {
    type: 'single',
    content: [text('“Zij” asarining muallifi kim?')],
    options: textOptions('*Mirzo Ulugʻbek', 'Al-Xorazmiy', 'Abu Rayhon Beruniy', 'Ibn Sino'),
  },
  {
    type: 'single',
    content: [text('Zahiriddin Muhammad Bobur qaysi davlatga asos solgan?')],
    options: textOptions(
      '*Boburiylar saltanatiga',
      'Shayboniylar davlatiga',
      'Temuriylar davlatiga',
      'Qoraxoniylar davlatiga',
    ),
  },
  {
    type: 'single',
    content: [text('“Al-jabr va al-muqobala” asari kimga tegishli?')],
    options: textOptions('*Al-Xorazmiyga', 'Al-Fargʻoniyga', 'Ibn Sinoga', 'Beruniyga'),
  },
  {
    type: 'single',
    content: [text('Oʻzbekiston Respublikasi Davlat bayrogʻi qachon tasdiqlangan?')],
    options: textOptions(
      '*1991-yil 18-noyabr',
      '1991-yil 31-avgust',
      '1992-yil 8-dekabr',
      '1992-yil 2-iyul',
    ),
  },
  {
    type: 'single',
    content: [text('Buyuk ipak yoʻli asosan qaysi ikki mintaqani bogʻlagan?')],
    options: textOptions(
      '*Sharq va Gʻarbni',
      'Shimol va Janubni',
      'Yevropa va Afrikani',
      'Hindiston va Xitoyni',
    ),
  },
  {
    type: 'single',
    content: [text('Xiva xonligi qaysi hududda tashkil topgan?')],
    options: textOptions('*Xorazmda', 'Fargʻona vodiysida', 'Zarafshon vohasida', 'Qashqadaryoda'),
  },
];

/* --------------------------------- builders ------------------------------- */

/** Cycles the templates so a run of questions never repeats a shape twice. */
function fromTemplates(
  templates: ((k: number) => QuestionSpec)[],
  count: number,
  section: string,
  offset = 0,
): QuestionSpec[] {
  return Array.from({ length: count }, (_, index) => {
    const k = offset + index;
    const template = templates[k % templates.length] as (k: number) => QuestionSpec;
    return { ...template(Math.floor(k / templates.length) + k), section };
  });
}

const withSection = (specs: QuestionSpec[], section: string): QuestionSpec[] =>
  specs.map((spec) => ({ ...spec, section }));

export const examQuestionSets = {
  nativeLanguage: (section: string) => withSection(NATIVE_LANGUAGE, section),
  history: (section: string) => withSection(HISTORY, section),
  math: (count: number, section: string, offset = 0) =>
    fromTemplates(MATH_TEMPLATES, count, section, offset),
  mathNumeric: (count: number, section: string, offset = 0) =>
    fromTemplates(MATH_NUMERIC_TEMPLATES, count, section, offset),
  physics: (count: number, section: string, offset = 0) =>
    fromTemplates(PHYSICS_TEMPLATES, count, section, offset),
};
