import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-hover',
  secondary: 'bg-surface-muted text-text border border-border hover:bg-border/60',
  ghost: 'bg-transparent text-text-muted hover:bg-surface-muted hover:text-text',
  danger: 'bg-danger text-on-primary hover:bg-danger/90',
  accent: 'bg-accent text-on-accent hover:bg-accent/90',
};

/** Disabled buttons change color instead of fading, so they stay legible. */
const DISABLED = 'bg-surface-muted text-text-muted border border-transparent cursor-not-allowed';

const SIZES: Record<ButtonSize, string> = {
  // Every interactive control keeps a 44px touch target.
  sm: 'h-9 px-3 text-small gap-1.5 rounded-control',
  md: 'h-11 px-4 text-body gap-2 rounded-control',
  lg: 'h-12 px-5 text-body font-medium gap-2 rounded-control',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading,
    fullWidth,
    icon,
    iconRight,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  const inactive = Boolean(disabled) && !loading;
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-colors duration-150',
        inactive ? DISABLED : VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" strokeWidth={1.75} /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'default' | 'danger';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, tone = 'default', className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control transition-colors duration-150',
        tone === 'danger'
          ? 'text-danger hover:bg-danger-soft'
          : 'text-text-muted hover:bg-surface-muted hover:text-text',
        'disabled:cursor-not-allowed disabled:text-border disabled:hover:bg-transparent',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
