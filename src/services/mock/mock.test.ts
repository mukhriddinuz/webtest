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
    expect([...types].sort()).toEqual(['contest', 'exam', 'limited', 'live', 'standard']);

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

describe('resolving a Telegram account', () => {
  const visitor = { id: 777000111, firstName: 'Muxriddin', username: 'muxriddin' };

  it('hands the first visitor the demo teacher, so the app is not empty', async () => {
    const user = await mockApi.users.resolve(visitor);

    expect(user.id).toBe('u_teacher_1');
    expect(user.firstName).toBe('Muxriddin');
    // The demo teacher's own name must not linger on the adopted account.
    expect(user.lastName).toBeUndefined();
    expect(user.username).toBe('muxriddin');

    const stats = await mockApi.users.stats(user.id);
    expect(stats.created).toBeGreaterThan(0);
    expect(stats.taken).toBeGreaterThan(0);
  });

  it('returns the same account on a second visit', async () => {
    const first = await mockApi.users.resolve(visitor);
    const again = await mockApi.users.resolve({ ...visitor, firstName: 'Muhriddin' });

    expect(again.id).toBe(first.id);
    expect(again.firstName).toBe('Muhriddin');
  });

  it('creates a fresh account once the demo teacher is taken', async () => {
    await mockApi.users.resolve(visitor);
    const other = await mockApi.users.resolve({ id: 777000222, firstName: 'Sitora' });

    expect(other.id).not.toBe('u_teacher_1');
    expect((await mockApi.users.stats(other.id)).created).toBe(0);
  });
});

describe('exam variants', () => {
  it('seeds a DTM paper whose blocks add up to 189', async () => {
    const test = await mockApi.tests.get('e_dtm_math_physics');
    const config = test.settings.exam;
    const questions = await mockApi.tests.questions(test.id);

    expect(config?.preset).toBe('dtm');
    expect(questions).toHaveLength(90);

    // Every question belongs to a block, and every block holds 30 of them.
    const perSection = config!.sections.map(
      (section) => questions.filter((question) => question.sectionId === section.id).length,
    );
    expect(perSection).toEqual([30, 30, 30]);

    const max = config!.sections.reduce(
      (sum, section, index) => sum + section.pointsPerQuestion * (perSection[index] as number),
      0,
    );
    expect(Math.round(max)).toBe(config!.maxScore);
  });

  it('seeds a Milliy sertifikat variant with its level bands', async () => {
    const test = await mockApi.tests.get('e_milliy_math');
    const config = test.settings.exam;

    expect(config?.preset).toBe('milliy');
    expect(config?.maxScore).toBe(75);
    expect(config?.approximate).toBe(true);
    expect(config?.levels.map((level) => level.code)).toEqual(['A+', 'A', 'B+', 'B', 'C+', 'C']);
    expect(await mockApi.tests.questions(test.id)).toHaveLength(43);
  });

  it('keeps every exam question answerable without a human marker', async () => {
    for (const id of ['e_dtm_math_physics', 'e_milliy_math']) {
      const questions = await mockApi.tests.questions(id);
      for (const question of questions) {
        if (question.type === 'single') {
          expect(question.options.filter((option) => option.isCorrect)).toHaveLength(1);
          expect(question.options.length).toBeGreaterThanOrEqual(4);
          // A distractor that repeats the answer makes the question unfair.
          const bodies = question.options.map((option) => JSON.stringify(option.content[0]));
          expect(new Set(bodies).size).toBe(bodies.length);
        } else {
          expect(question.numericAnswer).toBeDefined();
        }

        // A formula printed with a zero term ("x^2 + 0x − 36") reads as a
        // generator artefact rather than as an exam question.
        for (const block of question.content) {
          if (block.type === 'formula') {
            expect(block.value).not.toMatch(/[+−-]\s*0(x|\s*=)/);
          }
        }
      }
    }
  });
});

describe('guaranteed participants', () => {
  it('gives the demo accounts the attempts the seed promises them', async () => {
    // The pool is shuffled; naming an account here must still place it.
    const mine = await mockApi.attempts.listByUser('u_teacher_1');
    const taken = mine.filter((attempt) => attempt.status === 'submitted').map((a) => a.testId);

    expect(taken).toContain('e_dtm_math_physics');
    expect(taken).toContain('e_milliy_math');
    expect(taken).toContain('t_chemistry');
  });
});
