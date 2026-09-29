import { describe, expect, it, vi } from 'vitest';
import { ApiError, type Api } from '@/services/api';
import { resolveScan } from './resolveScan';

type Fake = Pick<Api, 'live' | 'tests'>;

/** An API where each call is whatever the test says it is. */
function fakeApi(over: {
  findByCode?: (code: string) => Promise<{ id: string } | null>;
  getSession?: (id: string) => Promise<{ id: string }>;
  getTest?: (id: string) => Promise<{ id: string }>;
}): Fake {
  return {
    live: {
      findByCode: over.findByCode ?? (() => Promise.resolve(null)),
      getSession: over.getSession ?? (() => Promise.reject(new ApiError('not_found'))),
    },
    tests: {
      get: over.getTest ?? (() => Promise.reject(new ApiError('not_found'))),
    },
  } as unknown as Fake;
}

describe('resolveScan', () => {
  it('sends a known join code to its room', async () => {
    const api = fakeApi({ findByCode: () => Promise.resolve({ id: 'live_abc' }) });
    expect(await resolveScan({ kind: 'code', code: '482913' }, api)).toEqual({
      ok: true,
      route: '/live/live_abc',
    });
  });

  it('says so when no room has that code', async () => {
    expect(await resolveScan({ kind: 'code', code: '000000' }, fakeApi({}))).toEqual({
      ok: false,
      reason: 'notFound',
      from: 'code',
    });
  });

  it('sends a live link to its room', async () => {
    const getSession = vi.fn(() => Promise.resolve({ id: 'live_abc' }));
    const result = await resolveScan(
      { kind: 'live', sessionId: 'live_abc' },
      fakeApi({ getSession }),
    );

    expect(getSession).toHaveBeenCalledWith('live_abc');
    expect(result).toEqual({ ok: true, route: '/live/live_abc' });
  });

  it('sends a test link to its intro', async () => {
    const api = fakeApi({ getTest: () => Promise.resolve({ id: 't_algebra' }) });
    expect(await resolveScan({ kind: 'test', testId: 't_algebra' }, api)).toEqual({
      ok: true,
      route: '/t/t_algebra',
    });
  });

  it('reports a deleted test as not found rather than opening an error page', async () => {
    expect(await resolveScan({ kind: 'test', testId: 't_gone' }, fakeApi({}))).toEqual({
      ok: false,
      reason: 'notFound',
      from: 'test',
    });
  });

  it('does not blame the code for a dead connection', async () => {
    const api = fakeApi({ getTest: () => Promise.reject(new ApiError('network')) });
    expect(await resolveScan({ kind: 'test', testId: 't_algebra' }, api)).toMatchObject({
      ok: false,
      reason: 'failed',
    });
  });

  it('does not blame the code for an error that is not an ApiError either', async () => {
    const api = fakeApi({ findByCode: () => Promise.reject(new TypeError('fetch failed')) });
    expect(await resolveScan({ kind: 'code', code: '482913' }, api)).toMatchObject({
      ok: false,
      reason: 'failed',
    });
  });

  it('never asks the API about something it did not recognise', async () => {
    const getTest = vi.fn();
    const findByCode = vi.fn();
    const api = fakeApi({ getTest, findByCode });

    expect(await resolveScan({ kind: 'unknown' }, api)).toEqual({
      ok: false,
      reason: 'unknown',
      from: 'unknown',
    });
    expect(getTest).not.toHaveBeenCalled();
    expect(findByCode).not.toHaveBeenCalled();
  });

  it('builds the route from the verified id, so an id cannot add a path segment', async () => {
    // Should an id ever come back with a slash, it is encoded, not followed.
    const api = fakeApi({ getTest: () => Promise.resolve({ id: 'a/../admin' }) });
    const result = await resolveScan({ kind: 'test', testId: 'x' }, api);

    expect(result).toEqual({ ok: true, route: '/t/a%2F..%2Fadmin' });
  });
});
