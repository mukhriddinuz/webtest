import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import type { TestStatus } from '@/services/types';
import { cn } from '@/lib/cn';
import { useCurrentUser } from '@/store/session';
import { useOnAirTestIds, useTests } from '@/hooks/queries';
import { usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { IconButton } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { Input } from '@/components/Input';
import { TestCard } from '@/components/TestCard';

type Filter = TestStatus | 'all';

const FILTERS: Filter[] = ['all', 'draft', 'scheduled', 'active', 'finished', 'archived'];

export default function MyTestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();

  const [filter, setFilter] = useState<Filter>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Everything is fetched once so the chips can show live counts.
  const tests = useTests({ authorId: user?.id }, Boolean(user));
  const onAir = useOnAirTestIds();

  const counts = useMemo(() => {
    const result: Record<Filter, number> = {
      all: 0,
      draft: 0,
      scheduled: 0,
      active: 0,
      finished: 0,
      archived: 0,
    };
    (tests.data ?? []).forEach((test) => {
      result.all += 1;
      result[test.status] += 1;
    });
    return result;
  }, [tests.data]);

  /** An empty bucket is noise, so only the filters that match anything show. */
  const chips = useMemo(
    () => FILTERS.filter((item) => item === 'all' || counts[item] > 0),
    [counts],
  );

  useEffect(() => {
    // The selected bucket can empty out after a publish or a delete.
    if (filter !== 'all' && counts[filter] === 0) setFilter('all');
  }, [counts, filter]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (tests.data ?? []).filter((test) => {
      if (filter !== 'all' && test.status !== filter) return false;
      if (needle && !test.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [tests.data, filter, search]);

  usePrimaryAction(null);

  const hasTests = (tests.data ?? []).length > 0;

  return (
    <Page>
      <PageHeader
        title={t('myTests.title')}
        actions={
          hasTests ? (
            <IconButton
              label={t('common.search')}
              onClick={() => {
                setSearchOpen((open) => !open);
                setSearch('');
              }}
            >
              {searchOpen ? (
                <X size={20} strokeWidth={1.75} />
              ) : (
                <Search size={20} strokeWidth={1.75} />
              )}
            </IconButton>
          ) : undefined
        }
      />

      {searchOpen && hasTests && (
        <div className="mb-3">
          <Input
            autoFocus
            value={search}
            placeholder={t('myTests.searchPlaceholder')}
            prefix={<Search size={16} strokeWidth={1.75} />}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}

      {hasTests && (
        <div className="relative mb-3">
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
            {chips.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cn(
                  'flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 text-[13px]',
                  'transition-colors duration-150',
                  filter === item
                    ? 'bg-primary-soft text-primary'
                    : 'bg-surface-muted text-text-muted hover:text-text',
                )}
              >
                {item === 'all' ? t('home.filterAll') : t(`status.${item}`)}
                <span className="tnum opacity-70">· {counts[item]}</span>
              </button>
            ))}
          </div>
          {/* Hints that the rail keeps going. */}
          <div className="pointer-events-none absolute inset-y-0 right-[-1rem] w-8 bg-gradient-to-l from-bg to-transparent" />
        </div>
      )}

      {tests.isPending ? (
        <LoadingState />
      ) : tests.isError ? (
        <ErrorState onRetry={() => void tests.refetch()} />
      ) : !hasTests ? (
        <EmptyState
          title={t('myTests.emptyTitle')}
          description={t('myTests.emptyText')}
          actionLabel={t('myTests.emptyAction')}
          onAction={() => navigate('/tests/new')}
        />
      ) : visible.length === 0 ? (
        <EmptyState title={t('myTests.nothingFound')} />
      ) : (
        <div className="-mx-4 bg-surface">
          {visible.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              onAir={onAir.has(test.id)}
              onClick={() =>
                navigate(
                  test.status === 'draft' ? `/tests/${test.id}/edit` : `/tests/${test.id}/manage`,
                )
              }
            />
          ))}
        </div>
      )}
    </Page>
  );
}
