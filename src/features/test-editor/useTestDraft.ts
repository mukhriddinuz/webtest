import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/services';
import type { Question, Test, TestSettings } from '@/services/types';
import { qk } from '@/hooks/queries';

export type SaveState = 'idle' | 'saving' | 'saved';

const AUTOSAVE_DELAY_MS = 600;

/**
 * Holds the wizard's working copy of a test and pushes changes to the API a
 * moment after the user stops typing, so the draft is never lost.
 */
export function useTestDraft(testId: string | undefined) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(Boolean(testId));
  const [error, setError] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const testTimer = useRef<number | null>(null);
  const questionsTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!testId) {
      setTest(null);
      setQuestions([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(false);
    void Promise.all([api.tests.get(testId), api.tests.questions(testId)])
      .then(([loadedTest, loadedQuestions]) => {
        if (!active) return;
        setTest(loadedTest);
        setQuestions(loadedQuestions);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [testId]);

  const flushTest = useCallback(
    (next: Test) => {
      if (testTimer.current) window.clearTimeout(testTimer.current);
      setSaveState('saving');
      testTimer.current = window.setTimeout(() => {
        void api.tests
          .update(next.id, {
            // A draft left unnamed would show up as a blank row everywhere,
            // so it is stored under a readable placeholder instead.
            title: next.title.trim() === '' ? t('testCard.untitled') : next.title,
            description: next.description,
            subject: next.subject,
            coverImageId: next.coverImageId,
            type: next.type,
            settings: next.settings,
          })
          .then(() => {
            setSaveState('saved');
            void client.invalidateQueries({ queryKey: qk.test(next.id) });
          })
          .catch(() => setSaveState('idle'));
      }, AUTOSAVE_DELAY_MS);
    },
    [client, t],
  );

  const flushQuestions = useCallback(
    (testIdentifier: string, next: Question[]) => {
      if (questionsTimer.current) window.clearTimeout(questionsTimer.current);
      setSaveState('saving');
      questionsTimer.current = window.setTimeout(() => {
        void api.tests
          .saveQuestions(testIdentifier, next)
          .then((saved) => {
            setQuestions(saved);
            setSaveState('saved');
            void client.invalidateQueries({ queryKey: qk.test(testIdentifier) });
          })
          .catch(() => setSaveState('idle'));
      }, AUTOSAVE_DELAY_MS);
    },
    [client],
  );

  const patchTest = useCallback(
    (patch: Partial<Omit<Test, 'settings'>> & { settings?: Partial<TestSettings> }) => {
      setTest((current) => {
        if (!current) return current;
        const next: Test = {
          ...current,
          ...patch,
          settings: { ...current.settings, ...(patch.settings ?? {}) },
        };
        flushTest(next);
        return next;
      });
    },
    [flushTest],
  );

  const replaceQuestions = useCallback(
    (updater: (current: Question[]) => Question[]) => {
      setQuestions((current) => {
        const next = updater(current).map((question, index) => ({ ...question, order: index }));
        if (test) flushQuestions(test.id, next);
        return next;
      });
    },
    [flushQuestions, test],
  );

  useEffect(
    () => () => {
      if (testTimer.current) window.clearTimeout(testTimer.current);
      if (questionsTimer.current) window.clearTimeout(questionsTimer.current);
    },
    [],
  );

  return {
    test,
    questions,
    loading,
    error,
    saveState,
    setTest,
    patchTest,
    replaceQuestions,
  };
}
