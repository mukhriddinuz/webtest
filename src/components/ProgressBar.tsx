import { cn } from '@/lib/cn';
import { clamp } from '@/lib/format';

export interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: 'primary' | 'accent' | 'success' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
  label?: string;
}

const TONES = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-success',
  danger: 'bg-danger',
};

export function ProgressBar({
  value,
  max = 100,
  tone = 'primary',
  size = 'md',
  className,
  label,
}: ProgressBarProps) {
  const percent = max === 0 ? 0 : clamp((value / max) * 100, 0, 100);
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-surface-muted',
        size === 'sm' ? 'h-1.5' : 'h-2',
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-300 ease-out', TONES[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
