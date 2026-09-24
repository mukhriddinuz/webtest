import type { User } from '@/services/types';

/**
 * The four demo accounts. Their telegram ids are stable so the dev panel can
 * switch between them and the mock bridge can hand one to the session store.
 */
export const SEED_USERS: User[] = [
  {
    id: 'u_teacher_1',
    telegramId: 100000001,
    firstName: 'Aziz',
    lastName: 'Rahimov',
    username: 'aziz_teacher',
    role: 'teacher',
    languageCode: 'uz',
    isBlocked: false,
    createdAt: '2024-09-01T08:00:00.000Z',
  },
  {
    id: 'u_teacher_2',
    telegramId: 100000002,
    firstName: 'Nilufar',
    lastName: 'Qodirova',
    username: 'nilufar_fizika',
    role: 'teacher',
    languageCode: 'uz',
    isBlocked: false,
    createdAt: '2024-09-12T08:00:00.000Z',
  },
  {
    id: 'u_student_1',
    telegramId: 100000003,
    firstName: 'Jasur',
    lastName: 'Toshmatov',
    username: 'jasur_t',
    role: 'student',
    languageCode: 'uz',
    isBlocked: false,
    createdAt: '2024-10-02T08:00:00.000Z',
  },
  {
    id: 'u_admin',
    telegramId: 100000004,
    firstName: 'Dilshod',
    lastName: 'Karimov',
    username: 'dilshod_admin',
    role: 'admin',
    languageCode: 'uz',
    isBlocked: false,
    createdAt: '2024-08-20T08:00:00.000Z',
  },
];

export const DEFAULT_DEV_USER = SEED_USERS[0] as User;

export function fullName(user: Pick<User, 'firstName' | 'lastName'>): string {
  return [user.firstName, user.lastName].filter(Boolean).join(' ');
}
