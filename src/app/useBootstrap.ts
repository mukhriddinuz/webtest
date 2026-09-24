import { useCallback, useEffect, useState } from 'react';
import { api, initializeApi } from '@/services';
import { getTelegram } from '@/lib/telegram';
import { useSessionStore } from '@/store/session';
import { DEFAULT_DEV_USER } from '@/mocks/users';

export type BootstrapState = 'loading' | 'ready' | 'error';

/**
 * Prepares the data layer and resolves who is using the app: the Telegram
 * account inside the Mini App, or the demo account chosen in the dev panel.
 */
export function useBootstrap(): { state: BootstrapState; retry: () => void } {
  const [state, setState] = useState<BootstrapState>('loading');
  const [attempt, setAttempt] = useState(0);
  const setUser = useSessionStore((store) => store.setUser);
  const devUserId = useSessionStore((store) => store.devUserId);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setState('loading');
      try {
        await initializeApi();
        const telegram = getTelegram();
        const telegramUser = telegram.getUser();

        if (telegram.isTelegram && telegramUser) {
          const user = await api.users.resolve({
            id: telegramUser.id,
            firstName: telegramUser.firstName,
            lastName: telegramUser.lastName,
            username: telegramUser.username,
            photoUrl: telegramUser.photoUrl,
          });
          if (!active) return;
          setUser(user);
        } else {
          // Browser mode: the dev panel picks one of the seeded accounts.
          const users = await api.users.list();
          const selected =
            users.find((user) => user.id === devUserId) ??
            users.find((user) => user.id === DEFAULT_DEV_USER.id) ??
            users[0] ??
            null;
          if (!active) return;
          setUser(selected);
        }

        if (active) setState('ready');
      } catch (error) {
        console.error('Bootstrap failed', error);
        if (active) setState('error');
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [setUser, devUserId, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { state, retry };
}
