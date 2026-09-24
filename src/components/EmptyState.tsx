import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  illustration?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      {illustration ?? <EmptyIllustration />}
      <h3 className="mt-5 text-section-title text-text">{title}</h3>
      {description && <p className="mt-1.5 max-w-xs text-body text-text-muted">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/** Calm line-art illustration built from tokens, so it fits both themes. */
export function EmptyIllustration() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true">
      <rect
        x="24"
        y="10"
        width="72"
        height="80"
        rx="10"
        className="fill-surface stroke-border"
        strokeWidth="1.5"
      />
      <rect x="38" y="28" width="44" height="4" rx="2" className="fill-border" />
      <rect x="38" y="42" width="34" height="4" rx="2" className="fill-border" />
      <rect x="38" y="56" width="40" height="4" rx="2" className="fill-border" />
      <circle cx="90" cy="70" r="16" className="fill-primary-soft" />
      <path
        d="M84 70h12M90 64v12"
        className="stroke-primary"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
