import { uid } from '@/lib/id';
import type {
  AnswerOption,
  ContentBlock,
  Question,
  QuestionType,
  Test,
  TestSettings,
  TestType,
} from '@/services/types';

/* ------------------------------ content blocks ---------------------------- */

export const text = (value: string): ContentBlock => ({ id: uid('b'), type: 'text', value });

export const formula = (value: string, display = false): ContentBlock => ({
  id: uid('b'),
  type: 'formula',
  value,
  display,
});

export const image = (imageId: string, caption?: string): ContentBlock => ({
  id: uid('b'),
  type: 'image',
  imageId,
  caption,
});

/* --------------------------------- options -------------------------------- */

/** `*` at the start marks the correct option, mirroring the text import format. */
export function options(...entries: string[]): AnswerOption[] {
  return entries.map((entry) => {
    const isCorrect = entry.startsWith('*');
    const body = isCorrect ? entry.slice(1) : entry;
    return { id: uid('o'), content: [text(body)], isCorrect };
  });
}

/** Options whose bodies are formulas rather than plain text. */
export function formulaOptions(...entries: string[]): AnswerOption[] {
  return entries.map((entry) => {
    const isCorrect = entry.startsWith('*');
    const body = isCorrect ? entry.slice(1) : entry;
    return { id: uid('o'), content: [formula(body)], isCorrect };
  });
}

/* -------------------------------- questions ------------------------------- */

export interface QuestionSpec {
  type: QuestionType;
  content: ContentBlock[];
  options?: AnswerOption[];
  accepted?: string[];
  numeric?: { value: number; tolerance: number };
  points?: number;
  timeLimitSec?: number;
  explanation?: ContentBlock[];
}

export function buildQuestions(testId: string, specs: QuestionSpec[]): Question[] {
  return specs.map((spec, index) => ({
    id: `${testId}_q${index + 1}`,
    testId,
    order: index,
    type: spec.type,
    content: spec.content,
    options: spec.options ?? [],
    acceptedAnswers: spec.accepted ?? [],
    numericAnswer: spec.numeric,
    points: spec.points ?? 1,
    timeLimitSec: spec.timeLimitSec,
    explanation: spec.explanation,
  }));
}

/* ---------------------------------- tests --------------------------------- */

export const defaultSettings = (): TestSettings => ({
  durationMin: 20,
  attemptLimit: 1,
  access: 'open',
  requiredChannels: [],
  shuffleQuestions: false,
  shuffleOptions: false,
  penaltyPoints: 0,
  allowBack: true,
  showResult: 'immediately',
  showCorrectAnswers: true,
  antiCheat: false,
  speedBonus: 0.5,
});

export interface TestSpec {
  id: string;
  authorId: string;
  type: TestType;
  title: string;
  description: string;
  subject: string;
  coverImageId?: string;
  status: Test['status'];
  settings?: Partial<TestSettings>;
  createdAgoDays?: number;
  questions: QuestionSpec[];
}

export function buildTest(spec: TestSpec, now: number): { test: Test; questions: Question[] } {
  const questions = buildQuestions(spec.id, spec.questions);
  const createdAt = new Date(now - (spec.createdAgoDays ?? 7) * 86400_000).toISOString();

  const test: Test = {
    id: spec.id,
    authorId: spec.authorId,
    type: spec.type,
    title: spec.title,
    description: spec.description,
    subject: spec.subject,
    coverImageId: spec.coverImageId,
    status: spec.status,
    settings: { ...defaultSettings(), ...spec.settings },
    questionCount: questions.length,
    participantCount: 0,
    createdAt,
    updatedAt: createdAt,
    publishedAt: spec.status === 'draft' ? undefined : createdAt,
  };

  return { test, questions };
}
