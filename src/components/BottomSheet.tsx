import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './Button';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  /** Full height sheet, used by the question editor. */
  tall?: boolean;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  closeLabel = 'Close',
  tall,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 flex w-full max-w-content animate-sheet-in flex-col',
          'rounded-t-sheet bg-surface sm:rounded-sheet',
          tall ? 'h-[92vh] sm:h-[85vh]' : 'max-h-[85vh]',
        )}
        style={{ boxShadow: 'var(--shadow-sheet)' }}
      >
        <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3">
          <span className="absolute left-1/2 top-1.5 h-1 w-9 -translate-x-1/2 rounded-full bg-text-muted/30 sm:hidden" />
          <h2 className="text-section-title text-text">{title}</h2>
          <IconButton label={closeLabel} onClick={onClose} className="-mr-2">
            <X size={18} strokeWidth={1.75} />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <div className="flex gap-2 px-4 py-3 pb-[max(0.75rem,var(--safe-bottom))]">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
