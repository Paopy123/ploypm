import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = (env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseKey = (env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const supabaseOk = Boolean(supabaseUrl && supabaseKey);

  if (mode === 'production' && process.env.NETLIFY === 'true' && !supabaseOk) {
    throw new Error(
      [
        'Missing Supabase keys at build time.',
        'In Netlify → Site configuration → Environment variables, add:',
        '  VITE_SUPABASE_URL',
        '  VITE_SUPABASE_ANON_KEY',
        'Then Deploys → Trigger deploy → Clear cache and deploy.',
        'See docs/NETLIFY_ENV.md',
      ].join('\n'),
    );
  }

  return {
    plugins: [react()],
    define: {
      __SUPABASE_CONFIGURED_AT_BUILD__: JSON.stringify(supabaseOk),
    },
  };
});
