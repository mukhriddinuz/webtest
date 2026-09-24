import {
  computeLiveScore,
  correctOptionIds,
  isNumericAnswerCorrect,
  isTextAnswerCorrect,
} from '@/lib/grading';
import { createRandom, randomInt, shuffle } from '@/lib/random';
import { uid } from '@/lib/id';
import { participantName } from './names';
import { postLive } from './liveChannel';
import type {
  LiveAnswerTally,
  LiveEvent,
  LiveLeaderboardRow,
  LiveParticipant,
  LiveSession,
  Question,
} from '@/services/types';

const DEFAULT_QUESTION_SEC = 20;
const BOT_JOIN_MIN_MS = 500;
const BOT_JOIN_MAX_MS = 2000;
/** Share of bots that answer a question correctly. */
const BOT_ACCURACY = 0.6;

interface BotPlan {
  /** When the bot answers, as a fraction of the question duration. */
  at: number;
  correct: boolean;
}

/**
 * Stands in for the future realtime server. It emits exactly the events the
 * WebSocket protocol will emit, so screens need no changes once it is swapped.
 */
export class LiveSimulator {
  private handlers = new Set<(event: LiveEvent) => void>();
  private timers: number[] = [];
  private answers = new Map<string, { optionIds?: string[]; value?: string; at: number }>();
  private scores = new Map<string, number>();
  private streaks = new Map<string, number>();
  private previousRanks = new Map<string, number>();
  private questionStartedAt = 0;
  private botCount = 0;
  private rnd = createRandom(Date.now() & 0xffff);

  constructor(
    public session: LiveSession,
    private questions: Question[],
    private speedBonus: number,
  ) {}

  /* ------------------------------ subscription ---------------------------- */

  subscribe(handler: (event: LiveEvent) => void): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private emit(event: LiveEvent): void {
    this.handlers.forEach((handler) => handler(event));
    postLive(this.session.id, { kind: 'event', event });
  }

  private later(handler: () => void, delayMs: number): void {
    this.timers.push(window.setTimeout(handler, delayMs));
  }

  private clearTimers(): void {
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers = [];
  }

  destroy(): void {
    this.clearTimers();
    this.handlers.clear();
  }

  /* --------------------------------- lobby -------------------------------- */

  /** Fake participants trickle in while the host waits. */
  startLobbyBots(target = randomInt(this.rnd, 8, 16)): void {
    const addOne = () => {
      if (this.session.status !== 'lobby' || this.botCount >= target) return;
      const index = this.botCount;
      this.botCount += 1;
      const bot: LiveParticipant = {
        userId: `bot_${uid()}`,
        name: participantName(index + 3),
        score: 0,
        streak: 0,
        joinedAt: new Date().toISOString(),
        isBot: true,
      };
      this.session.participants.push(bot);
      this.scores.set(bot.userId, 0);
      this.emit({ type: 'lobby_update', participants: [...this.session.participants] });
      this.later(addOne, randomInt(this.rnd, BOT_JOIN_MIN_MS, BOT_JOIN_MAX_MS));
    };
    this.later(addOne, BOT_JOIN_MIN_MS);
  }

  join(user: { id: string; name: string; photoUrl?: string }): LiveSession {
    const existing = this.session.participants.find((item) => item.userId === user.id);
    if (!existing) {
      this.session.participants.push({
        userId: user.id,
        name: user.name,
        photoUrl: user.photoUrl,
        score: 0,
        streak: 0,
        joinedAt: new Date().toISOString(),
        isBot: false,
      });
      this.scores.set(user.id, 0);
    }
    this.emit({ type: 'lobby_update', participants: [...this.session.participants] });
    return this.session;
  }

  /* ------------------------------- game flow ------------------------------ */

  start(): void {
    if (this.session.status !== 'lobby') return;
    this.clearTimers();
    this.session.currentIndex = -1;
    this.emit({ type: 'session_started', questionCount: this.questions.length });
    this.next();
  }

  next(): void {
    const index = this.session.currentIndex + 1;
    if (index >= this.questions.length) {
      this.finish();
      return;
    }
    this.showQuestion(index);
  }

  private showQuestion(index: number): void {
    const question = this.questions[index];
    if (!question) return;

    this.clearTimers();
    this.answers.clear();
    this.session.currentIndex = index;
    this.session.status = 'question';
    this.questionStartedAt = Date.now();
    this.session.questionStartedAt = new Date(this.questionStartedAt).toISOString();

    const durationSec = question.timeLimitSec ?? DEFAULT_QUESTION_SEC;

    this.emit({
      type: 'question_show',
      index,
      question,
      durationSec,
      startedAt: this.session.questionStartedAt,
    });

    this.scheduleBots(question, durationSec);
    this.later(() => this.reveal(), durationSec * 1000);
  }

