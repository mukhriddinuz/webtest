
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
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
