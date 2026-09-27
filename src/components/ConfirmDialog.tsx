import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { isApplePlatform } from '@/lib/platform';

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
 * Telegram's alert, in whichever shape the host client uses: iOS centres the
 * text and splits the footer in half with a hairline, while every other client
 * aligns the text left and puts both buttons in the bottom right corner.
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
  const apple = isApplePlatform();

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
        className={cn(
          'relative z-10 w-full animate-slide-up overflow-hidden rounded-sheet bg-surface',
          apple ? 'max-w-[280px]' : 'max-w-[320px]',
        )}
      >
        <div className={cn('pb-3 pt-5', apple ? 'px-5 pb-4 text-center' : 'px-6')}>
          <h2
            className={cn(
              'text-text',
              apple ? 'text-card-title font-semibold' : 'text-section-title',
            )}
          >
            {title}
          </h2>
          {description && (
            <p className={cn('text-text-muted', apple ? 'mt-1.5 text-small' : 'mt-2 text-body')}>
              {description}
            </p>
          )}
        </div>

        {apple ? (
          <div className="flex border-t border-border">
            <AlertButton onClick={onCancel} full>
              {cancelLabel ?? t('common.cancel')}
            </AlertButton>
            <span className="w-px bg-border" aria-hidden="true" />
            <AlertButton onClick={onConfirm} tone={tone} loading={loading} full>
              {confirmLabel ?? t('common.confirm')}
            </AlertButton>
          </div>
        ) : (
          <div className="flex justify-end gap-1 px-3 pb-3 pt-1">
            <AlertButton onClick={onCancel}>{cancelLabel ?? t('common.cancel')}</AlertButton>
            <AlertButton onClick={onConfirm} tone={tone} loading={loading}>
              {confirmLabel ?? t('common.confirm')}
            </AlertButton>
          </div>
        )}
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
  full,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: 'neutral' | 'primary' | 'danger';
  loading?: boolean;
  /** iOS splits the footer, so each button takes half of it. */
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex items-center justify-center gap-2 transition-colors duration-150',
        'active:bg-surface-muted disabled:opacity-60',
        full
          ? 'min-h-[48px] flex-1 px-3 text-body'
          : 'min-h-[40px] rounded-control px-4 text-body font-medium',
        tone === 'danger' ? 'font-medium text-danger' : 'text-primary',
      )}
    >
      {loading && <Loader2 size={15} className="animate-spin" strokeWidth={2} />}
      {children}
    </button>
  );
}
