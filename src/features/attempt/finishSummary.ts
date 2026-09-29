import type { ExamConfig, Question } from '@/services/types';

export interface BlockSummary {
  id: string;
  title: string;
  total: number;
  answered: number;
  unanswered: number;
  /** Position, in the order the candidate sees them, of the first gap. */
  firstUnansweredIndex: number | null;
}

export interface FinishSummary {
  total: number;
  answered: number;
  flagged: number;
  unanswered: number;
  firstUnansweredIndex: number | null;
  /** Empty for an ordinary test. */
  blocks: BlockSummary[];
}

/**
 * What the candidate should see before they close the paper for good.
 *
 * `questions` is in the order this attempt shows them, so an index found here
 * is the index to jump to. On an exam the gaps are also counted per block, since
 * ninety questions are read block by block and "6 unanswered" is only useful if
 * it says where.
 */
export function summarise(
  questions: readonly Question[],
  isAnswered: (question: Question) => boolean,
  flaggedIds: readonly string[],
  exam?: ExamConfig,
): FinishSummary {
  const answeredFlags = questions.map(isAnswered);
  const firstGap = answeredFlags.indexOf(false);

  const blocks: BlockSummary[] = (exam?.sections ?? []).map((section) => {
    let total = 0;
    let answered = 0;
    let firstUnansweredIndex: number | null = null;

    questions.forEach((question, index) => {
      if (question.sectionId !== section.id) return;
      total += 1;
      if (answeredFlags[index]) answered += 1;
      else if (firstUnansweredIndex === null) firstUnansweredIndex = index;
    });

    return {
      id: section.id,
      title: section.title,
      total,
      answered,
      unanswered: total - answered,
      firstUnansweredIndex,
    };
  });

  const answered = answeredFlags.filter(Boolean).length;
  return {
    total: questions.length,
    answered,
    flagged: questions.filter((question) => flaggedIds.includes(question.id)).length,
    unanswered: questions.length - answered,
    firstUnansweredIndex: firstGap === -1 ? null : firstGap,
    blocks,
  };
}
