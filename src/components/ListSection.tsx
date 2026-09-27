import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SwitchControl } from './Switch';
import { isApplePlatform } from '@/lib/platform';

/**
 * The list Telegram builds almost every screen from. It runs edge to edge with
 * square corners — the inset rounded card is the iOS dialect, not the one most
 * users see — and neighbouring sections are told apart by the strip of page
 * background between them rather than by a border.
 */
export interface ListSectionProps {
  /** Small caption above the group. */
  header?: ReactNode;
  /** Explanatory line under the group, as Telegram sets its settings hints. */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function ListSection({ header, footer, className, children }: ListSectionProps) {
  if (isApplePlatform()) {
    return (
      <section className={cn('mb-5', className)}>
        {header && <h2 className="section-header">{header}</h2>}
        <div className="overflow-hidden rounded-card bg-surface">{children}</div>
        {footer && <p className="px-4 pt-1.5 text-small text-text-muted">{footer}</p>}
      </section>
    );
  }

  return (
    // Negative margins undo the page gutter so the block spans the screen.
    <section className={cn('-mx-4 mb-2', className)}>
      <div className="bg-surface">
        {header && <h2 className="section-header">{header}</h2>}
        {children}
      </div>
      {footer && <p className="px-4 py-2 text-small text-text-muted">{footer}</p>}
    </section>
  );
}

/**
 * A feed of rows — tests, results — which is the same list in a different
 * costume, so it takes the same shape as a section.
 */
export function ListFeed({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        isApplePlatform() ? 'overflow-hidden rounded-card bg-surface' : '-mx-4 bg-surface',
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface ListRowProps {
  /** Leading glyph, drawn plain — Telegram tints the glyph, not a tile. */
  icon?: ReactNode;
  /** Overrides the glyph colour, e.g. for a destructive row. */
  iconClassName?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-hand value, e.g. the current setting. */
  value?: ReactNode;
  /** Replaces the value slot entirely — a switch, a badge, a button. */
  trailing?: ReactNode;
  onClick?: () => void;
  /** Shows the chevron; implied by `onClick` unless turned off. */
  chevron?: boolean;
  tone?: 'default' | 'danger' | 'primary';
  disabled?: boolean;
  className?: string;
}

const TITLE_TONE = {
  default: 'text-text',
  danger: 'text-danger',
  primary: 'text-primary',
};

function RowBody({
  icon,
  iconClassName,
  title,
  subtitle,
  value,
  trailing,
  showChevron,
  tone,
}: Pick<ListRowProps, 'icon' | 'iconClassName' | 'title' | 'subtitle' | 'value' | 'trailing'> & {
  showChevron: boolean;
  tone: NonNullable<ListRowProps['tone']>;
}) {
  return (
    <>
      {icon && (
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center',
            iconClassName ?? 'text-text-muted',
          )}
        >
          {icon}
        </span>
      )}

      <span
        className={cn(
          'flex min-h-[52px] min-w-0 flex-1 items-center gap-3 py-2.5 pr-4',
          // Drawn by the row itself so it can start after the icon rather
          // than cutting across the whole section.
          'border-t border-border group-first/row:border-t-0',
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={cn('truncate text-body', TITLE_TONE[tone])}>{title}</span>
          {subtitle && <span className="truncate text-small text-text-muted">{subtitle}</span>}
        </span>

        {trailing ?? (
          <>
            {value !== undefined && (
              <span className="shrink-0 truncate text-body text-text-muted">{value}</span>
            )}
            {showChevron && (
              <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-text-muted/70" />
            )}
          </>
        )}
      </span>
    </>
  );
}

/** A whole row that toggles: the label wraps it, so tapping anywhere works. */
export function ListToggleRow({
  icon,
  iconClassName,
  title,
  subtitle,
  checked,
  onChange,
  disabled,
}: Pick<ListRowProps, 'icon' | 'iconClassName' | 'title' | 'subtitle' | 'disabled'> & {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        'group/row flex w-full cursor-pointer items-center gap-4 pl-4 text-left',
        'transition-colors duration-150 active:bg-surface-muted',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <RowBody
        icon={icon}
        iconClassName={iconClassName}
        title={title}
        subtitle={subtitle}
        trailing={<SwitchControl checked={checked} onChange={onChange} disabled={disabled} />}
        showChevron={false}
        tone="default"
      />
    </label>
  );
}

export function ListRow({
  icon,
  iconClassName,
  title,
  subtitle,
  value,
  trailing,
  onClick,
  chevron,
  tone = 'default',
  disabled,
  className,
}: ListRowProps) {
  const showChevron = chevron ?? Boolean(onClick);
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      {...(onClick ? { type: 'button' as const, onClick, disabled } : {})}
      className={cn(
        'flex w-full items-center gap-4 pl-4 text-left',
        'group/row',
        onClick && !disabled && 'transition-colors duration-150 active:bg-surface-muted',
        disabled && 'opacity-50',
        className,
      )}
    >
      <RowBody
        icon={icon}
        iconClassName={iconClassName}
        title={title}
        subtitle={subtitle}
        value={value}
        trailing={trailing}
        showChevron={showChevron}
        tone={tone}
      />
    </Wrapper>
  );
}
