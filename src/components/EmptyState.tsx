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

/**
 * Calm line-art illustration built from tokens, so it fits both themes.
 *
 * It is drawn in shades of the text color rather than in `surface` and
 * `border`: the illustration sits on the page on one screen and on a card on
 * another, and those two tokens make it vanish into whichever of the two it
 * happens to match — which is what the dark theme did to it.
 */
export function EmptyIllustration() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true">
      <rect
        x="24"
        y="10"
        width="72"
        height="80"
        rx="10"
        className="fill-text/[0.04] stroke-text-muted/40"
        strokeWidth="1.5"
      />
      <rect x="38" y="28" width="44" height="4" rx="2" className="fill-text-muted/40" />
      <rect x="38" y="42" width="34" height="4" rx="2" className="fill-text-muted/40" />
      <rect x="38" y="56" width="40" height="4" rx="2" className="fill-text-muted/40" />
      <circle cx="90" cy="70" r="16" className="fill-primary" />
      <path
        d="M84 70h12M90 64v12"
        className="stroke-on-primary"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
