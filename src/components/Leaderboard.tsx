import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { LeaderboardRow } from '@/services/types';
import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/format';
import { Avatar } from './Avatar';
import { EmptyState } from './EmptyState';
import { Podium } from './Podium';

export interface LeaderboardProps {
  rows: LeaderboardRow[];
  currentUserId?: string;
  /** Hides the podium when the list is embedded in a smaller panel. */
  showPodium?: boolean;
}

export function Leaderboard({ rows, currentUserId, showPodium = true }: LeaderboardProps) {
  const { t } = useTranslation();

  if (rows.length === 0) {
    return <EmptyState title={t('leaderboard.empty')} description={t('leaderboard.emptyText')} />;
  }

  const top = rows.slice(0, 3);
  const rest = showPodium ? rows.slice(3) : rows;
  const currentRow = rows.find((row) => row.userId === currentUserId);
  const currentIsOnPodium = currentRow ? showPodium && currentRow.rank <= 3 : false;

  return (
    <div className="flex flex-col gap-4">
      {showPodium && (
        <Podium
          entries={top.map((row) => ({
            userId: row.userId,
            name: row.userName,
            photoUrl: row.photoUrl,
            score: row.score,
          }))}
          currentUserId={currentUserId}
        />
      )}

      <div className="flex flex-col gap-1.5">
        {rest.map((row) => (
          <LeaderboardItem key={row.attemptId} row={row} highlight={row.userId === currentUserId} />
        ))}
      </div>

      {currentRow && !currentIsOnPodium && (
        <div className="sticky bottom-[calc(var(--bottom-bar-height)+8px)] z-10">
          <div
            className="rounded-card border border-primary/40 bg-surface p-1"
            style={{ boxShadow: 'var(--shadow-raised)' }}
          >
            <LeaderboardItem row={currentRow} highlight label={t('leaderboard.yourPosition')} />
          </div>
        </div>
      )}
    </div>
  );
}

function LeaderboardItem({
  row,
  highlight,
  label,
}: {
  row: LeaderboardRow;
  highlight?: boolean;
  label?: string;
}) {
  return (
    <motion.div
      layout
      transition={{ duration: 0.25 }}
      className={cn(
        'flex items-center gap-3 rounded-control px-3 py-2',
        highlight ? 'bg-primary-soft' : 'bg-surface',
      )}
    >
      <span
        className={cn(
          'tnum w-7 shrink-0 text-center text-body font-medium',
          highlight ? 'text-primary' : 'text-text-muted',
        )}
      >
        {row.rank}
      </span>
      <Avatar name={row.userName} photoUrl={row.photoUrl} size={32} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body text-text">{row.userName}</span>
        {label && <span className="text-small text-primary">{label}</span>}
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className="tnum text-body font-medium text-text">{Math.round(row.score)}</span>
        <span className="tnum text-small text-text-muted">{formatDuration(row.timeSec)}</span>
      </span>
    </motion.div>
  );
}
