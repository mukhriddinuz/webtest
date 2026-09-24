import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
// Side-effect import: the app must not depend on a lazy chunk to set up i18n.
import '@/i18n';
import { ErrorState } from '@/components/StateViews';
import { Skeleton } from '@/components/Skeleton';
import { ThemeProvider } from './ThemeProvider';
import { createAppRouter } from './router';
import { Page } from './AppLayout';
import { useBootstrap } from './useBootstrap';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppBoot />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/** Nothing is routed until the data layer and the current user are ready. */
function AppBoot() {
  const { t } = useTranslation();
  const { state, retry } = useBootstrap();
  const [router] = useState(createAppRouter);

  if (state === 'loading') return <SplashScreen />;
  if (state === 'error') {
    return (
      <Page>
        <ErrorState onRetry={retry} message={t('common.errorText')} />
      </Page>
    );
  }

  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}

function SplashScreen() {
  return (
    <div className="page flex min-h-screen flex-col justify-center gap-4 py-10">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-60" />
      <div className="mt-4 flex flex-col gap-3">
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-24 w-full rounded-card" />
      </div>
    </div>
  );
}
