import { useEffect, useRef, useState } from 'react';
import { getTelegram } from '@/lib/telegram';
import type { MainButtonState } from '@/lib/telegram';

export interface PrimaryAction {
  label: string;
  onClick: () => void;
  enabled?: boolean;
  loading?: boolean;
  visible?: boolean;
  variant?: MainButtonState['variant'];
}

/**
 * The single entry point for a screen's main action. Inside Telegram it drives
 * MainButton; in the browser `PrimaryActionBar` renders the same state as a
 * sticky button. Screens never branch on the environment themselves.
 */
export function usePrimaryAction(action: PrimaryAction | null): void {
  const handlerRef = useRef<(() => void) | null>(null);
  handlerRef.current = action?.onClick ?? null;

  // The click subscription lives for the component's lifetime.
  useEffect(() => {
    const telegram = getTelegram();
    return telegram.mainButton.onClick(() => handlerRef.current?.());
  }, []);

  const label = action?.label;
  const enabled = action?.enabled ?? true;
  const loading = action?.loading ?? false;
  const visible = action?.visible ?? true;
  const variant = action?.variant ?? 'primary';

  useEffect(() => {
    const telegram = getTelegram();
    if (!label) {
      telegram.mainButton.set(null);
      return;
    }
    telegram.mainButton.set({ text: label, visible, enabled, loading, variant });
    return () => telegram.mainButton.set(null);
  }, [label, enabled, loading, visible, variant]);
}

/** Registers a Telegram BackButton handler for the current screen. */
export function useBackAction(handler: (() => void) | null): void {
  const handlerRef = useRef<(() => void) | null>(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const telegram = getTelegram();
    if (!handlerRef.current) {
      telegram.backButton.setVisible(false);
      return;
    }
    telegram.backButton.setVisible(true);
    const off = telegram.backButton.onClick(() => handlerRef.current?.());
    return () => {
      off();
      telegram.backButton.setVisible(false);
    };
  }, [handler === null]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Whether a screen currently asks for a main action. The layout uses it to keep
 * the bottom navigation from sitting under Telegram's MainButton (or under its
 * browser stand-in).
 */
export function useMainActionVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const telegram = getTelegram();
    // Child effects have already run, so the current state is authoritative.
    setVisible(Boolean(telegram.mainButton.getState()?.visible));
    return telegram.mainButton.subscribe((state) => setVisible(Boolean(state?.visible)));
  }, []);

  return visible;
}

/** Haptic shortcuts, so screens do not import the bridge directly. */
export function useHaptics() {
  return getTelegram().haptic;
}
