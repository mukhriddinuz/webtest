import { useEffect, useMemo, useState } from 'react';
import { api } from '@/services';
import type {
  LiveAnswerTally,
  LiveEvent,
  LiveLeaderboardRow,
  LiveParticipant,
  LiveRoundResult,
  LiveSession,
  LiveStatus,
  Question,
} from '@/services/types';

export interface LiveState {
  session: LiveSession | null;
  status: LiveStatus;
  participants: LiveParticipant[];
  questionCount: number;
  index: number;
  question: Question | null;
  durationSec: number;
  questionStartedAt: number;
  tally: LiveAnswerTally | null;
  round: LiveRoundResult | null;
  leaderboard: LiveLeaderboardRow[];
  loading: boolean;
  error: boolean;
}

const initialState: Omit<LiveState, 'loading' | 'error'> = {
  session: null,
  status: 'lobby',
  participants: [],
  questionCount: 0,
  index: 0,
  question: null,
  durationSec: 20,
  questionStartedAt: 0,
  tally: null,
  round: null,
  leaderboard: [],
};

/**
 * Subscribes to a live session and folds its event stream into render state.
 * Event names are the ones the future WebSocket will send.
 */
export function useLiveSession(sessionId: string | undefined): LiveState {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;

    setLoading(true);
    void api.live
      .getSession(sessionId)
      .then((session) => {
        if (!active) return;
        setState((current) => ({
          ...current,
          session,
          status: session.status,
          participants: session.participants,
          index: Math.max(0, session.currentIndex),
        }));
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));

    const unsubscribe = api.live.subscribe(sessionId, (event: LiveEvent) => {
      if (!active) return;
      setState((current) => reduce(current, event));
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [sessionId]);

  return useMemo(() => ({ ...state, loading, error }), [state, loading, error]);
}

function reduce(state: Omit<LiveState, 'loading' | 'error'>, event: LiveEvent) {
  switch (event.type) {
    case 'lobby_update':
      return { ...state, participants: event.participants };
    case 'session_started':
      return { ...state, status: 'question' as LiveStatus, questionCount: event.questionCount };
    case 'question_show':
      return {
        ...state,
        status: 'question' as LiveStatus,
        index: event.index,
        question: event.question,
        durationSec: event.durationSec,
        questionStartedAt: new Date(event.startedAt).getTime(),
        tally: null,
        round: null,
      };
    case 'answer_count_update':
      return { ...state, tally: event.tally };
    case 'question_end':
      return {
        ...state,
        status: 'reveal' as LiveStatus,
        round: event.result,
        tally: event.result.tally,
        leaderboard: event.result.leaderboard,
      };
    case 'leaderboard':
      return { ...state, leaderboard: event.rows };
    case 'session_paused':
      return { ...state, status: 'paused' as LiveStatus };
    case 'session_resumed':
      return { ...state, status: 'question' as LiveStatus };
    case 'session_finished':
      return { ...state, status: 'finished' as LiveStatus, leaderboard: event.rows };
    default:
      return state;
  }
}

/** Seconds left in the current question, derived from the clock. */
export function remainingSeconds(state: LiveState, now: number): number {
  if (state.questionStartedAt === 0) return state.durationSec;
  const elapsed = (now - state.questionStartedAt) / 1000;
  return Math.max(0, state.durationSec - elapsed);
}
