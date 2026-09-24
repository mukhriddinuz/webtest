import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type TestListParams } from '@/services';
import type { Question, Test, TestDraftInput, TestStatus } from '@/services/types';

/** Centralised query keys keep invalidation predictable. */
export const qk = {
  tests: (params: TestListParams) => ['tests', params] as const,
  test: (id: string) => ['test', id] as const,
  questions: (testId: string) => ['questions', testId] as const,
  attempt: (id: string) => ['attempt', id] as const,
  attemptQuestions: (id: string) => ['attempt-questions', id] as const,
  activeAttempt: (testId: string, userId: string) => ['active-attempt', testId, userId] as const,
  attemptsByUser: (userId: string) => ['attempts-user', userId] as const,
  leaderboard: (testId: string) => ['leaderboard', testId] as const,
  stats: (testId: string) => ['stats', testId] as const,
  participants: (testId: string) => ['participants', testId] as const,
  users: () => ['users'] as const,
  user: (id: string) => ['user', id] as const,
  userStats: (id: string) => ['user-stats', id] as const,
  registered: (testId: string, userId: string) => ['registered', testId, userId] as const,
  seats: (testId: string) => ['seats', testId] as const,
  registeredTests: (userId: string) => ['registered-tests', userId] as const,
  openLiveSessions: () => ['open-live-sessions'] as const,
  adminOverview: () => ['admin-overview'] as const,
};

/* --------------------------------- queries -------------------------------- */

export function useTests(params: TestListParams, enabled = true) {
  return useQuery({
    queryKey: qk.tests(params),
    queryFn: () => api.tests.list(params),
    enabled,
  });
}

export function useTest(id: string | undefined) {
  return useQuery({
    queryKey: qk.test(id ?? ''),
    queryFn: () => api.tests.get(id as string),
    enabled: Boolean(id),
  });
}

export function useQuestions(testId: string | undefined) {
  return useQuery({
    queryKey: qk.questions(testId ?? ''),
    queryFn: () => api.tests.questions(testId as string),
    enabled: Boolean(testId),
  });
}

export function useAttempt(attemptId: string | undefined) {
  return useQuery({
    queryKey: qk.attempt(attemptId ?? ''),
    queryFn: () => api.attempts.get(attemptId as string),
    enabled: Boolean(attemptId),
  });
}

export function useAttemptQuestions(attemptId: string | undefined) {
  return useQuery({
    queryKey: qk.attemptQuestions(attemptId ?? ''),
    queryFn: () => api.attempts.questionsFor(attemptId as string),
    enabled: Boolean(attemptId),
    staleTime: Infinity,
  });
}

export function useActiveAttempt(testId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: qk.activeAttempt(testId ?? '', userId ?? ''),
    queryFn: () => api.attempts.active(testId as string, userId as string),
    enabled: Boolean(testId && userId),
  });
}

export function useUserAttempts(userId: string | undefined) {
  return useQuery({
    queryKey: qk.attemptsByUser(userId ?? ''),
    queryFn: () => api.attempts.listByUser(userId as string),
    enabled: Boolean(userId),
  });
}

export function useLeaderboard(testId: string | undefined) {
  return useQuery({
    queryKey: qk.leaderboard(testId ?? ''),
    queryFn: () => api.tests.leaderboard(testId as string),
    enabled: Boolean(testId),
  });
}

export function useTestStats(testId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.stats(testId ?? ''),
    queryFn: () => api.tests.stats(testId as string),
    enabled: Boolean(testId) && enabled,
  });
}

export function useParticipants(testId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.participants(testId ?? ''),
    queryFn: () => api.tests.participants(testId as string),
    enabled: Boolean(testId) && enabled,
  });
}

export function useUsers(enabled = true) {
  return useQuery({ queryKey: qk.users(), queryFn: () => api.users.list(), enabled });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: qk.user(id ?? ''),
    queryFn: () => api.users.get(id as string),
    enabled: Boolean(id),
  });
}

export function useUserStats(id: string | undefined) {
  return useQuery({
    queryKey: qk.userStats(id ?? ''),
    queryFn: () => api.users.stats(id as string),
    enabled: Boolean(id),
  });
}

export function useRegistration(testId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: qk.registered(testId ?? '', userId ?? ''),
    queryFn: () => api.tests.isRegistered(testId as string, userId as string),
    enabled: Boolean(testId && userId),
  });
}

export function useSeatsLeft(testId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.seats(testId ?? ''),
    queryFn: () => api.tests.seatsLeft(testId as string),
    enabled: Boolean(testId) && enabled,
  });
}

export function useRegisteredTests(userId: string | undefined) {
  return useQuery({
    queryKey: qk.registeredTests(userId ?? ''),
    queryFn: () => api.tests.registeredTests(userId as string),
    enabled: Boolean(userId),
  });
}

export function useOpenLiveSessions() {
  return useQuery({
    queryKey: qk.openLiveSessions(),
    queryFn: () => api.live.listOpen(),
  });
}

/**
 * Ids of the tests whose live session is on air right now. Cards use it to
 * decide whether the pulsing "on air" marker is honest.
 */
export function useOnAirTestIds(): Set<string> {
  const sessions = useOpenLiveSessions();
  return useMemo(
    () => new Set((sessions.data ?? []).map((session) => session.testId)),
    [sessions.data],
  );
}

export function useAdminOverview(enabled = true) {
  return useQuery({
    queryKey: qk.adminOverview(),
    queryFn: () => api.admin.overview(),
    enabled,
  });
}

/* -------------------------------- mutations ------------------------------- */

export function useCreateTest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ input, authorId }: { input: TestDraftInput; authorId: string }) =>
      api.tests.create(input, authorId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['tests'] });
    },
  });
}

export function useUpdateTest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Test> }) =>
      api.tests.update(id, patch),
    onSuccess: (test) => {
      client.setQueryData(qk.test(test.id), test);
      void client.invalidateQueries({ queryKey: ['tests'] });
    },
  });
}

export function useSaveQuestions() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ testId, questions }: { testId: string; questions: Question[] }) =>
      api.tests.saveQuestions(testId, questions),
    onSuccess: (questions, variables) => {
      client.setQueryData(qk.questions(variables.testId), questions);
      void client.invalidateQueries({ queryKey: qk.test(variables.testId) });
    },
  });
}

export function useSetTestStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TestStatus }) =>
      api.tests.setStatus(id, status),
    onSuccess: (test) => {
      client.setQueryData(qk.test(test.id), test);
      void client.invalidateQueries({ queryKey: ['tests'] });
    },
  });
}

export function useDeleteTest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.tests.remove(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['tests'] });
    },
  });
}

export function useDuplicateTest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, authorId }: { id: string; authorId: string }) =>
      api.tests.duplicate(id, authorId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['tests'] });
    },
  });
}

export function useSetUserBlocked() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) =>
      api.users.setBlocked(id, blocked),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: qk.users() });
    },
  });
}
