import { gradeAttempt, gradingOptionsFromSettings } from '@/lib/grading';
import { createRandom, gaussian, randomInt, shuffle } from '@/lib/random';
import { uid } from '@/lib/id';
import type { Attempt, GivenAnswer, Question, Test, User } from '@/services/types';

/** Rough share of questions a participant leaves blank. */
const SKIP_RATE = 0.06;

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function wrongText(accepted: readonly string[], rnd: () => number): string {
  const pool = ['have', 'has', 'went', 'writed', 'seed', 'do', '120', '45', 'yadrocha'];
  const candidate = pool[Math.floor(rnd() * pool.length)] as string;
  return accepted.includes(candidate) ? `${candidate}x` : candidate;
}

/** Produces one plausible answer for a participant of the given ability. */
function answerFor(question: Question, ability: number, rnd: () => number): GivenAnswer | null {
  if (rnd() < SKIP_RATE * (1.4 - ability)) return null;

  const answeredAt = new Date().toISOString();
  const willBeCorrect = rnd() < ability;

  switch (question.type) {
    case 'single': {
      const correct = question.options.find((option) => option.isCorrect);
      const wrong = question.options.filter((option) => !option.isCorrect);
      const chosen =
        willBeCorrect && correct ? correct : (wrong[Math.floor(rnd() * wrong.length)] ?? correct);
      return chosen ? { questionId: question.id, optionIds: [chosen.id], answeredAt } : null;
    }
    case 'multiple': {
      const correct = question.options.filter((option) => option.isCorrect).map((o) => o.id);
      const wrong = question.options.filter((option) => !option.isCorrect).map((o) => o.id);
      if (willBeCorrect) return { questionId: question.id, optionIds: correct, answeredAt };
      // Partially correct answers keep the score distribution realistic.
      const partial = shuffle(correct, rnd).slice(0, Math.max(1, correct.length - 1));
      const noise = rnd() < 0.5 && wrong.length > 0 ? [wrong[0] as string] : [];
      return { questionId: question.id, optionIds: [...partial, ...noise], answeredAt };
    }
    case 'text': {
      const value =
        willBeCorrect && question.acceptedAnswers[0]
          ? question.acceptedAnswers[0]
          : wrongText(question.acceptedAnswers, rnd);
      return { questionId: question.id, value, answeredAt };
    }
    case 'numeric': {
      if (!question.numericAnswer) return null;
      const base = question.numericAnswer.value;
      const value = willBeCorrect
        ? base
        : base + (rnd() < 0.5 ? -1 : 1) * (1 + Math.floor(rnd() * 5));
      return { questionId: question.id, value: String(value), answeredAt };
    }
    default:
      return null;
  }
}

export interface GeneratedAttempts {
  attempts: Attempt[];
  participantIds: string[];
}

/**
 * Builds a realistic set of finished attempts for a test: abilities are
 * normally distributed, so the analytics screens show a believable curve.
 */
export function generateAttempts(input: {
  test: Test;
  questions: Question[];
  pool: User[];
  /** Accounts that must be among the participants, whatever the shuffle does. */
  always?: User[];
  count: number;
  now: number;
  /** Spread of start times, in days before `now`. */
  spreadDays?: number;
  meanAbility?: number;
}): GeneratedAttempts {
  const { test, questions, pool, count, now } = input;
  const rnd = createRandom(hashSeed(test.id));
  const spreadDays = input.spreadDays ?? 6;
  const meanAbility = input.meanAbility ?? 0.62;
  const grading = gradingOptionsFromSettings(test.settings);

  // The named accounts come first; the shuffle only fills the rest, so a demo
  // account asked for here really does end up with an attempt.
  const always = input.always ?? [];
  const alwaysIds = new Set(always.map((user) => user.id));
  const rest = shuffle(
    pool.filter((user) => !alwaysIds.has(user.id)),
    rnd,
  );
  const chosen = [...always, ...rest].slice(0, Math.min(count, always.length + rest.length));
  const attempts: Attempt[] = [];

  for (const user of chosen) {
    const ability = gaussian(rnd, meanAbility, 0.17, 0.12, 0.99);
    const answers: Record<string, GivenAnswer> = {};

    for (const question of questions) {
      const answer = answerFor(question, ability, rnd);
      if (answer) answers[question.id] = answer;
    }

    const grade = gradeAttempt(questions, answers, grading);
    const durationSec = test.settings.durationMin ? test.settings.durationMin * 60 : 900;
    const timeSec = randomInt(rnd, Math.round(durationSec * 0.25), Math.round(durationSec * 0.95));
    const startedAt = new Date(now - randomInt(rnd, 0, spreadDays * 86400) * 1000).toISOString();
    const finishedAt = new Date(new Date(startedAt).getTime() + timeSec * 1000).toISOString();

    attempts.push({
      id: uid('att'),
      testId: test.id,
      userId: user.id,
      status: 'submitted',
      startedAt,
      finishedAt,
      answers,
      flagged: [],
      questionOrder: questions.map((question) => question.id),
      score: grade.score,
      maxScore: grade.maxScore,
      percent: grade.percent,
      results: grade.results,
      tabSwitches: rnd() < 0.15 ? randomInt(rnd, 1, 3) : 0,
    });
  }

  attempts.sort((a, b) => b.score - a.score || a.startedAt.localeCompare(b.startedAt));
  attempts.forEach((attempt, index) => {
    attempt.rank = index + 1;
  });

  return { attempts, participantIds: chosen.map((user) => user.id) };
}

/**
 * A paper someone has started and not handed in: the first `share` of the
 * questions answered, the clock still running.
 */
export function inProgressAttempt(input: {
  test: Test;
  questions: Question[];
  user: User;
  now: number;
  /** Fraction of the paper already answered, 0..1. */
  share: number;
  /** Minutes ago the attempt began. */
  startedMinutesAgo: number;
}): Attempt {
  const { test, questions, user, now } = input;
  const rnd = createRandom(hashSeed(`${test.id}:${user.id}:running`));
  const answers: Record<string, GivenAnswer> = {};
  const answered = Math.floor(questions.length * input.share);
  for (const question of questions.slice(0, answered)) {
    const answer = answerFor(question, 0.7, rnd);
    if (answer) answers[question.id] = answer;
  }

  const startedAt = now - input.startedMinutesAgo * 60_000;
  const duration = test.settings.durationMin;
  return {
    id: uid('att'),
    testId: test.id,
    userId: user.id,
    status: 'in_progress',
    startedAt: new Date(startedAt).toISOString(),
    deadlineAt: duration ? new Date(startedAt + duration * 60_000).toISOString() : undefined,
    answers,
    flagged: questions
      .slice(0, answered)
      .filter((_, index) => index % 7 === 3)
      .map((question) => question.id),
    questionOrder: questions.map((question) => question.id),
    score: 0,
    maxScore: questions.reduce((sum, question) => sum + question.points, 0),
    percent: 0,
    results: [],
    tabSwitches: 0,
  };
}
