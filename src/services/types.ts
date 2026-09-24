/**
 * Domain model. Mirrors the future database schema so that swapping the mock
 * implementation for an HTTP one requires no changes above `services/`.
 */

export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  role: Role;
  languageCode?: 'uz' | 'ru';
  isBlocked: boolean;
  createdAt: string;
}

export type TestType = 'standard' | 'contest' | 'limited' | 'live';
export type TestStatus = 'draft' | 'scheduled' | 'active' | 'finished' | 'archived';

export type QuestionType = 'single' | 'multiple' | 'text' | 'numeric';

/** Rich content is a list of blocks so text, formulas and images can mix freely. */
export type ContentBlock =
  | { id: string; type: 'text'; value: string }
  | { id: string; type: 'formula'; value: string; display: boolean }
  | { id: string; type: 'image'; imageId: string; caption?: string };

export interface AnswerOption {
  id: string;
  content: ContentBlock[];
  isCorrect: boolean;
}

export interface Question {
  id: string;
  testId: string;
  order: number;
  type: QuestionType;
  content: ContentBlock[];
  options: AnswerOption[];
  /** Accepted answers for `text` questions (case/whitespace insensitive). */
  acceptedAnswers: string[];
  /** Expected value and tolerance for `numeric` questions. */
  numericAnswer?: { value: number; tolerance: number };
  points: number;
  /** Per-question limit in seconds — live tests only. */
  timeLimitSec?: number;
  explanation?: ContentBlock[];
}

export type AccessMode = 'open' | 'password' | 'invite';
export type ResultVisibility = 'immediately' | 'after_finish' | 'never';

export interface TestSettings {
  /** Total duration in minutes. `null` = unlimited. */
  durationMin: number | null;
  /** Contest window. */
  startsAt?: string;
  endsAt?: string;
  /** Limited tests. */
  participantLimit?: number;
  attemptLimit: number;
  access: AccessMode;
  password?: string;
  inviteCode?: string;
  requiredChannels: { id: string; title: string; username: string }[];
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  /** Points subtracted for a wrong answer (0 = disabled). */
  penaltyPoints: number;
  allowBack: boolean;
  showResult: ResultVisibility;
  showCorrectAnswers: boolean;
  antiCheat: boolean;
  /** Live tests: speed bonus weight, 0..1. */
  speedBonus: number;
}

export interface Test {
  id: string;
  authorId: string;
  type: TestType;
  title: string;
  description: string;
  subject: string;
  coverImageId?: string;
  status: TestStatus;
  settings: TestSettings;
  questionCount: number;
  participantCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'expired';

export interface GivenAnswer {
  questionId: string;
  /** Selected option ids for single/multiple. */
  optionIds?: string[];
  /** Raw input for text/numeric. */
  value?: string;
  answeredAt: string;
  /** Milliseconds spent, used for live speed bonus and analytics. */
  timeSpentMs?: number;
}

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  partial: boolean;
  earned: number;
  max: number;
}

export interface Attempt {
  id: string;
  testId: string;
  userId: string;
  status: AttemptStatus;
  startedAt: string;
  finishedAt?: string;
  /** Deadline computed from the test duration, if any. */
  deadlineAt?: string;
  answers: Record<string, GivenAnswer>;
  flagged: string[];
  /** Question order for this attempt (supports shuffling). */
  questionOrder: string[];
  score: number;
  maxScore: number;
  percent: number;
  results: QuestionResult[];
  /** Anti-cheat: how many times the participant left the page. */
  tabSwitches: number;
  rank?: number;
}

export interface LeaderboardRow {
  rank: number;
  userId: string;
  userName: string;
  photoUrl?: string;
  score: number;
  maxScore: number;
  percent: number;
  timeSec: number;
  attemptId: string;
}

export interface TestRegistration {
  testId: string;
  userId: string;
  registeredAt: string;
}

/* ------------------------------ live sessions ----------------------------- */

export type LiveStatus = 'lobby' | 'question' | 'reveal' | 'paused' | 'finished';

export interface LiveParticipant {
  userId: string;
  name: string;
  photoUrl?: string;
  score: number;
  streak: number;
  /** Points won on the most recent question. */
  lastGain?: number;
  joinedAt: string;
  isBot: boolean;
}

export interface LiveSession {
  id: string;
  testId: string;
  hostId: string;
  code: string;
  status: LiveStatus;
  currentIndex: number;
  questionStartedAt?: string;
  participants: LiveParticipant[];
  createdAt: string;
}

export interface LiveAnswerTally {
  /** optionId -> count. Text/numeric questions report correct vs wrong. */
  counts: Record<string, number>;
  answered: number;
  total: number;
}

export interface LiveRoundResult {
  questionId: string;
  correctOptionIds: string[];
  tally: LiveAnswerTally;
  leaderboard: LiveLeaderboardRow[];
}

export interface LiveLeaderboardRow {
  userId: string;
  name: string;
  photoUrl?: string;
  score: number;
  gained: number;
  rank: number;
  previousRank: number;
}

/** Event names match the future WebSocket protocol exactly. */
export type LiveEvent =
  | { type: 'lobby_update'; participants: LiveParticipant[] }
  | { type: 'session_started'; questionCount: number }
  | {
      type: 'question_show';
      index: number;
      question: Question;
      durationSec: number;
      startedAt: string;
    }
  | { type: 'answer_count_update'; tally: LiveAnswerTally }
  | { type: 'question_end'; result: LiveRoundResult }
  | { type: 'leaderboard'; rows: LiveLeaderboardRow[] }
  | { type: 'session_paused' }
  | { type: 'session_resumed' }
  | { type: 'session_finished'; rows: LiveLeaderboardRow[] };

/* -------------------------------- analytics ------------------------------- */

export interface QuestionStat {
  questionId: string;
  order: number;
  preview: string;
  correctRate: number;
  answered: number;
  /** optionId -> times chosen. */
  optionDistribution: Record<string, number>;
}

export interface TestStats {
  attempts: number;
  averagePercent: number;
  averageTimeSec: number;
  completionRate: number;
  scoreBuckets: { bucket: string; count: number }[];
  questions: QuestionStat[];
  hardest: QuestionStat[];
}

/* --------------------------------- import --------------------------------- */

export interface ParsedQuestionDraft {
  type: QuestionType;
  text: string;
  options: { text: string; isCorrect: boolean }[];
  acceptedAnswers?: string[];
  numericAnswer?: { value: number; tolerance: number };
  points: number;
}

export interface ImportResult {
  questions: ParsedQuestionDraft[];
  errors: { line: number; message: string }[];
}

/* --------------------------------- inputs --------------------------------- */

export interface TestDraftInput {
  type: TestType;
  title: string;
  description: string;
  subject: string;
  coverImageId?: string;
  settings: Partial<TestSettings>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}
