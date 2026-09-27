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
 * Telegram's alert: the title and the text sit left, and the two plain text
 * buttons sit together in the bottom right. The centred card split in half by
 * a hairline is the iOS dialect.
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
        className="relative z-10 w-full max-w-[320px] animate-slide-up overflow-hidden rounded-sheet bg-surface"
      >
        <div className="px-6 pb-3 pt-5">
          <h2 className="text-section-title text-text">{title}</h2>
          {description && <p className="mt-2 text-body text-text-muted">{description}</p>}
        </div>

        <div className="flex justify-end gap-1 px-3 pb-3 pt-1">
          <AlertButton onClick={onCancel}>{cancelLabel ?? t('common.cancel')}</AlertButton>
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
        'flex min-h-[40px] items-center justify-center gap-2 rounded-control px-4 text-body font-medium',
        'transition-colors duration-150 active:bg-surface-muted disabled:opacity-60',
        tone === 'danger' ? 'text-danger' : 'text-primary',
      )}
    >
      {loading && <Loader2 size={15} className="animate-spin" strokeWidth={2} />}
      {children}
    </button>
  );
}
