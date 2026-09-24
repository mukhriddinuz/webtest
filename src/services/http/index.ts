import type { Api } from '../api';

/**
 * Placeholder for the real backend client.
 *
 * When the API lands, implement the same `Api` interface here (one file per
 * resource, mirroring `services/mock/`) and set `VITE_API_MODE=http`. No screen,
 * hook or component needs to change: everything above this layer already talks
 * to the interface rather than to the mock.
 */
const notImplemented = (): never => {
  throw new Error('HTTP API is not implemented yet. Set VITE_API_MODE=mock.');
};

export const httpApi: Api = new Proxy({} as Api, {
  get: notImplemented,
});
