import { joinCode, uid } from '@/lib/id';
import { LiveSimulator } from '@/mocks/liveSimulator';
import { onLive, postLive } from '@/mocks/liveChannel';
import { ApiError, type LiveApi } from '../api';
import type { LiveEvent, LiveSession } from '../types';
import { db, mutate, questionsOf, requireSession, requireTest, simulate } from './db';

/** Simulators owned by this tab. Other tabs follow along over BroadcastChannel. */
const engines = new Map<string, LiveSimulator>();

function engineOf(sessionId: string): LiveSimulator | undefined {
  return engines.get(sessionId);
}

/**
 * Makes this tab the host of a session: it owns the simulator and applies
 * whatever the participant tabs send over the channel.
 */
function spawnEngine(session: LiveSession): LiveSimulator {
  const test = requireTest(session.testId);
  const questions = questionsOf(session.testId);
  if (questions.length === 0) throw new ApiError('test_not_active');

  const engine = new LiveSimulator(session, questions, test.settings.speedBonus);
  engines.set(session.id, engine);

  // Participant tabs announce themselves; the host applies their actions.
  onLive(session.id, (message) => {
    if (message.kind === 'join') engine.join(message.user);
    if (message.kind === 'answer') engine.answer(message.userId, message.payload);
    if (message.kind === 'sync')
      postLive(session.id, { kind: 'state', session: engine.snapshot() });
  });

  return engine;
}

function persist(session: LiveSession): void {
  mutate((draft) => {
    const index = draft.liveSessions.findIndex((item) => item.id === session.id);
    if (index === -1) draft.liveSessions.push(session);
    else draft.liveSessions[index] = session;
  });
}

export const mockLiveApi: LiveApi = {
  createSession: (testId: string, hostId: string) =>
    simulate(() => {
      requireTest(testId);

      const session: LiveSession = {
        id: uid('live'),
        testId,
        hostId,
        code: joinCode(),
        status: 'lobby',
        currentIndex: -1,
        participants: [],
        createdAt: new Date().toISOString(),
      };

      const engine = spawnEngine(session);
      persist(session);
      engine.startLobbyBots();

      return session;
    }),

  getSession: (sessionId: string) =>
    simulate(() => engineOf(sessionId)?.snapshot() ?? requireSession(sessionId)),

  findByCode: (code: string) =>
    simulate(() => {
      const normalized = code.trim();
      const session = db().liveSessions.find((item) => item.code === normalized);
      if (!session) return null;
      return engineOf(session.id)?.snapshot() ?? session;
    }),

  listOpen: () =>
    simulate(() =>
      db()
        .liveSessions.map((session) => engineOf(session.id)?.snapshot() ?? session)
        .filter((session) => session.status !== 'finished'),
    ),

  join: (sessionId: string, user) =>
    simulate(() => {
      const engine = engineOf(sessionId);
      if (engine) {
        const session = engine.join(user);
        persist(session);
        return session;
      }
      // Host runs in another tab: forward the request and return what we know.
      postLive(sessionId, { kind: 'join', user });
      return requireSession(sessionId);
    }),

  subscribe: (sessionId: string, handler: (event: LiveEvent) => void) => {
    const engine = engineOf(sessionId);
    if (engine) {
      const off = engine.subscribe(handler);
      return off;
    }
    const off = onLive(sessionId, (message) => {
      if (message.kind === 'event') handler(message.event);
    });
    postLive(sessionId, { kind: 'sync' });
    return off;
  },

  start: (sessionId: string) =>
    simulate(() => {
      // A session restored from storage (the seeded room, or a reload) has no
      // simulator yet; whoever presses start becomes its host.
      const stored = requireSession(sessionId);
      const engine =
        engineOf(sessionId) ??
        (stored.status === 'lobby' && stored.currentIndex === -1 ? spawnEngine(stored) : undefined);
      if (!engine) throw new ApiError('forbidden');
      engine.start();
      persist(engine.snapshot());
    }),

  next: (sessionId: string) =>
    simulate(() => {
      engineOf(sessionId)?.next();
    }),

  reveal: (sessionId: string) =>
    simulate(() => {
      engineOf(sessionId)?.reveal();
    }),

  pause: (sessionId: string) =>
    simulate(() => {
      engineOf(sessionId)?.pause();
    }),

  resume: (sessionId: string) =>
    simulate(() => {
      engineOf(sessionId)?.resume();
    }),

  finish: (sessionId: string) =>
    simulate(() => {
      const engine = engineOf(sessionId);
      engine?.finish();
      if (engine) persist(engine.snapshot());
    }),

  answer: (sessionId: string, userId: string, payload) =>
    simulate(() => {
      const engine = engineOf(sessionId);
      if (engine) engine.answer(userId, payload);
      else postLive(sessionId, { kind: 'answer', userId, payload });
    }),
};

/** Stops every simulator; used by the dev panel reset. */
export function disposeLiveEngines(): void {
  engines.forEach((engine) => engine.destroy());
  engines.clear();
}
