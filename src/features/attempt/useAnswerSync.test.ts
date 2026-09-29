import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { GivenAnswer } from '@/services/types';
import { useAnswerSync, withQueued } from './useAnswerSync';

const answer = (questionId: string, value: string): GivenAnswer => ({
  questionId,
  value,
  answeredAt: '2026-09-29T10:00:00.000Z',
});

/** A save that stays open until the test lets it through or fails it. */
function controllableSave() {
  const calls: { answer: GivenAnswer; resolve: () => void; reject: () => void }[] = [];
  const save = vi.fn(
    (a: GivenAnswer) =>
      new Promise<void>((resolve, reject) => {
        calls.push({ answer: a, resolve, reject: () => reject(new Error('offline')) });
      }),
  );
  return { save, calls };
}

const settle = () => act(async () => void (await Promise.resolve()));

describe('useAnswerSync', () => {
  it('sends answers one at a time, in the order they were given', async () => {
    const { save, calls } = controllableSave();
    const { result } = renderHook(() => useAnswerSync(save));

    act(() => {
      result.current.send(answer('q1', 'a'));
      result.current.send(answer('q2', 'b'));
    });
    await settle();

    // The second must wait for the first: two requests in flight could land
    // in either order.
    expect(save).toHaveBeenCalledTimes(1);
    expect(calls[0]?.answer.questionId).toBe('q1');

    await act(async () => calls[0]?.resolve());
    await settle();
    expect(save).toHaveBeenCalledTimes(2);
    expect(calls[1]?.answer.questionId).toBe('q2');
  });

  it('sends only the latest answer to a question that was changed while queued', async () => {
    const { save, calls } = controllableSave();
    const { result } = renderHook(() => useAnswerSync(save));

    act(() => {
      result.current.send(answer('q1', 'first'));
      result.current.send(answer('q2', 'other'));
      result.current.send(answer('q2', 'changed'));
    });
    await settle();
    await act(async () => calls[0]?.resolve());
    await settle();

    expect(calls[1]?.answer.value).toBe('changed');
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('does not lose an answer that was changed while its own send was in flight', async () => {
    const { save, calls } = controllableSave();
    const { result } = renderHook(() => useAnswerSync(save));

    act(() => result.current.send(answer('q1', 'first')));
    await settle();
    // The candidate changes their mind before the first request has landed.
    act(() => result.current.send(answer('q1', 'second')));
    await settle();

    await act(async () => calls[0]?.resolve());
    await settle();

    // The first request finishing must not be taken for the second one.
    expect(save).toHaveBeenCalledTimes(2);
    expect(calls[1]?.answer.value).toBe('second');
  });

  it('keeps an answer whose send failed, and reports it', async () => {
    const { save, calls } = controllableSave();
    const { result } = renderHook(() => useAnswerSync(save));

    act(() => result.current.send(answer('q1', 'a')));
    await settle();
    await act(async () => calls[0]?.reject());
    await settle();

    expect(result.current.unsent).toBe(1);
    expect(result.current.failing).toBe(true);
  });

  it('retries when the connection comes back, and clears the queue', async () => {
    const { save, calls } = controllableSave();
    const { result } = renderHook(() => useAnswerSync(save));

    act(() => result.current.send(answer('q1', 'a')));
    await settle();
    await act(async () => calls[0]?.reject());
    await settle();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    await settle();
    await act(async () => calls[1]?.resolve());
    await settle();

    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.unsent).toBe(0);
    expect(result.current.failing).toBe(false);
  });

  it('refuses to call the queue flushed while an answer is still stuck', async () => {
    const { save, calls } = controllableSave();
    const { result } = renderHook(() => useAnswerSync(save));

    act(() => result.current.send(answer('q1', 'a')));
    await settle();

    let outcome: boolean | undefined;
    const flushing = act(async () => {
      const pending = result.current.flush();
      await Promise.resolve();
      calls[0]?.reject();
      outcome = await pending;
    });
    await flushing;

    expect(outcome).toBe(false);
  });

  it('reports a clean flush once everything got through', async () => {
    const { save, calls } = controllableSave();
    const { result } = renderHook(() => useAnswerSync(save));

    act(() => result.current.send(answer('q1', 'a')));
    await settle();

    let outcome: boolean | undefined;
    await act(async () => {
      const pending = result.current.flush();
      await Promise.resolve();
      calls[0]?.resolve();
      outcome = await pending;
    });

    expect(outcome).toBe(true);
  });
});

describe('withQueued', () => {
  it('keeps a queued answer the server has not seen yet', () => {
    const server = { q1: answer('q1', 'old') };
    const merged = withQueued(server, [answer('q1', 'new'), answer('q2', 'fresh')]);

    expect(merged.q1?.value).toBe('new');
    expect(merged.q2?.value).toBe('fresh');
  });

  it('leaves the server answers alone when nothing is queued', () => {
    const server = { q1: answer('q1', 'a'), q2: answer('q2', 'b') };
    expect(withQueued(server, [])).toEqual(server);
  });

  it('does not touch the object it was given', () => {
    const server = { q1: answer('q1', 'a') };
    withQueued(server, [answer('q1', 'b')]);
    expect(server.q1.value).toBe('a');
  });
});
