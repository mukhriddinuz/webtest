import type { TestSettings } from '@/services/types';
import type { QuestionSpec, TestSpec } from '../builders';
import { bankQuestions } from './banks';
import { dtmVariant, milliyExam, milliyMathVariant } from './exams';
import { examQuestionSets } from './examQuestions';

/**
 * The bulk of the demo catalogue: dozens of tests from eight teachers, in
 * every type and every state a card can show. Each entry says how many
 * finished attempts it should carry; contests that have not opened yet carry
 * registrations instead.
 */
export interface CatalogEntry {
  spec: TestSpec;
  attempts?: { count: number; mean?: number; spreadDays?: number };
  /** Sign-ups for a contest that has not started. */
  registrations?: number;
}

const HOUR = 3600_000;
const DAY = 24 * HOUR;

const noSection = (specs: QuestionSpec[]): QuestionSpec[] =>
  specs.map((spec) => ({ ...spec, section: undefined }));

const math = (count: number, offset = 0) => noSection(examQuestionSets.math(count, '', offset));
const numeric = (count: number, offset = 0) =>
  noSection(examQuestionSets.mathNumeric(count, '', offset));
const physics = (count: number, offset = 0) =>
  noSection(examQuestionSets.physics(count, '', offset));
const timed = (specs: QuestionSpec[], seconds = 20): QuestionSpec[] =>
  specs.map((spec) => ({ ...spec, timeLimitSec: seconds }));

interface Make {
  id: string;
  author: string;
  title: string;
  description: string;
  subject: string;
  cover?: string;
  ago: number;
  questions: QuestionSpec[];
  settings?: Partial<TestSettings>;
  status?: TestSpec['status'];
  type?: TestSpec['type'];
}

const make = (input: Make): TestSpec => ({
  id: input.id,
  authorId: input.author,
  type: input.type ?? 'standard',
  title: input.title,
  description: input.description,
  subject: input.subject,
  coverImageId: input.cover ? `img_cover_${input.cover}` : undefined,
  status: input.status ?? 'active',
  createdAgoDays: input.ago,
  settings: input.settings,
  questions: input.questions,
});

