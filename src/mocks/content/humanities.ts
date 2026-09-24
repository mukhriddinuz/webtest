import { options, text, type TestSpec } from '../builders';

/** English — mostly free-text answers, to exercise answer normalisation. */
export const englishTest = (): TestSpec => ({
  id: 't_english',
  authorId: 'u_teacher_1',
  type: 'standard',
  title: 'Ingliz tili: Present Perfect',
  description: 'Present Perfect zamonini qo‘llash bo‘yicha amaliy test.',
  subject: 'Ingliz tili',
  coverImageId: 'img_cover_english',
  status: 'active',
  createdAgoDays: 20,
  settings: { durationMin: 15, attemptLimit: 3, showCorrectAnswers: true },
  questions: [
    {
      type: 'text',
      content: [text('Bo‘sh joyni to‘ldiring: I ___ never been to London.')],
      accepted: ['have', 'have.'],
      points: 1,
    },
    {
      type: 'text',
      content: [text('Bo‘sh joyni to‘ldiring: She ___ already finished her homework.')],
      accepted: ['has'],
      points: 1,
    },
    {
      type: 'single',
      content: [text('Qaysi gap Present Perfect zamonida yozilgan?')],
      options: options(
        '*They have visited Samarkand twice.',
        'They visited Samarkand last year.',
        'They are visiting Samarkand now.',
        'They will visit Samarkand tomorrow.',
      ),
      points: 2,
    },
    {
      type: 'text',
      content: [text('“go” fe’lining uchinchi shaklini (Past Participle) yozing.')],
      accepted: ['gone'],
      points: 1,
    },
    {
      type: 'text',
      content: [text('“write” fe’lining uchinchi shaklini yozing.')],
      accepted: ['written'],
      points: 1,
    },
    {
      type: 'multiple',
      content: [text('Present Perfect bilan ishlatiladigan so‘zlarni tanlang.')],
      options: options('*already', '*yet', 'yesterday', 'last week'),
      points: 2,
    },
    {
      type: 'single',
      content: [text('Present Perfect qanday tuziladi?')],
      options: options('*have/has + V3', 'will + V1', 'was/were + V-ing', 'do/does + V1'),
      points: 2,
    },
    {
      type: 'text',
      content: [text('Tarjima qiling: “Men bu kitobni o‘qib chiqdim.” (inglizcha)')],
      accepted: ['I have read this book', 'I have read this book.', "I've read this book"],
      points: 3,
    },
    {
      type: 'single',
      content: [text('Which sentence is correct?')],
      options: options(
        '*I have lived here since 2019.',
        'I have lived here for 2019.',
        'I live here since 2019.',
        'I am living here since 2019.',
      ),
      points: 2,
    },
    {
      type: 'text',
      content: [text('“see” fe’lining uchinchi shaklini yozing.')],
      accepted: ['seen'],
      points: 1,
    },
  ],
});

/** Live quiz — each question carries its own timer. */
export const historyTest = (): TestSpec => ({
  id: 't_history',
  authorId: 'u_teacher_1',
  type: 'live',
  title: 'Tarix: Amir Temur davri',
  description:
    'Sinfda birgalikda o‘tkaziladigan jonli test. Har bir savolga 20 soniya vaqt beriladi.',
  subject: 'Tarix',
  coverImageId: 'img_cover_history',
  status: 'active',
  createdAgoDays: 2,
  settings: { durationMin: null, attemptLimit: 1, speedBonus: 0.5, showCorrectAnswers: true },
  questions: [
    {
      type: 'single',
      content: [text('Amir Temur qaysi yilda tug‘ilgan?')],
      options: options('*1336', '1370', '1405', '1312'),
      points: 100,
      timeLimitSec: 20,
    },
    {
      type: 'single',
      content: [text('Amir Temur davlatining poytaxti qaysi shahar edi?')],
      options: options('*Samarqand', 'Buxoro', 'Shahrisabz', 'Toshkent'),
      points: 100,
      timeLimitSec: 20,
    },
    {
      type: 'single',
      content: [text('Amir Temur qaysi shaharda tug‘ilgan?')],
      options: options('*Shahrisabz (Kesh)', 'Samarqand', 'Termiz', 'Xiva'),
      points: 100,
      timeLimitSec: 20,
    },
    {
      type: 'single',
      content: [text('“Temur tuzuklari” nima haqida?')],
      options: options(
        '*Davlat boshqaruvi qoidalari',
        'She’riy to‘plam',
        'Tibbiyot kitobi',
        'Astronomiya jadvallari',
      ),
      points: 100,
      timeLimitSec: 25,
    },
    {
      type: 'single',
      content: [text('Amir Temur qaysi yilda vafot etgan?')],
      options: options('*1405', '1399', '1410', '1420'),
      points: 100,
      timeLimitSec: 20,
    },
    {
      type: 'single',
      content: [text('Ulug‘bek Amir Temurga kim bo‘lgan?')],
      options: options('*Nabirasi', 'O‘g‘li', 'Akasi', 'Ustozi'),
      points: 100,
      timeLimitSec: 20,
    },
    {
      type: 'single',
      content: [text('Amir Temur qurdirgan mashhur masjid nomi?')],
      options: options('*Bibixonim', 'Kalon', 'Juma', 'Poi Kalon'),
      points: 100,
      timeLimitSec: 20,
    },
    {
      type: 'single',
      content: [text('1402-yilgi Anqara jangida Amir Temur kimni yengdi?')],
      options: options('*Boyazid I', 'To‘xtamish', 'Mahmud G‘aznaviy', 'Chingizxon'),
      points: 100,
      timeLimitSec: 25,
    },
    {
      type: 'single',
      content: [text('Amir Temur saltanatining rasmiy tili nima edi?')],
      options: options('*Turkiy va forsiy', 'Arabcha', 'Mo‘g‘ulcha', 'Xitoycha'),
      points: 100,
      timeLimitSec: 20,
    },
    {
      type: 'single',
      content: [text('Amir Temur maqbarasi qanday ataladi?')],
      options: options('*Go‘ri Amir', 'Shohi Zinda', 'Registon', 'Ark'),
      points: 100,
      timeLimitSec: 20,
    },
  ],
});

