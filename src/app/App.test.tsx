import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { clearDatabase } from '@/services/mock/db';
import { useDevStore } from '@/store/dev';
import { useSessionStore } from '@/store/session';

/** jsdom has no IndexedDB; seed artwork goes to a Map instead. */
vi.mock('idb-keyval', () => {
  const store = new Map<string, unknown>();
  return {
    get: (key: string) => Promise.resolve(store.get(key)),
    set: (key: string, value: unknown) => {
      store.set(key, value);
      return Promise.resolve();
    },
    del: (key: string) => {
      store.delete(key);
      return Promise.resolve();
    },
    keys: () => Promise.resolve([...store.keys()]),
  };
});

// KaTeX pulls in a stylesheet that jsdom cannot parse.
vi.mock('katex/dist/katex.min.css', () => ({}));

beforeEach(() => {
  useDevStore.setState({ latencyMs: 0, errorRate: 0, channelCheckPasses: true });
  useSessionStore.setState({ user: null, devUserId: null });
  clearDatabase();
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
});

describe('App', () => {
  it(
    'boots, seeds the mock data and renders the home screen with its navigation',
    { timeout: 30000 },
    async () => {
      const { App } = await import('./App');
      render(<App />);

      // Greeting resolves once bootstrap picked the default demo teacher.
      await waitFor(
        () => {
          expect(screen.getByText(/Salom, Aziz/)).toBeDefined();
        },
        { timeout: 15000 },
      );

      // The compact join card replaced the old tabs.
      expect(screen.getByPlaceholderText('Test kodi')).toBeDefined();
      expect(screen.queryByText('Ishlaganlarim')).toBeNull();

      // Bottom navigation is present on a nav route.
      ['Asosiy', 'Testlarim', 'Natijalar', 'Profil'].forEach((label) => {
        expect(screen.getByText(label)).toBeDefined();
      });

      // The seeded account has activity, so the recent section is rendered.
      await waitFor(
        () => {
          expect(screen.getByText("So'nggi faoliyat")).toBeDefined();
        },
        { timeout: 15000 },
      );

      expect(document.documentElement.dataset.theme).toMatch(/light|dark/);
    },
  );

  it('hides the navigation on full-screen routes', { timeout: 30000 }, async () => {
    const { App } = await import('./App');
    render(<App />);

    await waitFor(
      () => {
        expect(screen.getByText(/Salom, Aziz/)).toBeDefined();
      },
      { timeout: 15000 },
    );

    // The central create button leads to a route marked `hideNav`.
    fireEvent.click(screen.getByLabelText('Yangi test'));

    await waitFor(
      () => {
        expect(screen.getByText('Test turini tanlang')).toBeDefined();
      },
      { timeout: 15000 },
    );

    expect(screen.queryByText('Asosiy')).toBeNull();
    expect(screen.queryByText('Natijalar')).toBeNull();
  });

  it('navigates to the tests tab and lists the seeded tests', { timeout: 30000 }, async () => {
    const { App } = await import('./App');
    render(<App />);

    await waitFor(
      () => {
        expect(screen.getByText(/Salom, Aziz/)).toBeDefined();
      },
      { timeout: 15000 },
    );

    fireEvent.click(screen.getByText('Testlarim'));

    await waitFor(
      () => {
        expect(screen.getByText('Algebra: kvadrat tenglamalar')).toBeDefined();
      },
      { timeout: 15000 },
    );
  });
});
