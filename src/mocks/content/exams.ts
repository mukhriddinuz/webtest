/**
 * The two seeded exam variants.
 *
 * Coefficients, the maximum score and the level bands are written here as
 * data, never in the grading code: the rules are revised most years, and a
 * revision must be one edit in one place.
 *
 * Sources for the figures below (verify before a release, they do change):
 * - DTM block test: 30 + 30 + 30 questions at 1.1 / 3.1 / 2.1, 189 in total.
 * - Milliy sertifikat, general subjects: 75 maximum, A+ from 70 down to C from
 *   46, below which no certificate is issued. The official score comes out of
 *   a Rasch model, so ours is flagged as an estimate.
 */

import type { ExamConfig } from '@/services/types';
import type { TestSpec } from '../builders';
import { examQuestionSets } from './examQuestions';

/* ----------------------------- DTM block test ----------------------------- */

const DTM_SECTIONS = {
  required: 's_required',
  first: 's_first',
  second: 's_second',
} as const;

const dtmConfig: ExamConfig = {
  preset: 'dtm',
  maxScore: 189,
  approximate: false,
  levels: [],
  sections: [
    {
      id: DTM_SECTIONS.required,
      title: 'Majburiy fanlar',
      subject: 'Ona tili, Matematika, Tarix',
      pointsPerQuestion: 1.1,
    },
    {
      id: DTM_SECTIONS.first,
      title: '1-blok',
      subject: 'Matematika',
      pointsPerQuestion: 3.1,
    },
    {
      id: DTM_SECTIONS.second,
      title: '2-blok',
      subject: 'Fizika',
      pointsPerQuestion: 2.1,
    },
  ],
};

interface DtmVariantInput {
  id: string;
  authorId: string;
  title: string;
  description: string;
  createdAgoDays: number;
  /** Shifts every generated question, so each variant is a different paper. */
  offset?: number;
  durationMin?: number;
  attemptLimit?: number;
  status?: TestSpec['status'];
}

export const dtmVariant = (input: DtmVariantInput): TestSpec => {
  const offset = input.offset ?? 0;
  return {
    id: input.id,
    authorId: input.authorId,
    type: 'exam',
    title: input.title,
    description: input.description,
    subject: 'Matematika',
    coverImageId: 'img_cover_dtm',
    status: input.status ?? 'active',
    createdAgoDays: input.createdAgoDays,
    settings: {
      durationMin: input.durationMin ?? 180,
      attemptLimit: input.attemptLimit ?? 3,
      allowBack: true,
      // Sections must stay in their own order, so nothing here is shuffled.
      shuffleQuestions: false,
      shuffleOptions: false,
      showResult: 'immediately',
      showCorrectAnswers: true,
      exam: dtmConfig,
    },
    questions: [
      ...examQuestionSets.nativeLanguage(DTM_SECTIONS.required),
      ...examQuestionSets.math(10, DTM_SECTIONS.required, offset),
      ...examQuestionSets.history(DTM_SECTIONS.required),
      ...examQuestionSets.math(22, DTM_SECTIONS.first, 11 + offset),
      ...examQuestionSets.mathNumeric(8, DTM_SECTIONS.first, offset),
      ...examQuestionSets.physics(30, DTM_SECTIONS.second, offset),
    ],
  };
};

export const dtmExam = (): TestSpec =>
  dtmVariant({
    id: 'e_dtm_math_physics',
    authorId: 'u_teacher_1',
    title: 'DTM blok test — Matematika / Fizika',
    description:
      'Kirish imtihoni tuzilishidagi namunaviy variant: majburiy fanlar, 1-blok va 2-blok. Savollar shu ilova uchun yozilgan.',
    createdAgoDays: 3,
  });

/* --------------------------- Milliy sertifikat ---------------------------- */

const MILLIY_SECTION = 's_main';

const milliyConfig: ExamConfig = {
  preset: 'milliy',
  maxScore: 75,
  // The official result is a Rasch estimate we cannot reproduce.
  approximate: true,
  sections: [
    {
      id: MILLIY_SECTION,
      title: 'Matematika',
      subject: 'Matematika',
      // Milliy sertifikat weighs by question difficulty, not by a flat
      // coefficient; this value only shapes the per-section summary.
      pointsPerQuestion: 1,
    },
  ],
  levels: [
    { code: 'A+', minScore: 70 },
    { code: 'A', minScore: 65 },
    { code: 'B+', minScore: 60 },
    { code: 'B', minScore: 55 },
    { code: 'C+', minScore: 50 },
    { code: 'C', minScore: 46 },
  ],
};

interface MilliyInput {
  id: string;
  authorId: string;
  title: string;
  description: string;
  subject: string;
  createdAgoDays: number;
  questions: (section: string) => TestSpec['questions'];
  durationMin?: number;
  status?: TestSpec['status'];
}

export const milliyExam = (input: MilliyInput): TestSpec => ({
  id: input.id,
  authorId: input.authorId,
  type: 'exam',
  title: input.title,
  description: input.description,
  subject: input.subject,
  coverImageId: 'img_cover_milliy',
  status: input.status ?? 'active',
  createdAgoDays: input.createdAgoDays,
  settings: {
    durationMin: input.durationMin ?? 150,
    attemptLimit: 3,
    allowBack: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    showResult: 'immediately',
    showCorrectAnswers: true,
    exam: {
      ...milliyConfig,
      sections: [
        {
          id: MILLIY_SECTION,
          title: input.subject,
          subject: input.subject,
          pointsPerQuestion: 1,
        },
      ],
    },
  },
  questions: input.questions(MILLIY_SECTION),
});

export const milliyMathVariant = (
  input: Omit<MilliyInput, 'questions' | 'subject'> & { offset: number },
): TestSpec =>
  milliyExam({
    ...input,
    subject: 'Matematika',
    questions: (section) => [
      ...examQuestionSets.math(20, section, 40 + input.offset),
      ...examQuestionSets.mathNumeric(23, section, 12 + input.offset),
    ],
  });

export const milliyMathExam = (): TestSpec =>
  milliyMathVariant({
    id: 'e_milliy_math',
    authorId: 'u_teacher_1',
    title: 'Milliy sertifikat — Matematika',
    description:
      'Yopiq va qisqa javobli savollardan iborat namunaviy variant. Rasmiy imtihondagi 2 ta kengaytirilgan javobli savol avtomatik tekshirilmagani uchun kiritilmagan.',
    createdAgoDays: 5,
    offset: 0,
  });
