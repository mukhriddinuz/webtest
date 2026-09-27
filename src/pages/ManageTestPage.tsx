import { lazy, Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Archive, Copy, Download, Link2, Pencil, Play, Radio, Square, Trash2 } from 'lucide-react';
import { api } from '@/services';
import type { TestStatus } from '@/services/types';
import { formatDateTime, formatDuration } from '@/lib/format';
import { useCurrentUser } from '@/store/session';
import { toast } from '@/store/toast';
import {
  useDeleteTest,
  useDuplicateTest,
  useParticipants,
  useQuestions,
  useSetTestStatus,
  useTest,
  useTestStats,
} from '@/hooks/queries';
import { usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { Avatar } from '@/components/Avatar';
import { ListRow, ListSection } from '@/components/ListSection';
import { Button, IconButton } from '@/components/Button';
import { Card, CardTitle } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { Input } from '@/components/Input';
import { QrCode } from '@/components/QrCode';
import { Tabs } from '@/components/Tabs';
import { TestStatusBadge, TestTypeBadge } from '@/components/TestTypeBadge';
import { exportResultsWorkbook } from '@/features/stats/exportExcel';

const AnalyticsTab = lazy(() =>
  import('@/features/stats/AnalyticsTab').then((module) => ({ default: module.AnalyticsTab })),
);

type ManageTab = 'participants' | 'analytics' | 'export';

export default function ManageTestPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const user = useCurrentUser();

  const [tab, setTab] = useState<ManageTab>('participants');
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState<'delete' | 'finish' | null>(null);
  const [exporting, setExporting] = useState(false);
  const [startingLive, setStartingLive] = useState(false);

  const testQuery = useTest(testId);
  const questions = useQuestions(testId);
  const participants = useParticipants(testId);
  const stats = useTestStats(testId, tab === 'analytics');

  const setStatus = useSetTestStatus();
  const duplicate = useDuplicateTest();
  const remove = useDeleteTest();

  const test = testQuery.data;
  const shareUrl = test ? `${window.location.origin}/t/${test.id}` : '';

  const filteredParticipants = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return participants.data ?? [];
    return (participants.data ?? []).filter((row) =>
      `${row.user.firstName} ${row.user.lastName ?? ''}`.toLowerCase().includes(needle),
    );
  }, [participants.data, search]);

  const startLive = async () => {
    if (!test || !user) return;
    setStartingLive(true);
    try {
      // Reuse a room that is already gathering players instead of stranding it.
      const open = await api.live.listOpen();
      const waiting = open.find((item) => item.testId === test.id && item.status === 'lobby');
      const session = waiting ?? (await api.live.createSession(test.id, user.id));
      navigate(`/live/${session.id}/host`);
    } catch {
      toast.error(t('errors.unknown'));
    } finally {
      setStartingLive(false);
    }
  };

  usePrimaryAction(
    test?.type === 'live' && test.status === 'active'
      ? {
          label: t('manage.startLive'),
          loading: startingLive,
          onClick: () => void startLive(),
        }
      : null,
  );

  if (testQuery.isPending) {
    return (
      <Page>
        <PageHeader title={t('manage.title')} onBack="auto" />
        <LoadingState count={2} />
      </Page>
    );
  }

  if (testQuery.isError || !test) {
    return (
      <Page>
        <PageHeader title={t('manage.title')} onBack="auto" />
        <ErrorState onRetry={() => void testQuery.refetch()} />
      </Page>
    );
  }

  const copy = (value: string) => {
    void navigator.clipboard?.writeText(value).then(() => toast.success(t('common.copied')));
  };

  const changeStatus = (status: TestStatus) => {
    setStatus.mutate(
      { id: test.id, status },
      { onSuccess: () => toast.success(t('common.saved')) },
    );
  };

  const canPublish = test.status === 'draft';
  const canFinish = test.status === 'active';
  const canArchive = test.status === 'finished' || test.status === 'active';

  return (
    <Page>
      <PageHeader
        title={test.title || t('manage.title')}
        subtitle={test.subject}
        onBack={() => navigate('/')}
        actions={
          <IconButton label={t('common.edit')} onClick={() => navigate(`/tests/${test.id}/edit`)}>
            <Pencil size={18} strokeWidth={1.75} />
          </IconButton>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <TestTypeBadge type={test.type} />
        <TestStatusBadge status={test.status} />
        <span className="tnum ml-auto text-small text-text-muted">
          {test.questionCount} · {test.participantCount}
        </span>
      </div>

      {/* Telegram sets actions as list rows rather than as a row of chips. */}
      <ListSection>
        {canPublish && (
          <ListRow
            icon={<Play size={15} strokeWidth={1.75} />}
            title={t('manage.publish')}
            tone="primary"
            chevron={false}
            onClick={() => changeStatus('active')}
          />
        )}
        {canFinish && (
          <ListRow
            icon={<Square size={15} strokeWidth={1.75} />}
            iconClassName="bg-text-muted text-on-primary"
            title={t('manage.finish')}
            chevron={false}
            onClick={() => setConfirm('finish')}
          />
        )}
        {canArchive && (
          <ListRow
            icon={<Archive size={15} strokeWidth={1.75} />}
            iconClassName="bg-text-muted text-on-primary"
            title={t('manage.archive')}
            chevron={false}
            onClick={() => changeStatus('archived')}
          />
        )}
        <ListRow
          icon={<Copy size={15} strokeWidth={1.75} />}
          iconClassName="bg-accent text-on-accent"
          title={t('manage.duplicate')}
          chevron={false}
          disabled={duplicate.isPending}
          onClick={() =>
            user &&
            duplicate.mutate(
              { id: test.id, authorId: user.id },
              { onSuccess: (copyTest) => navigate(`/tests/${copyTest.id}/edit`) },
            )
          }
        />
        {test.type === 'live' && test.status === 'active' && (
          <ListRow
            icon={<Radio size={15} strokeWidth={1.75} />}
            iconClassName="bg-danger text-on-primary"
            title={t('manage.startLive')}
            chevron={false}
            disabled={startingLive}
            onClick={() => void startLive()}
          />
        )}
        <ListRow
          icon={<Trash2 size={15} strokeWidth={1.75} />}
          iconClassName="bg-danger text-on-primary"
          title={t('manage.delete')}
          tone="danger"
          chevron={false}
          onClick={() => setConfirm('delete')}
        />
      </ListSection>

      <Card className="mb-4">
        <CardTitle className="mb-2">{t('manage.link')}</CardTitle>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => copy(shareUrl)}
              className="flex w-full items-center gap-2 rounded-control bg-surface-muted px-3 py-2.5 text-left text-small text-text"
            >
              <Link2 size={15} strokeWidth={1.75} className="shrink-0 text-text-muted" />
              <span className="truncate">{shareUrl}</span>
              <Copy size={14} strokeWidth={1.75} className="ml-auto shrink-0 text-text-muted" />
            </button>
            {test.settings.inviteCode && (
              <button
                type="button"
                onClick={() => copy(test.settings.inviteCode as string)}
                className="mt-2 flex w-full items-center gap-2 rounded-control bg-surface-muted px-3 py-2.5 text-small text-text"
              >
                {t('manage.inviteCode')}:
                <span className="tnum-mono font-medium">{test.settings.inviteCode}</span>
                <Copy size={14} strokeWidth={1.75} className="ml-auto text-text-muted" />
              </button>
            )}
          </div>
          <QrCode value={shareUrl} size={96} className="shrink-0" />
        </div>
      </Card>

      <Tabs<ManageTab>
        className="mb-4"
        variant="underline"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'participants', label: t('manage.tabParticipants') },
          { value: 'analytics', label: t('manage.tabAnalytics') },
          { value: 'export', label: t('manage.tabExport') },
        ]}
      />

      {tab === 'participants' && (
        <section className="flex flex-col gap-3">
          <Input
            value={search}
            placeholder={t('manage.searchParticipant')}
            onChange={(event) => setSearch(event.target.value)}
          />
          {participants.isPending ? (
            <LoadingState />
          ) : filteredParticipants.length === 0 ? (
            <EmptyState
              title={t('manage.noParticipants')}
              description={t('manage.noParticipantsText')}
            />
          ) : (
            <ListSection className="mb-0">
              {filteredParticipants.map((row, index) => {
                const timeSec = row.attempt.finishedAt
                  ? Math.round(
                      (new Date(row.attempt.finishedAt).getTime() -
                        new Date(row.attempt.startedAt).getTime()) /
                        1000,
                    )
                  : 0;
                const facts = [
                  `${Math.round(row.attempt.percent)}%`,
                  formatDuration(timeSec),
                  row.attempt.tabSwitches > 0
                    ? t('manage.exitsShort', { count: row.attempt.tabSwitches })
                    : null,
                ].filter(Boolean);

                return (
                  <ListRow
                    key={row.attempt.id}
                    icon={
                      <Avatar
                        name={`${row.user.firstName} ${row.user.lastName ?? ''}`}
                        photoUrl={row.user.photoUrl}
                        size={28}
                      />
                    }
                    iconClassName="bg-transparent"
                    title={
                      <>
                        <span className="tnum text-text-muted">{index + 1}. </span>
                        {row.user.firstName} {row.user.lastName}
                      </>
                    }
                    subtitle={facts.join(' · ')}
                    value={<span className="tnum text-text">{row.attempt.score}</span>}
                    onClick={() => navigate(`/t/${test.id}/result/${row.attempt.id}`)}
                  />
                );
              })}
            </ListSection>
          )}
        </section>
      )}

      {tab === 'analytics' && (
        <Suspense fallback={<LoadingState count={2} />}>
          {stats.isPending ? (
            <LoadingState count={2} />
          ) : stats.isError ? (
            <ErrorState onRetry={() => void stats.refetch()} />
          ) : stats.data ? (
            <AnalyticsTab stats={stats.data} questions={questions.data ?? []} />
          ) : null}
        </Suspense>
      )}

      {tab === 'export' && (
        <section className="flex flex-col gap-3">
          <p className="text-small text-text-muted">{t('manage.exportHint')}</p>
          <Button
            icon={<Download size={16} strokeWidth={1.75} />}
            loading={exporting}
            disabled={(participants.data ?? []).length === 0}
            onClick={async () => {
              setExporting(true);
              try {
                await exportResultsWorkbook({
                  test,
                  questions: questions.data ?? [],
                  rows: participants.data ?? [],
                });
              } catch {
                toast.error(t('errors.unknown'));
              } finally {
                setExporting(false);
              }
            }}
          >
            {t('manage.exportExcel')}
          </Button>
          <p className="text-small text-text-muted">
            {t('common.saved')}: {formatDateTime(test.updatedAt, i18n.language)}
          </p>
        </section>
      )}

      <ConfirmDialog
        open={confirm !== null}
        tone="danger"
        loading={remove.isPending || setStatus.isPending}
        title={confirm === 'delete' ? t('manage.deleteConfirm') : t('manage.finishConfirm')}
        description={
          confirm === 'delete' ? t('manage.deleteConfirmText') : t('manage.finishConfirmText')
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm === 'delete') {
            remove.mutate(test.id, {
              onSuccess: () => {
                toast.success(t('common.saved'));
                navigate('/', { replace: true });
              },
            });
          } else {
            changeStatus('finished');
          }
          setConfirm(null);
        }}
      />
    </Page>
  );
}
