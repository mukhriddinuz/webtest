import { describe, expect, it } from 'vitest';
import {
  computeLiveScore,
  examLevelFor,
  gradeAttempt,
  gradeExam,
  gradeQuestion,
  isNumericAnswerCorrect,
  isTextAnswerCorrect,
  normalizeText,
  parseNumeric,
} from './grading';
import type { ExamConfig, GivenAnswer, Question, QuestionResult } from '@/services/types';

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

describe('exam grading', () => {
  const dtm: ExamConfig = {
    preset: 'dtm',
    maxScore: 189,
    approximate: false,
    levels: [],
    sections: [
      { id: 's_required', title: 'Majburiy fanlar', subject: 'Majburiy', pointsPerQuestion: 1.1 },
      { id: 's_first', title: '1-blok fan', subject: 'Matematika', pointsPerQuestion: 3.1 },
      { id: 's_second', title: '2-blok fan', subject: 'Fizika', pointsPerQuestion: 2.1 },
    ],
  };

  const milliy: ExamConfig = {
    preset: 'milliy',
    maxScore: 75,
    approximate: true,
    sections: [{ id: 's_main', title: 'Matematika', subject: 'Matematika', pointsPerQuestion: 1 }],
    levels: [
      { code: 'A+', minScore: 70 },
      { code: 'A', minScore: 65 },
      { code: 'B+', minScore: 60 },
      { code: 'B', minScore: 55 },
      { code: 'C+', minScore: 50 },
      { code: 'C', minScore: 46 },
    ],
  };

  /** `correct` of `total` questions answered correctly in that section. */
  const section = (sectionId: string, correct: number, total: number) => {
    const questions: Question[] = [];
    const results: QuestionResult[] = [];
    for (let i = 0; i < total; i += 1) {
      const id = `${sectionId}_q${i}`;
      questions.push({
        id,
        testId: 't',
        order: i,
        sectionId,
        type: 'single',
        content: [],
        options: [],
        acceptedAnswers: [],
        points: 1,
      });
      results.push({ questionId: id, correct: i < correct, partial: false, earned: 0, max: 1 });
    }
    return { questions, results };
  };

  const combine = (...parts: ReturnType<typeof section>[]) => ({
    questions: parts.flatMap((part) => part.questions),
    results: parts.flatMap((part) => part.results),
  });

  it('weighs each DTM block by its own coefficient', () => {
    const all = combine(
      section('s_required', 30, 30),
      section('s_first', 30, 30),
      section('s_second', 30, 30),
    );
    const grade = gradeExam(dtm, all.questions, all.results);

    expect(grade.score).toBe(189);
    expect(grade.sections.map((s) => s.score)).toEqual([33, 93, 63]);
    expect(grade.level).toBeNull();
  });

  it('scores a partly correct DTM paper block by block', () => {
    const all = combine(
      section('s_required', 20, 30),
      section('s_first', 18, 30),
      section('s_second', 24, 30),
    );
    const grade = gradeExam(dtm, all.questions, all.results);

    // 20×1.1 + 18×3.1 + 24×2.1
    expect(grade.sections.map((s) => s.score)).toEqual([22, 55.8, 50.4]);
    expect(grade.score).toBe(128.2);
  });

  it('scales a Milliy sertifikat onto its own range and names the band', () => {
    const all = section('s_main', 36, 45);
    const grade = gradeExam(milliy, all.questions, all.results);

    // 36/45 = 80% of 75
    expect(grade.score).toBe(60);
    expect(grade.level).toBe('B+');
    expect(grade.approximate).toBe(true);
  });

  it('withholds a band below the lowest threshold', () => {
    const all = section('s_main', 20, 45);
    expect(gradeExam(milliy, all.questions, all.results).level).toBeNull();
  });

  it('picks the highest band the score reaches', () => {
    expect(examLevelFor(70, milliy.levels)).toBe('A+');
    expect(examLevelFor(69.9, milliy.levels)).toBe('A');
    expect(examLevelFor(46, milliy.levels)).toBe('C');
    expect(examLevelFor(45.9, milliy.levels)).toBeNull();
  });
});
