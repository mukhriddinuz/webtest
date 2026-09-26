/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'mock' | 'http';
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Injected by Vite at build time; see `define` in vite.config.ts. */
declare const __BUILD_ID__: string;
declare const __BUILD_TIME__: string;
