/**
 * Node 25 injects its own experimental `localStorage` global, which shadows the
 * jsdom one and is unusable without `--localstorage-file`. Tests get a plain
 * in-memory implementation instead; browsers are unaffected.
 */
class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }
}

const storage = new MemoryStorage();

for (const target of [globalThis, globalThis.window].filter(Boolean)) {
  Object.defineProperty(target, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
}

/** jsdom ships no matchMedia; components only need a stable "light" answer. */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

/**
 * React Router builds a `Request` for every client-side navigation. Node's
 * undici implementation rejects jsdom's `AbortSignal`, so tests get a minimal
 * stand-in; the app never reads anything else off it.
 */
class TestRequest {
  readonly url: string;
  readonly method: string;
  readonly signal: unknown;

  constructor(input: string | { url: string }, init: { method?: string; signal?: unknown } = {}) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init.method ?? 'GET';
    this.signal = init.signal ?? null;
  }
}

Object.defineProperty(globalThis, 'Request', {
  value: TestRequest,
  configurable: true,
  writable: true,
});
