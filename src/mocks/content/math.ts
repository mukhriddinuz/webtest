import { formula, formulaOptions, image, options, text, type TestSpec } from '../builders';

/** Algebra — formula heavy, every answer type represented. */
export const algebraTest = (): TestSpec => ({
  id: 't_algebra',
  authorId: 'u_teacher_1',
  type: 'standard',
  title: 'Algebra: kvadrat tenglamalar',
  description:
    'Kvadrat tenglamalar, diskriminant va Viyet teoremasi bo‘yicha asosiy bilimlarni tekshiradigan test.',
  subject: 'Matematika',
  coverImageId: 'img_cover_algebra',
  status: 'active',
  createdAgoDays: 12,
  settings: { durationMin: 20, attemptLimit: 2, showCorrectAnswers: true },
  questions: [
    {
      type: 'single',
      content: [text('Kvadrat tenglamaning umumiy ko‘rinishi qaysi?')],
      options: formulaOptions('*ax^2+bx+c=0', 'ax+b=0', 'ax^3+bx^2+c=0', '\\frac{a}{x}+b=0'),
      points: 1,
      explanation: [
        text('Kvadrat tenglamada eng yuqori daraja 2 ga teng va '),
        formula('a \\neq 0'),
        text(' shart bajarilishi kerak.'),
      ],
    },
    {
      type: 'single',
      content: [text('Quyidagi tenglamaning ildizlarini toping: '), formula('x^2-5x+6=0', true)],
      options: options('*2 va 3', '-2 va -3', '1 va 6', '-1 va -6'),
      points: 2,
      explanation: [formula('x_{1}+x_{2}=5,\\quad x_{1} \\cdot x_{2}=6', true)],
    },
    {
      type: 'single',
      content: [text('Diskriminant qanday hisoblanadi?')],
      options: formulaOptions('*D=b^2-4ac', 'D=b^2+4ac', 'D=4ac-b^2', 'D=\\sqrt{b^2-4ac}'),
      points: 1,
    },
    {
      type: 'numeric',
      content: [
        text('Quyidagi tenglamaning diskriminantini toping: '),
        formula('x^2-7x+12=0', true),
      ],
      numeric: { value: 1, tolerance: 0 },
      points: 2,
      explanation: [formula('D=(-7)^2-4\\cdot 1\\cdot 12=49-48=1', true)],
    },
    {
      type: 'multiple',
      content: [text('Quyidagilardan qaysilari kvadrat tenglama hisoblanadi?')],
      options: formulaOptions('*x^2+1=0', '*2x^2-3x=0', 'x^3-1=0', '5x-2=0'),
      points: 2,
    },
    {
      type: 'text',
      content: [
        text('Agar '),
        formula('D>0'),
        text(' bo‘lsa, kvadrat tenglama nechta haqiqiy ildizga ega?'),
      ],
      accepted: ['2', 'ikki', 'ikkita', 'ikkita ildiz'],
      points: 1,
    },
    {
      type: 'numeric',
      content: [text('Tenglamaning musbat ildizini toping: '), formula('2x^2-8=0', true)],
      numeric: { value: 2, tolerance: 0 },
      points: 2,
    },
    {
      type: 'single',
      content: [text('Viyet teoremasiga ko‘ra ildizlar yig‘indisi nimaga teng?')],
      options: formulaOptions(
        '*x_{1}+x_{2}=-\\frac{b}{a}',
        'x_{1}+x_{2}=\\frac{b}{a}',
        'x_{1}+x_{2}=\\frac{c}{a}',
        'x_{1}+x_{2}=-\\frac{c}{a}',
      ),
      points: 2,
    },
    {
      type: 'multiple',
      content: [text('Tenglamaning barcha ildizlarini tanlang: '), formula('x^2-4=0', true)],
      options: options('*2', '*-2', '4', '0'),
      points: 2,
    },
    {
      type: 'numeric',
      content: [text('Tenglamaning yagona ildizini toping: '), formula('x^2+6x+9=0', true)],
      numeric: { value: -3, tolerance: 0 },
      points: 2,
      explanation: [formula('(x+3)^2=0 \\Rightarrow x=-3', true)],
    },
  ],
});

