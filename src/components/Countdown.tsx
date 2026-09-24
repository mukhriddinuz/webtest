import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNow } from '@/hooks/useNow';
import { splitDuration } from '@/lib/format';
import { cn } from '@/lib/cn';

export interface CountdownProps {
  /** ISO timestamp to count down to. */
  target: string;
  onComplete?: () => void;
  size?: 'sm' | 'lg';
  className?: string;
}

/** Large, segmented countdown used by contest tests. */
export function Countdown({ target, onComplete, size = 'lg', className }: CountdownProps) {
  const { t } = useTranslation();
  const now = useNow(1000);
  const remaining = new Date(target).getTime() - now;
  const parts = splitDuration(remaining);
  const fired = useRef(false);

  useEffect(() => {
    if (remaining <= 0 && !fired.current) {
      fired.current = true;
      onComplete?.();
    }
    if (remaining > 0) fired.current = false;
  }, [remaining, onComplete]);

  const segments = [
    ...(parts.days > 0 ? [{ value: parts.days, label: 'd' }] : []),
    { value: parts.hours, label: 'h' },
    { value: parts.minutes, label: 'm' },
    { value: parts.seconds, label: 's' },
  ];

  if (size === 'sm') {
    return (
      <span className={cn('tnum-mono text-small text-text-muted', className)}>
        {formatCompact(parts)}
      </span>
    );
  }

  return (
    <div
      className={cn('flex items-end justify-center gap-2', className)}
      aria-label={t('testPage.startsIn')}
    >
      {segments.map((segment) => (
        <div key={segment.label} className="flex flex-col items-center">
          <span className="tnum-mono min-w-[52px] rounded-control bg-surface-muted px-2 py-1.5 text-center text-[26px] font-semibold text-text">
            {segment.value.toString().padStart(2, '0')}
          </span>
          <span className="mt-1 text-small uppercase text-text-muted">{segment.label}</span>
        </div>
      ))}
    </div>
  );
}

function formatCompact(parts: ReturnType<typeof splitDuration>): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (parts.days > 0) return `${parts.days}d ${pad(parts.hours)}:${pad(parts.minutes)}`;
  if (parts.hours > 0) return `${parts.hours}:${pad(parts.minutes)}:${pad(parts.seconds)}`;
  return `${pad(parts.minutes)}:${pad(parts.seconds)}`;
}
