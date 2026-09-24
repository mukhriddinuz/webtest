import { cn } from '@/lib/cn';
import { clamp } from '@/lib/format';

export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  tone?: 'primary' | 'accent' | 'success' | 'danger';
  label?: string;
  sublabel?: string;
  className?: string;
}

const STROKE = {
  primary: 'stroke-primary',
  accent: 'stroke-accent',
  success: 'stroke-success',
  danger: 'stroke-danger',
};

export function CircularProgress({
  value,
  max = 100,
  size = 148,
  strokeWidth = 10,
  tone = 'primary',
  label,
  sublabel,
  className,
}: CircularProgressProps) {
  const percent = max === 0 ? 0 : clamp((value / max) * 100, 0, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
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
          strokeDashoffset={offset}
          className={cn(STROKE[tone], 'transition-[stroke-dashoffset] duration-700 ease-out')}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="tnum text-[28px] font-semibold text-text">{label}</span>}
        {sublabel && <span className="text-small text-text-muted">{sublabel}</span>}
      </div>
    </div>
  );
}
