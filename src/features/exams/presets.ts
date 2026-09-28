import type { ExamConfig, ExamLevel, ExamPreset, ExamSection } from '@/services/types';

/**
 * What an author may and may not decide about an exam.
 *
 * A DTM ball or a Milliy sertifikat level only means something because every
 * paper is scored the same way. So the coefficients, the question counts and
 * the level bands come from here and are never editable in the wizard: the
 * author chooses the subjects and writes the questions, nothing else. Anyone
 * inventing their own coefficients would hand candidates a number that looks
 * official and is not.
 *
 * The figures themselves are revised most years — see README — so this file is
 * the one place to change when they are.
 */
export interface ExamSectionTemplate {
  id: string;
  /** i18n key under `exam.section.` */
  titleKey: string;
  pointsPerQuestion: number;
  /** Exactly this many questions, or undefined when the length is free. */
  requiredCount?: number;
  /** A fixed subject, e.g. the three compulsory ones; else the author picks. */
  fixedSubjectKey?: string;
}

export interface ExamPresetTemplate {
  preset: ExamPreset;
  maxScore: number;
  approximate: boolean;
  levels: ExamLevel[];
  sections: ExamSectionTemplate[];
  /** Minutes, matching the real paper. */
  durationMin: number;
}

export const EXAM_PRESETS: Record<ExamPreset, ExamPresetTemplate> = {
  // 30 + 30 + 30 questions at 1.1 / 3.1 / 2.1 — 189 in total.
  dtm: {
    preset: 'dtm',
    maxScore: 189,
    approximate: false,
    levels: [],
    durationMin: 180,
    sections: [
      {
        id: 's_required',
        titleKey: 'exam.section.required',
        pointsPerQuestion: 1.1,
        requiredCount: 30,
        fixedSubjectKey: 'exam.section.requiredSubjects',
      },
      {
        id: 's_first',
        titleKey: 'exam.section.first',
        pointsPerQuestion: 3.1,
        requiredCount: 30,
      },
      {
        id: 's_second',
        titleKey: 'exam.section.second',
        pointsPerQuestion: 2.1,
        requiredCount: 30,
      },
    ],
  },

  // One subject out of 75, graded A+ (70) down to C (46).
  milliy: {
    preset: 'milliy',
    maxScore: 75,
    // The official figure comes out of a Rasch model we cannot reproduce.
    approximate: true,
    durationMin: 150,
    sections: [{ id: 's_main', titleKey: 'exam.section.main', pointsPerQuestion: 1 }],
    levels: [
      { code: 'A+', minScore: 70 },
      { code: 'A', minScore: 65 },
      { code: 'B+', minScore: 60 },
      { code: 'B', minScore: 55 },
      { code: 'C+', minScore: 50 },
      { code: 'C', minScore: 46 },
    ],
  },
};

/** The sections whose subject the author has to choose. */
export function authorChosenSections(preset: ExamPreset): ExamSectionTemplate[] {
  return EXAM_PRESETS[preset].sections.filter((section) => !section.fixedSubjectKey);
}

/**
 * Builds the stored config from a preset and the subjects the author picked.
 * `translate` resolves the i18n keys, so the titles are stored in the language
 * the exam was written in and read the same for everyone taking it.
 */
export function buildExamConfig(
  preset: ExamPreset,
  subjects: Record<string, string>,
  translate: (key: string) => string,
): ExamConfig {
  const template = EXAM_PRESETS[preset];
  const sections: ExamSection[] = template.sections.map((section) => ({
    id: section.id,
    title: translate(section.titleKey),
    subject: section.fixedSubjectKey
      ? translate(section.fixedSubjectKey)
      : (subjects[section.id]?.trim() ?? ''),
    pointsPerQuestion: section.pointsPerQuestion,
  }));

  return {
    preset,
    maxScore: template.maxScore,
    approximate: template.approximate,
    levels: template.levels,
    sections,
  };
}

/** How many questions each block still needs, for the editor's progress line. */
export function sectionQuota(preset: ExamPreset, sectionId: string): number | undefined {
  return EXAM_PRESETS[preset].sections.find((section) => section.id === sectionId)?.requiredCount;
}
