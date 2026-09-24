import { cn } from '@/lib/cn';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onChange, label, hint, disabled, className }: SwitchProps) {
  return (
    <label
      className={cn(
        'flex min-h-[44px] cursor-pointer items-center justify-between gap-4 py-1',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span className="flex flex-col">
        {label && <span className="text-body text-text">{label}</span>}
        {hint && <span className="text-small text-text-muted">{hint}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          className={cn(
            'h-6 w-11 rounded-full border border-border bg-surface-muted transition-colors duration-150',
            'peer-checked:border-primary peer-checked:bg-primary',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg',
          )}
        />
        <span
          className={cn(
            'pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-surface shadow-sm',
            'transition-transform duration-150',
            checked && 'translate-x-5',
          )}
        />
      </span>
    </label>
  );
}
