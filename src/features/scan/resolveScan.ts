import { ApiError, type Api } from '@/services/api';
import type { ScanTarget } from '@/lib/scan';

export type ScanOutcome =
  /** A route inside the app, built here from a verified identifier. */
  | { ok: true; route: string }
  | { ok: false; reason: 'unknown' | 'notFound' | 'failed'; from: ScanTarget['kind'] };

/**
 * Turns a recognised scan into somewhere to go, but only after checking that
 * the thing it names exists — a code for a room that closed, or a test that was
 * deleted, should be answered where the camera was, not by landing on an error
 * page one screen later.
 *
 * The route is assembled from the identifier that was verified, never from the
 * scanned string.
 */
export async function resolveScan(
  target: ScanTarget,
  api: Pick<Api, 'live' | 'tests'>,
): Promise<ScanOutcome> {
  const from = target.kind;
  try {
    switch (target.kind) {
      case 'code': {
        const session = await api.live.findByCode(target.code);
        return session
          ? { ok: true, route: `/live/${encodeURIComponent(session.id)}` }
          : { ok: false, reason: 'notFound', from };
      }
      case 'live': {
        const session = await api.live.getSession(target.sessionId);
        return { ok: true, route: `/live/${encodeURIComponent(session.id)}` };
      }
      case 'test': {
        const test = await api.tests.get(target.testId);
        return { ok: true, route: `/t/${encodeURIComponent(test.id)}` };
      }
      default:
        return { ok: false, reason: 'unknown', from };
    }
  } catch (error) {
    // Only "there is no such thing" is the code's fault; anything else is the
    // connection's, and must not be reported as a bad code.
    const missing = error instanceof ApiError && error.code === 'not_found';
    return { ok: false, reason: missing ? 'notFound' : 'failed', from };
  }
}