export function buildCatalog(now: number): CatalogEntry[] {
  const contest = (
    input: Make,
    startOffsetMs: number,
    lengthMs: number,
    extra: Partial<TestSettings> = {},
  ): TestSpec =>
    make({
      ...input,
      type: 'contest',
      status: 'scheduled',
      settings: {
        startsAt: new Date(now + startOffsetMs).toISOString(),
        endsAt: new Date(now + startOffsetMs + lengthMs).toISOString(),
        shuffleQuestions: true,
        shuffleOptions: true,
        showResult: 'after_finish',
        ...extra,
        ...input.settings,
      },
    });

  const channel = (id: string, title: string, username: string) => [{ id, title, username }];

  return [
    /* ------------------------- Aziz Rahimov · mathematics ------------------------- */
    {
      spec: make({
        id: 't_quadratic',
        author: 'u_teacher_1',
        title: 'Kvadrat tenglamalar — mustahkamlash',
        description: 'Diskriminant, Viyet teoremasi va to‘liq bo‘lmagan kvadrat tenglamalar.',
        subject: 'Matematika',
        cover: 'algebra',
        ago: 9,
        questions: math(12, 3),
        settings: { durationMin: 25, attemptLimit: 2, showCorrectAnswers: true },
      }),
      attempts: { count: 41, mean: 0.64, spreadDays: 8 },
    },
    {
      spec: make({
        id: 't_logs',
        author: 'u_teacher_1',
        title: 'Logarifmlar: asosiy xossalar',
        description: 'Logarifm ta’rifi, xossalari va oddiy tenglamalar.',
        subject: 'Matematika',
        cover: 'log',
        ago: 12,
        questions: [...numeric(6, 2), ...math(6, 20)],
        settings: { durationMin: 20, attemptLimit: 3, shuffleQuestions: true },
      }),
      attempts: { count: 33, mean: 0.55, spreadDays: 6 },
    },
    {
      spec: make({
        id: 't_trig',
        author: 'u_teacher_1',
        title: 'Trigonometriya asoslari',
        description: 'Burchak o‘lchovlari, sinus va kosinus qiymatlari, asosiy ayniyatlar.',
        subject: 'Matematika',
        cover: 'trig',
        ago: 16,
        questions: math(15, 30),
        settings: { durationMin: 30, attemptLimit: 2, shuffleOptions: true, antiCheat: true },
      }),
      attempts: { count: 29, mean: 0.51, spreadDays: 12 },
    },
    {
      spec: make({
        id: 't_inequalities',
        author: 'u_teacher_1',
        title: 'Tengsizliklar va ularning sistemalari',
        description: 'Chiziqli va kvadrat tengsizliklar, oraliqlar usuli.',
        subject: 'Matematika',
        cover: 'algebra',
        ago: 24,
        questions: math(10, 50),
        settings: { durationMin: 20, attemptLimit: 1 },
      }),
      attempts: { count: 24, mean: 0.6, spreadDays: 20 },
    },
    {
      spec: make({
        id: 't_weekly12',
        author: 'u_teacher_1',
        title: 'Haftalik quiz #12',
        description: 'Haftalik takrorlash: 8 ta tezkor savol.',
        subject: 'Matematika',
        cover: 'quiz',
        ago: 14,
        status: 'finished',
        questions: math(8, 60),
        settings: { durationMin: 12, attemptLimit: 1, showResult: 'immediately' },
      }),
      attempts: { count: 52, mean: 0.7, spreadDays: 13 },
    },
    {
      spec: make({
        id: 't_weekly11',
        author: 'u_teacher_1',
        title: 'Haftalik quiz #11',
        description: 'Haftalik takrorlash: 8 ta tezkor savol.',
        subject: 'Matematika',
        cover: 'quiz',
        ago: 21,
        status: 'finished',
        questions: math(8, 66),
        settings: { durationMin: 12, attemptLimit: 1 },
      }),
      attempts: { count: 48, mean: 0.66, spreadDays: 20 },
    },
    {
      spec: make({
        id: 't_final9',
        author: 'u_teacher_1',
        title: 'Yakuniy nazorat — 9-sinf',
        description: 'O‘tgan o‘quv yilining yakuniy nazorati. Arxivga olingan.',
        subject: 'Matematika',
        cover: 'algebra',
        ago: 90,
        status: 'archived',
        questions: [...math(14, 74), ...numeric(6, 8)],
        settings: { durationMin: 45, attemptLimit: 1 },
      }),
      attempts: { count: 61, mean: 0.58, spreadDays: 85 },
    },
    {
      spec: make({
        id: 't_probability',
        author: 'u_teacher_1',
        title: 'Ehtimollik nazariyasi — kirish',
        description: 'Hodisalar, ehtimollik ta’rifi va oddiy masalalar. Hali tugallanmagan.',
        subject: 'Matematika',
        ago: 2,
        status: 'draft',
        questions: math(6, 90),
      }),
    },
    {
      spec: make({
        id: 't_untitled',
        author: 'u_teacher_1',
        title: 'Nomsiz test',
        description: '',
        subject: 'Boshqa',
        ago: 0,
        status: 'draft',
        questions: math(2, 4),
      }),
    },
    {
      spec: contest(
        {
          id: 'c_autumn',
          author: 'u_teacher_1',
          title: 'Kuzgi kubok — matematika musobaqasi',
          description:
            'Maktab o‘quvchilari uchun ochiq musobaqa. Eng kuchli o‘nlikka sertifikat beriladi.',
          subject: 'Matematika',
          cover: 'contest',
          ago: 6,
          questions: [...math(14, 100), ...numeric(6, 16)],
          settings: {
            durationMin: 90,
            attemptLimit: 1,
            antiCheat: true,
            requiredChannels: channel('ch_math', 'Matematika olami', 'matematika_olami'),
          },
        },
        26 * HOUR,
        3 * HOUR,
      ),
      registrations: 126,
    },
    {
      spec: contest(
        {
          id: 'c_blitz',
          author: 'u_teacher_1',
          title: 'Blitz: 15 daqiqada 15 ta misol',
          description: 'Tezlik musobaqasi: hozir ochiq, vaqt cheklangan.',
          subject: 'Matematika',
          cover: 'contest',
          ago: 1,
          questions: math(15, 120),
          settings: { durationMin: 15, attemptLimit: 1, antiCheat: true },
        },
        -25 * 60_000,
        2 * HOUR,
      ),
      attempts: { count: 22, mean: 0.6, spreadDays: 0.012 },
    },
    {
      spec: contest(
        {
          id: 'c_summer',
          author: 'u_teacher_1',
          title: 'Yozgi olimpiada 2026',
          description: 'Yozgi ta’til olimpiadasi. Natijalar e’lon qilingan.',
          subject: 'Matematika',
          cover: 'contest',
          ago: 50,
          questions: [...math(20, 140), ...numeric(10, 24)],
          settings: { durationMin: 120, attemptLimit: 1 },
        },
        -45 * DAY,
        3 * HOUR,
      ),
      attempts: { count: 58, mean: 0.5, spreadDays: 44 },
    },
    {
      spec: make({
        id: 'l_intensive',
        author: 'u_teacher_1',
        type: 'limited',
        title: 'Logika: 30 o‘rinli intensiv',
        description: 'Faqat 30 kishi uchun yopiq mashg‘ulot. O‘rinlar to‘lgan.',
        subject: 'Matematika',
        cover: 'logic',
        ago: 5,
        questions: math(10, 170),
        settings: {
          durationMin: 20,
          participantLimit: 30,
          attemptLimit: 1,
          access: 'invite',
          showResult: 'immediately',
        },
      }),
      attempts: { count: 30, mean: 0.62, spreadDays: 4 },
    },
    {
      spec: make({
        id: 'l_students',
        author: 'u_teacher_1',
        type: 'limited',
        title: 'Talabalar uchun maxsus test',
        description: 'Parol va kanalga a’zolik talab qilinadi. 100 tagacha ishtirokchi.',
        subject: 'Matematika',
        cover: 'quiz',
        ago: 8,
        questions: [...math(8, 200), ...numeric(4, 30)],
        settings: {
          durationMin: 30,
          participantLimit: 100,
          attemptLimit: 1,
          access: 'password',
          password: '1234',
          requiredChannels: channel('ch_students', 'Talabalar hamjamiyati', 'talabalar_uz'),
        },
      }),
      attempts: { count: 44, mean: 0.57, spreadDays: 7 },
    },
    {
      spec: make({
        id: 'v_math',
        author: 'u_teacher_1',
        type: 'live',
        title: 'Jonli viktorina: Matematika bellashuvi',
        description: 'Har bir savolga 20 soniya. Tezroq javob ko‘proq ball beradi.',
        subject: 'Matematika',
        cover: 'live',
        ago: 4,
        questions: timed(math(12, 230)),
        settings: { durationMin: null, speedBonus: 0.6 },
      }),
      attempts: { count: 26, mean: 0.6, spreadDays: 3 },
    },
    {
      spec: make({
        id: 'v_general',
        author: 'u_teacher_1',
        type: 'live',
        title: 'Jonli viktorina: Umumiy bilim',
        description: 'Geografiya, astronomiya va tarix aralash savollari.',
        subject: 'Umumiy bilim',
        cover: 'live',
        ago: 3,
        questions: timed([
          ...bankQuestions('Geografiya', 5, 0),
          ...bankQuestions('Astronomiya', 5, 3),
          ...bankQuestions('Tarix', 4, 2),
        ]),
        settings: { durationMin: null, speedBonus: 0.5 },
      }),
      attempts: { count: 19, mean: 0.63, spreadDays: 2 },
    },

    /* --------------------------- exams (DTM & Milliy) --------------------------- */
    {
      spec: dtmVariant({
        id: 'e_dtm_v2',
        authorId: 'u_teacher_1',
        title: 'DTM blok test — 2-variant',
        description: 'Matematika / Fizika bloki, boshqa savollar to‘plami bilan.',
        createdAgoDays: 8,
        offset: 30,
      }),
      attempts: { count: 30, mean: 0.5, spreadDays: 7 },
    },
    {
      spec: dtmVariant({
        id: 'e_dtm_v3',
        authorId: 'u_teacher_2',
        title: 'DTM blok test — 3-variant',
        description: 'Fizika bo‘yicha kuchaytirilgan variant. Vaqt: 3 soat.',
        createdAgoDays: 15,
        offset: 60,
      }),
      attempts: { count: 27, mean: 0.46, spreadDays: 14 },
    },
    {
      spec: dtmVariant({
        id: 'e_dtm_v4',
        authorId: 'u_teacher_1',
        title: 'DTM blok test — 4-variant (qoralama)',
        description: 'Hali e’lon qilinmagan variant.',
        createdAgoDays: 1,
        offset: 90,
        status: 'draft',
      }),
    },
    {
      spec: milliyMathVariant({
        id: 'e_milliy_m2',
        authorId: 'u_teacher_1',
        title: 'Milliy sertifikat — Matematika, 2-variant',
        description: 'Yopiq va qisqa javobli savollar, yangi to‘plam.',
        createdAgoDays: 9,
        offset: 20,
      }),
      attempts: { count: 24, mean: 0.6, spreadDays: 8 },
    },
    {
      spec: milliyMathVariant({
        id: 'e_milliy_m3',
        authorId: 'u_teacher_2',
        title: 'Milliy sertifikat — Matematika, 3-variant',
        description: 'Murakkabroq variant: A darajasiga tayyorlanish uchun.',
        createdAgoDays: 13,
        offset: 45,
      }),
      attempts: { count: 21, mean: 0.5, spreadDays: 12 },
    },
    {
      spec: milliyMathVariant({
        id: 'e_milliy_m4',
        authorId: 'u_teacher_1',
        title: 'Milliy sertifikat — Matematika, 4-variant',
        description: 'Oxirgi takrorlash varianti.',
        createdAgoDays: 2,
        offset: 70,
      }),
      attempts: { count: 18, mean: 0.58, spreadDays: 2 },
    },
    {
      spec: milliyExam({
        id: 'e_milliy_tarix',
        authorId: 'u_teacher_7',
        title: 'Milliy sertifikat — Tarix',
        description: 'O‘zbekiston tarixi bo‘yicha namunaviy variant.',
        subject: 'Tarix',
        createdAgoDays: 11,
        durationMin: 90,
        questions: (section) => [
          ...examQuestionSets.history(section),
          ...bankQuestions('Tarix', 14, 0, section),
        ],
      }),
      attempts: { count: 25, mean: 0.62, spreadDays: 10 },
    },
    {
      spec: milliyExam({
        id: 'e_milliy_ona',
        authorId: 'u_teacher_6',
        title: 'Milliy sertifikat — Ona tili va adabiyot',
        description: 'Grammatika va mumtoz adabiyot savollari.',
        subject: 'Ona tili',
        createdAgoDays: 7,
        durationMin: 90,
        questions: (section) => [
          ...examQuestionSets.nativeLanguage(section),
          ...bankQuestions('Adabiyot', 14, 0, section),
        ],
      }),
      attempts: { count: 23, mean: 0.66, spreadDays: 6 },
    },

    /* ------------------------ Nilufar Qodirova · physics ------------------------ */
    {
      spec: make({
        id: 't_kinematics',
        author: 'u_teacher_2',
        title: 'Kinematika: tekis harakat',
        description: 'Tezlik, yo‘l va vaqt bog‘lanishi. Grafik masalalar bilan.',
        subject: 'Fizika',
        cover: 'physics',
        ago: 10,
        questions: physics(12, 0),
        settings: { durationMin: 25, attemptLimit: 2 },
      }),
      attempts: { count: 39, mean: 0.59, spreadDays: 9 },
    },
    {
      spec: make({
        id: 't_dynamics',
        author: 'u_teacher_2',
        title: 'Dinamika va Nyuton qonunlari',
        description: 'Kuch, massa, tezlanish. Nyutonning uchta qonuni.',
        subject: 'Fizika',
        cover: 'physics',
        ago: 18,
        questions: physics(14, 12),
        settings: { durationMin: 30, attemptLimit: 2, shuffleQuestions: true },
      }),
      attempts: { count: 34, mean: 0.52, spreadDays: 17 },
    },
    {
      spec: make({
        id: 't_thermo',
        author: 'u_teacher_2',
        title: 'Termodinamika asoslari',
        description: 'Issiqlik miqdori, ish va ichki energiya.',
        subject: 'Fizika',
        cover: 'physics',
        ago: 22,
        questions: physics(10, 26),
        settings: { durationMin: 20, attemptLimit: 3 },
      }),
      attempts: { count: 22, mean: 0.48, spreadDays: 20 },
    },
    {
      spec: contest(
        {
          id: 'c_phys_cup',
          author: 'u_teacher_2',
          title: 'Fizika kubogi — bahorgi tur',
          description: 'Respublika bo‘yicha onlayn musobaqa. G‘oliblarga sovrinlar.',
          subject: 'Fizika',
          cover: 'contest',
          ago: 4,
          questions: physics(16, 40),
          settings: {
            durationMin: 45,
            attemptLimit: 1,
            antiCheat: true,
            requiredChannels: channel('ch_physics', 'Fizika olami', 'fizika_olami'),
          },
        },
        3 * DAY,
        4 * HOUR,
      ),
      registrations: 88,
    },
    {
      spec: make({
        id: 't_astronomy',
        author: 'u_teacher_2',
        title: 'Astronomiya: Quyosh tizimi',
        description: 'Sayyoralar, yo‘ldoshlar va kosmik tadqiqotlar tarixi.',
        subject: 'Astronomiya',
        cover: 'astronomy',
        ago: 26,
        questions: bankQuestions('Astronomiya', 14),
        settings: { durationMin: 15, attemptLimit: 3 },
      }),
      attempts: { count: 45, mean: 0.68, spreadDays: 24 },
    },

    /* --------------------------- Bobur Ismoilov · chemistry -------------------------- */
    {
      spec: make({
        id: 't_periodic',
        author: 'u_teacher_3',
        title: 'Kimyo: davriy jadval',
        description: 'Elementlar, ularning belgilari va asosiy birikmalar.',
        subject: 'Kimyo',
        cover: 'chemistry',
        ago: 13,
        questions: bankQuestions('Kimyo', 14),
        settings: { durationMin: 18, attemptLimit: 3 },
      }),
      attempts: { count: 51, mean: 0.65, spreadDays: 12 },
    },
    {
      spec: make({
        id: 't_organic',
        author: 'u_teacher_3',
        title: 'Organik kimyo — kirish',
        description: 'Uglevodorodlar va karbon kislotalar. Parol bilan himoyalangan.',
        subject: 'Kimyo',
        cover: 'chemistry',
        ago: 19,
        questions: bankQuestions('Kimyo', 10, 6),
        settings: { durationMin: 15, access: 'password', password: 'organik' },
      }),
      attempts: { count: 27, mean: 0.55, spreadDays: 18 },
    },
    {
      spec: make({
        id: 'v_chem',
        author: 'u_teacher_3',
        type: 'live',
        title: 'Jonli viktorina: Kimyo',
        description: 'Sinf bilan birga o‘ynaladigan tezkor viktorina.',
        subject: 'Kimyo',
        cover: 'live',
        ago: 6,
        questions: timed(bankQuestions('Kimyo', 12, 1), 15),
        settings: { durationMin: null, speedBonus: 0.5 },
      }),
      attempts: { count: 17, mean: 0.6, spreadDays: 5 },
    },

    /* ------------------------ Malika Sodiqova · languages ------------------------ */
    {
      spec: make({
        id: 't_eng_grammar',
        author: 'u_teacher_4',
        title: 'English Grammar Check',
        description: 'Tenses, articles and prepositions: a quick check-up.',
        subject: 'Ingliz tili',
        cover: 'english',
        ago: 11,
        questions: bankQuestions('Ingliz tili', 14),
        settings: { durationMin: 15, attemptLimit: 3 },
      }),
      attempts: { count: 57, mean: 0.6, spreadDays: 10 },
    },
    {
      spec: make({
        id: 't_eng_vocab',
        author: 'u_teacher_4',
        title: 'Vocabulary: Level B1',
        description: 'Everyday words and collocations for intermediate learners.',
        subject: 'Ingliz tili',
        cover: 'english',
        ago: 17,
        questions: bankQuestions('Ingliz tili', 10, 5),
        settings: { durationMin: 12, attemptLimit: 2, shuffleOptions: true },
      }),
      attempts: { count: 36, mean: 0.63, spreadDays: 16 },
    },
    {
      spec: contest(
        {
          id: 'c_spelling',
          author: 'u_teacher_4',
          title: 'Spelling Bee — musobaqa',
          description: 'Hozir davom etmoqda: imlo bo‘yicha tezkor bellashuv.',
          subject: 'Ingliz tili',
          cover: 'contest',
          ago: 2,
          questions: bankQuestions('Ingliz tili', 14, 2),
          settings: { durationMin: 15, attemptLimit: 1 },
        },
        -12 * 60_000,
        2 * HOUR,
      ),
      attempts: { count: 15, mean: 0.6, spreadDays: 0.008 },
    },
    {
      spec: make({
        id: 't_russian',
        author: 'u_teacher_4',
        title: 'Rus tili: boshlang‘ich daraja',
        description: 'Kundalik so‘zlar va oddiy iboralar tarjimasi.',
        subject: 'Rus tili',
        cover: 'russian',
        ago: 28,
        questions: bankQuestions('Rus tili', 14),
        settings: { durationMin: 12, attemptLimit: 3 },
      }),
      attempts: { count: 30, mean: 0.72, spreadDays: 26 },
    },

    /* ------------------------- Sherzod Nurmatov · informatics ------------------------- */
    {
      spec: make({
        id: 't_it_basics',
        author: 'u_teacher_5',
        title: 'Informatika: kompyuter asoslari',
        description: 'Qurilmalar, xotira turlari va sanoq tizimlari.',
        subject: 'Informatika',
        cover: 'it',
        ago: 7,
        questions: bankQuestions('Informatika', 14),
        settings: { durationMin: 15, attemptLimit: 2 },
      }),
      attempts: { count: 43, mean: 0.66, spreadDays: 6 },
    },
    {
      spec: make({
        id: 't_python',
        author: 'u_teacher_5',
        title: 'Python: birinchi qadamlar',
        description: 'Dasturlash tushunchalari va oddiy amallar.',
        subject: 'Informatika',
        cover: 'it',
        ago: 9,
        questions: bankQuestions('Informatika', 10, 4),
        settings: { durationMin: 12, attemptLimit: 3 },
      }),
      attempts: { count: 38, mean: 0.61, spreadDays: 8 },
    },
    {
      spec: make({
        id: 'v_it',
        author: 'u_teacher_5',
        type: 'live',
        title: 'Jonli viktorina: IT olami',
        description: 'Texnologiyalar haqida tezkor bellashuv.',
        subject: 'Informatika',
        cover: 'live',
        ago: 2,
        questions: timed(bankQuestions('Informatika', 12, 2), 15),
        settings: { durationMin: null, speedBonus: 0.4 },
      }),
      attempts: { count: 21, mean: 0.64, spreadDays: 2 },
    },
    {
      spec: make({
        id: 't_it_draft',
        author: 'u_teacher_5',
        title: 'Veb-dasturlash: HTML va CSS',
        description: 'Tayyorlanmoqda.',
        subject: 'Informatika',
        cover: 'it',
        ago: 1,
        status: 'draft',
        questions: bankQuestions('Informatika', 5, 8),
      }),
    },

    /* ---------------------- Gulchehra Hamidova · literature ---------------------- */
    {
      spec: make({
        id: 't_literature',
        author: 'u_teacher_6',
        title: 'Adabiyot: mumtoz asarlar',
        description: 'Asar va muallif juftliklarini topish.',
        subject: 'Adabiyot',
        cover: 'literature',
        ago: 15,
        questions: bankQuestions('Adabiyot', 14),
        settings: { durationMin: 15, attemptLimit: 3 },
      }),
      attempts: { count: 46, mean: 0.58, spreadDays: 14 },
    },
    {
      spec: make({
        id: 't_navoi',
        author: 'u_teacher_6',
        title: 'Alisher Navoiy ijodi',
        description: 'Buyuk shoir hayoti va asarlari bo‘yicha qisqa test.',
        subject: 'Adabiyot',
        cover: 'literature',
        ago: 23,
        questions: bankQuestions('Adabiyot', 8, 0),
        settings: { durationMin: 10, attemptLimit: 3 },
      }),
      attempts: { count: 35, mean: 0.7, spreadDays: 21 },
    },
    {
      spec: make({
        id: 't_uzbek',
        author: 'u_teacher_6',
        title: 'Ona tili: so‘z turkumlari',
        description: 'Ot, sifat, son, olmosh va fe’l. Qo‘shimchalar.',
        subject: 'Ona tili',
        cover: 'uzbek',
        ago: 12,
        questions: bankQuestions('Ona tili', 14),
        settings: { durationMin: 15, attemptLimit: 3 },
      }),
      attempts: { count: 52, mean: 0.64, spreadDays: 11 },
    },
    {
      spec: contest(
        {
          id: 'c_reader',
          author: 'u_teacher_6',
          title: 'Kitobxon — o‘qish musobaqasi',
          description: 'Mumtoz va zamonaviy adabiyot bo‘yicha viktorina, 5 kundan so‘ng.',
          subject: 'Adabiyot',
          cover: 'contest',
          ago: 3,
          questions: bankQuestions('Adabiyot', 14, 3),
          settings: { durationMin: 25, attemptLimit: 1 },
        },
        5 * DAY,
        6 * HOUR,
      ),
      registrations: 64,
    },

    /* ----------------------- Farhod Yo‘ldoshev · history & geography ----------------------- */
    {
      spec: make({
        id: 't_temur',
        author: 'u_teacher_7',
        title: 'Amir Temur va temuriylar davri',
        description: 'Temuriylar davlati, madaniyati va ilm-fani.',
        subject: 'Tarix',
        cover: 'history',
        ago: 14,
        questions: bankQuestions('Tarix', 14),
        settings: { durationMin: 18, attemptLimit: 3 },
      }),
      attempts: { count: 48, mean: 0.61, spreadDays: 13 },
    },
    {
      spec: make({
        id: 't_geography',
        author: 'u_teacher_7',
        title: 'Geografiya: dunyo mamlakatlari',
        description: 'Poytaxtlar, okeanlar va tabiiy obyektlar.',
        subject: 'Geografiya',
        cover: 'geography',
        ago: 20,
        questions: bankQuestions('Geografiya', 14),
        settings: { durationMin: 15, attemptLimit: 3 },
      }),
      attempts: { count: 41, mean: 0.67, spreadDays: 19 },
    },
    {
      spec: make({
        id: 'l_geo_olympiad',
        author: 'u_teacher_7',
        type: 'limited',
        title: 'Geografiya olimpiadasi — saralash',
        description: 'Faqat 60 nafar o‘quvchi qatnashadi. Taklif havolasi orqali.',
        subject: 'Geografiya',
        cover: 'geography',
        ago: 6,
        questions: bankQuestions('Geografiya', 12, 2),
        settings: {
          durationMin: 20,
          participantLimit: 60,
          attemptLimit: 1,
          access: 'invite',
        },
      }),
      attempts: { count: 37, mean: 0.6, spreadDays: 5 },
    },
    {
      spec: make({
        id: 'v_geo',
        author: 'u_teacher_7',
        type: 'live',
        title: 'Jonli viktorina: Dunyo bo‘ylab',
        description: 'Mamlakatlar va shaharlar bo‘yicha jonli bellashuv.',
        subject: 'Geografiya',
        cover: 'live',
        ago: 1,
        questions: timed(bankQuestions('Geografiya', 12, 1), 15),
        settings: { durationMin: null, speedBonus: 0.5 },
      }),
      attempts: { count: 20, mean: 0.62, spreadDays: 1 },
    },

    /* --------------------------- Zarina Ahmedova · biology --------------------------- */
    {
      spec: make({
        id: 't_cell',
        author: 'u_teacher_8',
        title: 'Biologiya: hujayra tuzilishi',
        description: 'Organoidlar va ularning vazifalari.',
        subject: 'Biologiya',
        cover: 'biology',
        ago: 8,
        questions: bankQuestions('Biologiya', 14),
        settings: { durationMin: 15, attemptLimit: 3 },
      }),
      attempts: { count: 44, mean: 0.63, spreadDays: 7 },
    },
    {
      spec: make({
        id: 't_human',
        author: 'u_teacher_8',
        title: 'Odam anatomiyasi',
        description: 'Qon aylanishi, nafas olish va hazm qilish tizimlari.',
        subject: 'Biologiya',
        cover: 'biology',
        ago: 16,
        questions: bankQuestions('Biologiya', 10, 4),
        settings: { durationMin: 12, attemptLimit: 3 },
      }),
      attempts: { count: 29, mean: 0.56, spreadDays: 15 },
    },
    {
      spec: contest(
        {
          id: 'c_bio_cup',
          author: 'u_teacher_8',
          title: 'Biologiya kubogi',
          description: 'Tugagan musobaqa: natijalar va reyting e’lon qilingan.',
          subject: 'Biologiya',
          cover: 'contest',
          ago: 20,
          questions: bankQuestions('Biologiya', 14, 2),
          settings: { durationMin: 20, attemptLimit: 1 },
        },
        -12 * DAY,
        3 * HOUR,
      ),
      attempts: { count: 33, mean: 0.59, spreadDays: 11 },
    },
  ];
}
