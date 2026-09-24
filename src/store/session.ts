import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/services/types';

interface SessionState {
  /** Resolved once the mock database is ready. */
  user: User | null;
  /** Browser mode only: which demo account the dev panel selected. */
  devUserId: string | null;
  setUser: (user: User | null) => void;
  setDevUserId: (id: string) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      devUserId: null,
      setUser: (user) => set({ user }),
      setDevUserId: (devUserId) => set({ devUserId }),
    }),
    {
      name: 'testhub.session.v1',
      partialize: (state) => ({ devUserId: state.devUserId }),
    },
  ),
);

export function useCurrentUser(): User | null {
  return useSessionStore((state) => state.user);
}
