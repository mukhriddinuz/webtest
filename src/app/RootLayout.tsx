import { lazy, Suspense } from 'react';
import { Outlet, useMatches } from 'react-router-dom';
import { getTelegram } from '@/lib/telegram';
import { useMainActionVisible } from '@/hooks/usePrimaryAction';
import { BottomNav } from '@/components/BottomNav';
import { Toaster } from '@/components/Toaster';
import { PrimaryActionBar } from './PrimaryActionBar';

import { devToolsEnabled } from './devTools';
import type { RouteHandle } from './router';

/** Kept out of the main bundle; only fetched where dev tools are enabled. */
const DevPanelSheet = lazy(() =>
  import('./DevPanel').then((module) => ({ default: module.DevPanelSheet })),
);

/**
 * Frame shared by every screen. It decides whether the bottom navigation is
 * shown: full-screen routes opt out with `handle: { hideNav: true }`, and any
 * screen that asks for a main action hides it too, so the two bars never stack.
 */
export function RootLayout() {
  const matches = useMatches();
  const mainActionVisible = useMainActionVisible();
  const insideTelegram = getTelegram().isTelegram;

  const hiddenByRoute = matches.some(
    (match) => (match.handle as RouteHandle | undefined)?.hideNav === true,
  );
  const showNav = !hiddenByRoute && !mainActionVisible;

  return (
    <div className="min-h-full">
      <Outlet />
      {showNav && <BottomNav />}
      {/* Telegram renders its own MainButton; the browser needs a stand-in. */}
      {!insideTelegram && <PrimaryActionBar />}
      <Toaster />
      {devToolsEnabled() && (
        <Suspense fallback={null}>
          <DevPanelSheet />
        </Suspense>
      )}
    </div>
  );
}