/** Geometry olympiad — limited seats, image + formula content. */
export const geometryTest = (): TestSpec => ({
  id: 't_geometry',
  authorId: 'u_teacher_2',
  type: 'limited',
  title: 'Geometriya olimpiadasi',
  description:
    'Maktab bosqichi olimpiadasi uchun saralash testi. Joylar soni cheklangan, har bir ishtirokchi bir marta ishlaydi.',
  subject: 'Geometriya',
  coverImageId: 'img_cover_geometry',
  status: 'active',
  createdAgoDays: 5,
  settings: {
    durationMin: 30,
    participantLimit: 50,
    attemptLimit: 1,
    allowBack: false,
    antiCheat: true,
    penaltyPoints: 0.5,
    showResult: 'after_finish',
  },
  questions: [
    {
      type: 'single',
      content: [
        image('img_geo_triangle', 'ABC uchburchagi'),
        text('Uchburchak yuzasi qaysi formula bilan topiladi?'),
      ],
      options: formulaOptions('*S=\\frac{1}{2}ah', 'S=ah', 'S=\\frac{a+b+c}{2}', 'S=\\pi R^2'),
      points: 2,
    },
    {
      type: 'numeric',
      content: [
        text('To‘g‘ri burchakli uchburchakning katetlari 3 va 4 ga teng. Gipotenuzasini toping.'),
      ],
      numeric: { value: 5, tolerance: 0 },
      points: 2,
      explanation: [formula('c=\\sqrt{3^2+4^2}=\\sqrt{25}=5', true)],
    },
    {
      type: 'single',
      content: [image('img_geo_circle', 'Aylana va uning radiusi'), text('Aylana uzunligi:')],
      options: formulaOptions('*L=2\\pi R', 'L=\\pi R^2', 'L=\\pi D^2', 'L=\\frac{\\pi R}{2}'),
      points: 2,
    },
    {
      type: 'numeric',
      content: [
        text('Radiusi 5 ga teng doiraning yuzasini toping ('),
        formula('\\pi \\approx 3.14'),
        text(').'),
      ],
      numeric: { value: 78.5, tolerance: 0.5 },
      points: 3,
    },
    {
      type: 'text',
      content: [text('Uchburchak ichki burchaklari yig‘indisi necha gradusga teng? (faqat son)')],
      accepted: ['180', '180 gradus', '180gradus'],
      points: 1,
    },
    {
      type: 'multiple',
      content: [text('Pifagor teoremasi to‘g‘ri yozilgan variantlarni tanlang.')],
      options: formulaOptions('*c^2=a^2+b^2', '*a^2=c^2-b^2', 'c^2=a^2-b^2', 'c=a+b'),
      points: 3,
    },
    {
      type: 'single',
      content: [text('Kosinuslar teoremasi qaysi formula bilan ifodalanadi?')],
      options: formulaOptions(
        '*c^2=a^2+b^2-2ab\\cos C',
        'c^2=a^2+b^2+2ab\\cos C',
        '\\frac{a}{\\sin A}=\\frac{b}{\\sin B}',
        'S=\\frac{1}{2}ab\\sin C',
      ),
      points: 3,
    },
    {
      type: 'numeric',
      content: [text('Teng tomonli uchburchakning tomoni 6 ga teng. Perimetrini toping.')],
      numeric: { value: 18, tolerance: 0 },
      points: 2,
    },
    {
      type: 'text',
      content: [text('To‘g‘ri burchak necha gradusga teng? (faqat son)')],
      accepted: ['90', '90 gradus'],
      points: 1,
    },
  ],
});

/** Archived test from the previous school year, kept for its statistics. */
export const progressionsTest = (): TestSpec => ({
  id: 't_progressions',
  authorId: 'u_teacher_1',
  type: 'standard',
  title: 'Matematika: progressiyalar (2024)',
  description: 'O‘tgan o‘quv yilidagi yakuniy nazorat. Arxivga olingan.',
  subject: 'Matematika',
  status: 'archived',
  createdAgoDays: 150,
  settings: { durationMin: 25, attemptLimit: 1 },
  questions: [
    {
      type: 'single',
      content: [text('Arifmetik progressiyaning n-hadi formulasi:')],
      options: formulaOptions(
        '*a_{n}=a_{1}+(n-1)d',
        'a_{n}=a_{1} \\cdot q^{n-1}',
        'a_{n}=a_{1}+nd',
        'a_{n}=\\frac{a_{1}+a_{n}}{2}',
      ),
      points: 2,
    },
    {
      type: 'single',
      content: [text('Geometrik progressiyaning n-hadi formulasi:')],
      options: formulaOptions(
        '*b_{n}=b_{1} \\cdot q^{n-1}',
        'b_{n}=b_{1}+(n-1)q',
        'b_{n}=b_{1} \\cdot q^{n}',
        'b_{n}=\\frac{b_{1}}{q^{n}}',
      ),
      points: 2,
    },
    {
      type: 'numeric',
      content: [
        text('Arifmetik progressiyada '),
        formula('a_{1}=3'),
        text(', '),
        formula('d=4'),
        text('. '),
        formula('a_{5}'),
        text(' ni toping.'),
      ],
      numeric: { value: 19, tolerance: 0 },
      points: 3,
    },
    {
      type: 'numeric',
      content: [
        text('Geometrik progressiyada '),
        formula('b_{1}=2'),
        text(', '),
        formula('q=3'),
        text('. '),
        formula('b_{4}'),
        text(' ni toping.'),
      ],
      numeric: { value: 54, tolerance: 0 },
      points: 3,
    },
    {
      type: 'multiple',
      content: [text('Quyidagilardan qaysilari arifmetik progressiya?')],
      options: options('*2, 5, 8, 11', '*10, 7, 4, 1', '2, 4, 8, 16', '1, 1, 2, 3, 5'),
      points: 3,
    },
    {
      type: 'text',
      content: [text('Arifmetik progressiyaning ayirmasi qanday harf bilan belgilanadi?')],
      accepted: ['d'],
      points: 1,
    },
    {
      type: 'numeric',
      content: [text('1 dan 10 gacha bo‘lgan natural sonlar yig‘indisini toping.')],
      numeric: { value: 55, tolerance: 0 },
      points: 2,
    },
    {
      type: 'single',
      content: [text('Arifmetik progressiya yig‘indisi formulasi:')],
      options: formulaOptions(
        '*S_{n}=\\frac{a_{1}+a_{n}}{2} \\cdot n',
        'S_{n}=\\frac{a_{1} \\cdot a_{n}}{2}',
        'S_{n}=a_{1} \\cdot n',
        'S_{n}=\\frac{b_{1}(q^{n}-1)}{q-1}',
      ),
      points: 2,
    },
  ],
});
