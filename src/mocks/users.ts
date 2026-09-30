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

const teacher = (n: number, firstName: string, lastName: string, username: string): User => ({
  id: `u_teacher_${n}`,
  telegramId: 100000000 + 10 + n,
  firstName,
  lastName,
  username,
  role: 'teacher',
  languageCode: 'uz',
  isBlocked: false,
  createdAt: new Date(Date.UTC(2024, 8, 1 + n * 3, 8)).toISOString(),
});

/** More teachers, so the catalogue has authors other than the demo account. */
export const EXTRA_TEACHERS: User[] = [
  teacher(3, 'Bobur', 'Ismoilov', 'bobur_kimyo'),
  teacher(4, 'Malika', 'Sodiqova', 'malika_english'),
  teacher(5, 'Sherzod', 'Nurmatov', 'sherzod_it'),
  teacher(6, 'Gulchehra', 'Hamidova', 'gulchehra_adabiyot'),
  teacher(7, 'Farhod', 'Yo‘ldoshev', 'farhod_tarix'),
  teacher(8, 'Zarina', 'Ahmedova', 'zarina_bio'),
];

export const DEFAULT_DEV_USER = SEED_USERS[0] as User;

export function fullName(user: Pick<User, 'firstName' | 'lastName'>): string {
  return [user.firstName, user.lastName].filter(Boolean).join(' ');
}
