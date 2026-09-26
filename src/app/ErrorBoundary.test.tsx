import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@/i18n';
import { AppErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('Kutilmagan xato');
}

describe('AppErrorBoundary', () => {
  it('shows a recoverable screen instead of a blank page', () => {
    // React logs the caught error; that noise is expected here.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    );

    expect(screen.getByText("Nimadir noto'g'ri ketdi")).toBeTruthy();
    // The message itself is surfaced, and a way out is always offered.
    expect(screen.getByText('Kutilmagan xato')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Qayta urinish' })).toBeTruthy();

    consoleError.mockRestore();
  });

  it('renders its children while nothing throws', () => {
    render(
      <AppErrorBoundary>
        <p>Hammasi joyida</p>
      </AppErrorBoundary>,
    );
    expect(screen.getByText('Hammasi joyida')).toBeTruthy();
  });
});
