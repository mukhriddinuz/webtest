import type { Unsubscribe } from './types';

/** Minimal typed emitter shared by both bridge implementations. */
export function createEmitter<T>() {
  const handlers = new Set<(value: T) => void>();
  return {
    on(handler: (value: T) => void): Unsubscribe {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    emit(value: T): void {
      handlers.forEach((handler) => handler(value));
    },
    get size(): number {
      return handlers.size;
    },
  };
}
