import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BottomSheet } from './BottomSheet';

export interface PickerOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export interface PickerSheetProps<T extends string> {
  open: boolean;
  title: string;
  value: T;
  options: PickerOption<T>[];
  onSelect: (value: T) => void;
  onClose: () => void;
  closeLabel?: string;
}

/**
 * The way Telegram asks a one-of question: a sheet of rows with a tick beside
 * the current choice, rather than a dropdown borrowed from the desktop web.
 */
export function PickerSheet<T extends string>({
  open,
  title,
  value,
  options,
  onSelect,
  onClose,
  closeLabel,
}: PickerSheetProps<T>) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} closeLabel={closeLabel}>
      <div className="-mx-4 -my-4 overflow-hidden">
        {options.map((option, index) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onSelect(option.value);
              onClose();
            }}
            className="flex w-full items-center gap-4 pl-4 text-left transition-colors duration-150 active:bg-surface-muted"
          >
            <span
              className={cn(
                'flex min-h-[52px] flex-1 items-center gap-3 py-2.5 pr-4',
                index > 0 && 'border-t border-border',
              )}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-body text-text">{option.label}</span>
                {option.hint && (
                  <span className="truncate text-small text-text-muted">{option.hint}</span>
                )}
              </span>
              {option.value === value && (
                <Check size={18} strokeWidth={2.25} className="shrink-0 text-primary" />
              )}
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
