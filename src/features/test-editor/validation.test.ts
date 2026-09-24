import { describe, expect, it } from 'vitest';
import { buildTest } from '@/mocks/builders';
import type { Test } from '@/services/types';
import { validateBasics, validateTest } from './validation';

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
