import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  FileSpreadsheet,
  GraduationCap,
  KeyRound,
  PlayCircle,
  Plus,
  Radio,
  ScanLine,
  Trophy,
} from 'lucide-react';
import { api } from '@/services';
import type { Attempt, Test } from '@/services/types';
import { isAnswered } from '@/lib/grading';
import { cn } from '@/lib/cn';
import { useCurrentUser } from '@/store/session';
import { toast } from '@/store/toast';
import {
  useOnAirTestIds,
  useOpenLiveSessions,
  useRegisteredTests,
  useTests,
  useUserAttempts,
  useUserStats,
} from '@/hooks/queries';
import { useQrScanner } from '@/features/scan/useQrScanner';
import { useHaptics, usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { Button, IconButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { Countdown } from '@/components/Countdown';
import { EmptyIllustration } from '@/components/EmptyState';
import { ListFeed } from '@/components/ListSection';
import { LoadingState } from '@/components/StateViews';
import { ProgressBar } from '@/components/ProgressBar';
import { TestCard } from '@/components/TestCard';
import { TestTypeBadge } from '@/components/TestTypeBadge';

const CODE_LENGTH = 6;

/** An unfinished attempt and an unpublished draft are both "pick this up again". */
type ContinueItem =
  | { kind: 'attempt'; key: string; at: string; attempt: Attempt; test: Test | undefined }
  | { kind: 'draft'; key: string; at: string; test: Test };

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const user = useCurrentUser();
  const joinInputRef = useRef<HTMLInputElement>(null);

  const stats = useUserStats(user?.id);
  const attempts = useUserAttempts(user?.id);
  const allTests = useTests({});
  const registered = useRegisteredTests(user?.id);
  const liveSessions = useOpenLiveSessions();
  const onAir = useOnAirTestIds();

  const testsById = useMemo(() => {
    const map = new Map<string, Test>();
    (allTests.data ?? []).forEach((test) => map.set(test.id, test));
    return map;
  }, [allTests.data]);

  const myTests = useMemo(
    () => (allTests.data ?? []).filter((test) => test.authorId === user?.id),
    [allTests.data, user?.id],
  );

  /** Attempts still open plus drafts still unpublished, most recent first. */
  const toContinue = useMemo(() => {
    const items: ContinueItem[] = [];

    (attempts.data ?? [])
      .filter((attempt) => attempt.status === 'in_progress')
      .forEach((attempt) =>
        items.push({
          kind: 'attempt',
          key: `a_${attempt.id}`,
          at: attempt.startedAt,
          attempt,
          test: testsById.get(attempt.testId),
        }),
      );

    myTests
      .filter((test) => test.status === 'draft')
      .forEach((test) =>
        items.push({ kind: 'draft', key: `d_${test.id}`, at: test.updatedAt, test }),
      );

    return items.sort((a, b) => b.at.localeCompare(a.at));
  }, [attempts.data, myTests, testsById]);

  const upcoming = useMemo(
    () =>
      (registered.data ?? []).filter(
        (test) => test.type === 'contest' && test.status === 'scheduled' && test.settings.startsAt,
      ),
    [registered.data],
  );

  /** Only sessions still in the lobby can actually be joined from here. */
  const live = useMemo(
    () =>
      (liveSessions.data ?? []).filter(
        (session) => session.status === 'lobby' && testsById.has(session.testId),
      ),
    [liveSessions.data, testsById],
  );

  /** Last three published tests the user made or finished, newest first. */
  const recent = useMemo(() => {
    const entries: { key: string; test: Test; at: string; percent?: number }[] = [];

    myTests
      .filter((test) => test.status !== 'draft')
      .forEach((test) => entries.push({ key: `t_${test.id}`, test, at: test.updatedAt }));

    (attempts.data ?? [])
      .filter((attempt) => attempt.status === 'submitted')
      .forEach((attempt) => {
        const test = testsById.get(attempt.testId);
        if (!test) return;
        entries.push({
          key: `a_${attempt.id}`,
          test,
          at: attempt.finishedAt ?? attempt.startedAt,
          percent: attempt.percent,
        });
      });

    return entries.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 3);
  }, [attempts.data, myTests, testsById]);

  const taken = stats.data?.taken ?? 0;
  const hasCreated = (stats.data?.created ?? 0) > 0;
  const showStats = taken > 0 || hasCreated;
  const loading = attempts.isPending || allTests.isPending;

  // Open live rooms belong to everyone, so only the user's own material
  // decides whether this screen still looks empty.
  const ownSections = [toContinue, upcoming, recent].filter((section) => section.length > 0).length;
  const isNewUser = !loading && ownSections === 0;
  // With a single section the page looks unfinished; shortcuts fill it usefully.
  const showQuickActions = !loading && ownSections === 1;

  const focusJoin = () => {
    joinInputRef.current?.focus();
    joinInputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  usePrimaryAction(null);

  return (
    <Page>
      <PageHeader>
        <h1 className="truncate text-page-title text-text">
          {t('home.greeting', { name: user?.firstName ?? '' })}
        </h1>
        <p className="truncate text-[14px] text-text-muted">{t('home.subtitle')}</p>
      </PageHeader>

      <JoinCodeCard inputRef={joinInputRef} />

      {showStats && (
        <Card className="mt-3 p-0">
          <div className="grid grid-cols-3 divide-x divide-border">
            <StatColumn label={t('home.statsTaken')} value={taken} />
            <StatColumn
              label={t('home.statsAverage')}
              // An average over nothing is not zero, it is unknown.
              value={taken === 0 ? t('home.statsEmpty') : `${stats.data?.averagePercent ?? 0}%`}
            />
            <StatColumn label={t('home.statsCreated')} value={stats.data?.created ?? 0} />
          </div>
        </Card>
      )}

      <ExamsEntry onClick={() => navigate('/exams')} />

      {loading && <LoadingState count={2} />}

      {isNewUser && (
        <Card className="mt-4 flex flex-col items-center px-5 py-8 text-center">
          <EmptyIllustration />
          <h2 className="mt-5 text-section-title text-text">{t('home.welcomeTitle')}</h2>
          <p className="mt-1.5 max-w-xs text-body text-text-muted">{t('home.welcomeText')}</p>
          <div className="mt-5 flex w-full max-w-xs flex-col gap-2">
            <Button fullWidth onClick={() => navigate('/tests/new')}>
              {t('home.welcomeCreate')}
            </Button>
            <Button fullWidth variant="secondary" onClick={focusJoin}>
              {t('home.welcomeJoin')}
            </Button>
          </div>
        </Card>
      )}

      {toContinue.length > 0 && (
        <Section title={t('home.sectionContinue')}>
          <ListFeed>
            {toContinue.map((item) =>
              item.kind === 'attempt' ? (
                <ContinueRow
                  key={item.key}
                  attempt={item.attempt}
                  test={item.test}
                  onClick={() => {
                    haptics.selection();
                    navigate(`/t/${item.attempt.testId}/attempt/${item.attempt.id}`);
                  }}
                />
              ) : (
                <TestCard
                  key={item.key}
                  test={item.test}
                  onClick={() => {
                    haptics.selection();
                    navigate(`/tests/${item.test.id}/edit`);
                  }}
                />
              ),
            )}
          </ListFeed>
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title={t('home.sectionUpcoming')}>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {upcoming.map((test) => (
              <button
                key={test.id}
                type="button"
                onClick={() => navigate(`/t/${test.id}`)}
                className="card flex w-[220px] shrink-0 flex-col gap-2 p-3 text-left"
              >
                <span className="line-clamp-2 text-card-title text-text">{test.title}</span>
                <TestTypeBadge type={test.type} />
                {test.settings.startsAt && (
                  <span className="flex items-center gap-1.5 text-small text-accent">
                    {t('testPage.startsIn')}
                    <Countdown target={test.settings.startsAt} size="sm" className="text-accent" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </Section>
      )}

      {live.length > 0 && (
        <Section title={t('home.sectionLive')}>
          <ListFeed>
            {live.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => navigate(`/live/${session.id}`)}
                className="card flex items-center gap-3 p-3 text-left"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
                  <Radio size={18} strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body text-text">
                    {testsById.get(session.testId)?.title}
                  </span>
                  <span className="block text-small text-text-muted">
                    {t('home.liveOpen')} ·{' '}
                    {t('live.waitingCount', { count: session.participants.length })}
                  </span>
                </span>
                <span className="tnum-mono shrink-0 text-body font-medium tracking-[0.15em] text-text">
                  {session.code}
                </span>
              </button>
            ))}
          </ListFeed>
        </Section>
      )}

      {recent.length > 0 && (
        <Section
          title={t('home.sectionRecent')}
          action={
            <button
              type="button"
              onClick={() => navigate(hasCreated ? '/my-tests' : '/results')}
              className="flex items-center gap-0.5 text-small text-primary"
            >
              {t('home.viewAll')}
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          }
        >
          <ListFeed>
            {recent.map((entry) => (
              <TestCard
                key={entry.key}
                compact
                test={entry.test}
                resultPercent={entry.percent}
                onAir={onAir.has(entry.test.id)}
                onClick={() =>
                  navigate(
                    entry.test.authorId === user?.id && entry.percent === undefined
                      ? `/tests/${entry.test.id}/manage`
                      : `/t/${entry.test.id}`,
                  )
                }
              />
            ))}
          </ListFeed>
        </Section>
      )}

      {showQuickActions && (
        <Section title={t('home.quickTitle')}>
          <div className="grid grid-cols-2 gap-2">
            <QuickAction
              icon={<Plus size={20} strokeWidth={1.75} />}
              label={t('home.quickCreate')}
              onClick={() => navigate('/tests/new')}
            />
            <QuickAction
              icon={<FileSpreadsheet size={20} strokeWidth={1.75} />}
              label={t('home.quickImport')}
              onClick={() => navigate('/tests/new?import=1')}
            />
            <QuickAction
              icon={<KeyRound size={20} strokeWidth={1.75} />}
              label={t('home.quickJoin')}
              onClick={focusJoin}
            />
            <QuickAction
              icon={<Trophy size={20} strokeWidth={1.75} />}
              label={t('home.quickResults')}
              onClick={() => navigate('/results')}
            />
          </div>
        </Section>
      )}
    </Page>
  );
}

/* --------------------------------- pieces --------------------------------- */

function JoinCodeCard({ inputRef }: { inputRef: React.RefObject<HTMLInputElement> }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const scanner = useQrScanner();

  const join = async (value: string) => {
    if (value.length !== CODE_LENGTH || joining) return;
    setJoining(true);
    try {
      const session = await api.live.findByCode(value);
      if (!session) {
        haptics.notification('error');
        toast.error(t('home.joinInvalid'));
        return;
      }
      haptics.notification('success');
      navigate(`/live/${session.id}`);
    } catch {
      toast.error(t('errors.unknown'));
    } finally {
      setJoining(false);
    }
  };

  return (
    <Card className="flex items-center gap-2 p-2">
      <input
        ref={inputRef}
        value={code}
        inputMode="numeric"
        maxLength={CODE_LENGTH}
        placeholder={t('home.joinPlaceholder')}
        aria-label={t('home.joinTitle')}
        onChange={(event) => {
          const next = event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH);
          setCode(next);
          // Six digits is a complete code, so there is nothing left to confirm.
          if (next.length === CODE_LENGTH) void join(next);
        }}
        className={cn(
          'h-11 min-w-0 flex-1 rounded-control bg-transparent px-3 text-body text-text',
          'placeholder:font-sans placeholder:tracking-normal placeholder:text-text-muted/70',
          'focus:outline-none',
          code !== '' && 'font-mono tracking-[0.3em]',
        )}
      />
      {/* Drawn only where Telegram can open a camera; elsewhere it would do nothing. */}
      {scanner.supported && (
        <IconButton
          label={t('scan.button')}
          className="shrink-0 text-primary hover:text-primary"
          disabled={scanner.scanning}
          onClick={() => void scanner.scan()}
        >
          <ScanLine size={22} strokeWidth={1.75} />
        </IconButton>
      )}
      <Button
        className="shrink-0"
        loading={joining}
        disabled={code.length !== CODE_LENGTH}
        onClick={() => void join(code)}
      >
        {t('home.join')}
      </Button>
    </Card>
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

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card flex items-center gap-2.5 p-3 text-left transition-colors duration-150 active:bg-surface-muted"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        {icon}
      </span>
      <span className="min-w-0 text-small font-medium text-text">{label}</span>
    </button>
  );
}

/** The one way into the exam catalogue; the tab bar is already full. */
function ExamsEntry({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="card mt-3 flex w-full items-center gap-3 p-3 text-left transition-colors duration-150 active:bg-surface-muted"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
        <GraduationCap size={20} strokeWidth={1.75} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-card-title text-text">{t('exam.homeTitle')}</span>
        <span className="truncate text-small text-text-muted">{t('exam.homeText')}</span>
      </span>
      <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-text-muted" />
    </button>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="section-header px-0 pb-0">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ContinueRow({
  attempt,
  test,
  onClick,
}: {
  attempt: Attempt;
  test: Test | undefined;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const total = attempt.questionOrder.length;
  const answered = attempt.questionOrder.filter((id) => isAnswered(attempt.answers[id])).length;
  const title = test?.title.trim() ?? '';

  return (
    <button type="button" onClick={onClick} className="card flex items-center gap-3 p-3 text-left">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <PlayCircle size={18} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-body',
            title === '' ? 'italic text-text-muted' : 'text-text',
          )}
        >
          {title === '' ? t('testCard.untitled') : title}
        </span>
        <span className="mt-1 block">
          <ProgressBar value={answered} max={Math.max(1, total)} size="sm" />
        </span>
        <span className="tnum mt-1 block text-small text-text-muted">
          {t('home.continueProgress', { answered, total })}
        </span>
      </span>
      <ChevronRight size={16} strokeWidth={1.75} className="shrink-0 text-text-muted" />
    </button>
  );
}
