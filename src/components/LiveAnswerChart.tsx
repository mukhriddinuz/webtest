import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export interface LiveAnswerChartProps {
  /** Ordered option ids as shown to participants. */
  optionIds: string[];
  counts: Record<string, number>;
  correctIds?: string[];
  /** Correct answers stay hidden while the question is still running. */
  reveal?: boolean;
}

/** Bars grow as answers arrive. Hand-built so the live screen stays snappy. */
export function LiveAnswerChart({
  optionIds,
  counts,
  correctIds = [],
  reveal,
}: LiveAnswerChartProps) {
  const total = Math.max(
    1,
    optionIds.reduce((sum, id) => sum + (counts[id] ?? 0), 0),
  );

  return (
    <div className="flex h-40 items-end justify-center gap-3">
      {optionIds.map((id, index) => {
        const count = counts[id] ?? 0;
        const ratio = count / total;
        const isCorrect = correctIds.includes(id);

        return (
          <div
            key={id}
            className="flex h-full w-full max-w-[72px] flex-col items-center justify-end gap-2"
          >
            <span className="tnum text-small text-text-muted">{count}</span>
            <motion.div
              className={cn(
                'w-full rounded-t-control',
                reveal ? (isCorrect ? 'bg-success' : 'bg-border') : 'bg-primary',
              )}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(4, ratio * 100)}%` }}
              transition={{ type: 'spring', stiffness: 160, damping: 22 }}
            />
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-small font-medium',
                reveal && isCorrect
                  ? 'bg-success text-on-primary'
                  : 'bg-surface-muted text-text-muted',
              )}
            >
              {reveal && isCorrect ? (
                <Check size={14} strokeWidth={2.5} />
              ) : (
                (LETTERS[index] ?? index + 1)
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
