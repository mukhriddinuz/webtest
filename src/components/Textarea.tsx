import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Field } from './Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, rows = 3, ...rest },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  return (
    <Field label={label} hint={hint} error={error} required={rest.required} htmlFor={textareaId}>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={cn(
          'w-full resize-y rounded-card bg-surface-muted px-4 py-3',
          'text-body text-text placeholder:text-text-muted transition-shadow duration-150',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50',
          error && 'ring-2 ring-danger',
          className,
        )}
        {...rest}
      />
    </Field>
  );
});