  private scheduleBots(question: Question, durationSec: number): void {
    const bots = this.session.participants.filter((participant) => participant.isBot);
    const correctIds = correctOptionIds(question);
    const wrongIds = question.options
      .filter((option) => !option.isCorrect)
      .map((option) => option.id);

    bots.forEach((bot) => {
      const plan: BotPlan = {
        at: 0.1 + this.rnd() * 0.75,
        correct: this.rnd() < BOT_ACCURACY,
      };
      this.later(
        () => {
          if (this.session.status !== 'question') return;
          const optionIds = plan.correct
            ? correctIds.slice(0, question.type === 'multiple' ? correctIds.length : 1)
            : shuffle(wrongIds, this.rnd).slice(0, 1);
          this.answers.set(bot.userId, { optionIds, at: Date.now() });
          this.emit({ type: 'answer_count_update', tally: this.tally(question) });
        },
        Math.round(plan.at * durationSec * 1000),
      );
    });
  }

  /** Records an answer coming from a real participant. */
  answer(userId: string, payload: { optionIds?: string[]; value?: string }): void {
    if (this.session.status !== 'question') return;
    if (this.answers.has(userId)) return;
    this.answers.set(userId, { ...payload, at: Date.now() });
    const question = this.questions[this.session.currentIndex];
    if (question) this.emit({ type: 'answer_count_update', tally: this.tally(question) });
  }

  private tally(question: Question): LiveAnswerTally {
    const counts: Record<string, number> = {};
    question.options.forEach((option) => {
      counts[option.id] = 0;
    });
    this.answers.forEach((answer) => {
      answer.optionIds?.forEach((optionId) => {
        if (optionId in counts) counts[optionId] = (counts[optionId] ?? 0) + 1;
      });
    });
    return {
      counts,
      answered: this.answers.size,
      total: this.session.participants.length,
    };
  }

  private isCorrect(question: Question, answer: { optionIds?: string[]; value?: string }): boolean {
    switch (question.type) {
      case 'single':
      case 'multiple': {
        const correct = new Set(correctOptionIds(question));
        const given = new Set(answer.optionIds ?? []);
        if (given.size !== correct.size) return false;
        return [...given].every((id) => correct.has(id));
      }
      case 'text':
        return isTextAnswerCorrect(question.acceptedAnswers, answer.value ?? '');
      case 'numeric':
        return question.numericAnswer
          ? isNumericAnswerCorrect(question.numericAnswer, answer.value ?? '')
          : false;
      default:
        return false;
    }
  }

  /** Closes the current question, scores it and publishes the new standings. */
  reveal(): void {
    if (this.session.status !== 'question') return;
    const question = this.questions[this.session.currentIndex];
    if (!question) return;

    this.clearTimers();
    this.session.status = 'reveal';

    const limitMs = (question.timeLimitSec ?? DEFAULT_QUESTION_SEC) * 1000;
    this.previousRanks = new Map(this.leaderboard().map((row) => [row.userId, row.rank] as const));

    this.session.participants.forEach((participant) => {
      const answer = this.answers.get(participant.userId);
      const correct = answer ? this.isCorrect(question, answer) : false;
      const streak = correct ? (this.streaks.get(participant.userId) ?? 0) + 1 : 0;
      this.streaks.set(participant.userId, streak);

      const gained = computeLiveScore({
        basePoints: question.points,
        correct,
        elapsedMs: answer ? answer.at - this.questionStartedAt : limitMs,
        limitMs,
        speedBonus: this.speedBonus,
        streak,
      });

      const total = (this.scores.get(participant.userId) ?? 0) + gained;
      this.scores.set(participant.userId, total);
      participant.score = total;
      participant.streak = streak;
      participant.lastGain = gained;
    });

    const rows = this.leaderboard();
    this.emit({
      type: 'question_end',
      result: {
        questionId: question.id,
        correctOptionIds: correctOptionIds(question),
        tally: this.tally(question),
        leaderboard: rows,
      },
    });
    this.emit({ type: 'leaderboard', rows });
  }

  private leaderboard(): LiveLeaderboardRow[] {
    return this.session.participants
      .slice()
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .map((participant, index) => ({
        userId: participant.userId,
        name: participant.name,
        photoUrl: participant.photoUrl,
        score: participant.score,
        gained: participant.lastGain ?? 0,
        rank: index + 1,
        previousRank: this.previousRanks.get(participant.userId) ?? index + 1,
      }));
  }

  pause(): void {
    if (this.session.status !== 'question') return;
    this.clearTimers();
    this.session.status = 'paused';
    this.emit({ type: 'session_paused' });
  }

  resume(): void {
    if (this.session.status !== 'paused') return;
    this.session.status = 'question';
    const question = this.questions[this.session.currentIndex];
    const durationSec = question?.timeLimitSec ?? DEFAULT_QUESTION_SEC;
    const elapsed = Date.now() - this.questionStartedAt;
    this.emit({ type: 'session_resumed' });
    this.later(() => this.reveal(), Math.max(1000, durationSec * 1000 - elapsed));
  }

  finish(): void {
    this.clearTimers();
    this.session.status = 'finished';
    this.emit({ type: 'session_finished', rows: this.leaderboard() });
  }

  snapshot(): LiveSession {
    return { ...this.session, participants: [...this.session.participants] };
  }
}
