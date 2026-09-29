import { useEffect } from 'react';
import { getTelegram } from '@/lib/telegram';

/**
 * Everything that stops a long paper being lost to the phone rather than to
 * the candidate. Held together because each guard only makes sense while an
 * attempt is running, and each must be released the moment it ends.
 */
export function useClosingConfirmation(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const telegram = getTelegram();
    telegram.setClosingConfirmation(true);
    return () => telegram.setClosingConfirmation(false);
  }, [active]);
}

/** The slice of the Screen Wake Lock API used here; typed locally because older DOM libs lack it. */
interface WakeLockSentinelLike {
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
}

interface WakeLockHost {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
}

/**
 * Keeps the screen on for as long as `active`. A three-hour paper outlasts any
 * phone's screen timeout, and a dimmed, locked screen mid-exam is a trap.
 *
 * The lock is dropped by the browser whenever the page is hidden, so it is
 * taken again when the page comes back. Where the API is missing — some
 * webviews — or the request is refused, this does nothing: the exam works the
 * same, the screen just may dim.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined') return;
    const host = navigator as unknown as WakeLockHost;
    if (!host.wakeLock) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await host.wakeLock?.request('screen');
        if (!lock) return;
        if (cancelled) {
          void lock.release();
          return;
        }
        sentinel = lock;
        lock.addEventListener('release', () => {
          if (sentinel === lock) sentinel = null;
        });
      } catch {
        // Refused (battery saver, permissions): the exam carries on regardless.
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible' && !sentinel) void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release();
      sentinel = null;
    };
  }, [active]);
}
