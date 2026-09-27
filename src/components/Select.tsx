import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Field } from './Input';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <Field label={label} hint={hint} error={error} required={rest.required} htmlFor={selectId}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-12 w-full appearance-none rounded-card bg-surface-muted pl-4 pr-10',
            'text-body text-text transition-shadow duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50',
            error && 'ring-2 ring-danger',
            className,
          )}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted"
        />
      </div>
    </Field>
  );
});
