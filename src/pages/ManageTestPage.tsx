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

      <div className="mb-4 flex flex-wrap gap-2">
        {canPublish && (
          <Button
            size="sm"
            icon={<Play size={15} strokeWidth={1.75} />}
            onClick={() => changeStatus('active')}
          >
            {t('manage.publish')}
          </Button>
        )}
        {canFinish && (
          <Button
            size="sm"
            variant="secondary"
            icon={<Square size={15} strokeWidth={1.75} />}
            onClick={() => setConfirm('finish')}
          >
            {t('manage.finish')}
          </Button>
        )}
        {canArchive && (
          <Button
            size="sm"
            variant="secondary"
            icon={<Archive size={15} strokeWidth={1.75} />}
            onClick={() => changeStatus('archived')}
          >
            {t('manage.archive')}
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          icon={<Copy size={15} strokeWidth={1.75} />}
          loading={duplicate.isPending}
          onClick={() =>
            user &&
            duplicate.mutate(
              { id: test.id, authorId: user.id },
              {
                onSuccess: (copyTest) => navigate(`/tests/${copyTest.id}/edit`),
              },
            )
          }
        >
          {t('manage.duplicate')}
        </Button>
        {test.type === 'live' && test.status === 'active' && (
          <Button
            size="sm"
            variant="danger"
            icon={<Radio size={15} strokeWidth={1.75} />}
            loading={startingLive}
            onClick={() => void startLive()}
          >
            {t('manage.startLive')}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          icon={<Trash2 size={15} strokeWidth={1.75} />}
          onClick={() => setConfirm('delete')}
        >
          {t('manage.delete')}
        </Button>
      </div>

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
            <div className="no-scrollbar overflow-x-auto">
              <table className="w-full min-w-[420px] text-small">
                <thead>
                  <tr className="border-b border-border text-left text-text-muted">
                    <th className="py-2 pr-2 font-medium">#</th>
                    <th className="py-2 pr-2 font-medium">{t('manage.colName')}</th>
                    <th className="py-2 pr-2 text-right font-medium">{t('manage.colScore')}</th>
                    <th className="py-2 pr-2 text-right font-medium">{t('manage.colPercent')}</th>
                    <th className="py-2 pr-2 text-right font-medium">{t('manage.colTime')}</th>
                    <th className="py-2 text-right font-medium">{t('manage.colExits')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((row, index) => {
                    const timeSec = row.attempt.finishedAt
                      ? Math.round(
                          (new Date(row.attempt.finishedAt).getTime() -
                            new Date(row.attempt.startedAt).getTime()) /
                            1000,
                        )
                      : 0;
                    return (
                      <tr
                        key={row.attempt.id}
                        className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-muted"
                        onClick={() => navigate(`/t/${test.id}/result/${row.attempt.id}`)}
                      >
                        <td className="tnum py-2 pr-2 text-text-muted">{index + 1}</td>
                        <td className="py-2 pr-2">
                          <span className="flex items-center gap-2">
                            <Avatar
                              name={`${row.user.firstName} ${row.user.lastName ?? ''}`}
                              photoUrl={row.user.photoUrl}
                              size={26}
                            />
                            <span className="truncate text-text">
                              {row.user.firstName} {row.user.lastName}
                            </span>
                          </span>
                        </td>
                        <td className="tnum py-2 pr-2 text-right text-text">{row.attempt.score}</td>
                        <td className="tnum py-2 pr-2 text-right text-text-muted">
                          {Math.round(row.attempt.percent)}%
                        </td>
                        <td className="tnum py-2 pr-2 text-right text-text-muted">
                          {formatDuration(timeSec)}
                        </td>
                        <td className="tnum py-2 text-right text-text-muted">
                          {row.attempt.tabSwitches}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
