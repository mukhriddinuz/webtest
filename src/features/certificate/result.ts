import { gradeExam } from '@/lib/grading';
import { isResultHidden } from '@/lib/resultVisibility';
import type { Attempt, Question, Test } from '@/services/types';
import type { CertificateResult } from './certificate';

/**
 * What the certificate may say about the paper. A test that hides its result
 * must not leak it through the certificate either, so that case reports none.
 */
export function certificateResultFor(
  test: Test,
  attempt: Attempt,
  questions: readonly Question[],
): CertificateResult | null {
  if (isResultHidden(test)) return null;

  const exam = test.settings.exam;
  if (exam) {
    const grade = gradeExam(exam, questions, attempt.results);
    return { kind: 'exam', score: grade.score, maxScore: grade.maxScore, level: grade.level };
  }
  return {
    kind: 'percent',
    percent: attempt.percent,
    score: attempt.score,
    maxScore: attempt.maxScore,
  };
}
