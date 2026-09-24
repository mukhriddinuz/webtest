import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useCurrentUser } from '@/store/session';
import { useLeaderboard, useTest } from '@/hooks/queries';
import { usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { Leaderboard } from '@/components/Leaderboard';

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const { testId } = useParams<{ testId: string }>();
  const user = useCurrentUser();
  const test = useTest(testId);
  const leaderboard = useLeaderboard(testId);

  usePrimaryAction(null);

  return (
    <Page>
      <PageHeader title={t('leaderboard.title')} subtitle={test.data?.title} onBack="auto" />
      {leaderboard.isPending ? (
        <LoadingState />
      ) : leaderboard.isError ? (
        <ErrorState onRetry={() => void leaderboard.refetch()} />
      ) : (
        <Leaderboard rows={leaderboard.data ?? []} currentUserId={user?.id} />
      )}
    </Page>
  );
}
