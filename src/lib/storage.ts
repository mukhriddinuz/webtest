/** Thin, typed wrapper around localStorage with a safe fallback. */

const memory = new Map<string, string>();

function available(): boolean {
  try {
    const probe = '__testhub_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const hasLocalStorage = typeof window !== 'undefined' && available();

export function readRaw(key: string): string | null {
  return hasLocalStorage ? window.localStorage.getItem(key) : (memory.get(key) ?? null);
}

export function writeRaw(key: string, value: string): void {
  if (hasLocalStorage) window.localStorage.setItem(key, value);
  else memory.set(key, value);
}

export function removeRaw(key: string): void {
  if (hasLocalStorage) window.localStorage.removeItem(key);
  else memory.delete(key);
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    writeRaw(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to persist', key, error);
  }
}
