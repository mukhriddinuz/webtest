import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flag, LayoutGrid } from 'lucide-react';
import { api } from '@/services';
import type { GivenAnswer } from '@/services/types';
import { isAnswered } from '@/lib/grading';
import { toast } from '@/store/toast';
import { useAttempt, useAttemptQuestions, useTest } from '@/hooks/queries';
import { useHaptics, usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page } from '@/app/AppLayout';
import { BottomSheet } from '@/components/BottomSheet';
import { Button, IconButton } from '@/components/Button';
import { ConnectionBanner } from '@/features/attempt/ConnectionBanner';
import { FinishSheet } from '@/features/attempt/FinishSheet';
import { summarise } from '@/features/attempt/finishSummary';
import { useAnswerSync, useOnline, withQueued } from '@/features/attempt/useAnswerSync';
import { useClosingConfirmation, useWakeLock } from '@/hooks/useExamGuards';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { ProgressBar } from '@/components/ProgressBar';
import { QuestionNavigator } from '@/components/QuestionNavigator';
import { QuestionView } from '@/components/QuestionView';
import { sectionPosition } from '@/features/exams/examView';
import { Timer } from '@/components/Timer';
import { cn } from '@/lib/cn';

export default function AttemptPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();

  const attemptQuery = useAttempt(attemptId);
  const questionsQuery = useAttemptQuestions(attemptId);
  const testQuery = useTest(testId);

  const attempt = attemptQuery.data;
  const questions = useMemo(() => questionsQuery.data ?? [], [questionsQuery.data]);
  const test = testQuery.data;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, GivenAnswer>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const questionShownAt = useRef(Date.now());
  const submitted = useRef(false);

  const allowBack = test?.settings.allowBack ?? true;
  const current = questions[index];
  // An exam is read block by block, so the block's own count leads the header.
  const section = sectionPosition(test?.settings.exam, questions, index);

  const online = useOnline();
  const sync = useAnswerSync(
    useCallback(
      (answer: GivenAnswer) =>
        attemptId ? api.attempts.saveAnswer(attemptId, answer) : Promise.resolve(),
      [attemptId],
    ),
  );

  const { queued } = sync;

  // Hydrate local state once the attempt arrives (also after a page refresh).
  // A reload must not wipe answers that are still on their way to the server.
  useEffect(() => {
    if (!attempt) return;
    setAnswers(withQueued(attempt.answers, queued()));
    setFlagged(attempt.flagged);
    if (attempt.status !== 'in_progress' && attemptId && testId) {
      navigate(`/t/${testId}/result/${attemptId}`, { replace: true });
    }
  }, [attempt, attemptId, testId, navigate, queued]);

  useEffect(() => {
    questionShownAt.current = Date.now();
  }, [index]);

  // The paper is only in danger while it is running.
  const running = attempt?.status === 'in_progress';
  useClosingConfirmation(running);
  useWakeLock(running);

  /**
   * `force` is for the clock running out: the paper closes whether or not every
   * answer got through, since waiting would only keep it open past its time.
   * A candidate finishing by choice is held back instead — closing over answers
   * that never reached the server would silently cost them marks.
   */
  const submit = useCallback(
    async (force = false) => {
      if (!attemptId || submitted.current) return;
      submitted.current = true;
      setSubmitting(true);
      try {
        const clean = await sync.flush();
        if (!clean && !force) {
          submitted.current = false;
          toast.error(t('attempt.cannotFinishUnsent', { count: sync.queued().length }));
          return;
        }
        await api.attempts.submit(attemptId);
        haptics.notification('success');
        navigate(`/t/${testId}/result/${attemptId}`, { replace: true });
      } catch {
        submitted.current = false;
        toast.error(t('errors.unknown'));
      } finally {
        setSubmitting(false);
      }
    },
    [attemptId, testId, navigate, haptics, t, sync],
  );

  /* ------------------------------- anti-cheat ------------------------------ */

  useEffect(() => {
    if (!test?.settings.antiCheat || !attemptId) return;
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      void api.attempts.recordTabSwitch(attemptId).then((updated) => {
        toast.error(t('attempt.tabSwitchWarning', { count: updated.tabSwitches }));
        haptics.notification('warning');
      });
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [test?.settings.antiCheat, attemptId, t, haptics]);

  /* --------------------------------- answers ------------------------------- */

  const persist = useCallback(
    (answer: GivenAnswer) => {
      setAnswers((previous) => ({ ...previous, [answer.questionId]: answer }));
      if (attemptId) sync.send(answer);
    },
    [attemptId, sync],
  );

  const selectOption = (optionId: string) => {
    if (!current) return;
    haptics.selection();
    const existing = answers[current.id]?.optionIds ?? [];
    const optionIds =
      current.type === 'multiple'
        ? existing.includes(optionId)
          ? existing.filter((id) => id !== optionId)
          : [...existing, optionId]
        : [optionId];

    persist({
      questionId: current.id,
      optionIds,
      answeredAt: new Date().toISOString(),
      timeSpentMs: Date.now() - questionShownAt.current,
    });
  };

  const changeValue = (value: string) => {
    if (!current) return;
    persist({
      questionId: current.id,
      value,
      answeredAt: new Date().toISOString(),
      timeSpentMs: Date.now() - questionShownAt.current,
    });
  };

  const toggleFlag = () => {
    if (!current || !attemptId) return;
    haptics.impact('light');
    setFlagged((previous) =>
      previous.includes(current.id)
        ? previous.filter((id) => id !== current.id)
        : [...previous, current.id],
    );
    void api.attempts.toggleFlag(attemptId, current.id);
  };

  const summary = summarise(
    questions,
    (question) => isAnswered(answers[question.id]),
    flagged,
    test?.settings.exam,
  );
  const isLast = index === questions.length - 1;

  usePrimaryAction(
    current
      ? isLast
        ? {
            label: t('common.finish'),
            loading: submitting,
            onClick: () => setConfirmFinish(true),
          }
        : {
            label: t('common.next'),
            onClick: () => setIndex((value) => Math.min(questions.length - 1, value + 1)),
          }
      : null,
  );

  if (attemptQuery.isPending || questionsQuery.isPending) {
    return (
      <Page>
        <LoadingState count={2} />
      </Page>
    );
  }

  if (attemptQuery.isError || !attempt || !current) {
    return (
      <Page>
        <ErrorState onRetry={() => void attemptQuery.refetch()} />
      </Page>
    );
  }

  return (
    <Page>
      <header
        className="sticky top-0 z-30 -mx-4 border-b border-border bg-bg/95 px-4 pb-3 backdrop-blur"
        style={{ paddingTop: 'max(0.5rem, var(--safe-top))' }}
      >
        <div className="mb-2 flex items-center gap-2">
          {/* The block's name can be long, so it sits above its own count
              rather than competing with the timer for one line. */}
          {section ? (
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-small text-text-muted">{section.title}</span>
              <span className="tnum text-body font-medium text-text">
                {t('exam.position', { current: section.current, total: section.total })}
              </span>
            </span>
          ) : (
            <span className="tnum min-w-0 truncate text-body font-medium text-text">
              {t('attempt.progress', { current: index + 1, total: questions.length })}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            {attempt.deadlineAt && (
              <Timer
                deadline={attempt.deadlineAt}
                totalSec={
                  (new Date(attempt.deadlineAt).getTime() - new Date(attempt.startedAt).getTime()) /
                  1000
                }
                onThreshold={(thresholdSec) => {
                  haptics.notification('warning');
                  toast.info(t('attempt.minutesLeft', { count: Math.round(thresholdSec / 60) }));
                }}
                onExpire={() => void submit(true)}
              />
            )}
            <IconButton label={t('attempt.flag')} onClick={toggleFlag}>
              <Flag
                size={18}
                strokeWidth={1.75}
                className={cn(flagged.includes(current.id) && 'text-accent')}
                fill={flagged.includes(current.id) ? 'currentColor' : 'none'}
              />
            </IconButton>
            <IconButton label={t('attempt.navigator')} onClick={() => setNavigatorOpen(true)}>
              <LayoutGrid size={18} strokeWidth={1.75} />
            </IconButton>
          </div>
        </div>
        <ProgressBar value={index + 1} max={questions.length} size="sm" />
        <ConnectionBanner online={online} unsent={sync.unsent} failing={sync.failing} />
      </header>

      <div className="card mt-4 p-4">
        <div className="mb-3 flex items-center justify-between text-small text-text-muted">
          <span>{t(`questionType.${current.type}`)}</span>
          <span className="tnum">
            {current.points} {t('common.pointsShort')}
          </span>
        </div>
        <QuestionView
          question={current}
          answer={answers[current.id]}
          onSelectOption={selectOption}
          onChangeValue={changeValue}
        />
      </div>

      <div className="mt-4 flex gap-2">
        {allowBack && (
          <Button
            variant="secondary"
            className="flex-1"
            disabled={index === 0}
            icon={<ChevronLeft size={16} strokeWidth={1.75} />}
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
          >
            {t('common.previous')}
          </Button>
        )}
        <Button
          variant="secondary"
          className="flex-1"
          disabled={isLast}
          iconRight={<ChevronRight size={16} strokeWidth={1.75} />}
          onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))}
        >
          {t('common.next')}
        </Button>
      </div>

      <BottomSheet
        open={navigatorOpen}
        onClose={() => setNavigatorOpen(false)}
        title={t('attempt.navigator')}
        closeLabel={t('common.close')}
      >
        <QuestionNavigator
          total={questions.length}
          current={index}
          allowJumpBack={allowBack}
          answered={questions.map((question) => isAnswered(answers[question.id]))}
          flagged={questions.map((question) => flagged.includes(question.id))}
          onSelect={(next) => {
            setIndex(next);
            setNavigatorOpen(false);
          }}
        />
      </BottomSheet>

      <FinishSheet
        open={confirmFinish}
        summary={summary}
        unsent={sync.unsent}
        allowBack={allowBack}
        currentIndex={index}
        loading={submitting}
        onJump={setIndex}
        onClose={() => setConfirmFinish(false)}
        onFinish={() => void submit()}
      />
    </Page>
  );
}
