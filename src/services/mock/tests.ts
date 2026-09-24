import { uid } from '@/lib/id';
import { blocksToPlainText } from '@/lib/content';
import { devSettings } from '@/store/dev';
import { ApiError, type ParticipantRow, type TestListParams, type TestsApi } from '../api';
import type {
  Attempt,
  LeaderboardRow,
  Question,
  QuestionStat,
  Test,
  TestDraftInput,
  TestStats,
  TestStatus,
} from '../types';
import { db, mutate, questionsOf, requireTest, requireUser, simulate } from './db';
import { defaultSettings } from '@/mocks/builders';

/**
 * Contest windows open and close on their own, so the stored status is only a
 * baseline; this resolves what the status actually is right now.
 */
export function effectiveStatus(test: Test, now = Date.now()): TestStatus {
  if (test.status === 'draft' || test.status === 'archived') return test.status;
  const { startsAt, endsAt } = test.settings;
  if (test.type === 'contest' && startsAt && endsAt) {
    const start = new Date(startsAt).getTime();
    const end = new Date(endsAt).getTime();
    if (now < start) return 'scheduled';
    if (now > end) return 'finished';
    return 'active';
  }
  return test.status;
}

export function withStatus(test: Test): Test {
  return { ...test, status: effectiveStatus(test) };
}

function fullName(userId: string): string {
  const user = db().users.find((item) => item.id === userId);
  return user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : '?';
}

