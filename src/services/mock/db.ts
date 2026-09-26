import { readJson, removeRaw, writeJson } from '@/lib/storage';
import { devSettings } from '@/store/dev';
import { ApiError } from '../api';
import type { Attempt, LiveSession, Question, Test, TestRegistration, User } from '../types';

export const DB_KEY = 'testhub.db.v1';
/**
 * Bumped whenever the seed material changes shape or content: a device holding
 * an older database discards it and seeds again, which is also what refreshes
 * the stored artwork.
 */
export const DB_VERSION = 3;

export interface MockDatabase {
  version: number;
  users: User[];
  tests: Test[];
  questions: Question[];
  attempts: Attempt[];
  registrations: TestRegistration[];
  liveSessions: LiveSession[];
}

export const emptyDatabase = (): MockDatabase => ({
  version: DB_VERSION,
  users: [],
  tests: [],
  questions: [],
  attempts: [],
  registrations: [],
  liveSessions: [],
});

let cache: MockDatabase | null = null;

export function db(): MockDatabase {
  if (!cache) {
    const stored = readJson<MockDatabase | null>(DB_KEY, null);
    cache = stored && stored.version === DB_VERSION ? stored : emptyDatabase();
  }
  return cache;
}

export function setDatabase(next: MockDatabase): void {
  cache = next;
  writeJson(DB_KEY, next);
}

/** Mutates the database and persists it in one step. */
export function mutate<T>(recipe: (draft: MockDatabase) => T): T {
  const current = db();
  const result = recipe(current);
  writeJson(DB_KEY, current);
  return result;
}

export function clearDatabase(): void {
  cache = null;
  removeRaw(DB_KEY);
}

export function hasData(): boolean {
  return db().tests.length > 0 || db().users.length > 0;
}

/**
 * Every mock call goes through here so the dev panel's latency and error
 * simulation apply uniformly, exactly like a real network boundary would.
 */
export async function simulate<T>(produce: () => T): Promise<T> {
  const { latencyMs, errorRate } = devSettings();
  if (latencyMs > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, latencyMs));
  }
  if (errorRate > 0 && Math.random() < errorRate) {
    throw new ApiError('network', 'Simulated network failure');
  }
  return produce();
}

export function requireTest(id: string): Test {
  const test = db().tests.find((item) => item.id === id);
  if (!test) throw new ApiError('not_found', `Test ${id} not found`);
  return test;
}

export function requireUser(id: string): User {
  const user = db().users.find((item) => item.id === id);
  if (!user) throw new ApiError('not_found', `User ${id} not found`);
  return user;
}

export function requireAttempt(id: string): Attempt {
  const attempt = db().attempts.find((item) => item.id === id);
  if (!attempt) throw new ApiError('not_found', `Attempt ${id} not found`);
  return attempt;
}

export function requireSession(id: string): LiveSession {
  const session = db().liveSessions.find((item) => item.id === id);
  if (!session) throw new ApiError('not_found', `Session ${id} not found`);
  return session;
}

export function questionsOf(testId: string): Question[] {
  return db()
    .questions.filter((question) => question.testId === testId)
    .sort((a, b) => a.order - b.order);
}
