import { z } from 'zod';
import { blocksToPlainText } from '@/lib/content';
import type { Question, Test } from '@/services/types';
import { sectionQuota } from '@/features/exams/presets';

export interface ValidationIssue {
  /** i18n key under `validation.` */
  key: string;
  params?: Record<string, string | number>;
}

export const TITLE_MIN_LENGTH = 3;

/**
 * Step 2 of the wizard. The messages are i18n keys, resolved by the step so
 * the schema itself stays free of presentation concerns.
 */
export const basicsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'validation.titleRequired')
    .min(TITLE_MIN_LENGTH, 'validation.titleTooShort'),
  description: z.string(),
  subject: z.string(),
});

export type BasicsErrors = Partial<Record<keyof z.infer<typeof basicsSchema>, string>>;

/** Returns an i18n key per invalid field, or an empty object when valid. */
export function validateBasics(
  test: Pick<Test, 'title' | 'description' | 'subject'>,
): BasicsErrors {
  const result = basicsSchema.safeParse(test);
  if (result.success) return {};
  const errors: BasicsErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in errors)) {
      errors[field as keyof BasicsErrors] = issue.message;
    }
  }
  return errors;
}

/**
 * An exam only reports a comparable ball if every block holds the number of
 * questions the real paper does, so a short block blocks publishing.
 */
export function validateExam(test: Test, questions: Question[]): ValidationIssue[] {
  if (test.type !== 'exam') return [];

  const config = test.settings.exam;
  if (!config) return [{ key: 'validation.examPresetRequired' }];

  const issues: ValidationIssue[] = [];
  for (const section of config.sections) {
    if (section.subject.trim() === '') {
      issues.push({ key: 'validation.examSubjectRequired', params: { title: section.title } });
    }

    const quota = sectionQuota(config.preset, section.id);
    if (quota === undefined) continue;
    const actual = questions.filter((question) => question.sectionId === section.id).length;
    if (actual !== quota) {
      issues.push({
        key: 'validation.examSectionCount',
        params: { title: section.title, count: quota, actual },
      });
    }
  }
  return issues;
}

/** Everything that must hold before a test can be published. */
export function validateTest(test: Test, questions: Question[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const basics = validateBasics(test);
  if (basics.title) issues.push({ key: basics.title });
  if (questions.length === 0) issues.push({ key: 'validation.questionsRequired' });
  issues.push(...validateExam(test, questions));

  questions.forEach((question, index) => {
    const n = index + 1;

    if (blocksToPlainText(question.content).trim() === '') {
      issues.push({ key: 'validation.questionNoText', params: { n } });
    }

    if (question.type === 'single' || question.type === 'multiple') {
      if (question.options.length < 2) {
        issues.push({ key: 'validation.questionFewOptions', params: { n } });
      }
      if (!question.options.some((option) => option.isCorrect)) {
        issues.push({ key: 'validation.questionNoCorrect', params: { n } });
      }
    }

    if (question.type === 'text' && question.acceptedAnswers.length === 0) {
      issues.push({ key: 'validation.questionNoAccepted', params: { n } });
    }

    if (question.type === 'numeric' && !question.numericAnswer) {
      issues.push({ key: 'validation.questionNoNumeric', params: { n } });
    }

    if (test.type === 'live' && !question.timeLimitSec) {
      issues.push({ key: 'validation.liveNeedsTime', params: { n } });
    }
  });

  if (test.type === 'contest') {
    const { startsAt, endsAt } = test.settings;
    if (!startsAt || !endsAt) issues.push({ key: 'validation.contestNeedsWindow' });
    else if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      issues.push({ key: 'validation.contestWindowOrder' });
    }
  }

  if (test.type === 'limited' && !test.settings.participantLimit) {
    issues.push({ key: 'validation.limitedNeedsLimit' });
  }

  if (test.settings.access === 'password' && !test.settings.password?.trim()) {
    issues.push({ key: 'validation.passwordRequired' });
  }

  // The live time-limit rule is reported per question; collapse duplicates.
  return dedupe(issues);
}

function dedupe(issues: ValidationIssue[]): ValidationIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const signature = `${issue.key}:${JSON.stringify(issue.params ?? {})}`;
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}
