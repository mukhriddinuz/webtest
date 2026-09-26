import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Clock,
  FileQuestion,
  Repeat,
  Send,
  ShieldCheck,
  Shuffle,
  Users,
} from 'lucide-react';
import { api, ApiError } from '@/services';
import { useCurrentUser } from '@/store/session';
import { toast } from '@/store/toast';
import {
  qk,
  useActiveAttempt,
  useLeaderboard,
  useRegistration,
  useSeatsLeft,
  useTest,
  useUser,
  useUserAttempts,
} from '@/hooks/queries';
import { useHaptics, usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card, CardTitle } from '@/components/Card';
import { Countdown } from '@/components/Countdown';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { Input } from '@/components/Input';
import { ProgressBar } from '@/components/ProgressBar';
import { TestStatusBadge, TestTypeBadge } from '@/components/TestTypeBadge';
import { useImageSrc } from '@/hooks/useImageSrc';

export default function TestIntroPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const haptics = useHaptics();
  const { testId } = useParams<{ testId: string }>();
  const user = useCurrentUser();

  const testQuery = useTest(testId);
  const test = testQuery.data;
  const author = useUser(test?.authorId);
  const cover = useImageSrc(test?.coverImageId);
  const activeAttempt = useActiveAttempt(testId, user?.id);
  const userAttempts = useUserAttempts(user?.id);
  const registration = useRegistration(testId, user?.id);
  const seats = useSeatsLeft(testId, test?.type === 'limited');
  const leaderboard = useLeaderboard(testId);

  const [password, setPassword] = useState('');
  const [passwordOk, setPasswordOk] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [channelsOk, setChannelsOk] = useState(false);
  const [checking, setChecking] = useState(false);
  const [starting, setStarting] = useState(false);
  const isAuthor = Boolean(user && test && test.authorId === user.id);

  const finishedAttempts = useMemo(
    () =>
      (userAttempts.data ?? []).filter(
        (attempt) => attempt.testId === testId && attempt.status === 'submitted',
      ),
    [userAttempts.data, testId],
  );
  const lastAttempt = finishedAttempts[0];

  const needsPassword = test?.settings.access === 'password' && !passwordOk;
  const needsChannels = (test?.settings.requiredChannels.length ?? 0) > 0 && !channelsOk;
  const attemptsLeft = test ? Math.max(0, test.settings.attemptLimit - finishedAttempts.length) : 0;
  const seatsFull = test?.type === 'limited' && seats.data === 0 && !registration.data;

  const blocked =
    !test ||
    test.status === 'draft' ||
    test.status === 'archived' ||
    test.status === 'scheduled' ||
    test.status === 'finished' ||
    seatsFull ||
    needsPassword ||
    needsChannels ||
    (attemptsLeft === 0 && !activeAttempt.data);

  const startAttempt = async () => {
    if (!testId || !user) return;
    setStarting(true);
    try {
      const { attempt } = await api.attempts.start(testId, user.id);
      haptics.impact('medium');
      void client.invalidateQueries({ queryKey: qk.activeAttempt(testId, user.id) });
      navigate(`/t/${testId}/attempt/${attempt.id}`);
    } catch (error) {
      haptics.notification('error');
      const code = error instanceof ApiError ? error.code : 'unknown';
      toast.error(t(`errors.${code}` as const, { defaultValue: t('errors.unknown') }));
    } finally {
      setStarting(false);
    }
  };

  /**
   * Live tests are not taken alone: the author opens a session, everyone else
   * joins it with the six digit code from the home screen.
   */
  const startLiveSession = async () => {
    if (!test || !user) return;
    setStarting(true);
    try {
      const session = await api.live.createSession(test.id, user.id);
      navigate(`/live/${session.id}/host`);
    } catch {
      toast.error(t('errors.unknown'));
    } finally {
      setStarting(false);
    }
  };

  const primaryAction =
    test?.type === 'live'
      ? isAuthor && test.status === 'active'
        ? {
            label: t('manage.startLive'),
            loading: starting,
            onClick: () => void startLiveSession(),
          }
        : null
      : test && !blocked
        ? {
            label: activeAttempt.data ? t('testPage.continueAttempt') : t('testPage.startTest'),
            loading: starting,
            onClick: () => void startAttempt(),
          }
        : null;

  usePrimaryAction(primaryAction);

  // Reset gating whenever the test changes.
  useEffect(() => {
    setPasswordOk(false);
    setChannelsOk(false);
    setPassword('');
  }, [testId]);

  if (testQuery.isPending) {
    return (
      <Page>
        <PageHeader onBack="auto" />
        <LoadingState count={2} />
      </Page>
    );
  }

  if (testQuery.isError || !test) {
    return (
      <Page>
        <PageHeader onBack="auto" />
        <ErrorState onRetry={() => void testQuery.refetch()} />
      </Page>
    );
  }

  const checkChannels = async () => {
    if (!testId || !user) return;
    setChecking(true);
    try {
      const ok = await api.tests.checkChannelSubscription(testId, user.id);
      setChannelsOk(ok);
      if (ok) {
        haptics.notification('success');
        toast.success(t('testPage.subscriptionOk'));
      } else {
        haptics.notification('error');
        toast.error(t('testPage.subscriptionFailed'));
      }
    } finally {
      setChecking(false);
    }
  };

  const submitPassword = async () => {
    if (!testId) return;
    const ok = await api.tests.verifyPassword(testId, password);
    setPasswordOk(ok);
    setPasswordError(ok ? null : t('testPage.passwordWrong'));
    if (ok) haptics.notification('success');
    else haptics.notification('error');
  };

  const register = async () => {
    if (!testId || !user) return;
    try {
      await api.tests.register(testId, user.id);
      void client.invalidateQueries({ queryKey: qk.registered(testId, user.id) });
      void client.invalidateQueries({ queryKey: qk.test(testId) });
      haptics.notification('success');
      toast.success(t('testPage.registered'));
    } catch (error) {
      const code = error instanceof ApiError ? error.code : 'unknown';
      toast.error(t(`errors.${code}` as const, { defaultValue: t('errors.unknown') }));
    }
  };

  return (
    <Page>
      <PageHeader onBack="auto" />

      {cover && (
        <img
          src={cover}
          alt=""
          className="mb-4 h-40 w-full rounded-card border border-border object-cover"
        />
      )}

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <TestTypeBadge type={test.type} />
        <TestStatusBadge status={test.status} />
        {test.settings.antiCheat && (
          <Badge tone="danger" icon={<ShieldCheck size={12} strokeWidth={2} />}>
            Anti-cheat
          </Badge>
        )}
      </div>

      <h1 className="text-page-title text-text">{test.title}</h1>
      {author.data && (
        <p className="mt-1 text-small text-text-muted">
          {t('testPage.author')}: {author.data.firstName} {author.data.lastName}
        </p>
      )}
      {test.description && <p className="mt-3 text-body text-text-muted">{test.description}</p>}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <InfoTile
          icon={<FileQuestion size={16} strokeWidth={1.75} />}
          value={test.questionCount}
          label={t('common.questions')}
        />
        <InfoTile
          icon={<Clock size={16} strokeWidth={1.75} />}
          value={test.settings.durationMin ?? '∞'}
          label={t('common.minutesShort')}
        />
        <InfoTile
          icon={<Users size={16} strokeWidth={1.75} />}
          value={test.participantCount}
          label={t('common.participants')}
        />
      </div>

      {/* ------------------------------ gating ------------------------------ */}

      {test.status === 'archived' && <Notice tone="muted" text={t('testPage.archivedNotice')} />}

      {test.status === 'finished' && test.type === 'contest' && (
        <Notice tone="muted" text={t('testPage.finished')} />
      )}

      {test.type === 'contest' && test.status === 'scheduled' && test.settings.startsAt && (
        <Card className="mt-4 text-center">
          <p className="mb-3 text-small text-text-muted">{t('testPage.startsIn')}</p>
          <Countdown
            target={test.settings.startsAt}
            onComplete={() => void client.invalidateQueries({ queryKey: qk.test(test.id) })}
          />
          <Button
            className="mt-4"
            fullWidth
            variant={registration.data ? 'secondary' : 'primary'}
            disabled={registration.data}
            onClick={() => void register()}
          >
            {registration.data ? t('testPage.registered') : t('testPage.register')}
          </Button>
        </Card>
      )}

      {test.type === 'contest' && test.status === 'active' && test.settings.endsAt && (
        <Card className="mt-4 flex items-center justify-between gap-3">
          <span className="text-small text-text-muted">{t('testPage.endsIn')}</span>
          <Countdown
            target={test.settings.endsAt}
            size="sm"
            className="text-body text-text"
            onComplete={() => void client.invalidateQueries({ queryKey: qk.test(test.id) })}
          />
        </Card>
      )}

      {test.type === 'limited' && test.settings.participantLimit && (
        <Card className="mt-4">
          <div className="mb-2 flex items-center justify-between text-small">
            <span className="text-text-muted">
              {t('testPage.seatsTaken', {
                taken: test.participantCount,
                total: test.settings.participantLimit,
              })}
            </span>
            {seatsFull && <span className="text-danger">{t('testPage.seatsFull')}</span>}
          </div>
          <ProgressBar
            value={test.participantCount}
            max={test.settings.participantLimit}
            tone={seatsFull ? 'danger' : 'primary'}
          />
        </Card>
      )}

      {test.settings.access === 'password' && !passwordOk && (
        <Card className="mt-4">
          <CardTitle className="mb-2">{t('testPage.passwordTitle')}</CardTitle>
          <div className="flex gap-2">
            <Input
              type="password"
              value={password}
              error={passwordError ?? undefined}
              placeholder={t('testPage.passwordPlaceholder')}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void submitPassword();
              }}
            />
            <Button className="shrink-0 self-start" onClick={() => void submitPassword()}>
              {t('common.confirm')}
            </Button>
          </div>
        </Card>
      )}

      {test.settings.requiredChannels.length > 0 && !channelsOk && (
        <Card className="mt-4">
          <CardTitle className="mb-2">{t('testPage.channelsTitle')}</CardTitle>
          <div className="mb-3 flex flex-col gap-2">
            {test.settings.requiredChannels.map((channel) => (
              <a
                key={channel.id}
                href={`https://t.me/${channel.username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-control bg-surface-muted px-3 py-2.5 text-body text-text"
              >
                <Send size={16} strokeWidth={1.75} className="text-info" />
                {channel.title}
                <span className="ml-auto text-small text-text-muted">@{channel.username}</span>
              </a>
            ))}
          </div>
          <Button
            fullWidth
            variant="secondary"
            loading={checking}
            onClick={() => void checkChannels()}
          >
            {t('testPage.checkSubscription')}
          </Button>
        </Card>
      )}

      {test.type !== 'live' && attemptsLeft === 0 && !activeAttempt.data && (
        <Notice tone="danger" text={t('testPage.noAttemptsLeft')} />
      )}

      {test.type === 'live' && !isAuthor && (
        <Card className="mt-4 text-center">
          <p className="text-body text-text-muted">{t('live.joinTitle')}</p>
          <p className="mt-1 text-small text-text-muted">{t('home.joinTitle')}</p>
        </Card>
      )}

      {/* ------------------------------- rules ------------------------------ */}

      <section className="mt-4">
        <CardTitle className="mb-2">{t('testPage.rules')}</CardTitle>
        <ul className="flex flex-col gap-1.5 text-small text-text-muted">
          <Rule
            icon={<Repeat size={14} strokeWidth={1.75} />}
            text={t('testPage.ruleAttempts', { count: test.settings.attemptLimit })}
          />
          {!test.settings.allowBack && (
            <Rule
              icon={<AlertTriangle size={14} strokeWidth={1.75} />}
              text={t('testPage.ruleNoBack')}
            />
          )}
          {test.settings.shuffleQuestions && (
            <Rule
              icon={<Shuffle size={14} strokeWidth={1.75} />}
              text={t('testPage.ruleShuffle')}
            />
          )}
          {test.settings.penaltyPoints > 0 && (
            <Rule
              icon={<AlertTriangle size={14} strokeWidth={1.75} />}
              text={t('testPage.rulePenalty', { points: test.settings.penaltyPoints })}
            />
          )}
          {test.settings.antiCheat && (
            <Rule
              icon={<ShieldCheck size={14} strokeWidth={1.75} />}
              text={t('testPage.ruleAntiCheat')}
            />
          )}
        </ul>
      </section>

      {lastAttempt && (
        <Button
          className="mt-4"
          fullWidth
          variant="secondary"
          onClick={() => navigate(`/t/${test.id}/result/${lastAttempt.id}`)}
        >
          {t('testPage.viewResult')}
        </Button>
      )}

      {(leaderboard.data?.length ?? 0) > 0 && (
        <Button
          className="mt-2"
          fullWidth
          variant="ghost"
          onClick={() => navigate(`/t/${test.id}/leaderboard`)}
        >
          {t('leaderboard.title')}
        </Button>
      )}
    </Page>
  );
}

function InfoTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-card bg-surface py-3">
      <span className="text-text-muted">{icon}</span>
      <span className="tnum mt-1 text-[18px] font-semibold text-text">{value}</span>
      <span className="text-small text-text-muted">{label}</span>
    </div>
  );
}

function Notice({ tone, text }: { tone: 'muted' | 'danger'; text: string }) {
  return (
    <div
      className={
        tone === 'danger'
          ? 'mt-4 flex items-center gap-2 rounded-card bg-danger-soft px-3 py-2.5 text-small text-danger'
          : 'mt-4 flex items-center gap-2 rounded-card bg-surface-muted px-3 py-2.5 text-small text-text-muted'
      }
    >
      <AlertTriangle size={16} strokeWidth={1.75} />
      {text}
    </div>
  );
}

function Rule({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="text-text-muted">{icon}</span>
      {text}
    </li>
  );
}
