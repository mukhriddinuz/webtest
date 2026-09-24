import type { Api } from './api';
import { ensureSeeded, mockApi } from './mock';
import { httpApi } from './http';

const MODE = (import.meta.env.VITE_API_MODE ?? 'mock') as 'mock' | 'http';

/** The single API instance the whole app uses. */
export const api: Api = MODE === 'http' ? httpApi : mockApi;

export const isMockMode = MODE === 'mock';

/** Prepares the data layer before the first render. */
export async function initializeApi(): Promise<void> {
  if (isMockMode) await ensureSeeded();
}

export * from './api';
export * from './types';
