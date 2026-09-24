import type {
  Attempt,
  GivenAnswer,
  ImportResult,
  LeaderboardRow,
  LiveEvent,
  LiveSession,
  Question,
  Test,
  TestDraftInput,
  TestStats,
  TestStatus,
  TestType,
  User,
} from './types';

/**
 * The only surface the UI is allowed to talk to. Two implementations exist:
 * `services/mock` (used today) and `services/http` (filled in once the backend
 * lands). Selected by VITE_API_MODE.
 */

export interface TestListParams {
  authorId?: string;
  status?: TestStatus | 'all';
  type?: TestType | 'all';
  search?: string;
}

export interface ParticipantRow {
  attempt: Attempt;
  user: User;
}

export interface UserStats {
  created: number;
  taken: number;
  averagePercent: number;
  bestPercent: number;
}

export interface StartAttemptResult {
  attempt: Attempt;
  questions: Question[];
}

export interface TestsApi {
  list(params?: TestListParams): Promise<Test[]>;
  get(id: string): Promise<Test>;
  create(input: TestDraftInput, authorId: string): Promise<Test>;
  update(id: string, patch: Partial<Test>): Promise<Test>;
  remove(id: string): Promise<void>;
  duplicate(id: string, authorId: string): Promise<Test>;
  setStatus(id: string, status: TestStatus): Promise<Test>;
  questions(testId: string): Promise<Question[]>;
  saveQuestions(testId: string, questions: Question[]): Promise<Question[]>;
  stats(testId: string): Promise<TestStats>;
  leaderboard(testId: string): Promise<LeaderboardRow[]>;
  participants(testId: string): Promise<ParticipantRow[]>;
  register(testId: string, userId: string): Promise<void>;
  isRegistered(testId: string, userId: string): Promise<boolean>;
  /** Tests this user signed up for and has not taken yet. */
  registeredTests(userId: string): Promise<Test[]>;
  verifyPassword(testId: string, password: string): Promise<boolean>;
  checkChannelSubscription(testId: string, userId: string): Promise<boolean>;
  /** Seats left for limited tests; `null` when unlimited. */
  seatsLeft(testId: string): Promise<number | null>;
}

export interface AttemptsApi {
  start(testId: string, userId: string): Promise<StartAttemptResult>;
  get(attemptId: string): Promise<Attempt>;
  /** Unfinished attempt of this user on this test, if any. */
  active(testId: string, userId: string): Promise<Attempt | null>;
  questionsFor(attemptId: string): Promise<Question[]>;
  saveAnswer(attemptId: string, answer: GivenAnswer): Promise<Attempt>;
  toggleFlag(attemptId: string, questionId: string): Promise<Attempt>;
  recordTabSwitch(attemptId: string): Promise<Attempt>;
  submit(attemptId: string): Promise<Attempt>;
  listByUser(userId: string): Promise<Attempt[]>;
  listByTest(testId: string): Promise<Attempt[]>;
}

export interface UsersApi {
  /** Resolves (and lazily creates) the account behind a Telegram id. */
  resolve(telegramUser: {
    id: number;
    firstName: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
  }): Promise<User>;
  get(id: string): Promise<User>;
  list(): Promise<User[]>;
  setBlocked(id: string, blocked: boolean): Promise<User>;
  stats(userId: string): Promise<UserStats>;
}

export interface LiveApi {
  createSession(testId: string, hostId: string): Promise<LiveSession>;
  getSession(sessionId: string): Promise<LiveSession>;
  findByCode(code: string): Promise<LiveSession | null>;
  /** Sessions that are on air — gathering participants or already running. */
  listOpen(): Promise<LiveSession[]>;
  join(
    sessionId: string,
    user: { id: string; name: string; photoUrl?: string },
  ): Promise<LiveSession>;
  subscribe(sessionId: string, handler: (event: LiveEvent) => void): () => void;
  start(sessionId: string): Promise<void>;
  next(sessionId: string): Promise<void>;
  reveal(sessionId: string): Promise<void>;
  pause(sessionId: string): Promise<void>;
  resume(sessionId: string): Promise<void>;
  finish(sessionId: string): Promise<void>;
  answer(
    sessionId: string,
    userId: string,
    payload: { optionIds?: string[]; value?: string },
  ): Promise<void>;
}

export interface AdminApi {
  overview(): Promise<{ users: number; tests: number; attempts: number }>;
  tests(): Promise<Test[]>;
}

export interface ImportApi {
  parseText(source: string): ImportResult;
  parseWorkbook(file: File): Promise<ImportResult>;
  templateWorkbook(): Promise<Blob>;
}

export interface Api {
  tests: TestsApi;
  attempts: AttemptsApi;
  users: UsersApi;
  live: LiveApi;
  admin: AdminApi;
  /** Restores the seed dataset. Mock only; a no-op against a real backend. */
  reset(): Promise<void>;
}

/** Errors the UI can branch on without parsing messages. */
export type ApiErrorCode =
  | 'not_found'
  | 'forbidden'
  | 'test_full'
  | 'test_not_active'
  | 'attempt_limit'
  | 'wrong_password'
  | 'not_subscribed'
  | 'network';

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'ApiError';
  }
}
