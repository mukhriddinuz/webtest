import { formula, formulaOptions, image, options, text, type TestSpec } from '../builders';

/** Contest that opens in two hours — exercises the countdown and scheduling. */
export const physicsTest = (now: number): TestSpec => ({
  id: 't_physics',
  authorId: 'u_teacher_2',
  type: 'contest',
  title: 'Fizika: mexanika asoslari',
  description:
    'Tezlik, tezlanish va Nyuton qonunlari bo‘yicha musobaqa. Belgilangan vaqtda boshlanadi.',
  subject: 'Fizika',
  coverImageId: 'img_cover_physics',
  status: 'scheduled',
  createdAgoDays: 3,
  settings: {
    durationMin: 25,
    startsAt: new Date(now + 2 * 3600_000).toISOString(),
    endsAt: new Date(now + 4 * 3600_000).toISOString(),
    attemptLimit: 1,
    shuffleQuestions: true,
    shuffleOptions: true,
    antiCheat: true,
    showResult: 'after_finish',
    requiredChannels: [{ id: 'ch_physics', title: 'Fizika olami', username: 'fizika_olami' }],
  },
  questions: [
    {
      type: 'single',
      content: [
        image('img_phys_graph', 'Jismning v-t grafigi'),
        text('Grafikka ko‘ra jism 0-4 s oralig‘ida qanday harakat qiladi?'),
      ],
      options: options(
        '*Tekis tezlanuvchan',
        'Tekis sekinlanuvchan',
        'Tinch holatda',
        'Tekis (o‘zgarmas tezlikda)',
      ),
      points: 3,
    },
    {
      type: 'single',
      content: [text('Nyutonning ikkinchi qonuni:')],
      options: formulaOptions('*F=ma', 'F=\\frac{m}{a}', 'F=mgh', 'F=\\frac{mv^2}{2}'),
      points: 2,
    },
    {
      type: 'numeric',
      content: [
        text('Massasi 2 kg bo‘lgan jismga 10 N kuch ta’sir qilmoqda. Tezlanishini toping ('),
        formula('\\text{m/s}^2'),
        text(').'),
      ],
      numeric: { value: 5, tolerance: 0 },
      points: 3,
      explanation: [formula('a=\\frac{F}{m}=\\frac{10}{2}=5', true)],
    },
    {
      type: 'single',
      content: [
        image('img_phys_incline', 'Qiya tekislikdagi jism'),
        text('Qiya tekislikda jismga qaysi kuch harakat yo‘nalishida ta’sir qiladi?'),
      ],
      options: options(
        '*Og‘irlik kuchining tekislikka parallel tashkil etuvchisi',
        'Normal reaksiya kuchi',
        'Arximed kuchi',
        'Markazga intilma kuch',
      ),
      points: 3,
    },
    {
      type: 'multiple',
      content: [text('Quyidagilardan qaysilari vektor kattalik?')],
      options: options('*Tezlik', '*Kuch', 'Massa', 'Vaqt'),
      points: 3,
    },
    {
      type: 'numeric',
      content: [
        image('img_phys_pulley', 'Blok orqali bog‘langan jismlar'),
        text('Erkin tushish tezlanishi necha m/s² ga teng? (yaxlitlangan qiymat)'),
      ],
      numeric: { value: 9.8, tolerance: 0.2 },
      points: 2,
    },
    {
      type: 'text',
      content: [text('Kuch qaysi birlikda o‘lchanadi? (qisqa yozuv)')],
      accepted: ['N', 'Nyuton', 'nyuton'],
      points: 1,
    },
    {
      type: 'single',
      content: [text('Kinetik energiya formulasi:')],
      options: formulaOptions(
        '*E_{k}=\\frac{mv^2}{2}',
        'E_{k}=mgh',
        'E_{k}=\\frac{kx^2}{2}',
        'E_{k}=mv',
      ),
      points: 2,
    },
  ],
});

/** Chemistry — numeric answers and chemical formulas. */
export const chemistryTest = (): TestSpec => ({
  id: 't_chemistry',
  authorId: 'u_teacher_2',
  type: 'standard',
  title: 'Kimyo: moddalar formulasi',
  description: 'Molekulyar massa, valentlik va oddiy hisob-kitoblar.',
  subject: 'Kimyo',
  coverImageId: 'img_cover_chemistry',
  status: 'active',
  createdAgoDays: 8,
  settings: { durationMin: 15, attemptLimit: 3, penaltyPoints: 0 },
  questions: [
    {
      type: 'single',
      content: [text('Sulfat kislotaning formulasi qaysi?')],
      options: formulaOptions('*H_2SO_4', 'HNO_3', 'H_2CO_3', 'HCl'),
      points: 1,
    },
    {
      type: 'numeric',
      content: [text('Suvning ('), formula('H_2O'), text(') molekulyar massasini toping.')],
      numeric: { value: 18, tolerance: 0.5 },
      points: 2,
      explanation: [formula('M=2 \\cdot 1 + 16 = 18\\ \\text{g/mol}', true)],
    },
    {
      type: 'numeric',
      content: [text('Kislorod atomining nisbiy atom massasi nechaga teng?')],
      numeric: { value: 16, tolerance: 0 },
      points: 1,
    },
    {
      type: 'multiple',
      content: [text('Quyidagilardan qaysilari kislota hisoblanadi?')],
      options: formulaOptions('*HCl', '*H_2SO_4', 'NaOH', 'NaCl'),
      points: 2,
    },
    {
      type: 'text',
      content: [text('Natriy elementining kimyoviy belgisi qanday yoziladi?')],
      accepted: ['Na'],
      points: 1,
    },
    {
      type: 'numeric',
      content: [
        text('Karbonat angidrid ('),
        formula('CO_2'),
        text(') ning molekulyar massasini toping.'),
      ],
      numeric: { value: 44, tolerance: 0.5 },
      points: 2,
    },
    {
      type: 'single',
      content: [text('Osh tuzining kimyoviy formulasi:')],
      options: formulaOptions('*NaCl', 'KCl', 'CaCO_3', 'NaOH'),
      points: 1,
    },
    {
      type: 'numeric',
      content: [text('Vodorod atomining nisbiy atom massasi nechaga teng?')],
      numeric: { value: 1, tolerance: 0 },
      points: 1,
    },
  ],
});

/** Draft in progress — shows the unpublished state on the home screen. */
export const biologyDraft = (): TestSpec => ({
  id: 't_biology_draft',
  authorId: 'u_teacher_1',
  type: 'standard',
  title: 'Biologiya: hujayra tuzilishi',
  description: 'Hozircha tayyorlanmoqda.',
  subject: 'Biologiya',
  status: 'draft',
  createdAgoDays: 1,
  settings: { durationMin: 15 },
  questions: [
    {
      type: 'single',
      content: [text('Hujayraning energiya markazi qaysi organoid hisoblanadi?')],
      options: options('*Mitoxondriya', 'Ribosoma', 'Yadro', 'Lizosoma'),
      points: 1,
    },
    {
      type: 'multiple',
      content: [text('Quyidagilardan qaysilari o‘simlik hujayrasida bo‘ladi?')],
      options: options('*Hujayra devori', '*Xloroplast', 'Sentriola', 'Hivchin'),
      points: 2,
    },
    {
      type: 'text',
      content: [text('Irsiy axborot saqlanadigan organoid nomi?')],
      accepted: ['yadro', 'Yadro'],
      points: 1,
    },
  ],
});
