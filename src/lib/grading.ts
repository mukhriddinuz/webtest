import type { GivenAnswer, Question, QuestionResult, TestSettings } from '@/services/types';

/**
 * Pure grading logic. Kept free of React, storage and i18n so it can be moved
 * to the backend verbatim. Covered by `grading.test.ts`.
 */

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'j',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'x',
  ц: 's',
  ч: 'ch',
  ш: 'sh',
  щ: 'sh',
  ъ: '',
  ы: 'i',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  ў: 'o',
  қ: 'q',
  ғ: 'g',
  ҳ: 'h',
};

/**
 * Case, spacing, apostrophe and script insensitive normalisation.
 * "O‘zbekiston" / "o'zbekiston" / "Ўзбекистон" all collapse to "ozbekiston".
 */
export function normalizeText(input: string): string {
  const lowered = input.toLowerCase().normalize('NFKC');
  let out = '';
  for (const char of lowered) {
    const mapped = CYRILLIC_TO_LATIN[char];
    out += mapped === undefined ? char : mapped;
  }
  return out
    .replace(/[’'`ʻʼ‘´]/g, '')
    .replace(/[.,;:!?"“”()\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Accepts "3,14", " 3.14 ", "−5" (unicode minus). */
export function parseNumeric(input: string): number | null {
  const cleaned = input
    .trim()
    .replace(/\u2212/g, '-')
    .replace(/\s/g, '')
    .replace(',', '.');
  if (cleaned === '' || !/^-?\d*\.?\d+(e-?\d+)?$/i.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function isTextAnswerCorrect(accepted: readonly string[], value: string): boolean {
  const normalized = normalizeText(value);
  if (normalized === '') return false;
  return accepted.some((candidate) => normalizeText(candidate) === normalized);
}

export function isNumericAnswerCorrect(
  expected: { value: number; tolerance: number },
  value: string,
): boolean {
  const parsed = parseNumeric(value);
  if (parsed === null) return false;
  return Math.abs(parsed - expected.value) <= Math.abs(expected.tolerance) + Number.EPSILON;
}

export function correctOptionIds(question: Question): string[] {
  return question.options.filter((option) => option.isCorrect).map((option) => option.id);
}

export interface GradingOptions {
  penaltyPoints: number;
  /** Multiple-choice questions award proportional credit when enabled. */
  partialCredit: boolean;
}

export const defaultGradingOptions: GradingOptions = { penaltyPoints: 0, partialCredit: true };

export function gradingOptionsFromSettings(settings: TestSettings): GradingOptions {
  return { penaltyPoints: settings.penaltyPoints, partialCredit: true };
}

/** Grades one question. `earned` may be negative when a penalty applies. */
export function gradeQuestion(
  question: Question,
  answer: GivenAnswer | undefined,
  options: GradingOptions = defaultGradingOptions,
): QuestionResult {
  const max = question.points;
  const blank: QuestionResult = {
    questionId: question.id,
    correct: false,
    partial: false,
    earned: 0,
    max,
  };
  if (!answer) return blank;

  // `|| 0` keeps the result from being -0 when no penalty is configured.
  const penalize = (): QuestionResult => ({
    ...blank,
    earned: options.penaltyPoints > 0 ? -options.penaltyPoints : 0,
  });

  switch (question.type) {
    case 'single': {
      const selected = answer.optionIds?.[0];
      if (!selected) return blank;
      const isCorrect = correctOptionIds(question).includes(selected);
      return isCorrect ? { ...blank, correct: true, earned: max } : penalize();
    }

    case 'multiple': {
      const selected = new Set(answer.optionIds ?? []);
      if (selected.size === 0) return blank;
      const correct = correctOptionIds(question);
      const correctSet = new Set(correct);
      const hits = [...selected].filter((id) => correctSet.has(id)).length;
      const misses = [...selected].filter((id) => !correctSet.has(id)).length;

      if (hits === correct.length && misses === 0) {
        return { ...blank, correct: true, earned: max };
      }
      if (!options.partialCredit) return penalize();

      const ratio = correct.length === 0 ? 0 : (hits - misses) / correct.length;
      if (ratio <= 0) return penalize();
      return {
        ...blank,
        partial: true,
        earned: roundPoints(max * ratio),
      };
    }

    case 'text': {
      const value = answer.value ?? '';
      if (value.trim() === '') return blank;
      return isTextAnswerCorrect(question.acceptedAnswers, value)
        ? { ...blank, correct: true, earned: max }
        : penalize();
    }

    case 'numeric': {
      const value = answer.value ?? '';
      if (value.trim() === '' || !question.numericAnswer) return blank;
      return isNumericAnswerCorrect(question.numericAnswer, value)
        ? { ...blank, correct: true, earned: max }
        : penalize();
    }

    default:
      return blank;
  }
}

export interface AttemptGrade {
  results: QuestionResult[];
  score: number;
  maxScore: number;
  percent: number;
}

export function gradeAttempt(
  questions: readonly Question[],
  answers: Readonly<Record<string, GivenAnswer>>,
  options: GradingOptions = defaultGradingOptions,
): AttemptGrade {
  const results = questions.map((question) =>
    gradeQuestion(question, answers[question.id], options),
  );
  const maxScore = results.reduce((sum, result) => sum + result.max, 0);
  const rawScore = results.reduce((sum, result) => sum + result.earned, 0);
  const score = roundPoints(Math.max(0, rawScore));
  return {
    results,
    score,
    maxScore,
    percent: maxScore === 0 ? 0 : roundPoints((score / maxScore) * 100),
  };
}

/**
 * Live scoring: a correct answer is worth the base points plus a speed bonus
 * that decays linearly with the time taken.
 */
export function computeLiveScore(input: {
  basePoints: number;
  correct: boolean;
  elapsedMs: number;
  limitMs: number;
  speedBonus: number;
  streak?: number;
}): number {
  if (!input.correct) return 0;
  const remaining = Math.max(0, input.limitMs - input.elapsedMs) / Math.max(1, input.limitMs);
  const bonus = input.basePoints * input.speedBonus * remaining;
  const streakBonus = input.streak && input.streak >= 3 ? input.basePoints * 0.1 : 0;
  return Math.round(input.basePoints + bonus + streakBonus);
}

/** Points are kept to two decimals to avoid floating point noise. */
export function roundPoints(value: number): number {
  return Math.round(value * 100) / 100;
}

/** True when the participant supplied something for this question. */
export function isAnswered(answer: GivenAnswer | undefined): boolean {
  if (!answer) return false;
  if (answer.optionIds && answer.optionIds.length > 0) return true;
  return (answer.value ?? '').trim() !== '';
}
