import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  interactive?: boolean;
}

export function Card({ padded = true, interactive, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'card',
        padded && 'p-4',
        interactive && 'cursor-pointer transition-colors duration-150 hover:border-primary/40',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('font-sans text-card-title text-text', className)}>{children}</h3>;
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('text-section-title text-text', className)}>{children}</h2>;
}
