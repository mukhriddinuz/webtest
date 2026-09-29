import { describe, expect, it } from 'vitest';
import type { ExamConfig, Question } from '@/services/types';
import { summarise } from './finishSummary';

const question = (id: string, sectionId?: string): Question =>
  ({ id, sectionId }) as unknown as Question;

const exam = {
  preset: 'dtm',
  maxScore: 189,
  approximate: false,
  levels: [],
  sections: [
    { id: 'a', title: 'Majburiy', subject: '', pointsPerQuestion: 1.1 },
    { id: 'b', title: '1-blok', subject: '', pointsPerQuestion: 3.1 },
  ],
} as ExamConfig;

describe('summarise', () => {
  const qs = [question('q1', 'a'), question('q2', 'a'), question('q3', 'b'), question('q4', 'b')];

  it('counts answered, flagged and unanswered', () => {
    const done = new Set(['q1', 'q3']);
    const result = summarise(qs, (q) => done.has(q.id), ['q2', 'q3']);

    expect(result).toMatchObject({ total: 4, answered: 2, unanswered: 2, flagged: 2 });
  });

  it('points at the first gap in the order the questions are shown', () => {
    const done = new Set(['q1']);
    expect(summarise(qs, (q) => done.has(q.id), []).firstUnansweredIndex).toBe(1);
  });

  it('has no gap to point at once everything is answered', () => {
    const result = summarise(qs, () => true, []);
    expect(result.firstUnansweredIndex).toBeNull();
    expect(result.unanswered).toBe(0);
  });

  it('counts gaps per block on an exam, each with its own first gap', () => {
    const done = new Set(['q1', 'q2', 'q3']);
    const { blocks } = summarise(qs, (q) => done.has(q.id), [], exam);

    expect(blocks).toEqual([
      {
        id: 'a',
        title: 'Majburiy',
        total: 2,
        answered: 2,
        unanswered: 0,
        firstUnansweredIndex: null,
      },
      { id: 'b', title: '1-blok', total: 2, answered: 1, unanswered: 1, firstUnansweredIndex: 3 },
    ]);
  });

  it('has no blocks for an ordinary test', () => {
    expect(summarise(qs, () => true, []).blocks).toEqual([]);
  });

  it('follows a shuffled order: the index is the shown position, not the stored one', () => {
    const shuffled = [qs[2]!, qs[0]!, qs[3]!, qs[1]!];
    const done = new Set(['q3', 'q1']);
    const { blocks, firstUnansweredIndex } = summarise(shuffled, (q) => done.has(q.id), [], exam);

    expect(firstUnansweredIndex).toBe(2);
    expect(blocks[1]?.firstUnansweredIndex).toBe(2);
  });
});
