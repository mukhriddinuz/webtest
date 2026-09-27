import type { ExamConfig, Question } from '@/services/types';

/** Where a question sits inside its own block, for the exam attempt header. */
export interface SectionPosition {
  title: string;
  subject: string;
  /** 1-based index within the block, not within the paper. */
  current: number;
  total: number;
}

/**
 * An exam paper is read block by block, so "17 / 90" tells a candidate far
 * less than "1-blok fan, 7 / 30". This resolves the latter.
 */
export function sectionPosition(
  config: ExamConfig | undefined,
  questions: readonly Question[],
  index: number,
): SectionPosition | null {
  const question = questions[index];
  if (!config || !question?.sectionId) return null;

  const section = config.sections.find((item) => item.id === question.sectionId);
  if (!section) return null;

  const own = questions.filter((item) => item.sectionId === section.id);
  return {
    title: section.title,
    subject: section.subject,
    current: own.findIndex((item) => item.id === question.id) + 1,
    total: own.length,
  };
}

/** How many questions each block holds, for the intro screen's summary. */
export function sectionSizes(
  config: ExamConfig,
  questions: readonly Question[],
): { id: string; count: number }[] {
  return config.sections.map((section) => ({
    id: section.id,
    count: questions.filter((question) => question.sectionId === section.id).length,
  }));
}
