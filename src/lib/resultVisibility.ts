import type { Test } from '@/services/types';

/**
 * Whether a test keeps its result from the person who took it: never shown at
 * all, or held back until the test itself is over.
 */
export function isResultHidden(test: Pick<Test, 'settings' | 'status'>): boolean {
  return (
    test.settings.showResult === 'never' ||
    (test.settings.showResult === 'after_finish' && test.status === 'active')
  );
}
