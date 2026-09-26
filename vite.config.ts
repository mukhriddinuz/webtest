import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Stamped into the bundle so the running app can say which build it is —
 * the only reliable way to tell a stale webview from a missing deploy.
 */
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev';

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: true,
    port: 5173,
    // Needed for ngrok / cloudflared tunnels when testing as a Telegram Mini App.
    allowedHosts: true,
  },
  build: {
    target: 'es2020',
    // KaTeX, Recharts and SheetJS are deliberately split and lazy-loaded.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          katex: ['katex'],
          charts: ['recharts'],
          sheet: ['xlsx'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
