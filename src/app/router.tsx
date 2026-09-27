import { lazy } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { RouteSuspense } from './AppLayout';
import { RouteErrorBoundary } from './ErrorBoundary';
import { RootLayout } from './RootLayout';

/* Heavy screens (KaTeX, Recharts, SheetJS) are split into their own chunks. */
const HomePage = lazy(() => import('@/pages/HomePage'));
const MyTestsPage = lazy(() => import('@/pages/MyTestsPage'));
const ResultsPage = lazy(() => import('@/pages/ResultsPage'));
const TestEditorPage = lazy(() => import('@/pages/TestEditorPage'));
const TestIntroPage = lazy(() => import('@/pages/TestIntroPage'));
const AttemptPage = lazy(() => import('@/pages/AttemptPage'));
const ResultPage = lazy(() => import('@/pages/ResultPage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));
const ManageTestPage = lazy(() => import('@/pages/ManageTestPage'));
const LiveHostPage = lazy(() => import('@/pages/LiveHostPage'));
const LivePlayerPage = lazy(() => import('@/pages/LivePlayerPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const ExamsPage = lazy(() => import('@/pages/ExamsPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const UiKitPage = lazy(() => import('@/pages/UiKitPage'));

/** Screens that own the whole viewport: no bottom navigation. */
const hideNav = { hideNav: true } as const;

export interface RouteHandle {
  hideNav?: boolean;
}

const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    // A screen that throws replaces the page, not the whole app.
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <RouteSuspense />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/my-tests', element: <MyTestsPage /> },
          { path: '/results', element: <ResultsPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/exams', element: <ExamsPage /> },
          { path: '/admin', element: <AdminPage /> },

          { path: '/tests/new', element: <TestEditorPage />, handle: hideNav },
          { path: '/tests/:testId/edit', element: <TestEditorPage />, handle: hideNav },
          { path: '/tests/:testId/manage', element: <ManageTestPage /> },

          { path: '/t/:testId', element: <TestIntroPage /> },
          {
            path: '/t/:testId/attempt/:attemptId',
            element: <AttemptPage />,
            handle: hideNav,
          },
          { path: '/t/:testId/result/:attemptId', element: <ResultPage /> },
          { path: '/t/:testId/leaderboard', element: <LeaderboardPage /> },

          { path: '/live/:sessionId/host', element: <LiveHostPage />, handle: hideNav },
          { path: '/live/:sessionId', element: <LivePlayerPage />, handle: hideNav },

          ...(import.meta.env.DEV ? [{ path: '/dev/ui', element: <UiKitPage /> }] : []),
          { path: '/404', element: <NotFoundPage /> },
          { path: '*', element: <Navigate to="/404" replace /> },
        ],
      },
    ],
  },
];

/**
 * Built per mount rather than at module load, so the router always starts from
 * the current URL (tests mount the app more than once).
 */
export function createAppRouter() {
  return createBrowserRouter(routes, {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  });
}
