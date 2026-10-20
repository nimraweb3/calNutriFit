import {defineConfig} from 'vitest/config';
// Unit tests must not depend on, or load, a developer's backend credentials.
export default defineConfig({
  envDir:false,
  // Vite replaces import.meta.env during transformation, before beforeEach stubs.
  // These deliberately fake values initialize the mocked client without secrets.
  define:{
    'import.meta.env.VITE_SUPABASE_URL':JSON.stringify('https://example.supabase.co'),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify('sb_publishable_test'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY':JSON.stringify(''),
  },
  test:{include:['src/**/*.test.ts','src/**/*.test.tsx']},
});
