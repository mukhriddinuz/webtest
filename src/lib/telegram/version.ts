/**
 * Whether a Bot API version is at least another, comparing numerically per part.
 * "6.10" is newer than "6.9", which a string comparison gets backwards.
 *
 * A missing or unreadable version counts as too old: a feature guarded by this
 * is one that throws or does nothing where it is unsupported, so the safe
 * reading of "cannot tell" is "do not use it".
 */
export function versionAtLeast(current: string | undefined, required: string): boolean {
  if (!current) return false;
  const have = current.split('.').map((part) => Number.parseInt(part, 10));
  const need = required.split('.').map((part) => Number.parseInt(part, 10));
  if (have.some(Number.isNaN)) return false;

  for (let i = 0; i < Math.max(have.length, need.length); i += 1) {
    const a = have[i] ?? 0;
    const b = need[i] ?? 0;
    if (a !== b) return a > b;
  }
  return true;
}
