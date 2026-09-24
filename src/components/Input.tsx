import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
  htmlFor?: string;
}

export function Field({ label, hint, error, required, className, children, htmlFor }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-small font-medium text-text">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-small text-danger">{error}</p>
      ) : hint ? (
        <p className="text-small text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputClasses =
  'h-11 w-full rounded-control border border-border bg-surface-muted px-3 text-body text-text ' +
  'placeholder:text-text-muted/70 transition-colors duration-150 ' +
  'focus:border-primary focus:bg-surface focus:outline-none disabled:opacity-50';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  hint?: string;
  error?: string;
  /** Adornment rendered inside the field, e.g. a search icon. */
  prefix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, prefix, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <Field label={label} hint={hint} error={error} required={rest.required} htmlFor={inputId}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(inputClasses, prefix && 'pl-9', error && 'border-danger', className)}
          {...rest}
        />
      </div>
    </Field>
  );
});