/** Contest that is running right now — the home screen shows a live countdown. */
export const midtermContest = (now: number): TestSpec => ({
  id: 't_midterm',
  authorId: 'u_teacher_2',
  type: 'contest',
  title: 'Matematika: oraliq nazorat',
  description: 'Hozir davom etmoqda. Belgilangan vaqt tugagach test yopiladi.',
  subject: 'Matematika',
  status: 'active',
  createdAgoDays: 4,
  settings: {
    durationMin: 20,
    startsAt: new Date(now - 30 * 60_000).toISOString(),
    endsAt: new Date(now + 90 * 60_000).toISOString(),
    attemptLimit: 1,
    access: 'password',
    password: '2024',
    shuffleQuestions: true,
    showResult: 'after_finish',
  },
  questions: [
    {
      type: 'numeric',
      content: [text('12 ning 25% i nechaga teng?')],
      numeric: { value: 3, tolerance: 0 },
      points: 2,
    },
    {
      type: 'single',
      content: [text('7 va 9 sonlarining eng kichik umumiy karralisi (EKUK):')],
      options: options('*63', '16', '72', '21'),
      points: 2,
    },
    {
      type: 'numeric',
      content: [text('144 sonining kvadrat ildizini toping.')],
      numeric: { value: 12, tolerance: 0 },
      points: 2,
    },
    {
      type: 'multiple',
      content: [text('Quyidagilardan qaysilari tub son?')],
      options: options('*13', '*17', '21', '27'),
      points: 3,
    },
    {
      type: 'text',
      content: [text('Uchburchakning uchta tomoni yig‘indisi qanday ataladi?')],
      accepted: ['perimetr', 'Perimetr'],
      points: 1,
    },
    {
      type: 'numeric',
      content: [text('Agar 3x = 21 bo‘lsa, x nechaga teng?')],
      numeric: { value: 7, tolerance: 0 },
      points: 2,
    },
    {
      type: 'single',
      content: [text('0,25 kasr sonining oddiy kasr ko‘rinishi:')],
      options: options('*1/4', '1/2', '2/5', '3/4'),
      points: 2,
    },
    {
      type: 'numeric',
      content: [text('Tomoni 7 ga teng kvadratning yuzasini toping.')],
      numeric: { value: 49, tolerance: 0 },
      points: 2,
    },
  ],
});

/**
 * A contest whose window has already closed, so the seed also carries the
 * "finished" card state. It reuses the mid-term questions on purpose — the
 * point here is the lifecycle, not new content.
 */
export const closedContest = (now: number): TestSpec => {
  const base = midtermContest(now);
  const start = now - 9 * 86400_000;
  return {
    ...base,
    id: 't_olympiad',
    title: 'Matematika olimpiadasi — yakuniy bosqich',
    description: 'Musobaqa yakunlandi. Natijalar va savollar tahlili boshqaruv panelida.',
    createdAgoDays: 12,
    settings: {
      durationMin: 30,
      startsAt: new Date(start).toISOString(),
      endsAt: new Date(start + 2 * 3600_000).toISOString(),
      attemptLimit: 1,
      access: 'open',
      shuffleQuestions: true,
      showResult: 'after_finish',
    },
  };
};
