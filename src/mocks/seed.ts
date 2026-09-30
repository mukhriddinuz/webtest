import { buildTest, type TestSpec } from './builders';
import { generateAttempts, inProgressAttempt } from './attempts';
import { seedImages } from './images';
import { participantName } from './names';
import { EXTRA_TEACHERS, SEED_USERS } from './users';
import { buildCatalog } from './content/catalog';
import { algebraTest, geometryTest, progressionsTest } from './content/math';
import { biologyDraft, chemistryTest, physicsTest } from './content/science';
import { closedContest, englishTest, historyTest, midtermContest } from './content/humanities';
import { dtmExam, milliyMathExam } from './content/exams';
import { emptyDatabase, setDatabase, type MockDatabase } from '@/services/mock/db';
import { inviteCode } from '@/lib/id';
import type {
  Attempt,
  LiveSession,
  Question,
  Test,
  TestRegistration,
  User,
} from '@/services/types';

/** Extra accounts that only exist to fill leaderboards and statistics. */
const EXTRA_PARTICIPANTS = 400;

/** Participants whose accounts are blocked, so the admin list has some. */
const BLOCKED = new Set([7, 41, 83, 120, 177, 230, 291, 333, 388]);

function buildParticipants(now: number): User[] {
  return Array.from({ length: EXTRA_PARTICIPANTS }, (_, index) => {
    const [firstName, lastName] = participantName(index).split(' ') as [string, string];
    return {
      id: `u_p${index + 1}`,
      telegramId: 200000000 + index,
      firstName,
      lastName,
      // Every third account has a public username, as real ones often do.
      username:
        index % 3 === 0
          ? `${firstName.replace(/[^a-z]/gi, '').toLowerCase()}_${index + 1}`
          : undefined,
      role: 'student' as const,
      languageCode: index % 9 === 4 ? ('ru' as const) : ('uz' as const),
      isBlocked: BLOCKED.has(index),
      createdAt: new Date(now - (3 + ((index * 7) % 330)) * 86400_000).toISOString(),
    };
  });
}

/** How many finished attempts each test should carry. */
const ATTEMPT_PLAN: Record<string, { count: number; mean?: number; spreadDays?: number }> = {
  t_algebra: { count: 46, mean: 0.66, spreadDays: 10 },
  t_english: { count: 38, mean: 0.58, spreadDays: 14 },
  t_geometry: { count: 47, mean: 0.48, spreadDays: 4 },
  t_progressions: { count: 62, mean: 0.61, spreadDays: 40 },
  t_chemistry: { count: 31, mean: 0.7, spreadDays: 7 },
  t_midterm: { count: 18, mean: 0.55, spreadDays: 1 },
  t_olympiad: { count: 27, mean: 0.63, spreadDays: 9 },
  e_dtm_math_physics: { count: 24, mean: 0.52, spreadDays: 6 },
  e_milliy_math: { count: 19, mean: 0.61, spreadDays: 12 },
};

/** Demo accounts that must appear among the participants of a given test. */
const GUARANTEED_PARTICIPANTS: Record<string, string[]> = {
  e_dtm_math_physics: ['u_student_1', 'u_teacher_1'],
  e_milliy_math: ['u_teacher_1'],
  t_algebra: ['u_student_1'],
  t_english: ['u_student_1', 'u_teacher_1'],
  t_chemistry: ['u_student_1', 'u_teacher_1'],
  t_progressions: ['u_student_1'],
};

/** Papers left half-done by the demo accounts, so "continue" always has rows. */
const RUNNING: Record<string, { userId: string; share: number; minutes: number }[]> = {
  t_geography: [{ userId: 'u_teacher_1', share: 0.45, minutes: 6 }],
  t_it_basics: [{ userId: 'u_teacher_1', share: 0.7, minutes: 9 }],
  t_uzbek: [{ userId: 'u_teacher_1', share: 0.2, minutes: 3 }],
  t_cell: [{ userId: 'u_student_1', share: 0.5, minutes: 5 }],
  t_literature: [{ userId: 'u_student_1', share: 0.3, minutes: 4 }],
};

/**
 * Who must appear among a test's finished attempts. The demo student takes
 * everything; the demo teacher takes most of what other teachers wrote, apart
 * from the papers they are in the middle of.
 */
function guaranteedFor(test: Test, position: number): string[] {
  const ids = new Set(GUARANTEED_PARTICIPANTS[test.id] ?? []);
  ids.add('u_student_1');
  if (test.authorId !== 'u_teacher_1' && position % 4 !== 3) ids.add('u_teacher_1');
  for (const running of RUNNING[test.id] ?? []) ids.delete(running.userId);
  return [...ids];
}

