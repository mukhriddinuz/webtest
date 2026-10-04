import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Wraps the built web app (`dist`) in an Android WebView. There is no backend
 * yet, so the app runs on its mock data layer, exactly as it does in a browser.
 */
const config: CapacitorConfig = {
  appId: 'uz.testhub.app',
  appName: 'TestHub',
  webDir: 'dist',
  android: { allowMixedContent: false },
  server: { androidScheme: 'https' },
};

export default config;
