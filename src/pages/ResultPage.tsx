import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Clock, Medal, Share2, Trophy, X } from 'lucide-react';
import { getTelegram } from '@/lib/telegram';
import { formatDuration } from '@/lib/format';
import { toast } from '@/store/toast';
import { useAttempt, useAttemptQuestions, useLeaderboard, useTest } from '@/hooks/queries';
import { usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { Button } from '@/components/Button';
import { Card, CardTitle } from '@/components/Card';
import { CircularProgress } from '@/components/CircularProgress';
import { ContentBlocks } from '@/components/ContentBlocks';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { QuestionView } from '@/components/QuestionView';
import { cn } from '@/lib/cn';

function praiseKey(percent: number): string {
  if (percent >= 90) return 'result.praise90';
  if (percent >= 75) return 'result.praise75';
  if (percent >= 60) return 'result.praise60';
  if (percent >= 40) return 'result.praise40';
  return 'result.praise0';
}

export default function ResultPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();

  const attemptQuery = useAttempt(attemptId);
  const questionsQuery = useAttemptQuestions(attemptId);
  const testQuery = useTest(testId);
  const leaderboard = useLeaderboard(testId);

  const attempt = attemptQuery.data;
  const test = testQuery.data;
  const questions = questionsQuery.data ?? [];

  usePrimaryAction(
    testId
      ? {
          label: t('leaderboard.title'),
          onClick: () => navigate(`/t/${testId}/leaderboard`),
        }
      : null,
  );

  if (attemptQuery.isPending || testQuery.isPending) {
    return (
      <Page>
        <PageHeader title={t('result.title')} onBack="auto" />
        <LoadingState count={2} />
      </Page>
    );
  }

  if (attemptQuery.isError || !attempt || !test) {
    return (
      <Page>
        <PageHeader title={t('result.title')} onBack="auto" />
        <ErrorState onRetry={() => void attemptQuery.refetch()} />
      </Page>
    );
  }

  const hideResult =
    test.settings.showResult === 'never' ||
    (test.settings.showResult === 'after_finish' && test.status === 'active');

  const timeSec = attempt.finishedAt
    ? Math.round(
        (new Date(attempt.finishedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000,
      )
    : 0;

  const rank = leaderboard.data?.find((row) => row.attemptId === attempt.id)?.rank ?? attempt.rank;
  const correctCount = attempt.results.filter((result) => result.correct).length;
  const wrongCount = attempt.results.filter(
    (result) => !result.correct && !result.partial && result.earned <= 0,
  ).length;

  const share = () => {
    const message = t('result.shareText', {
      title: test.title,
      percent: Math.round(attempt.percent),
    });
    const telegram = getTelegram();
    if (telegram.switchInlineQuery(message)) return;
    const url = `${window.location.origin}/t/${test.id}`;
    void navigator.clipboard?.writeText(`${message} ${url}`).then(() => {
      toast.success(t('common.copied'));
    });
  };

  if (hideResult) {
    return (
      <Page>
        <PageHeader title={t('result.title')} onBack={() => navigate('/')} />
        <Card className="text-center">
          <p className="text-body text-text-muted">{t('result.resultHidden')}</p>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title={t('result.title')} subtitle={test.title} onBack={() => navigate('/')} />

      <div className="flex flex-col items-center">
        <CircularProgress
          value={attempt.percent}
          label={`${Math.round(attempt.percent)}%`}
          sublabel={`${attempt.score} / ${attempt.maxScore}`}
          tone={attempt.percent >= 60 ? 'success' : attempt.percent >= 40 ? 'accent' : 'danger'}
        />
        <p className="mt-3 text-section-title text-text">{t(praiseKey(attempt.percent))}</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <SummaryTile
          icon={<Trophy size={16} strokeWidth={1.75} />}
          value={attempt.score}
          label={t('result.score')}
        />
        <SummaryTile
          icon={<Clock size={16} strokeWidth={1.75} />}
          value={formatDuration(timeSec)}
          label={t('result.time')}
        />
        <SummaryTile
          icon={<Medal size={16} strokeWidth={1.75} />}
          value={rank ? `#${rank}` : '-'}
          label={t('result.rank')}
        />
      </div>

      <div className="mt-3 flex gap-2 text-small">
        <span className="flex-1 rounded-control bg-success-soft px-3 py-2 text-success">
          {t('result.correct')}: <span className="tnum font-medium">{correctCount}</span>
        </span>
        <span className="flex-1 rounded-control bg-danger-soft px-3 py-2 text-danger">
          {t('result.wrong')}: <span className="tnum font-medium">{wrongCount}</span>
        </span>
      </div>

      <Button
        className="mt-4"
        fullWidth
        variant="secondary"
        icon={<Share2 size={16} strokeWidth={1.75} />}
        onClick={share}
      >
        {t('result.share')}
      </Button>

      {test.settings.showCorrectAnswers ? (
        <section className="mt-6">
          <CardTitle className="mb-3">{t('result.review')}</CardTitle>
          <div className="flex flex-col gap-3">
            {questions.map((question, position) => {
              const result = attempt.results.find((item) => item.questionId === question.id);
              const answer = attempt.answers[question.id];
              const tone = result?.correct ? 'success' : answer ? 'danger' : 'muted';

              return (
                <Card key={question.id} className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-small',
                        tone === 'success'
                          ? 'bg-success text-on-primary'
                          : tone === 'danger'
                            ? 'bg-danger text-on-primary'
                            : 'bg-surface-muted text-text-muted',
                      )}
                    >
                      {tone === 'success' ? (
                        <Check size={13} strokeWidth={2.5} />
                      ) : tone === 'danger' ? (
                        <X size={13} strokeWidth={2.5} />
                      ) : (
                        '-'
                      )}
                    </span>
                    <span className="tnum text-small text-text-muted">
                      {position + 1} / {questions.length}
                    </span>
                    <span className="tnum ml-auto text-small text-text-muted">
                      {result?.earned ?? 0} / {question.points}
                    </span>
                  </div>

                  <QuestionView question={question} answer={answer} mode="review" showCorrect />

                  {!answer && (
                    <p className="mt-2 text-small text-text-muted">{t('result.noAnswer')}</p>
                  )}

                  {question.explanation && question.explanation.length > 0 && (
                    <div className="mt-3 rounded-control bg-surface-muted p-3">
                      <p className="mb-1 text-small font-medium text-text-muted">
                        {t('result.explanation')}
                      </p>
                      <ContentBlocks blocks={question.explanation} textClassName="text-body" />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ) : (
        <p className="mt-6 text-center text-small text-text-muted">{t('result.hidden')}</p>
      )}
    </Page>
  );
}

function SummaryTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-card border border-border bg-surface py-3">
      <span className="text-text-muted">{icon}</span>
      <span className="tnum mt-1 text-[18px] font-semibold text-text">{value}</span>
      <span className="text-small text-text-muted">{label}</span>
    </div>
  );
}
