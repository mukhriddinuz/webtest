import { describe, expect, it } from 'vitest';
import { buildTest } from '@/mocks/builders';
import type { Question, Test } from '@/services/types';
import { validateBasics, validateExam, validateTest } from './validation';

function makeTest(title: string): Test {
  const { test } = buildTest(
    {
      id: 't_demo',
      authorId: 'u_teacher_1',
      type: 'standard',
      title,
      description: '',
      subject: '',
      status: 'draft',
      questions: [],
    },
    Date.now(),
  );
  return test;
}

describe('validateBasics', () => {
  it('requires a name', () => {
    expect(validateBasics(makeTest('  ')).title).toBe('validation.titleRequired');
  });

  it('requires at least three characters', () => {
    expect(validateBasics(makeTest('AB')).title).toBe('validation.titleTooShort');
  });

  it('accepts a real name', () => {
    expect(validateBasics(makeTest('Algebra'))).toEqual({});
  });
});

describe('validateTest', () => {
  it('blocks publishing a test whose name is too short', () => {
    const issues = validateTest(makeTest('AB'), []);
    expect(issues.map((issue) => issue.key)).toContain('validation.titleTooShort');
  });
});

describe('validateExam', () => {
  const dtmTest = (sections: { id: string; subject: string }[]): Test =>
    ({
      id: 'e1',
      type: 'exam',
      title: 'Sinov',
      description: '',
      subject: '',
      settings: {
        exam: {
          preset: 'dtm',
          maxScore: 189,
          approximate: false,
          levels: [],
          sections: sections.map((section) => ({
            ...section,
            title: section.id,
            pointsPerQuestion: 1,
          })),
        },
      },
    }) as unknown as Test;

  const questionsIn = (sectionId: string, count: number): Question[] =>
    Array.from(
      { length: count },
      (_, i) => ({ id: `${sectionId}-${i}`, sectionId }) as unknown as Question,
    );

  it('refuses a block that is short of the paper it imitates', () => {
    const test = dtmTest([
      { id: 's_required', subject: 'Majburiy' },
      { id: 's_first', subject: 'Matematika' },
      { id: 's_second', subject: 'Fizika' },
    ]);
    const issues = validateExam(test, [
      ...questionsIn('s_required', 30),
      ...questionsIn('s_first', 29),
      ...questionsIn('s_second', 30),
    ]);

    expect(issues).toHaveLength(1);
    expect(issues[0]?.key).toBe('validation.examSectionCount');
    expect(issues[0]?.params).toMatchObject({ count: 30, actual: 29 });
  });

  it('accepts a paper whose blocks are all complete', () => {
    const test = dtmTest([
      { id: 's_required', subject: 'Majburiy' },
      { id: 's_first', subject: 'Matematika' },
      { id: 's_second', subject: 'Fizika' },
    ]);
    expect(
      validateExam(test, [
        ...questionsIn('s_required', 30),
        ...questionsIn('s_first', 30),
        ...questionsIn('s_second', 30),
      ]),
    ).toEqual([]);
  });

  it('asks for a subject on every block the author has to choose', () => {
    const test = dtmTest([
      { id: 's_required', subject: 'Majburiy' },
      { id: 's_first', subject: '  ' },
      { id: 's_second', subject: 'Fizika' },
    ]);
    const issues = validateExam(test, [
      ...questionsIn('s_required', 30),
      ...questionsIn('s_first', 30),
      ...questionsIn('s_second', 30),
    ]);
    expect(issues.map((issue) => issue.key)).toEqual(['validation.examSubjectRequired']);
  });

  it('leaves a plain test alone', () => {
    expect(validateExam({ type: 'standard' } as Test, [])).toEqual([]);
  });
});
