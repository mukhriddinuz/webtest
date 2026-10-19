import { describe, expect, it } from 'vitest';
import { buildSeedDatabase } from '@/mocks/seed';
import { certificateResultFor } from './result';

const NOW = Date.UTC(2026, 9, 19, 10, 0, 0);
const database = buildSeedDatabase(NOW);

const paper = (testId: string) => {
  const test = structuredClone(database.tests.find((item) => item.id === testId)!);
  const attempt = database.attempts.find(
    (item) => item.testId === testId && item.status === 'submitted',
  )!;
  const questions = database.questions.filter((item) => item.testId === testId);
  return { test, attempt, questions };
};

describe('certificateResultFor', () => {
  it('reports the percentage for an ordinary test', () => {
    const { test, attempt, questions } = paper('t_algebra');
    expect(certificateResultFor(test, attempt, questions)).toEqual({
      kind: 'percent',
      percent: attempt.percent,
      score: attempt.score,
      maxScore: attempt.maxScore,
    });
  });

  it('reports the ball and level for an exam', () => {
    const { test, attempt, questions } = paper('e_milliy_math');
    const result = certificateResultFor(test, attempt, questions);
    expect(result?.kind).toBe('exam');
    if (result?.kind === 'exam') expect(result.maxScore).toBe(75);
  });

  it('says nothing about the result of a test that hides it', () => {
    const { test, attempt, questions } = paper('t_algebra');
    test.settings.showResult = 'never';
    expect(certificateResultFor(test, attempt, questions)).toBeNull();
  });

  it('holds a result back until the test is over when asked to', () => {
    const { test, attempt, questions } = paper('t_algebra');
    test.settings.showResult = 'after_finish';
    test.status = 'active';
    expect(certificateResultFor(test, attempt, questions)).toBeNull();
    test.status = 'finished';
    expect(certificateResultFor(test, attempt, questions)?.kind).toBe('percent');
  });
});
