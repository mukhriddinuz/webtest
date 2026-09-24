import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@/i18n';
import { buildTest } from '@/mocks/builders';
import type { Test } from '@/services/types';
import uz from '@/i18n/uz.json';
import { TestCard } from './TestCard';

function makeTest(overrides: Partial<Test> = {}): Test {
  const { test } = buildTest(
    {
      id: 't_demo',
      authorId: 'u_teacher_1',
      type: 'standard',
      title: 'Algebra: kvadrat tenglamalar',
      description: '',
      subject: 'Matematika',
      status: 'active',
      questions: [],
    },
    Date.now(),
  );
  return { ...test, questionCount: 12, participantCount: 30, ...overrides };
}

describe('TestCard', () => {
  it('shows the test name as the first line', () => {
    render(<TestCard test={makeTest()} />);
    expect(screen.getByText('Algebra: kvadrat tenglamalar')).toBeTruthy();
  });

  it('falls back to a placeholder when the name is empty', () => {
    render(<TestCard test={makeTest({ title: '   ' })} />);
    expect(screen.getByText(uz.testCard.untitled)).toBeTruthy();
  });

  it('replaces the counters of a draft with its next step', () => {
    render(<TestCard test={makeTest({ status: 'draft', questionCount: 0 })} />);
    expect(screen.getByText(uz.testCard.draftNoQuestions)).toBeTruthy();
    expect(screen.getByText(uz.testCard.continueEditing)).toBeTruthy();
  });

  it('marks a test as on air only while a session is running', () => {
    const test = makeTest({ type: 'live' });
    const { rerender } = render(<TestCard test={test} />);
    expect(screen.queryByText(uz.testCard.onAir)).toBeNull();

    rerender(<TestCard test={test} onAir />);
    expect(screen.getByText(uz.testCard.onAir)).toBeTruthy();
  });
});
