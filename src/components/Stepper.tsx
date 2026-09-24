import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface StepperProps {
  steps: string[];
  current: number;
  onStepClick?: (index: number) => void;
  /** Highest step the user is allowed to jump to. */
  maxReachable?: number;
}

export function Stepper({ steps, current, onStepClick, maxReachable }: StepperProps) {
  const reachable = maxReachable ?? current;

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        const clickable = onStepClick && index <= reachable;

        return (
          <div key={step} className="flex flex-1 items-center gap-1">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(index)}
              className={cn(
                'flex flex-1 flex-col items-start gap-1.5 py-1 text-left',
                clickable ? 'cursor-pointer' : 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'h-1 w-full rounded-full transition-colors duration-200',
                  done || active ? 'bg-primary' : 'bg-surface-muted',
                )}
              />
              <span
                className={cn(
                  'flex items-center gap-1 text-small transition-colors duration-200',
                  active ? 'font-medium text-text' : 'text-text-muted',
                )}
              >
                {done && <Check size={12} strokeWidth={2.25} className="text-primary" />}
                {step}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
