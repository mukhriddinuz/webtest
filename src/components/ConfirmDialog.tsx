import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The alert Telegram puts up: a narrow card with centred text and two plain
 * text buttons under a hairline — not two filled buttons, which would read as
 * a form rather than as a question.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'primary',
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
      <div
        className="absolute inset-0 animate-fade-in bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-[280px] animate-slide-up overflow-hidden rounded-sheet bg-surface"
      >
        <div className="px-5 pb-4 pt-5 text-center">
          <h2 className="text-card-title font-semibold text-text">{title}</h2>
          {description && <p className="mt-1.5 text-small text-text-muted">{description}</p>}
        </div>

        <div className="flex border-t border-border">
          <AlertButton onClick={onCancel}>{cancelLabel ?? t('common.cancel')}</AlertButton>
          <span className="w-px bg-border" aria-hidden="true" />
          <AlertButton onClick={onConfirm} tone={tone} loading={loading}>
            {confirmLabel ?? t('common.confirm')}
          </AlertButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AlertButton({
  children,
  onClick,
  tone = 'neutral',
  loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: 'neutral' | 'primary' | 'danger';
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex min-h-[48px] flex-1 items-center justify-center gap-2 px-3 text-body',
        'transition-colors duration-150 active:bg-surface-muted disabled:opacity-60',
        tone === 'danger' ? 'font-medium text-danger' : 'text-primary',
      )}
    >
      {loading && <Loader2 size={15} className="animate-spin" strokeWidth={2} />}
      {children}
    </button>
  );
}