/** Rooms already gathering players, so the "on air" state is full from the first run. */
const LOBBIES = [
  { id: 'live_history_demo', testId: 't_history', code: '482913', bots: 5, minutes: 2 },
  { id: 'live_demo_math', testId: 'v_math', code: '731405', bots: 14, minutes: 4 },
  { id: 'live_demo_general', testId: 'v_general', code: '206839', bots: 9, minutes: 3 },
  { id: 'live_demo_chem', testId: 'v_chem', code: '915274', bots: 11, minutes: 6 },
  { id: 'live_demo_it', testId: 'v_it', code: '384627', bots: 7, minutes: 1 },
  { id: 'live_demo_geo', testId: 'v_geo', code: '560192', bots: 16, minutes: 8 },
];

export function buildSeedDatabase(now = Date.now()): MockDatabase {
  const database = emptyDatabase();
  const participants = buildParticipants(now);
  database.users = [...SEED_USERS, ...EXTRA_TEACHERS, ...participants];

  const specs: TestSpec[] = [
    algebraTest(),
    physicsTest(now),
    englishTest(),
    geometryTest(),
    historyTest(),
    chemistryTest(),
    midtermContest(now),
    biologyDraft(),
    progressionsTest(),
    closedContest(now),
    dtmExam(),
    milliyMathExam(),
  ];

  const catalog = buildCatalog(now);
  specs.push(...catalog.map((entry) => entry.spec));
  const plans = { ...ATTEMPT_PLAN };
  for (const entry of catalog) {
    if (entry.attempts) plans[entry.spec.id] = entry.attempts;
  }

  const tests: Test[] = [];
  const questions: Question[] = [];
  const attempts: Attempt[] = [];
  const registrations: TestRegistration[] = [];

  let planned = 0;
  for (const spec of specs) {
    const built = buildTest(spec, now);
    if (built.test.settings.access === 'invite' && !built.test.settings.inviteCode) {
      built.test.settings.inviteCode = inviteCode();
    }
    tests.push(built.test);
    questions.push(...built.questions);

    const plan = plans[built.test.id];
    if (!plan) continue;
    planned += 1;

    const guaranteed = guaranteedFor(built.test, planned)
      .map((id) => database.users.find((user) => user.id === id))
      .filter((user): user is User => Boolean(user));

    const generated = generateAttempts({
      test: built.test,
      questions: built.questions,
      pool: participants,
      always: guaranteed,
      count: plan.count,
      now,
      meanAbility: plan.mean,
      spreadDays: plan.spreadDays,
    });

    attempts.push(...generated.attempts);
    built.test.participantCount = generated.attempts.length;
  }

  // Papers in progress.
  for (const [testId, rows] of Object.entries(RUNNING)) {
    const test = tests.find((item) => item.id === testId);
    if (!test) continue;
    for (const row of rows) {
      const user = database.users.find((item) => item.id === row.userId);
      if (!user) continue;
      attempts.push(
        inProgressAttempt({
          test,
          questions: questions.filter((question) => question.testId === testId),
          user,
          now,
          share: row.share,
          startedMinutesAgo: row.minutes,
        }),
      );
    }
  }

  // Contest registrations: participants sign up before the start time.
  const signUp = (test: Test, users: User[]) => {
    users.forEach((user, index) => {
      registrations.push({
        testId: test.id,
        userId: user.id,
        registeredAt: new Date(now - (20 + ((index * 137) % 5000)) * 60_000).toISOString(),
      });
    });
    test.participantCount = users.length;
  };

  const physics = tests.find((test) => test.id === 't_physics');
  if (physics) signUp(physics, participants.slice(0, 23));

  const demoAccounts = (test: Test): User[] =>
    ['u_student_1', 'u_teacher_1']
      .filter((id) => id !== test.authorId)
      .map((id) => database.users.find((user) => user.id === id))
      .filter((user): user is User => Boolean(user));

  catalog.forEach((entry, index) => {
    const test = tests.find((item) => item.id === entry.spec.id);
    if (!test || !entry.registrations) return;
    const start = (index * 41) % (participants.length - entry.registrations);
    signUp(test, [
      ...demoAccounts(test),
      ...participants.slice(start, start + entry.registrations),
    ]);
  });

  database.liveSessions = LOBBIES.flatMap((lobby, index): LiveSession[] => {
    const test = tests.find((item) => item.id === lobby.testId);
    if (!test) return [];
    const start = index * 23;
    return [
      {
        id: lobby.id,
        testId: test.id,
        hostId: test.authorId,
        code: lobby.code,
        status: 'lobby',
        currentIndex: -1,
        participants: participants.slice(start, start + lobby.bots).map((user, order) => ({
          userId: user.id,
          name: [user.firstName, user.lastName].filter(Boolean).join(' '),
          score: 0,
          streak: 0,
          joinedAt: new Date(now - (lobby.bots - order) * 12_000).toISOString(),
          isBot: true,
        })),
        createdAt: new Date(now - lobby.minutes * 60_000).toISOString(),
      },
    ];
  });

  database.tests = tests;
  database.questions = questions;
  database.attempts = attempts;
  database.registrations = registrations;
  return database;
}

/** Writes the seed dataset (and its artwork) into storage. */
export async function seedDatabase(now = Date.now()): Promise<MockDatabase> {
  const database = buildSeedDatabase(now);
  setDatabase(database);
  await seedImages();
  return database;
}
