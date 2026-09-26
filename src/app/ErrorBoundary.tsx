import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useRouteError } from 'react-router-dom';
import { ErrorState } from '@/components/StateViews';
import { Page } from './AppLayout';

/**
 * Inside Telegram a crash is worse than on the web: there is no address bar,
 * so a blank screen leaves the user with nothing to do but close the Mini App.
 * Both fallbacks below therefore always offer a way out — a full reload, which
 * is safe because every screen restores its state from the data layer.
 */
function CrashScreen({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : undefined;
  return (
    <Page padded={false}>
      <ErrorState onRetry={() => window.location.reload()} message={message} />
    </Page>
  );
}

/** Rendered by the router when a screen throws while rendering or loading. */
export function RouteErrorBoundary() {
  const error = useRouteError();
  return <CrashScreen error={error} />;
}

interface State {
  error: unknown;
}

/**
 * Catches what the router cannot: a throw from the providers above it, or from
 * a screen after it has mounted.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Nothing collects these yet; the console is what a developer can reach.
    console.error('Unhandled error', error, info.componentStack);
  }

  render() {
    if (this.state.error) return <CrashScreen error={this.state.error} />;
    return this.props.children;
  }
}
