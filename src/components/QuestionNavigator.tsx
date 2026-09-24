import { Flag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

export interface QuestionNavigatorProps {
  total: number;
  current: number;
  answered: boolean[];
  flagged: boolean[];
  onSelect: (index: number) => void;
  /** Hidden when navigating back is not allowed. */
  allowJumpBack?: boolean;
}

export function QuestionNavigator({
  total,
  current,
  answered,
  flagged,
  onSelect,
  allowJumpBack = true,
}: QuestionNavigatorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-2">
        {Array.from({ length: total }).map((_, index) => {
          const isCurrent = index === current;
          const isAnswered = answered[index] ?? false;
          const isFlagged = flagged[index] ?? false;
          const locked = !allowJumpBack && index !== current;

          return (
            <button
              key={index}
              type="button"
              disabled={locked}
              onClick={() => onSelect(index)}
              aria-current={isCurrent}
              className={cn(
                'relative flex h-11 items-center justify-center rounded-control border text-body transition-colors duration-150',
                isCurrent
                  ? 'border-primary bg-primary text-on-primary'
                  : isAnswered
                    ? 'border-primary/30 bg-primary-soft text-primary'
                    : 'border-border bg-surface text-text-muted',
                locked && 'cursor-not-allowed opacity-40',
              )}
            >
              <span className="tnum">{index + 1}</span>
              {isFlagged && (
                <Flag
                  size={10}
                  strokeWidth={2.5}
                  className={cn(
                    'absolute right-1 top-1',
                    isCurrent ? 'text-on-primary' : 'text-accent',
                  )}
                  fill="currentColor"
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-small text-text-muted">
        <LegendItem className="border-primary/30 bg-primary-soft" label={t('attempt.answered')} />
        <LegendItem className="border-border bg-surface" label={t('attempt.unanswered')} />
        <LegendItem className="border-accent bg-accent-soft" label={t('attempt.flagged')} />
      </div>
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-3 w-3 rounded border', className)} />
      {label}
    </span>
  );
}
