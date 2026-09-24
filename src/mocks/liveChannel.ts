import type { LiveEvent, LiveSession } from '@/services/types';

/**
 * Cross-tab transport for live sessions. The tab that created the session runs
 * the simulator and broadcasts its events; other tabs (the participant view)
 * listen and send their answers back. When the backend arrives this file is
 * replaced by a WebSocket connection carrying the very same message shapes.
 */
export type LiveMessage =
  | { kind: 'event'; event: LiveEvent }
  | { kind: 'state'; session: LiveSession }
  | { kind: 'join'; user: { id: string; name: string; photoUrl?: string } }
  | { kind: 'answer'; userId: string; payload: { optionIds?: string[]; value?: string } }
  | { kind: 'sync' };

const channels = new Map<string, BroadcastChannel>();

function supported(): boolean {
  return typeof BroadcastChannel !== 'undefined';
}

export function getChannel(sessionId: string): BroadcastChannel | null {
  if (!supported()) return null;
  const existing = channels.get(sessionId);
  if (existing) return existing;
  const channel = new BroadcastChannel(`testhub.live.${sessionId}`);
  channels.set(sessionId, channel);
  return channel;
}

export function postLive(sessionId: string, message: LiveMessage): void {
  getChannel(sessionId)?.postMessage(message);
}

export function onLive(sessionId: string, handler: (message: LiveMessage) => void): () => void {
  const channel = getChannel(sessionId);
  if (!channel) return () => undefined;
  const listener = (event: MessageEvent<LiveMessage>) => handler(event.data);
  channel.addEventListener('message', listener);
  return () => channel.removeEventListener('message', listener);
}
