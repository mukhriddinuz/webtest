import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Loader2, X, Zap } from 'lucide-react';
import { api } from '@/services';
import { useCurrentUser } from '@/store/session';
import { useNow } from '@/hooks/useNow';
import { useHaptics, usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { Card, CardTitle } from '@/components/Card';
import { ContentBlocks } from '@/components/ContentBlocks';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { OptionCard } from '@/components/OptionCard';
import { Podium } from '@/components/Podium';
import { RingTimer } from '@/components/Timer';
import { remainingSeconds, useLiveSession } from '@/features/live/useLiveSession';

export default function LivePlayerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { sessionId } = useParams<{ sessionId: string }>();
  const user = useCurrentUser();
  const live = useLiveSession(sessionId);
  const now = useNow(250);

  const [joined, setJoined] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const remaining = remainingSeconds(live, now);

  // Join once the session is known; the host applies it and echoes a lobby update.
  useEffect(() => {
    if (!sessionId || !user || joined || live.loading || live.error) return;
    void api.live
      .join(sessionId, {
        id: user.id,
        name: [user.firstName, user.lastName].filter(Boolean).join(' '),
        photoUrl: user.photoUrl,
      })
      .then(() => setJoined(true))
      .catch(() => undefined);
  }, [sessionId, user, joined, live.loading, live.error]);

  // A new question clears the previous choice.
  useEffect(() => {
    setSelected(null);
  }, [live.question?.id]);

  const myRow = useMemo(
    () => live.leaderboard.find((row) => row.userId === user?.id),
    [live.leaderboard, user?.id],
  );

  const wasCorrect = useMemo(() => {
    if (!live.round || !selected) return null;
    return live.round.correctOptionIds.includes(selected);
  }, [live.round, selected]);

  usePrimaryAction(
    live.status === 'finished' ? { label: t('common.goHome'), onClick: () => navigate('/') } : null,
  );

  const answer = (optionId: string) => {
    if (!sessionId || !user || selected) return;
    setSelected(optionId);
    haptics.selection();
    void api.live.answer(sessionId, user.id, { optionIds: [optionId] });
  };

  useEffect(() => {
    if (wasCorrect === null) return;
    haptics.notification(wasCorrect ? 'success' : 'error');
  }, [wasCorrect, haptics]);

  if (live.loading) {
    return (
      <Page>
        <PageHeader title={t('live.playerView')} onBack="auto" />
        <LoadingState count={2} />
      </Page>
    );
  }

  if (live.error || !live.session) {
    return (
      <Page>
        <PageHeader title={t('live.playerView')} onBack="auto" />
        <ErrorState message={t('live.sessionNotFound')} />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title={t('live.playerView')}
        subtitle={`#${live.session.code}`}
        onBack={() => navigate('/')}
      />

      {live.status === 'lobby' && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-primary" />
          <p className="text-section-title text-text">{t('live.waiting')}</p>
          <p className="text-body text-text-muted">
            {t('live.waitingCount', { count: live.participants.length })}
          </p>
        </div>
      )}

      {(live.status === 'question' || live.status === 'paused') && live.question && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-small text-text-muted">
              {t('live.question', {
                current: live.index + 1,
                total: live.questionCount || live.index + 1,
              })}
            </span>
            <RingTimer remainingSec={remaining} totalSec={live.durationSec} size={56} />
          </div>

          <Card>
            <ContentBlocks blocks={live.question.content} textClassName="text-question" />
          </Card>

          {selected ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-card bg-primary-soft px-4 py-6 text-center"
            >
              <p className="text-card-title text-primary">{t('live.yourAnswer')}</p>
              <p className="mt-1 text-small text-text-muted">{t('live.waitOthers')}</p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-2">
              {live.question.options.map((option, index) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  index={index}
                  state="idle"
                  disabled={live.status === 'paused'}
                  onSelect={() => answer(option.id)}
                />
              ))}
            </div>
          )}

          {live.status === 'paused' && (
            <p className="text-center text-small text-text-muted">{t('live.paused')}</p>
          )}
        </section>
      )}

      {live.status === 'reveal' && live.round && (
        <section className="flex flex-col gap-4">
          <div
            className={
              wasCorrect
                ? 'flex flex-col items-center gap-2 rounded-card bg-success-soft px-4 py-8 text-success'
                : 'flex flex-col items-center gap-2 rounded-card bg-danger-soft px-4 py-8 text-danger'
            }
          >
            {wasCorrect ? <Check size={34} strokeWidth={2} /> : <X size={34} strokeWidth={2} />}
            <p className="text-section-title">
              {wasCorrect ? t('live.youAreCorrect') : t('live.youAreWrong')}
            </p>
            {myRow && myRow.gained > 0 && (
              <p className="tnum flex items-center gap-1 text-body">
                <Zap size={14} strokeWidth={2} />+{myRow.gained}
              </p>
            )}
          </div>

          {live.question && (
            <Card>
              <CardTitle className="mb-2">{t('live.correctAnswer')}</CardTitle>
              <div className="flex flex-col gap-2">
                {live.question.options
                  .filter((option) => live.round?.correctOptionIds.includes(option.id))
                  .map((option, index) => (
                    <OptionCard key={option.id} option={option} index={index} state="correct" />
                  ))}
              </div>
            </Card>
          )}

          {myRow && (
            <p className="text-center text-body text-text">
              {t('live.yourRank', { rank: myRow.rank })}
            </p>
          )}
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
            currentUserId={user?.id}
          />
          {myRow && (
            <Card className="text-center">
              <p className="text-small text-text-muted">{t('leaderboard.yourPosition')}</p>
              <p className="tnum text-[28px] font-semibold text-text">#{myRow.rank}</p>
              <p className="tnum text-body text-text-muted">{myRow.score}</p>
            </Card>
          )}
        </section>
      )}
    </Page>
  );
}
