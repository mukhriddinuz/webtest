import { describe, expect, it } from 'vitest';
import {
  computeLiveScore,
  gradeAttempt,
  gradeQuestion,
  isNumericAnswerCorrect,
  isTextAnswerCorrect,
  normalizeText,
  parseNumeric,
} from './grading';
import type { GivenAnswer, Question } from '@/services/types';

const baseQuestion = (over: Partial<Question>): Question => ({
  id: 'q1',
  testId: 't1',
  order: 0,
  type: 'single',
  content: [{ id: 'c1', type: 'text', value: 'Savol' }],
  options: [],
  acceptedAnswers: [],
  points: 10,
  ...over,
});

const answer = (over: Partial<GivenAnswer>): GivenAnswer => ({
  questionId: 'q1',
  answeredAt: new Date().toISOString(),
  ...over,
});

describe('normalizeText', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalizeText('  Toshkent   Shahri ')).toBe('toshkent shahri');
  });

  it('ignores apostrophe variants', () => {
    expect(normalizeText('O‘zbekiston')).toBe(normalizeText("o'zbekiston"));
    expect(normalizeText('Oʻzbekiston')).toBe('ozbekiston');
  });

  it('transliterates cyrillic to latin', () => {
    expect(normalizeText('Ўзбекистон')).toBe('ozbekiston');
    expect(normalizeText('Тошкент')).toBe(normalizeText('Toshkent'));
  });

  it('drops punctuation', () => {
    expect(normalizeText('Amir Temur, 1336-yil.')).toBe('amir temur 1336 yil');
  });
});

describe('parseNumeric', () => {
  it('accepts comma decimals and surrounding spaces', () => {
    expect(parseNumeric(' 3,14 ')).toBe(3.14);
  });

  it('accepts the unicode minus sign', () => {
    expect(parseNumeric('−5')).toBe(-5);
  });

  it('rejects non numeric input', () => {
    expect(parseNumeric('12a')).toBeNull();
    expect(parseNumeric('')).toBeNull();
  });
});

describe('text answers', () => {
  it('matches any accepted spelling', () => {
    expect(isTextAnswerCorrect(['have been', 'has been'], '  Has Been ')).toBe(true);
  });

  it('rejects an empty answer', () => {
    expect(isTextAnswerCorrect(['a'], '   ')).toBe(false);
  });
});

describe('numeric answers', () => {
  it('honours the tolerance band', () => {
    expect(isNumericAnswerCorrect({ value: 9.8, tolerance: 0.2 }, '9.65')).toBe(true);
    expect(isNumericAnswerCorrect({ value: 9.8, tolerance: 0.2 }, '9.5')).toBe(false);
  });

  it('treats zero tolerance as exact', () => {
    expect(isNumericAnswerCorrect({ value: 98, tolerance: 0 }, '98')).toBe(true);
    expect(isNumericAnswerCorrect({ value: 98, tolerance: 0 }, '98.1')).toBe(false);
  });
});

