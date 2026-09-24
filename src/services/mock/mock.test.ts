import { beforeEach, describe, expect, it } from 'vitest';
import { buildSeedDatabase } from '@/mocks/seed';
import { useDevStore } from '@/store/dev';
import { mockApi } from './index';
import { clearDatabase, setDatabase } from './db';
import { ApiError } from '../api';

/**
 * Integration coverage for the mock backend: the same flows the Definition of
 * Done walks through by hand.
 */
beforeEach(() => {
  // No artificial latency or failures while testing.
  useDevStore.setState({ latencyMs: 0, errorRate: 0, channelCheckPasses: true });
  clearDatabase();
  // Seed relative to now, so contest windows land where the spec expects them.
  setDatabase(buildSeedDatabase(Date.now()));
});

describe('seed data', () => {
  it('creates the demo accounts and at least eight tests', async () => {
    const tests = await mockApi.tests.list();
    const users = await mockApi.users.list();
    expect(tests.length).toBeGreaterThanOrEqual(8);
    expect(users.filter((user) => user.role === 'teacher')).toHaveLength(2);
    expect(users.some((user) => user.role === 'admin')).toBe(true);
  });

  it('covers every test type and all four answer types', async () => {
    const tests = await mockApi.tests.list();
    const types = new Set(tests.map((test) => test.type));
    expect([...types].sort()).toEqual(['contest', 'limited', 'live', 'standard']);

    const questions = await Promise.all(tests.map((test) => mockApi.tests.questions(test.id)));
    const answerTypes = new Set(questions.flat().map((question) => question.type));
    expect([...answerTypes].sort()).toEqual(['multiple', 'numeric', 'single', 'text']);
  });

  it('covers every lifecycle state a card can show', async () => {
    const tests = await mockApi.tests.list();
    const statuses = new Set(tests.map((test) => test.status));
    expect([...statuses].sort()).toEqual(['active', 'archived', 'draft', 'finished', 'scheduled']);

    // Every test carries a name, otherwise cards render an empty first row.
    expect(tests.every((test) => test.title.trim() !== '')).toBe(true);
  });

  it('opens with a live room that is already gathering players', async () => {
    const open = await mockApi.live.listOpen();
    expect(open).toHaveLength(1);
    expect(open[0]?.status).toBe('lobby');
    expect(open[0]?.participants.length).toBeGreaterThan(0);

    const byCode = await mockApi.live.findByCode(open[0]?.code as string);
    expect(byCode?.id).toBe(open[0]?.id);
  });

  it('gives finished tests a realistic spread of attempts', async () => {
    const stats = await mockApi.tests.stats('t_algebra');
    expect(stats.attempts).toBeGreaterThan(30);
    expect(stats.averagePercent).toBeGreaterThan(20);
    expect(stats.averagePercent).toBeLessThan(95);
    expect(stats.scoreBuckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(stats.attempts);
    expect(stats.hardest).toHaveLength(5);
  });

  it('ranks the leaderboard by score', async () => {
    const rows = await mockApi.tests.leaderboard('t_algebra');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.rank).toBe(1);
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i - 1]!.score).toBeGreaterThanOrEqual(rows[i]!.score);
    }
  });
});

describe('authoring flow', () => {
  it('creates, fills, publishes and duplicates a test', async () => {
    const created = await mockApi.tests.create(
      {
        type: 'standard',
        title: 'Yangi test',
        description: '',
        subject: 'Matematika',
        settings: {},
      },
      'u_teacher_1',
    );
    expect(created.status).toBe('draft');

    await mockApi.tests.saveQuestions(created.id, [
      {
        id: 'nq1',
        testId: created.id,
        order: 0,
        type: 'single',
        content: [{ id: 'b1', type: 'text', value: '2 + 2 = ?' }],
        options: [
          { id: 'o1', content: [{ id: 'b2', type: 'text', value: '4' }], isCorrect: true },
          { id: 'o2', content: [{ id: 'b3', type: 'text', value: '5' }], isCorrect: false },
        ],
        acceptedAnswers: [],
        points: 1,
      },
    ]);

    const withQuestions = await mockApi.tests.get(created.id);
    expect(withQuestions.questionCount).toBe(1);

    const published = await mockApi.tests.setStatus(created.id, 'active');
    expect(published.status).toBe('active');
    expect(published.publishedAt).toBeTruthy();

    const copy = await mockApi.tests.duplicate(created.id, 'u_teacher_1');
    expect(copy.status).toBe('draft');
    expect(await mockApi.tests.questions(copy.id)).toHaveLength(1);

    await mockApi.tests.remove(copy.id);
    await expect(mockApi.tests.get(copy.id)).rejects.toBeInstanceOf(ApiError);
  });
});

