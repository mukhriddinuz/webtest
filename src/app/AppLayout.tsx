import { Suspense, type ReactNode } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { getTelegram } from '@/lib/telegram';
import { useBackAction } from '@/hooks/usePrimaryAction';
import { cn } from '@/lib/cn';
import { IconButton } from '@/components/Button';
import { LoadingState } from '@/components/StateViews';
import { DevPanelButton } from './DevPanelButton';

export interface PageProps {
  children: ReactNode;
  className?: string;
  /**
   * Reserves room for whichever bar is at the bottom: the sticky primary
   * action or the navigation. Only one of them is ever visible.
   */
  padded?: boolean;
}

export function Page({ children, className, padded = true }: PageProps) {
  return (
    <main
      className={cn('page', className)}
      style={
        padded
          ? {
              paddingBottom:
                'calc(var(--bottom-bar-height) + var(--nav-height) + var(--safe-bottom) + 16px)',
            }
          : undefined
      }
    >
      {children}
    </main>
  );
}

/** Routed screens are code-split, so they need a shared loading frame. */
export function RouteSuspense() {
  return (
    <Suspense
      fallback={
        <Page>
          <LoadingState />
        </Page>
      }
    >
      <Outlet />
    </Suspense>
  );
}

export interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  /** Shows a back control (and wires Telegram's BackButton). */
  onBack?: (() => void) | 'auto';
  actions?: ReactNode;
  sticky?: boolean;
  /** Off by default; screens with scrolling tables opt back in. */
  divider?: boolean;
  /** Replaces the default title block, e.g. with a greeting. */
  children?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  actions,
  sticky = true,
  divider = false,
  children,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const telegram = getTelegram();
  const handleBack = onBack === 'auto' ? () => navigate(-1) : (onBack ?? null);

  useBackAction(handleBack);

  return (
    <header
      className={cn(
        'z-30 -mx-4 mb-3 bg-bg/90 px-4 backdrop-blur-[20px]',
        divider && 'border-b border-border',
        sticky && 'sticky top-0',
      )}
      style={{ paddingTop: 'max(0.5rem, var(--safe-top))' }}
    >
      <div className="flex min-h-[48px] items-center gap-2 pb-2">
        <DevPanelButton />
        {/* Inside Telegram the native BackButton already handles this. */}
        {handleBack && !telegram.isTelegram && (
          <IconButton
            label="Back"
            onClick={handleBack}
            className="-ml-2 text-primary hover:text-primary"
          >
            <ChevronLeft size={26} strokeWidth={2} />
          </IconButton>
        )}
        <div className="min-w-0 flex-1">
          {children ?? (
            <>
              {title && (
                <h1 className="truncate text-page-title leading-tight text-text">{title}</h1>
              )}
              {subtitle && <p className="truncate text-small text-text-muted">{subtitle}</p>}
            </>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
    </header>
  );
}
