import { uid } from '@/lib/id';
import { ApiError, type UsersApi, type UserStats } from '../api';
import type { User } from '../types';
import { db, mutate, requireUser, simulate } from './db';

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
