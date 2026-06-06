/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __SUPABASE_CONFIGURED_AT_BUILD__: boolean;

interface Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}
