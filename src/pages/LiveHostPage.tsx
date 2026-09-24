import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronUp, ExternalLink, Pause, Play, SkipForward } from 'lucide-react';
import { api } from '@/services';
import { useNow } from '@/hooks/useNow';
import { usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card, CardTitle } from '@/components/Card';
import { ContentBlocks } from '@/components/ContentBlocks';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { LiveAnswerChart } from '@/components/LiveAnswerChart';
import { Podium } from '@/components/Podium';
import { QrCode } from '@/components/QrCode';
import { RingTimer } from '@/components/Timer';
import { cn } from '@/lib/cn';
import { remainingSeconds, useLiveSession } from '@/features/live/useLiveSession';

export default function LiveHostPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const live = useLiveSession(sessionId);
  const now = useNow(250);

  const remaining = remainingSeconds(live, now);
  const canStart = live.status === 'lobby' && live.participants.length > 0;

  usePrimaryAction(
    live.status === 'lobby'
      ? {
          label: t('live.startGame'),
          enabled: canStart,
          onClick: () => sessionId && void api.live.start(sessionId),
        }
      : live.status === 'reveal'
        ? {
            label: t('live.nextQuestion'),
            onClick: () => sessionId && void api.live.next(sessionId),
          }
        : live.status === 'finished'
          ? { label: t('common.goHome'), onClick: () => navigate('/') }
          : null,
  );

  if (live.loading) {
    return (
      <Page>
        <PageHeader title={t('live.hostView')} onBack="auto" />
        <LoadingState count={2} />
      </Page>
    );
  }

  if (live.error || !live.session) {
    return (
      <Page>
        <PageHeader title={t('live.hostView')} onBack="auto" />
        <ErrorState message={t('live.sessionNotFound')} />
      </Page>
    );
  }

  const session = live.session;
  const joinUrl = `${window.location.origin}/live/${session.id}`;

  return (
    <Page>
      <PageHeader
        title={t('live.hostView')}
        subtitle={t('live.waitingCount', { count: live.participants.length })}
        onBack={() => navigate(-1)}
      />

      {live.status === 'lobby' && (
        <section className="flex flex-col items-center gap-4">
          <Card className="w-full text-center">
            <p className="text-small text-text-muted">{t('live.joinCode')}</p>
            <p className="tnum-mono my-2 text-[44px] font-semibold leading-none tracking-[0.12em] text-text">
              {session.code}
            </p>
            <div className="flex justify-center">
              <QrCode value={joinUrl} size={140} />
            </div>
            <Button
              className="mt-4"
              variant="secondary"
              fullWidth
              icon={<ExternalLink size={15} strokeWidth={1.75} />}
              onClick={() => window.open(joinUrl, '_blank', 'noopener')}
            >
              {t('live.openPlayerView')}
            </Button>
          </Card>

          <div className="w-full">
            <CardTitle className="mb-2">
              {t('live.waitingCount', { count: live.participants.length })}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence initial={false}>
                {live.participants.map((participant) => (
                  <motion.span
                    key={participant.userId}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-1 pr-3"
                  >
                    <Avatar name={participant.name} photoUrl={participant.photoUrl} size={24} />
                    <span className="text-small text-text">{participant.name}</span>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>
      )}

      {(live.status === 'question' || live.status === 'paused') && live.question && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <RingTimer remainingSec={remaining} totalSec={live.durationSec} />
            <div className="min-w-0 flex-1">
              <p className="text-small text-text-muted">
                {t('live.question', {
                  current: live.index + 1,
                  total: live.questionCount || session.currentIndex + 1,
                })}
              </p>
              <p className="tnum text-body font-medium text-text">
                {t('live.answeredCount', {
                  answered: live.tally?.answered ?? 0,
                  total: live.participants.length,
                })}
              </p>
            </div>
          </div>

          <Card>
            <ContentBlocks blocks={live.question.content} textClassName="text-question" />
          </Card>

          <LiveAnswerChart
            optionIds={live.question.options.map((option) => option.id)}
            counts={live.tally?.counts ?? {}}
          />

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              icon={
                live.status === 'paused' ? (
                  <Play size={15} strokeWidth={1.75} />
                ) : (
                  <Pause size={15} strokeWidth={1.75} />
                )
              }
              onClick={() =>
                sessionId &&
                void (live.status === 'paused'
                  ? api.live.resume(sessionId)
                  : api.live.pause(sessionId))
              }
            >
              {live.status === 'paused' ? t('live.resume') : t('live.pause')}
            </Button>
            <Button
              className="flex-1"
              icon={<SkipForward size={15} strokeWidth={1.75} />}
              onClick={() => sessionId && void api.live.reveal(sessionId)}
            >
              {t('live.showResults')}
            </Button>
          </div>
        </section>
      )}

      {live.status === 'reveal' && live.question && live.round && (
        <section className="flex flex-col gap-4">
          <Card>
            <ContentBlocks blocks={live.question.content} textClassName="text-question" />
          </Card>

          <LiveAnswerChart
            reveal
            optionIds={live.question.options.map((option) => option.id)}
            counts={live.round.tally.counts}
            correctIds={live.round.correctOptionIds}
          />

          <div>
            <CardTitle className="mb-2">{t('leaderboard.title')}</CardTitle>
            <LiveRows rows={live.leaderboard.slice(0, 10)} />
          </div>
        </section>
      )}

      {live.status === 'finished' && (
        <section className="flex flex-col gap-5">
          <CardTitle>{t('live.finalResults')}</CardTitle>
          <Podium
            entries={live.leaderboard.slice(0, 3).map((row) => ({
              userId: row.userId,
              name: row.name,
              photoUrl: row.photoUrl,
              score: row.score,
            }))}
          />
          <LiveRows rows={live.leaderboard.slice(3)} />
        </section>
      )}
    </Page>
  );
}

function LiveRows({
  rows,
}: {
  rows: {
    userId: string;
    name: string;
    score: number;
    gained: number;
    rank: number;
    previousRank: number;
    photoUrl?: string;
  }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row) => {
        const delta = row.previousRank - row.rank;
        return (
          <motion.div
            key={row.userId}
            layout
            transition={{ duration: 0.35 }}
            className="flex items-center gap-3 rounded-control bg-surface px-3 py-2"
          >
            <span className="tnum w-6 shrink-0 text-center text-body text-text-muted">
              {row.rank}
            </span>
            <Avatar name={row.name} photoUrl={row.photoUrl} size={30} />
            <span className="min-w-0 flex-1 truncate text-body text-text">{row.name}</span>
            {delta !== 0 && (
              <span
                className={cn(
                  'flex items-center text-small',
                  delta > 0 ? 'text-success' : 'text-danger',
                )}
              >
                <ChevronUp size={14} strokeWidth={2} className={cn(delta < 0 && 'rotate-180')} />
                {Math.abs(delta)}
              </span>
            )}
            {row.gained > 0 && <span className="tnum text-small text-accent">+{row.gained}</span>}
            <span className="tnum w-12 shrink-0 text-right text-body font-medium text-text">
              {row.score}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
