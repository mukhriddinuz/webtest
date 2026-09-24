import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getTelegram } from '@/lib/telegram';
import type { MainButtonState } from '@/lib/telegram';
import { Button } from '@/components/Button';

/**
 * Browser-mode stand-in for Telegram's MainButton. It mirrors whatever
 * `usePrimaryAction` requested and publishes its height as
 * `--bottom-bar-height` so pages can pad themselves correctly.
 */
export function PrimaryActionBar() {
  const telegram = getTelegram();
  const [state, setState] = useState<MainButtonState | null>(() => telegram.mainButton.getState());
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => telegram.mainButton.subscribe(setState), [telegram]);

  useLayoutEffect(() => {
    const height = state?.visible ? (barRef.current?.offsetHeight ?? 0) : 0;
    document.documentElement.style.setProperty('--bottom-bar-height', `${height}px`);
    return () => {
      document.documentElement.style.setProperty('--bottom-bar-height', '0px');
    };
  }, [state]);

  if (!state || !state.visible) return null;

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur"
      style={{ paddingBottom: 'max(0.75rem, var(--safe-bottom))' }}
    >
      <div className="mx-auto w-full max-w-content px-4 pt-3">
        <Button
          fullWidth
          size="lg"
          variant={state.variant === 'danger' ? 'danger' : 'primary'}
          disabled={!state.enabled}
          loading={state.loading}
          onClick={() => telegram.mainButton.click()}
        >
          {state.text}
        </Button>
      </div>
    </div>
  );
}
