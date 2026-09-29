import { useCallback, useEffect, useRef, useState } from 'react';
import type { GivenAnswer } from '@/services/types';

/** How often a failed send is tried again while the page stays open. */
const RETRY_EVERY_MS = 8000;

/** Tracks the browser's own view of the connection. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  return online;
}

export interface AnswerSync {
  /** Queues an answer and sends it as soon as the ones before it are through. */
  send(answer: GivenAnswer): void;
  /**
   * Tries to get every queued answer through. Resolves true when nothing is
   * left, false when something could not be sent.
   */
  flush(): Promise<boolean>;
  /** Answers held back, waiting to be sent. */
  unsent: number;
  /** A snapshot of the answers still queued, newest state per question. */
  queued(): GivenAnswer[];
  /** True while the last attempt to send failed. */
  failing: boolean;
}

/**
 * Sends answers to the API without ever losing one silently.
 *
 * Fire-and-forget saving is fine while the network never fails and quietly
 * wrong once it can: an answer whose request fails would show as given on the
 * screen and be missing on the server, and the candidate would find out from
 * their result. Here a failed answer stays queued and is retried when the
 * connection returns and on a timer, and finishing waits for the queue.
 *
 * Sends go out one at a time in the order they were made, holding only the
 * latest answer per question, so a slow earlier request can never overwrite a
 * newer one.
 */
export function useAnswerSync(save: (answer: GivenAnswer) => Promise<unknown>): AnswerSync {
  const pending = useRef(new Map<string, GivenAnswer>());
  const draining = useRef<Promise<void> | null>(null);
  const lastFailed = useRef(false);
  const saveRef = useRef(save);
  saveRef.current = save;

  const [unsent, setUnsent] = useState(0);
  const [failing, setFailing] = useState(false);

  const publish = useCallback(() => {
    setUnsent(pending.current.size);
    setFailing(lastFailed.current);
  }, []);

  const drain = useCallback((): Promise<void> => {
    if (draining.current) return draining.current;

    const run = async () => {
      lastFailed.current = false;
      while (pending.current.size > 0) {
        const [questionId, answer] = pending.current.entries().next().value as [
          string,
          GivenAnswer,
        ];
        try {
          await saveRef.current(answer);
          // A newer answer for the same question may have arrived meanwhile;
          // it stays queued and goes out on the next turn.
          if (pending.current.get(questionId) === answer) pending.current.delete(questionId);
        } catch {
          lastFailed.current = true;
          break;
        }
      }
    };

    draining.current = run().finally(() => {
      draining.current = null;
      publish();
    });
    return draining.current;
  }, [publish]);

  const send = useCallback(
    (answer: GivenAnswer) => {
      // Re-inserting moves the question to the back, keeping the order of the
      // most recent answers.
      pending.current.delete(answer.questionId);
      pending.current.set(answer.questionId, answer);
      publish();
      void drain();
    },
    [drain, publish],
  );

  const flush = useCallback(async () => {
    // A drain in flight may finish with newer answers still queued behind it.
    for (let round = 0; round < 3; round += 1) {
      await drain();
      if (pending.current.size === 0) return true;
      if (lastFailed.current) return false;
    }
    return pending.current.size === 0;
  }, [drain]);

  useEffect(() => {
    const retry = () => void drain();
    window.addEventListener('online', retry);
    const timer = window.setInterval(() => {
      if (pending.current.size > 0) retry();
    }, RETRY_EVERY_MS);
    return () => {
      window.removeEventListener('online', retry);
      window.clearInterval(timer);
    };
  }, [drain]);

  const queued = useCallback(() => [...pending.current.values()], []);

  return { send, flush, queued, unsent, failing };
}

/**
 * The answers to show once the server's copy of the attempt has been reloaded.
 *
 * A reload — react-query refetches on reconnect, which is exactly when a queue
 * of unsent answers is about to be retried — brings back what the server holds,
 * and that lacks every answer still queued. Showing it as-is would make those
 * answers vanish from the screen while they are still on their way, so the
 * queued ones win.
 */
export function withQueued(
  serverAnswers: Readonly<Record<string, GivenAnswer>>,
  queued: readonly GivenAnswer[],
): Record<string, GivenAnswer> {
  const merged = { ...serverAnswers };
  for (const answer of queued) merged[answer.questionId] = answer;
  return merged;
}