export const mockTestsApi: TestsApi = {
  list: (params: TestListParams = {}) =>
    simulate(() => {
      const search = params.search?.trim().toLowerCase();
      return db()
        .tests.map(withStatus)
        .filter((test) => {
          if (params.authorId && test.authorId !== params.authorId) return false;
          if (params.status && params.status !== 'all' && test.status !== params.status)
            return false;
          if (params.type && params.type !== 'all' && test.type !== params.type) return false;
          if (search && !test.title.toLowerCase().includes(search)) return false;
          return true;
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }),

  get: (id: string) => simulate(() => withStatus(requireTest(id))),

  create: (input: TestDraftInput, authorId: string) =>
    simulate(() =>
      mutate((draft) => {
        const now = new Date().toISOString();
        const test: Test = {
          id: uid('test'),
          authorId,
          type: input.type,
          title: input.title,
          description: input.description,
          subject: input.subject,
          coverImageId: input.coverImageId,
          status: 'draft',
          settings: { ...defaultSettings(), ...input.settings },
          questionCount: 0,
          participantCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        draft.tests.push(test);
        return test;
      }),
    ),

  update: (id: string, patch: Partial<Test>) =>
    simulate(() =>
      mutate((draft) => {
        const test = draft.tests.find((item) => item.id === id);
        if (!test) throw new ApiError('not_found');
        Object.assign(test, patch, { updatedAt: new Date().toISOString() });
        return withStatus(test);
      }),
    ),

  remove: (id: string) =>
    simulate(() =>
      mutate((draft) => {
        draft.tests = draft.tests.filter((test) => test.id !== id);
        draft.questions = draft.questions.filter((question) => question.testId !== id);
        draft.attempts = draft.attempts.filter((attempt) => attempt.testId !== id);
        draft.registrations = draft.registrations.filter((row) => row.testId !== id);
        draft.liveSessions = draft.liveSessions.filter((session) => session.testId !== id);
      }),
    ),

  duplicate: (id: string, authorId: string) =>
    simulate(() =>
      mutate((draft) => {
        const source = requireTest(id);
        const now = new Date().toISOString();
        const copyId = uid('test');
        const copy: Test = {
          ...source,
          id: copyId,
          authorId,
          title: `${source.title} (2)`,
          status: 'draft',
          participantCount: 0,
          createdAt: now,
          updatedAt: now,
          publishedAt: undefined,
        };
        draft.tests.push(copy);
        questionsOf(id).forEach((question, index) => {
          draft.questions.push({
            ...question,
            id: uid('q'),
            testId: copyId,
            order: index,
            options: question.options.map((option) => ({ ...option, id: uid('o') })),
          });
        });
        return copy;
      }),
    ),

  setStatus: (id: string, status: TestStatus) =>
    simulate(() =>
      mutate((draft) => {
        const test = draft.tests.find((item) => item.id === id);
        if (!test) throw new ApiError('not_found');
        test.status = status;
        test.updatedAt = new Date().toISOString();
        if (status === 'active' && !test.publishedAt) test.publishedAt = test.updatedAt;
        return withStatus(test);
      }),
    ),

  questions: (testId: string) => simulate(() => questionsOf(testId)),

  saveQuestions: (testId: string, questions: Question[]) =>
    simulate(() =>
      mutate((draft) => {
        const normalized = questions.map((question, index) => ({
          ...question,
          testId,
          order: index,
        }));
        draft.questions = [
          ...draft.questions.filter((question) => question.testId !== testId),
          ...normalized,
        ];
        const test = draft.tests.find((item) => item.id === testId);
        if (test) {
          test.questionCount = normalized.length;
          test.updatedAt = new Date().toISOString();
        }
        return normalized;
      }),
    ),

  stats: (testId: string) => simulate(() => computeStats(testId)),

  leaderboard: (testId: string) => simulate(() => computeLeaderboard(testId)),

  participants: (testId: string) =>
    simulate<ParticipantRow[]>(() =>
      db()
        .attempts.filter((attempt) => attempt.testId === testId)
        .map((attempt) => ({ attempt, user: requireUser(attempt.userId) }))
        .sort((a, b) => b.attempt.score - a.attempt.score),
    ),

  register: (testId: string, userId: string) =>
    simulate(() =>
      mutate((draft) => {
        const exists = draft.registrations.some(
          (row) => row.testId === testId && row.userId === userId,
        );
        if (exists) return;
        const test = draft.tests.find((item) => item.id === testId);
        if (!test) throw new ApiError('not_found');
        const limit = test.settings.participantLimit;
        if (limit && test.participantCount >= limit) throw new ApiError('test_full');
        draft.registrations.push({
          testId,
          userId,
          registeredAt: new Date().toISOString(),
        });
        test.participantCount += 1;
      }),
    ),

  isRegistered: (testId: string, userId: string) =>
    simulate(() =>
      db().registrations.some((row) => row.testId === testId && row.userId === userId),
    ),

  registeredTests: (userId: string) =>
    simulate(() => {
      const testIds = new Set(
        db()
          .registrations.filter((row) => row.userId === userId)
          .map((row) => row.testId),
      );
      const taken = new Set(
        db()
          .attempts.filter((attempt) => attempt.userId === userId && attempt.status === 'submitted')
          .map((attempt) => attempt.testId),
      );
      return db()
        .tests.filter((test) => testIds.has(test.id) && !taken.has(test.id))
        .map(withStatus)
        .sort((a, b) => (a.settings.startsAt ?? '').localeCompare(b.settings.startsAt ?? ''));
    }),

  verifyPassword: (testId: string, password: string) =>
    simulate(() => {
      const test = requireTest(testId);
      return (test.settings.password ?? '') === password.trim();
    }),

  checkChannelSubscription: () => simulate(() => devSettings().channelCheckPasses),

  seatsLeft: (testId: string) =>
    simulate(() => {
      const test = requireTest(testId);
      const limit = test.settings.participantLimit;
      if (!limit) return null;
      return Math.max(0, limit - test.participantCount);
    }),
};

/* -------------------------------- analytics ------------------------------- */

function submittedAttempts(testId: string): Attempt[] {
  return db().attempts.filter(
    (attempt) => attempt.testId === testId && attempt.status === 'submitted',
  );
}

export function computeLeaderboard(testId: string): LeaderboardRow[] {
  return submittedAttempts(testId)
    .slice()
    .sort((a, b) => b.score - a.score || timeOf(a) - timeOf(b))
    .map((attempt, index) => ({
      rank: index + 1,
      userId: attempt.userId,
      userName: fullName(attempt.userId),
      score: attempt.score,
      maxScore: attempt.maxScore,
      percent: attempt.percent,
      timeSec: timeOf(attempt),
      attemptId: attempt.id,
    }));
}

function timeOf(attempt: Attempt): number {
  if (!attempt.finishedAt) return 0;
  return Math.round(
    (new Date(attempt.finishedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000,
  );
}

const BUCKETS = [
  { bucket: '0-20', min: 0, max: 20 },
  { bucket: '21-40', min: 21, max: 40 },
  { bucket: '41-60', min: 41, max: 60 },
  { bucket: '61-80', min: 61, max: 80 },
  { bucket: '81-100', min: 81, max: 100 },
];

export function computeStats(testId: string): TestStats {
  const attempts = submittedAttempts(testId);
  const questions = questionsOf(testId);
  const all = db().attempts.filter((attempt) => attempt.testId === testId);

  const questionStats: QuestionStat[] = questions.map((question) => {
    const optionDistribution: Record<string, number> = {};
    question.options.forEach((option) => {
      optionDistribution[option.id] = 0;
    });

    let answered = 0;
    let correct = 0;

    attempts.forEach((attempt) => {
      const answer = attempt.answers[question.id];
      if (!answer) return;
      answered += 1;
      answer.optionIds?.forEach((optionId) => {
        if (optionId in optionDistribution) {
          optionDistribution[optionId] = (optionDistribution[optionId] ?? 0) + 1;
        }
      });
      const result = attempt.results.find((item) => item.questionId === question.id);
      if (result?.correct) correct += 1;
    });

    return {
      questionId: question.id,
      order: question.order,
      preview: blocksToPlainText(question.content).slice(0, 80),
      correctRate: answered === 0 ? 0 : Math.round((correct / answered) * 100),
      answered,
      optionDistribution,
    };
  });

  const averagePercent =
    attempts.length === 0
      ? 0
      : Math.round(attempts.reduce((sum, attempt) => sum + attempt.percent, 0) / attempts.length);

  const averageTimeSec =
    attempts.length === 0
      ? 0
      : Math.round(attempts.reduce((sum, attempt) => sum + timeOf(attempt), 0) / attempts.length);

  return {
    attempts: attempts.length,
    averagePercent,
    averageTimeSec,
    completionRate: all.length === 0 ? 0 : Math.round((attempts.length / all.length) * 100),
    scoreBuckets: BUCKETS.map((bucket) => ({
      bucket: bucket.bucket,
      count: attempts.filter(
        (attempt) => attempt.percent >= bucket.min && attempt.percent <= bucket.max,
      ).length,
    })),
    questions: questionStats,
    hardest: [...questionStats].sort((a, b) => a.correctRate - b.correctRate).slice(0, 5),
  };
}
