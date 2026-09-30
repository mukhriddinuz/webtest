import { seedDatabase } from '@/mocks/seed';
import { clearImages } from '@/lib/imageStore';
import type { AdminApi, Api } from '../api';
import { clearDatabase, db, hasData, loadDatabase, simulate } from './db';
import { mockTestsApi, withStatus } from './tests';
import { mockAttemptsApi } from './attempts';
import { mockUsersApi } from './users';
import { disposeLiveEngines, mockLiveApi } from './live';

const mockAdminApi: AdminApi = {
  overview: () =>
    simulate(() => ({
      users: db().users.length,
      tests: db().tests.length,
      attempts: db().attempts.length,
    })),
  tests: () => simulate(() => db().tests.map(withStatus)),
};

/** Seeds the mock database on first run. Safe to call repeatedly. */
export async function ensureSeeded(): Promise<void> {
  await loadDatabase();
  if (hasData()) return;
  await seedDatabase();
}

export const mockApi: Api = {
  tests: mockTestsApi,
  attempts: mockAttemptsApi,
  users: mockUsersApi,
  live: mockLiveApi,
  admin: mockAdminApi,
  async reset() {
    disposeLiveEngines();
    clearDatabase();
    await clearImages();
    await seedDatabase();
  },
};
