import { buildTest, type TestSpec } from './builders';
import { generateAttempts } from './attempts';
import { seedImages } from './images';
import { participantName } from './names';
import { SEED_USERS } from './users';
import { algebraTest, geometryTest, progressionsTest } from './content/math';
import { biologyDraft, chemistryTest, physicsTest } from './content/science';
import { closedContest, englishTest, historyTest, midtermContest } from './content/humanities';
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
const EXTRA_PARTICIPANTS = 90;

function buildParticipants(now: number): User[] {
  return Array.from({ length: EXTRA_PARTICIPANTS }, (_, index) => ({
    id: `u_p${index + 1}`,
    telegramId: 200000000 + index,
    firstName: participantName(index).split(' ')[0] as string,
    lastName: participantName(index).split(' ')[1] as string,
    role: 'student' as const,
    languageCode: 'uz' as const,
    isBlocked: index === 7, // one blocked account, so the admin screen has data
    createdAt: new Date(now - (30 + index) * 86400_000).toISOString(),
  }));
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
};

/** Demo accounts that must appear among the participants of a given test. */
const GUARANTEED_PARTICIPANTS: Record<string, string[]> = {
  t_algebra: ['u_student_1'],
  t_english: ['u_student_1', 'u_teacher_1'],
  t_chemistry: ['u_student_1', 'u_teacher_1'],
  t_progressions: ['u_student_1'],
};

export function buildSeedDatabase(now = Date.now()): MockDatabase {
  const database = emptyDatabase();
  const participants = buildParticipants(now);
  database.users = [...SEED_USERS, ...participants];

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
  ];

  const tests: Test[] = [];
  const questions: Question[] = [];
  const attempts: Attempt[] = [];
  const registrations: TestRegistration[] = [];

  for (const spec of specs) {
    const built = buildTest(spec, now);
    if (built.test.settings.access === 'invite' && !built.test.settings.inviteCode) {
      built.test.settings.inviteCode = inviteCode();
    }
    tests.push(built.test);
    questions.push(...built.questions);

    const plan = ATTEMPT_PLAN[built.test.id];
    if (!plan) continue;

    const guaranteed = (GUARANTEED_PARTICIPANTS[built.test.id] ?? [])
      .map((id) => database.users.find((user) => user.id === id))
      .filter((user): user is User => Boolean(user));

    const generated = generateAttempts({
      test: built.test,
      questions: built.questions,
      pool: [...guaranteed, ...participants],
      count: plan.count,
      now,
      meanAbility: plan.mean,
      spreadDays: plan.spreadDays,
    });

    attempts.push(...generated.attempts);
    built.test.participantCount = generated.attempts.length;
  }

  // Contest registrations: participants sign up before the start time.
  const physics = tests.find((test) => test.id === 't_physics');
  if (physics) {
    const registrants = participants.slice(0, 23);
    registrants.forEach((user) => {
      registrations.push({
        testId: physics.id,
        userId: user.id,
        registeredAt: new Date(now - 3600_000).toISOString(),
      });
    });
    physics.participantCount = registrants.length;
  }

  // A live room already gathering players, so the "on air" state exists from
  // the first run instead of only after someone hosts a session.
  const history = tests.find((test) => test.id === 't_history');
  if (history) {
    const room: LiveSession = {
      id: 'live_history_demo',
      testId: history.id,
      hostId: history.authorId,
      code: '482913',
      status: 'lobby',
      currentIndex: -1,
      participants: participants.slice(0, 5).map((user, index) => ({
        userId: user.id,
        name: [user.firstName, user.lastName].filter(Boolean).join(' '),
        score: 0,
        streak: 0,
        joinedAt: new Date(now - (5 - index) * 20_000).toISOString(),
        isBot: true,
      })),
      createdAt: new Date(now - 2 * 60_000).toISOString(),
    };
    database.liveSessions = [room];
  }

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
