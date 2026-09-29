import { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useNow } from '@/hooks/useNow';
import { formatDuration } from '@/lib/format';
import { crossedThreshold, inWarningStage, warningThresholds } from '@/lib/timeWarnings';
import { cn } from '@/lib/cn';

export interface TimerProps {
  /** ISO deadline. */
  deadline: string;
  onExpire?: () => void;
  /**
   * Whole length of the paper, in seconds. Given it, the timer turns amber in
   * the run-up and reports each warning mark as it passes; without it the
   * timer only knows the final minute.
   */
  totalSec?: number;
  /** Called once as the clock passes a warning mark, with that mark in seconds. */
  onThreshold?: (thresholdSec: number) => void;
  className?: string;
  showIcon?: boolean;
}

const DANGER_THRESHOLD_SEC = 60;

/**
 * Compact timer: amber in the run-up to the end, then red and pulsing in the
 * final minute.
 */
export function Timer({
  deadline,
  onExpire,
  totalSec,
  onThreshold,
  className,
  showIcon = true,
}: TimerProps) {
  const now = useNow(1000);
  const remainingSec = Math.max(0, Math.round((new Date(deadline).getTime() - now) / 1000));
  const danger = remainingSec <= DANGER_THRESHOLD_SEC;
  const warning = !danger && totalSec !== undefined && inWarningStage(remainingSec, totalSec);
  const fired = useRef(false);

  const previous = useRef<number | null>(null);
  const thresholdRef = useRef(onThreshold);
  thresholdRef.current = onThreshold;
  useEffect(() => {
    if (totalSec === undefined) return;
    const crossed = crossedThreshold(previous.current, remainingSec, warningThresholds(totalSec));
    previous.current = remainingSec;
    if (crossed !== null) thresholdRef.current?.(crossed);
  }, [remainingSec, totalSec]);

  useEffect(() => {
    if (remainingSec <= 0 && !fired.current) {
      fired.current = true;
      onExpire?.();
    }
  }, [remainingSec, onExpire]);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-body transition-colors duration-300',
        danger
          ? 'bg-danger-soft text-danger'
          : warning
            ? 'bg-accent-soft text-accent'
            : 'bg-surface-muted text-text',
        danger && 'animate-pulse-soft',
        className,
      )}
      role="timer"
      aria-live={danger ? 'assertive' : 'off'}
    >
      {showIcon && <Clock size={15} strokeWidth={1.75} />}
      <span className="tnum-mono font-medium">{formatDuration(remainingSec)}</span>
    </span>
  );
}

/** Ring timer used by the live host screen. */
export function RingTimer({
  remainingSec,
  totalSec,
  size = 72,
}: {
  remainingSec: number;
  totalSec: number;
  size?: number;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = totalSec === 0 ? 0 : Math.max(0, Math.min(1, remainingSec / totalSec));
  const danger = remainingSec <= 5;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-surface-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className={cn(
            danger ? 'stroke-danger' : 'stroke-primary',
            'transition-[stroke-dashoffset] duration-1000 ease-linear',
          )}
        />
      </svg>
      <span
        className={cn(
          'tnum-mono absolute text-[20px] font-semibold',
          danger ? 'text-danger' : 'text-text',
        )}
      >
        {Math.ceil(remainingSec)}
      </span>
    </div>
  );
}
