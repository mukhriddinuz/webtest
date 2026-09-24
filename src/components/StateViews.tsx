import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { SkeletonList } from './Skeleton';

export function LoadingState({ count = 3 }: { count?: number }) {
  return (
    <div className="py-4" aria-busy="true">
      <SkeletonList count={count} />
    </div>
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle size={24} strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 text-section-title text-text">{t('common.errorTitle')}</h3>
      <p className="mt-1.5 max-w-xs text-body text-text-muted">
        {message ?? t('common.errorText')}
      </p>
      {onRetry && (
        <Button className="mt-5" variant="secondary" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
