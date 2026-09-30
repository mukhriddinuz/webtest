import { describe, expect, it } from 'vitest';
import { effectiveStatus } from '@/services/mock/tests';
import { buildSeedDatabase } from './seed';

const NOW = Date.UTC(2026, 8, 30, 10, 0, 0);
const database = buildSeedDatabase(NOW);

describe('demo dataset', () => {
  it('is large enough to show every screen full', () => {
    expect(database.tests.length).toBeGreaterThanOrEqual(60);
    expect(database.users.length).toBeGreaterThanOrEqual(400);
    expect(database.attempts.length).toBeGreaterThanOrEqual(1500);
    expect(database.liveSessions.length).toBeGreaterThanOrEqual(6);
  });

  it('stays within what IndexedDB stores comfortably', () => {
    // Guards against a runaway generator: the whole database is one value.
    expect(JSON.stringify(database).length).toBeLessThan(16_000_000);
  });

  it('has no dangling references', () => {
    const tests = new Set(database.tests.map((test) => test.id));
    const users = new Set(database.users.map((user) => user.id));
    for (const attempt of database.attempts) {
      expect(tests.has(attempt.testId)).toBe(true);
      expect(users.has(attempt.userId)).toBe(true);
    }
    for (const row of database.registrations) {
      expect(tests.has(row.testId)).toBe(true);
      expect(users.has(row.userId)).toBe(true);
    }
    for (const test of database.tests) expect(users.has(test.authorId)).toBe(true);
    for (const question of database.questions) expect(tests.has(question.testId)).toBe(true);
  });

  it('keeps every count in step with the rows behind it', () => {
    for (const test of database.tests) {
      const questions = database.questions.filter((question) => question.testId === test.id);
      expect(test.questionCount).toBe(questions.length);
      const finished = database.attempts.filter(
        (attempt) => attempt.testId === test.id && attempt.status === 'submitted',
      ).length;
      const signedUp = database.registrations.filter((row) => row.testId === test.id).length;
      if (finished > 0) expect(test.participantCount).toBe(finished);
      else if (signedUp > 0) expect(test.participantCount).toBe(signedUp);
    }
  });

  it('gives every live room a distinct join code and an open test', () => {
    const codes = database.liveSessions.map((session) => session.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const session of database.liveSessions) {
      const test = database.tests.find((item) => item.id === session.testId);
      expect(test?.type).toBe('live');
      expect(session.participants.length).toBeGreaterThan(0);
    }
  });

  it('leaves the demo teacher papers to continue, and only on open tests', () => {
    const running = database.attempts.filter(
      (attempt) => attempt.userId === 'u_teacher_1' && attempt.status === 'in_progress',
    );
    expect(running.length).toBeGreaterThanOrEqual(3);
    for (const attempt of running) {
      const test = database.tests.find((item) => item.id === attempt.testId);
      expect(test && effectiveStatus(test, NOW)).toBe('active');
      const submitted = database.attempts.filter(
        (item) =>
          item.testId === attempt.testId &&
          item.userId === attempt.userId &&
          item.status === 'submitted',
      );
      expect(submitted).toHaveLength(0);
    }
  });

  it('shows the demo teacher a full My tests list in every state', () => {
    const own = database.tests.filter((test) => test.authorId === 'u_teacher_1');
    expect(own.length).toBeGreaterThanOrEqual(20);
    const states = new Set(own.map((test) => effectiveStatus(test, NOW)));
    for (const state of ['draft', 'scheduled', 'active', 'finished', 'archived']) {
      expect(states.has(state as never)).toBe(true);
    }
  });

  it('spans every type, access mode and both exam kinds', () => {
    const types = new Set(database.tests.map((test) => test.type));
    expect([...types].sort()).toEqual(['contest', 'exam', 'limited', 'live', 'standard']);
    const access = new Set(database.tests.map((test) => test.settings.access));
    expect([...access].sort()).toEqual(['invite', 'open', 'password']);
    const presets = database.tests.map((test) => test.settings.exam?.preset).filter(Boolean);
    expect(presets.filter((preset) => preset === 'dtm').length).toBeGreaterThanOrEqual(4);
    expect(presets.filter((preset) => preset === 'milliy').length).toBeGreaterThanOrEqual(6);
  });

  it('has a full contest, a blocked account and unique names', () => {
    const full = database.tests.find((test) => test.id === 'l_intensive');
    expect(full?.participantCount).toBe(full?.settings.participantLimit);
    expect(database.users.filter((user) => user.isBlocked).length).toBeGreaterThanOrEqual(5);
    const names = database.users.map((user) => `${user.firstName} ${user.lastName}`);
    expect(new Set(names).size).toBeGreaterThanOrEqual(names.length - 2);
  });

  it('is the same every time it is built for the same moment', () => {
    const again = buildSeedDatabase(NOW);
    expect(again.attempts.map((attempt) => attempt.score)).toEqual(
      database.attempts.map((attempt) => attempt.score),
    );
  });
});
