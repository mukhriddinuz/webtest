import { uid } from '@/lib/id';
import { gradeAttempt, gradingOptionsFromSettings } from '@/lib/grading';
import { shuffle } from '@/lib/random';
import { ApiError, type AttemptsApi, type StartAttemptResult } from '../api';
import type { Attempt, GivenAnswer, Question } from '../types';
import { db, mutate, questionsOf, requireAttempt, requireTest, simulate } from './db';
import { computeLeaderboard, effectiveStatus } from './tests';

/** Questions in the order this attempt saw them, with options shuffled to match. */
function orderedQuestions(attempt: Attempt): Question[] {
  const byId = new Map(questionsOf(attempt.testId).map((question) => [question.id, question]));
  return attempt.questionOrder
    .map((id) => byId.get(id))
    .filter((question): question is Question => Boolean(question));
}

function finalize(attemptId: string, status: Attempt['status']): Attempt {
  return mutate((draft) => {
    const attempt = draft.attempts.find((item) => item.id === attemptId);
    if (!attempt) throw new ApiError('not_found');
    if (attempt.status !== 'in_progress') return attempt;

    const test = requireTest(attempt.testId);
    const questions = orderedQuestions(attempt);
    const grade = gradeAttempt(
      questions,
      attempt.answers,
      gradingOptionsFromSettings(test.settings),
    );

    attempt.status = status;
    attempt.finishedAt = new Date().toISOString();
    attempt.results = grade.results;
    attempt.score = grade.score;
    attempt.maxScore = grade.maxScore;
    attempt.percent = grade.percent;

    const testRow = draft.tests.find((item) => item.id === attempt.testId);
    if (testRow) {
      const unique = new Set(
        draft.attempts
          .filter((item) => item.testId === attempt.testId && item.status === 'submitted')
          .map((item) => item.userId),
      );
      testRow.participantCount = Math.max(testRow.participantCount, unique.size);
    }

    attempt.rank = computeLeaderboard(attempt.testId).find(
      (row) => row.attemptId === attempt.id,
    )?.rank;
    return attempt;
  });
}

export const mockAttemptsApi: AttemptsApi = {
  start: (testId: string, userId: string) =>
    simulate<StartAttemptResult>(() =>
      mutate((draft) => {
        const test = requireTest(testId);
        const status = effectiveStatus(test);

        if (status !== 'active') throw new ApiError('test_not_active');

        const previous = draft.attempts.filter(
          (attempt) => attempt.testId === testId && attempt.userId === userId,
        );
        const running = previous.find((attempt) => attempt.status === 'in_progress');
        if (running) {
          return { attempt: running, questions: orderedQuestions(running) };
        }
        if (previous.length >= test.settings.attemptLimit) {
          throw new ApiError('attempt_limit');
        }

        const limit = test.settings.participantLimit;
        if (limit) {
          const seatTaken = draft.registrations.some(
            (row) => row.testId === testId && row.userId === userId,
          );
          if (!seatTaken) {
            if (test.participantCount >= limit) throw new ApiError('test_full');
            draft.registrations.push({
              testId,
              userId,
              registeredAt: new Date().toISOString(),
            });
            test.participantCount += 1;
          }
        }

        const base = questionsOf(testId);
        const ordered = test.settings.shuffleQuestions ? shuffle(base) : base;
        const questions = test.settings.shuffleOptions
          ? ordered.map((question) => ({ ...question, options: shuffle(question.options) }))
          : ordered;

        const startedAt = new Date();
        const attempt: Attempt = {
          id: uid('att'),
          testId,
          userId,
          status: 'in_progress',
          startedAt: startedAt.toISOString(),
          deadlineAt: test.settings.durationMin
            ? new Date(startedAt.getTime() + test.settings.durationMin * 60_000).toISOString()
            : undefined,
          answers: {},
          flagged: [],
          questionOrder: questions.map((question) => question.id),
          score: 0,
          maxScore: questions.reduce((sum, question) => sum + question.points, 0),
          percent: 0,
          results: [],
          tabSwitches: 0,
        };

        draft.attempts.push(attempt);
        return { attempt, questions };
      }),
    ),

  get: (attemptId: string) => simulate(() => requireAttempt(attemptId)),

  active: (testId: string, userId: string) =>
    simulate(
      () =>
        db().attempts.find(
          (attempt) =>
            attempt.testId === testId &&
            attempt.userId === userId &&
            attempt.status === 'in_progress',
        ) ?? null,
    ),

  questionsFor: (attemptId: string) => simulate(() => orderedQuestions(requireAttempt(attemptId))),

  saveAnswer: (attemptId: string, answer: GivenAnswer) =>
    simulate(() =>
      mutate((draft) => {
        const attempt = draft.attempts.find((item) => item.id === attemptId);
        if (!attempt) throw new ApiError('not_found');
        const empty =
          (!answer.optionIds || answer.optionIds.length === 0) &&
          (answer.value ?? '').trim() === '';
        if (empty) delete attempt.answers[answer.questionId];
        else attempt.answers[answer.questionId] = answer;
        return attempt;
      }),
    ),

  toggleFlag: (attemptId: string, questionId: string) =>
    simulate(() =>
      mutate((draft) => {
        const attempt = draft.attempts.find((item) => item.id === attemptId);
        if (!attempt) throw new ApiError('not_found');
        attempt.flagged = attempt.flagged.includes(questionId)
          ? attempt.flagged.filter((id) => id !== questionId)
          : [...attempt.flagged, questionId];
        return attempt;
      }),
    ),

  recordTabSwitch: (attemptId: string) =>
    simulate(() =>
      mutate((draft) => {
        const attempt = draft.attempts.find((item) => item.id === attemptId);
        if (!attempt) throw new ApiError('not_found');
        attempt.tabSwitches += 1;
        return attempt;
      }),
    ),

  submit: (attemptId: string) => simulate(() => finalize(attemptId, 'submitted')),

  listByUser: (userId: string) =>
    simulate(() =>
      db()
        .attempts.filter((attempt) => attempt.userId === userId)
        .sort((a, b) => (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt)),
    ),

  listByTest: (testId: string) =>
    simulate(() => db().attempts.filter((attempt) => attempt.testId === testId)),
};

/** Used by the attempt screen when the timer runs out. */
export function expireAttempt(attemptId: string): Attempt {
  return finalize(attemptId, 'submitted');
}
