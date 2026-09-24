import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  variant?: 'segmented' | 'underline';
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  variant = 'segmented',
}: TabsProps<T>) {
  if (variant === 'underline') {
    return (
      <div
        className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-border', className)}
        role="tablist"
      >
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={item.value === value}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative min-h-[44px] whitespace-nowrap px-3 text-body transition-colors duration-150',
              item.value === value ? 'text-text' : 'text-text-muted hover:text-text',
            )}
          >
            {item.label}
            {typeof item.count === 'number' && (
              <span className="ml-1 text-small text-text-muted">{item.count}</span>
            )}
            {item.value === value && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('flex gap-1 rounded-control bg-surface-muted p-1', className)}
      role="tablist"
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={item.value === value}
          onClick={() => onChange(item.value)}
          className={cn(
            'flex-1 rounded-[9px] px-3 py-2 text-body transition-colors duration-150',
            item.value === value
              ? 'bg-surface text-text shadow-sm'
              : 'text-text-muted hover:text-text',
          )}
        >
          {item.label}
          {typeof item.count === 'number' && (
            <span className="ml-1 text-small opacity-70">{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