describe('taking a test', () => {
  it('scores a submitted attempt and places it on the leaderboard', async () => {
    const { attempt, questions } = await mockApi.attempts.start('t_chemistry', 'u_admin');
    expect(attempt.status).toBe('in_progress');
    expect(questions.length).toBeGreaterThan(0);

    for (const question of questions) {
      if (question.type === 'single' || question.type === 'multiple') {
        const correct = question.options.filter((option) => option.isCorrect).map((o) => o.id);
        await mockApi.attempts.saveAnswer(attempt.id, {
          questionId: question.id,
          optionIds: correct,
          answeredAt: new Date().toISOString(),
        });
      } else if (question.type === 'text') {
        await mockApi.attempts.saveAnswer(attempt.id, {
          questionId: question.id,
          value: question.acceptedAnswers[0] ?? '',
          answeredAt: new Date().toISOString(),
        });
      } else if (question.numericAnswer) {
        await mockApi.attempts.saveAnswer(attempt.id, {
          questionId: question.id,
          value: String(question.numericAnswer.value),
          answeredAt: new Date().toISOString(),
        });
      }
    }

    const submitted = await mockApi.attempts.submit(attempt.id);
    expect(submitted.status).toBe('submitted');
    expect(submitted.percent).toBe(100);
    expect(submitted.rank).toBe(1);

    const rows = await mockApi.tests.leaderboard('t_chemistry');
    expect(rows[0]?.userId).toBe('u_admin');
  });

  it('restores an unfinished attempt instead of starting a second one', async () => {
    const first = await mockApi.attempts.start('t_algebra', 'u_admin');
    const second = await mockApi.attempts.start('t_algebra', 'u_admin');
    expect(second.attempt.id).toBe(first.attempt.id);

    const active = await mockApi.attempts.active('t_algebra', 'u_admin');
    expect(active?.id).toBe(first.attempt.id);
  });

  it('enforces the attempt limit', async () => {
    const { attempt } = await mockApi.attempts.start('t_geometry', 'u_admin');
    await mockApi.attempts.submit(attempt.id);
    await expect(mockApi.attempts.start('t_geometry', 'u_admin')).rejects.toMatchObject({
      code: 'attempt_limit',
    });
  });

  it('refuses to start a test that is not active', async () => {
    await expect(mockApi.attempts.start('t_biology_draft', 'u_admin')).rejects.toMatchObject({
      code: 'test_not_active',
    });
    await expect(mockApi.attempts.start('t_physics', 'u_admin')).rejects.toMatchObject({
      code: 'test_not_active',
    });
  });

  it('records anti-cheat tab switches and flags', async () => {
    const { attempt, questions } = await mockApi.attempts.start('t_algebra', 'u_student_1');
    const flagged = await mockApi.attempts.toggleFlag(attempt.id, questions[0]!.id);
    expect(flagged.flagged).toContain(questions[0]!.id);

    const switched = await mockApi.attempts.recordTabSwitch(attempt.id);
    expect(switched.tabSwitches).toBe(1);
  });
});

describe('limited seats', () => {
  it('closes registration once the limit is reached', async () => {
    const before = await mockApi.tests.seatsLeft('t_geometry');
    expect(before).toBe(3);

    await mockApi.tests.register('t_geometry', 'u_p91');
    await mockApi.tests.register('t_geometry', 'u_p92');
    await mockApi.tests.register('t_geometry', 'u_p93');

    expect(await mockApi.tests.seatsLeft('t_geometry')).toBe(0);
    await expect(mockApi.tests.register('t_geometry', 'u_admin')).rejects.toMatchObject({
      code: 'test_full',
    });
  });
});

describe('contest scheduling', () => {
  it('reports scheduled before the window and active inside it', async () => {
    const upcoming = await mockApi.tests.get('t_physics');
    expect(upcoming.status).toBe('scheduled');

    const running = await mockApi.tests.get('t_midterm');
    expect(running.status).toBe('active');
  });

  it('checks the password', async () => {
    expect(await mockApi.tests.verifyPassword('t_midterm', '2024')).toBe(true);
    expect(await mockApi.tests.verifyPassword('t_midterm', 'wrong')).toBe(false);
  });
});

describe('reset', () => {
  it('rebuilds the seed data', async () => {
    await mockApi.tests.remove('t_algebra');
    expect(await mockApi.tests.list()).not.toContainEqual(
      expect.objectContaining({ id: 't_algebra' }),
    );
    setDatabase(buildSeedDatabase(Date.now()));
    expect(await mockApi.tests.list()).toContainEqual(expect.objectContaining({ id: 't_algebra' }));
  });
});
