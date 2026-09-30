import { del, get, set } from 'idb-keyval';
import { removeRaw } from '@/lib/storage';
import { devSettings } from '@/store/dev';
import { ApiError } from '../api';
import type { Attempt, LiveSession, Question, Test, TestRegistration, User } from '../types';

/** Where the database lived while it still fitted in localStorage. */
export const LEGACY_DB_KEY = 'testhub.db.v1';
/**
 * The database lives in IndexedDB: a fully populated demo runs to several
 * megabytes, past what localStorage will hold. It is read once at start-up
 * into memory, so every call after that stays synchronous.
 */
export const DB_KEY = 'testhub:db';
/**
 * Bumped whenever the seed material changes shape or content: a device holding
 * an older database discards it and seeds again, which is also what refreshes
 * the stored artwork.
 */
export const DB_VERSION = 5;

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

const SAVE_DELAY_MS = 400;
let saveTimer: number | undefined;

const hasIndexedDb = () => typeof indexedDB !== 'undefined';

/** Writes the in-memory database out now. Failures only cost persistence. */
export async function flushDatabase(): Promise<void> {
  if (saveTimer !== undefined) {
    window.clearTimeout(saveTimer);
    saveTimer = undefined;
  }
  if (!cache || !hasIndexedDb()) return;
  try {
    await set(DB_KEY, cache);
  } catch {
    // A full or blocked store leaves the session working, just not remembered.
  }
}

/** Saves shortly after the last change, so a burst of writes is one write. */
function scheduleSave(): void {
  if (!hasIndexedDb()) return;
  if (saveTimer !== undefined) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => void flushDatabase(), SAVE_DELAY_MS);
}

if (typeof document !== 'undefined') {
  // A WebView can be killed the moment it is hidden; save before that.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushDatabase();
  });
  window.addEventListener('pagehide', () => void flushDatabase());
}

/** Loads the stored database into memory. Call once before the first `db()`. */
export async function loadDatabase(): Promise<void> {
  removeRaw(LEGACY_DB_KEY);
  if (!hasIndexedDb()) return;
  try {
    const stored = await get<MockDatabase>(DB_KEY);
    if (stored && stored.version === DB_VERSION) cache = stored;
  } catch {
    // Unreadable storage: start from a fresh seed.
  }
}

export function db(): MockDatabase {
  if (!cache) cache = emptyDatabase();
  return cache;
}

export function setDatabase(next: MockDatabase): void {
  cache = next;
  scheduleSave();
}

/** Mutates the database and persists it in one step. */
export function mutate<T>(recipe: (draft: MockDatabase) => T): T {
  const result = recipe(db());
  scheduleSave();
  return result;
}

export function clearDatabase(): void {
  cache = null;
  if (saveTimer !== undefined) {
    window.clearTimeout(saveTimer);
    saveTimer = undefined;
  }
  if (hasIndexedDb()) void del(DB_KEY).catch(() => undefined);
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
