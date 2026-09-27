import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { Attempt, Test } from '@/services/types';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useCurrentUser } from '@/store/session';
import { useTests, useUserAttempts, useUserStats } from '@/hooks/queries';
import { usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState, LoadingState } from '@/components/StateViews';

/** Percentage color follows the same thresholds across the app. */
function percentTone(percent: number): string {
  if (percent >= 80) return 'text-success';
  if (percent >= 50) return 'text-accent';
  return 'text-danger';
}

export default function ResultsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();

  const stats = useUserStats(user?.id);
  const attempts = useUserAttempts(user?.id);
  const tests = useTests({});

  const testsById = useMemo(() => {
    const map = new Map<string, Test>();
    (tests.data ?? []).forEach((test) => map.set(test.id, test));
    return map;
  }, [tests.data]);

  const rows = useMemo(
    () =>
      (attempts.data ?? [])
        .filter((attempt): attempt is Attempt => attempt.status === 'submitted')
        .filter((attempt) => testsById.has(attempt.testId)),
    [attempts.data, testsById],
  );

  usePrimaryAction(null);

  return (
    <Page>
      <PageHeader title={t('results.title')} />

      {rows.length > 0 && (
        <Card className="mb-4 p-0">
          <div className="grid grid-cols-3 divide-x divide-border">
            <StatColumn label={t('results.statTaken')} value={stats.data?.taken ?? 0} />
            <StatColumn
              label={t('results.statAverage')}
              value={`${stats.data?.averagePercent ?? 0}%`}
            />
            <StatColumn label={t('results.statBest')} value={`${stats.data?.bestPercent ?? 0}%`} />
          </div>
        </Card>
      )}

      {attempts.isPending || tests.isPending ? (
        <LoadingState />
      ) : attempts.isError ? (
        <ErrorState onRetry={() => void attempts.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={t('results.emptyTitle')}
          description={t('results.emptyText')}
          actionLabel={t('results.emptyAction')}
          onAction={() => navigate('/')}
        />
      ) : (
        <div className="-mx-4 bg-surface">
          {rows.map((attempt) => {
            const test = testsById.get(attempt.testId);
            return (
              <button
                key={attempt.id}
                type="button"
                onClick={() => navigate(`/t/${attempt.testId}/result/${attempt.id}`)}
                className="group/row flex w-full items-center gap-3 pl-4 text-left transition-colors duration-150 active:bg-surface-muted"
              >
                <span className="flex min-w-0 flex-1 items-center gap-3 border-t border-border py-3 pr-4 group-first/row:border-t-0">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-body text-text">{test?.title}</span>
                    <span className="truncate text-small text-text-muted">
                      {formatDate(attempt.finishedAt ?? attempt.startedAt, i18n.language)} ·{' '}
                      <span className="tnum">
                        {attempt.score} / {attempt.maxScore}
                      </span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      'tnum shrink-0 text-body font-medium',
                      percentTone(attempt.percent),
                    )}
                  >
                    {Math.round(attempt.percent)}%
                  </span>
                  <ChevronRight
                    size={16}
                    strokeWidth={1.75}
                    className="shrink-0 text-text-muted/70"
                  />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Page>
  );
}

function StatColumn({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center px-2 py-3">
      <span className="tnum text-[20px] font-semibold leading-tight text-text">{value}</span>
      <span className="truncate text-small text-text-muted">{label}</span>
    </div>
  );
}
