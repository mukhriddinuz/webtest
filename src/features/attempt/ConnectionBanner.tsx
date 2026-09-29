import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';
import { toast } from '@/store/toast';

export interface ConnectionBannerProps {
  online: boolean;
  /** Answers still waiting to be sent. */
  unsent: number;
  /** True while the last try at sending them failed. */
  failing: boolean;
}

/**
 * Says so when answers are not getting through.
 *
 * The screen shows an answer as given the moment it is tapped, so without this
 * a candidate on a dead connection has no way to know that what they see is not
 * what the server holds. It stays out of the way otherwise — an answer merely
 * in flight is not worth a banner — and confirms once when the backlog clears,
 * so the warning does not just vanish unexplained.
 */
export function ConnectionBanner({ online, unsent, failing }: ConnectionBannerProps) {
  const { t } = useTranslation();

  const trouble = !online || (failing && unsent > 0);
  const wasInTrouble = useRef(false);

  useEffect(() => {
    if (trouble) {
      wasInTrouble.current = true;
      return;
    }
    if (wasInTrouble.current && unsent === 0) {
      wasInTrouble.current = false;
      toast.success(t('attempt.sentAgain'));
    }
  }, [trouble, unsent, t]);

  if (!trouble) return null;

  const message = !online
    ? unsent > 0
      ? t('attempt.offlineCount', { count: unsent })
      : t('attempt.offline')
    : t('attempt.sendFailing');

  return (
    <div
      role="status"
      aria-live="polite"
      className="-mx-4 mt-2 flex items-center gap-2 bg-danger-soft px-4 py-2 text-small text-danger"
    >
      <WifiOff size={15} strokeWidth={1.75} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}