describe('gradeQuestion', () => {
  const single = baseQuestion({
    type: 'single',
    options: [
      { id: 'a', content: [], isCorrect: false },
      { id: 'b', content: [], isCorrect: true },
    ],
  });

  it('awards full points for the correct option', () => {
    expect(gradeQuestion(single, answer({ optionIds: ['b'] })).earned).toBe(10);
  });

  it('returns zero for an unanswered question, even with a penalty', () => {
    const result = gradeQuestion(single, undefined, { penaltyPoints: 2, partialCredit: true });
    expect(result.earned).toBe(0);
    expect(result.correct).toBe(false);
  });

  it('applies the penalty to a wrong option', () => {
    const result = gradeQuestion(single, answer({ optionIds: ['a'] }), {
      penaltyPoints: 2.5,
      partialCredit: true,
    });
    expect(result.earned).toBe(-2.5);
  });

  const multiple = baseQuestion({
    type: 'multiple',
    options: [
      { id: 'a', content: [], isCorrect: true },
      { id: 'b', content: [], isCorrect: true },
      { id: 'c', content: [], isCorrect: false },
      { id: 'd', content: [], isCorrect: false },
    ],
  });

  it('gives full credit only for the exact correct set', () => {
    const result = gradeQuestion(multiple, answer({ optionIds: ['a', 'b'] }));
    expect(result.correct).toBe(true);
    expect(result.earned).toBe(10);
  });

  it('gives partial credit for a subset', () => {
    const result = gradeQuestion(multiple, answer({ optionIds: ['a'] }));
    expect(result.partial).toBe(true);
    expect(result.earned).toBe(5);
  });

  it('subtracts wrong picks from partial credit', () => {
    const result = gradeQuestion(multiple, answer({ optionIds: ['a', 'b', 'c'] }));
    expect(result.earned).toBe(5);
  });

  it('never returns partial credit below zero', () => {
    const result = gradeQuestion(multiple, answer({ optionIds: ['c', 'd'] }));
    expect(result.earned).toBe(0);
  });

  it('can disable partial credit', () => {
    const result = gradeQuestion(multiple, answer({ optionIds: ['a'] }), {
      penaltyPoints: 0,
      partialCredit: false,
    });
    expect(result.earned).toBe(0);
    expect(result.partial).toBe(false);
  });
});

describe('gradeAttempt', () => {
  const questions: Question[] = [
    baseQuestion({
      id: 'q1',
      type: 'single',
      options: [
        { id: 'a', content: [], isCorrect: true },
        { id: 'b', content: [], isCorrect: false },
      ],
    }),
    baseQuestion({ id: 'q2', type: 'text', acceptedAnswers: ['Toshkent'], points: 5 }),
    baseQuestion({
      id: 'q3',
      type: 'numeric',
      numericAnswer: { value: 4, tolerance: 0 },
      points: 5,
    }),
  ];

  it('sums points and computes a percentage', () => {
    const grade = gradeAttempt(questions, {
      q1: answer({ questionId: 'q1', optionIds: ['a'] }),
      q2: answer({ questionId: 'q2', value: 'toshkent' }),
      q3: answer({ questionId: 'q3', value: '5' }),
    });
    expect(grade.maxScore).toBe(20);
    expect(grade.score).toBe(15);
    expect(grade.percent).toBe(75);
  });

  it('clamps a negative total to zero', () => {
    const grade = gradeAttempt(
      questions,
      { q1: answer({ questionId: 'q1', optionIds: ['b'] }) },
      { penaltyPoints: 5, partialCredit: true },
    );
    expect(grade.score).toBe(0);
    expect(grade.percent).toBe(0);
  });

  it('handles an attempt with no questions', () => {
    const grade = gradeAttempt([], {});
    expect(grade.percent).toBe(0);
    expect(grade.maxScore).toBe(0);
  });
});

describe('computeLiveScore', () => {
  it('awards nothing for a wrong answer', () => {
    expect(
      computeLiveScore({
        basePoints: 100,
        correct: false,
        elapsedMs: 100,
        limitMs: 20000,
        speedBonus: 0.5,
      }),
    ).toBe(0);
  });

  it('rewards a fast correct answer more than a slow one', () => {
    const fast = computeLiveScore({
      basePoints: 100,
      correct: true,
      elapsedMs: 1000,
      limitMs: 20000,
      speedBonus: 0.5,
    });
    const slow = computeLiveScore({
      basePoints: 100,
      correct: true,
      elapsedMs: 19000,
      limitMs: 20000,
      speedBonus: 0.5,
    });
    expect(fast).toBeGreaterThan(slow);
    expect(slow).toBeGreaterThanOrEqual(100);
    expect(fast).toBeLessThanOrEqual(150);
  });

  it('adds a streak bonus from the third correct answer', () => {
    const withStreak = computeLiveScore({
      basePoints: 100,
      correct: true,
      elapsedMs: 20000,
      limitMs: 20000,
      speedBonus: 0,
      streak: 3,
    });
    expect(withStreak).toBe(110);
  });
});
