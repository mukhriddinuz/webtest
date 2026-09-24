import { readJson, writeJson } from '@/lib/storage';

const KEY = 'testhub:editor-step';

type StepMap = Record<string, number>;

/**
 * Remembers where the author stopped in the wizard so reopening a draft from
 * a card continues instead of restarting.
 */
export function rememberStep(testId: string, step: number): void {
  const map = readJson<StepMap>(KEY, {});
  map[testId] = step;
  writeJson(KEY, map);
}

export function recallStep(testId: string, fallback: number, max: number): number {
  const stored = readJson<StepMap>(KEY, {})[testId];
  if (typeof stored !== 'number') return fallback;
  return Math.min(Math.max(stored, fallback), max);
}

export function forgetStep(testId: string): void {
  const map = readJson<StepMap>(KEY, {});
  delete map[testId];
  writeJson(KEY, map);
}
