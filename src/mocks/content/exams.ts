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
      title: '1-blok fan',
      subject: 'Matematika',
      pointsPerQuestion: 3.1,
    },
    {
      id: DTM_SECTIONS.second,
      title: '2-blok fan',
      subject: 'Fizika',
      pointsPerQuestion: 2.1,
    },
  ],
};

export const dtmExam = (): TestSpec => ({
  id: 'e_dtm_math_physics',
  authorId: 'u_teacher_1',
  type: 'exam',
  title: 'DTM blok test — Matematika / Fizika',
  description:
    'Kirish imtihoni tuzilishidagi namunaviy variant: majburiy fanlar, 1-blok va 2-blok. Savollar shu ilova uchun yozilgan.',
  subject: 'Matematika',
  status: 'active',
  createdAgoDays: 3,
  settings: {
    durationMin: 180,
    attemptLimit: 3,
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
    ...examQuestionSets.math(10, DTM_SECTIONS.required),
    ...examQuestionSets.history(DTM_SECTIONS.required),
    ...examQuestionSets.math(22, DTM_SECTIONS.first, 11),
    ...examQuestionSets.mathNumeric(8, DTM_SECTIONS.first),
    ...examQuestionSets.physics(30, DTM_SECTIONS.second),
  ],
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

export const milliyMathExam = (): TestSpec => ({
  id: 'e_milliy_math',
  authorId: 'u_teacher_1',
  type: 'exam',
  title: 'Milliy sertifikat — Matematika',
  description:
    'Yopiq va qisqa javobli savollardan iborat namunaviy variant. Rasmiy imtihondagi 2 ta kengaytirilgan javobli savol avtomatik tekshirilmagani uchun kiritilmagan.',
  subject: 'Matematika',
  status: 'active',
  createdAgoDays: 5,
  settings: {
    durationMin: 150,
    attemptLimit: 3,
    allowBack: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    showResult: 'immediately',
    showCorrectAnswers: true,
    exam: milliyConfig,
  },
  questions: [
    ...examQuestionSets.math(20, MILLIY_SECTION, 40),
    ...examQuestionSets.mathNumeric(23, MILLIY_SECTION, 12),
  ],
});
