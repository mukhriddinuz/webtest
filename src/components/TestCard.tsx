import { useTranslation } from 'react-i18next';
import { ArrowRight, FileQuestion, Users } from 'lucide-react';
import type { Test } from '@/services/types';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { useImageSrc } from '@/hooks/useImageSrc';
import { LiveOnAirBadge, TestStatusBadge, TestTypeBadge, TYPE_ICON } from './TestTypeBadge';
import { Countdown } from './Countdown';
import { ProgressBar } from './ProgressBar';

export interface TestCardProps {
  test: Test;
  onClick?: () => void;
  /** Result percentage, shown on the "taken" tab. */
  resultPercent?: number;
  showStatus?: boolean;
  /** Drops the counters and keeps title, type and date — used in feeds. */
  compact?: boolean;
  /** True only while a live session for this test is gathering or running. */
  onAir?: boolean;
}

export function TestCard({
  test,
  onClick,
  resultPercent,
  showStatus = true,
  compact = false,
  onAir = false,
}: TestCardProps) {
  const { t, i18n } = useTranslation();
  const cover = useImageSrc(test.coverImageId);
  const now = Date.now();

  const startsAt = test.settings.startsAt ? new Date(test.settings.startsAt).getTime() : null;
  const endsAt = test.settings.endsAt ? new Date(test.settings.endsAt).getTime() : null;
  const upcoming = startsAt !== null && startsAt > now;
  const running = startsAt !== null && endsAt !== null && startsAt <= now && endsAt > now;

  const title = test.title.trim();
  const isDraft = test.status === 'draft';
  const TypeIcon = TYPE_ICON[test.type];

  return (
    // A feed row, not a card: Telegram lists run edge to edge and are told
    // apart by a separator that starts where the text starts.
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group/row flex w-full gap-3 bg-surface pl-4 text-left transition-colors duration-150',
        onClick && 'active:bg-surface-muted',
      )}
    >
      <span
        className={cn(
          'mt-3 flex shrink-0 items-center justify-center self-start overflow-hidden rounded-full',
          compact ? 'h-11 w-11' : 'h-14 w-14',
          cover ? '' : 'bg-primary-soft text-primary',
        )}
      >
        {cover ? (
          <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <TypeIcon size={compact ? 18 : 22} strokeWidth={1.5} />
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1.5 border-t border-border py-3 pr-4 group-first/row:border-t-0">
        {title === '' ? (
          <span className="text-card-title italic text-text-muted">{t('testCard.untitled')}</span>
        ) : (
          <span className="line-clamp-2 text-card-title text-text">{title}</span>
        )}

        <span className="flex flex-wrap items-center gap-1.5">
          <TestTypeBadge type={test.type} />
          {onAir && <LiveOnAirBadge />}
          {showStatus && !compact && <TestStatusBadge status={test.status} />}
        </span>

        {isDraft ? (
          <DraftFooter questionCount={test.questionCount} />
        ) : compact ? (
          <span className="text-small text-text-muted">
            {formatDate(test.updatedAt, i18n.language)}
          </span>
        ) : (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-text-muted">
            <span className="inline-flex items-center gap-1">
              <FileQuestion size={13} strokeWidth={1.75} />
              <span className="tnum">{test.questionCount}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Users size={13} strokeWidth={1.75} />
              <span className="tnum">{test.participantCount}</span>
            </span>
            <span>{formatDate(test.createdAt, i18n.language)}</span>
          </span>
        )}

        {typeof resultPercent === 'number' && (
          <span className="text-small text-success">
            {t('testCard.yourResult', { percent: Math.round(resultPercent) })}
          </span>
        )}

        {!compact && test.type === 'contest' && upcoming && test.settings.startsAt && (
          <span className="inline-flex items-center gap-1.5 text-small text-accent">
            {t('testCard.startsIn', { time: '' })}
            <Countdown target={test.settings.startsAt} size="sm" className="text-accent" />
          </span>
        )}
        {!compact && test.type === 'contest' && running && test.settings.endsAt && (
          <span className="inline-flex items-center gap-1.5 text-small text-success">
            {t('testCard.endsIn', { time: '' })}
            <Countdown target={test.settings.endsAt} size="sm" className="text-success" />
          </span>
        )}

        {!compact && test.type === 'limited' && test.settings.participantLimit ? (
          <span className="flex flex-col gap-1">
            <span className="text-small text-text-muted">
              {t('testPage.seatsTaken', {
                taken: test.participantCount,
                total: test.settings.participantLimit,
              })}
            </span>
            <ProgressBar
              size="sm"
              value={test.participantCount}
              max={test.settings.participantLimit}
              tone={test.participantCount >= test.settings.participantLimit ? 'danger' : 'primary'}
            />
          </span>
        ) : null}
      </span>
    </button>
  );
}

/**
 * A draft has no audience yet, so counters would be noise; what matters is
 * what is left to do. The whole card already opens the editor, so the link is
 * a visual affordance rather than a nested button.
 */
function DraftFooter({ questionCount }: { questionCount: number }) {
  const { t } = useTranslation();
  return (
    <>
      <span className="text-small text-text-muted">
        {questionCount === 0
          ? t('testCard.draftNoQuestions')
          : t('testCard.draftInProgress', { n: questionCount })}
      </span>
      <span className="inline-flex items-center gap-1 text-small font-medium text-primary">
        {t('testCard.continueEditing')}
        <ArrowRight size={14} strokeWidth={2} />
      </span>
    </>
  );
}
