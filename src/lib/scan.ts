/**
 * What a scanned QR code may lead to.
 *
 * The text a camera reads is whatever anybody printed: a poster in a corridor
 * can carry a link to anywhere. So it is treated as data to be recognised, never
 * as an address to be opened. Only three shapes of it mean anything here, and
 * each is reduced to a bare identifier; the app then builds its own route from
 * that identifier. The scanned string itself is never navigated to.
 */
export type ScanTarget =
  | { kind: 'code'; code: string }
  | { kind: 'live'; sessionId: string }
  | { kind: 'test'; testId: string }
  | { kind: 'unknown' };

const CODE = /^\d{6}$/;

/** Ids are `live_…`, `t_…`, `att_…`: short, plain, no separators that mean a path. */
const ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Longer than any link we print; anything bigger is not ours and not worth parsing. */
const MAX_LENGTH = 2048;

const LIVE_PATH = /^\/live\/([^/]+)\/?$/;
const TEST_PATH = /^\/t\/([^/]+)\/?$/;

/**
 * Recognises a scanned string.
 *
 * - Six digits is a join code, the same one typed by hand.
 * - A link to *this app's own origin* of the form `/live/<id>` or `/t/<id>` is
 *   what the app's own QR codes carry. `/live/<id>/host` is deliberately not
 *   accepted: a player must not be dropped onto the host's controls by a code
 *   meant for the room.
 * - Everything else — another origin, another scheme, another path — is unknown.
 */
export function parseScan(raw: string, ownOrigin: string): ScanTarget {
  const text = raw.trim();
  if (text === '' || text.length > MAX_LENGTH) return { kind: 'unknown' };

  if (CODE.test(text)) return { kind: 'code', code: text };

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { kind: 'unknown' };
  }

  // `origin` is "null" for javascript:, data: and the like, so this also rules
  // out every scheme that is not http(s) on our own host.
  if (url.origin !== ownOrigin) return { kind: 'unknown' };

  const live = LIVE_PATH.exec(url.pathname)?.[1];
  if (live !== undefined) return idOr(live, (sessionId) => ({ kind: 'live', sessionId }));

  const test = TEST_PATH.exec(url.pathname)?.[1];
  if (test !== undefined) return idOr(test, (testId) => ({ kind: 'test', testId }));

  return { kind: 'unknown' };
}

function idOr(candidate: string, make: (id: string) => ScanTarget): ScanTarget {
  let decoded: string;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return { kind: 'unknown' };
  }
  // Checked after decoding, so "%2e%2e" cannot smuggle a dot-dot past the pattern.
  return ID.test(decoded) ? make(decoded) : { kind: 'unknown' };
}
