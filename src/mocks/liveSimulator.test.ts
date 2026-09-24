import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveSimulator } from './liveSimulator';
import { buildQuestions, options, text } from './builders';
import type { LiveEvent, LiveSession } from '@/services/types';

const questions = buildQuestions('t_live', [
  {
    type: 'single',
    content: [text('Savol 1')],
    options: options('*Toshkent', 'Samarqand'),
    points: 100,
    timeLimitSec: 20,
  },
  {
    type: 'single',
    content: [text('Savol 2')],
    options: options('*1336', '1370'),
    points: 100,
    timeLimitSec: 20,
  },
]);

const session = (): LiveSession => ({
  id: 'live_test',
  testId: 't_live',
  hostId: 'u_teacher_1',
  code: '123456',
  status: 'lobby',
  currentIndex: -1,
  participants: [],
  createdAt: new Date().toISOString(),
});

describe('LiveSimulator', () => {
  let simulator: LiveSimulator;
  let events: LiveEvent[];

  beforeEach(() => {
    vi.useFakeTimers();
    simulator = new LiveSimulator(session(), questions, 0.5);
    events = [];
    simulator.subscribe((event) => events.push(event));
  });

  afterEach(() => {
    simulator.destroy();
    vi.useRealTimers();
  });

  const types = () => events.map((event) => event.type);

  /** Latest leaderboard event, or undefined if none was emitted yet. */
  const lastLeaderboard = () => {
    const rows = events.filter((event) => event.type === 'leaderboard');
    return rows[rows.length - 1];
  };

  it('lets bots trickle into the lobby', () => {
    simulator.startLobbyBots(5);
    vi.advanceTimersByTime(12_000);
    expect(simulator.session.participants.length).toBeGreaterThan(0);
    expect(types()).toContain('lobby_update');
  });

  it('emits the documented event sequence for a round', () => {
    simulator.join({ id: 'u_student_1', name: 'Jasur' });
    simulator.start();

    expect(types()).toContain('session_started');
    expect(types()).toContain('question_show');

    simulator.answer('u_student_1', { optionIds: [questions[0]!.options[0]!.id] });
    expect(types()).toContain('answer_count_update');

    vi.advanceTimersByTime(20_000);
    expect(types()).toContain('question_end');
    expect(types()).toContain('leaderboard');
  });

  it('scores a correct answer and leaves a wrong one at zero', () => {
    simulator.join({ id: 'right', name: 'To‘g‘ri' });
    simulator.join({ id: 'wrong', name: 'Noto‘g‘ri' });
    simulator.start();

    simulator.answer('right', { optionIds: [questions[0]!.options[0]!.id] });
    simulator.answer('wrong', { optionIds: [questions[0]!.options[1]!.id] });
    simulator.reveal();

    const byId = new Map(simulator.session.participants.map((p) => [p.userId, p.score]));
    expect(byId.get('right')).toBeGreaterThanOrEqual(100);
    expect(byId.get('wrong')).toBe(0);
  });

  it('ignores a second answer from the same participant', () => {
    simulator.join({ id: 'u1', name: 'A' });
    simulator.start();
    simulator.answer('u1', { optionIds: [questions[0]!.options[1]!.id] });
    simulator.answer('u1', { optionIds: [questions[0]!.options[0]!.id] });
    simulator.reveal();
    expect(simulator.session.participants[0]?.score).toBe(0);
  });

  it('pauses and resumes without ending the question', () => {
    simulator.join({ id: 'u1', name: 'A' });
    simulator.start();
    simulator.pause();
    expect(simulator.session.status).toBe('paused');

    vi.advanceTimersByTime(30_000);
    expect(types()).not.toContain('question_end');

    simulator.resume();
    expect(simulator.session.status).toBe('question');
    vi.advanceTimersByTime(30_000);
    expect(types()).toContain('question_end');
  });

  it('finishes after the last question', () => {
    simulator.join({ id: 'u1', name: 'A' });
    simulator.start();
    simulator.reveal();
    simulator.next();
    simulator.reveal();
    simulator.next();
    expect(simulator.session.status).toBe('finished');
    expect(types()).toContain('session_finished');
  });

  it('reports rank movement between rounds', () => {
    simulator.join({ id: 'a', name: 'A' });
    simulator.join({ id: 'b', name: 'B' });
    simulator.start();

    // Round 1: only B scores, so B leads.
    simulator.answer('b', { optionIds: [questions[0]!.options[0]!.id] });
    simulator.reveal();
    const afterFirst = lastLeaderboard();
    expect(afterFirst?.type === 'leaderboard' && afterFirst.rows[0]?.userId).toBe('b');

    simulator.next();

    // Round 2: A catches up and takes the top spot on the tiebreak.
    simulator.answer('a', { optionIds: [questions[1]!.options[0]!.id] });
    simulator.answer('b', { optionIds: [questions[1]!.options[1]!.id] });
    simulator.reveal();

    const last = lastLeaderboard();
    expect(last?.type).toBe('leaderboard');
    if (last?.type === 'leaderboard') {
      const rowA = last.rows.find((row) => row.userId === 'a');
      expect(rowA?.rank).toBe(1);
      expect(rowA?.previousRank).toBe(2);
      expect(rowA?.gained).toBeGreaterThan(0);
    }
  });
});
