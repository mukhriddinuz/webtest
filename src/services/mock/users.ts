import { uid } from '@/lib/id';
import { ApiError, type UsersApi, type UserStats } from '../api';
import type { User } from '../types';
import { db, mutate, requireUser, simulate } from './db';

/**
 * Until the backend lands there is nothing but the seed material, and it all
 * belongs to the demo teacher. A visitor who arrives as a fresh account would
 * therefore meet an empty app, so the first Telegram account to open it takes
 * that teacher's place — its tests, attempts and statistics included. Each
 * device seeds its own database, so every visitor gets this on their first run.
 *
 * Any further account opened on the same device is shown the same demo
 * account rather than an empty one, so the full demo is visible from every
 * login. The backend replaces this with real per-account data.
 */
const DEMO_TEACHER = { id: 'u_teacher_1', telegramId: 100000001 };

export const mockUsersApi: UsersApi = {
  resolve: (telegramUser) =>
    simulate(() =>
      mutate((draft) => {
        const existing = draft.users.find((user) => user.telegramId === telegramUser.id);
        if (existing) {
          existing.firstName = telegramUser.firstName;
          existing.lastName = telegramUser.lastName ?? existing.lastName;
          existing.username = telegramUser.username ?? existing.username;
          existing.photoUrl = telegramUser.photoUrl ?? existing.photoUrl;
          return existing;
        }

        const demo = draft.users.find((user) => user.id === DEMO_TEACHER.id);
        // Unclaimed while it still carries the telegram id from the seed.
        if (demo && demo.telegramId === DEMO_TEACHER.telegramId) {
          demo.telegramId = telegramUser.id;
          demo.firstName = telegramUser.firstName;
          demo.lastName = telegramUser.lastName;
          demo.username = telegramUser.username;
          demo.photoUrl = telegramUser.photoUrl;
          return demo;
        }

        // The demo is already claimed: show it to this account too, rather
        // than an empty app.
        if (demo) return demo;

        const created: User = {
          id: uid('user'),
          telegramId: telegramUser.id,
          firstName: telegramUser.firstName,
          lastName: telegramUser.lastName,
          username: telegramUser.username,
          photoUrl: telegramUser.photoUrl,
          role: 'teacher',
          languageCode: 'uz',
          isBlocked: false,
          createdAt: new Date().toISOString(),
        };
        draft.users.push(created);
        return created;
      }),
    ),

  get: (id: string) => simulate(() => requireUser(id)),

  list: () =>
    simulate(() =>
      db()
        .users.slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),

  setBlocked: (id: string, blocked: boolean) =>
    simulate(() =>
      mutate((draft) => {
        const user = draft.users.find((item) => item.id === id);
        if (!user) throw new ApiError('not_found');
        user.isBlocked = blocked;
        return user;
      }),
    ),

  stats: (userId: string) =>
    simulate<UserStats>(() => {
      const created = db().tests.filter((test) => test.authorId === userId).length;
      const attempts = db().attempts.filter(
        (attempt) => attempt.userId === userId && attempt.status === 'submitted',
      );
      const averagePercent =
        attempts.length === 0
          ? 0
          : Math.round(
              attempts.reduce((sum, attempt) => sum + attempt.percent, 0) / attempts.length,
            );
      const bestPercent = attempts.reduce((best, attempt) => Math.max(best, attempt.percent), 0);
      return { created, taken: attempts.length, averagePercent, bestPercent };
    }),
};
