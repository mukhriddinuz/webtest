/**
 * Warnings before a timed paper runs out, in seconds remaining.
 *
 * A warning is only worth giving when it lands well inside the paper: telling
 * someone on a 12-minute quiz that ten minutes are left, a minute after they
 * started, is noise. So a threshold applies only when the whole duration is at
 * least twice as long as it.
 */
const WARN_AT_SEC = [600, 300] as const;

export function warningThresholds(totalSec: number): number[] {
  return WARN_AT_SEC.filter((threshold) => totalSec >= threshold * 2);
}

/**
 * The threshold that was crossed between two readings, or null.
 *
 * "Crossed" means from above to at-or-below, so opening a paper that already
 * has four minutes left does not announce the five-minute mark that passed
 * long ago, and a reading that skipped several seconds (a throttled background
 * tab) still catches the mark it jumped over.
 */
export function crossedThreshold(
  previousSec: number | null,
  currentSec: number,
  thresholds: readonly number[],
): number | null {
  if (previousSec === null) return null;
  // The largest applies when two were crossed at once: it is the news.
  return (
    [...thresholds]
      .sort((a, b) => b - a)
      .find((threshold) => previousSec > threshold && currentSec <= threshold) ?? null
  );
}

/** True while the time left is inside the earliest warning, before the final minute. */
export function inWarningStage(remainingSec: number, totalSec: number): boolean {
  const first = warningThresholds(totalSec)[0];
  return first !== undefined && remainingSec <= first;
}
