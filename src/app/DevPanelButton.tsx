import { useTranslation } from 'react-i18next';
import { Bug } from 'lucide-react';
import { useDevStore } from '@/store/dev';
import { devToolsEnabled } from './devTools';

/**
 * Small trigger that lives in the page header, so it never covers content or
 * the bottom navigation. Rendered only where dev tools are enabled.
 */
export function DevPanelButton() {
  const { t } = useTranslation();
  const setPanelOpen = useDevStore((state) => state.setPanelOpen);

  if (!devToolsEnabled()) return null;

  return (
    <button
      type="button"
      onClick={() => setPanelOpen(true)}
      aria-label={t('dev.title')}
      title={t('dev.title')}
      className="-ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-colors duration-150 hover:text-text"
    >
      <Bug size={14} strokeWidth={1.75} />
    </button>
  );
}
