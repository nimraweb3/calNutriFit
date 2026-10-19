# CalNutriFit

Nutrition and workout journal built with React 18, strict TypeScript and Vite. It reuses Nutrio’s Lovable Cloud/Supabase authentication and user-owned data, deployed at https://calnutrifit.vercel.app/.

## Development

Use Node 24. Run npm ci, copy .env.example to .env.local and set the public Supabase project URL and anon/publishable key. Run npm run dev. No service-role or AI provider secret belongs in a VITE_ variable.
Run npm test for business-logic and regression tests. npm run build performs TypeScript checks, builds assets and prerenders the public landing page. CI configuration is in .github/workflows/quality.yml.

## Architecture and verification

src/backend.ts maps existing shared tables without replacing user data. src/engine.ts, daily-balance.ts and analytics-data.ts implement calculations. Food entries store nutrition snapshots. AuthPanel uses Lovable-managed Google OAuth; direct Supabase Google OAuth is not appropriate for this configuration. Chart/recipe/AI panels load on demand.

See [production audit](docs/PRODUCTION-AUDIT.md), [operations and schema](docs/OPERATIONS.md), and [deployment history](DEPLOYMENT.md) for evidence and remaining gates.

This application is not yet certified production-ready. Outstanding work includes full table-by-table cross-user authorization tests, server AI controls, atomic multi-record saves, account deletion, email delivery verification, nutrition provenance, operator privacy/retention policy and wider accessibility/performance validation. A passing build or dependency scan does not prove those properties.

## Test data and privacy

Demo mode is labeled sample data and does not save. Integration scripts use dedicated synthetic accounts; never substitute a personal account. .env.demo and .env.audit-test are ignored credentials. No personal journal data is sent to public SEO metadata. AI only receives inputs and preferences the user elects to send. Reference catalogs contain estimates, not independently verified nutritional records.

Original reference source: nimraweb3/nutrio-pulse-tracker at df1441c2ceb4d2eab2cc1dc96cfb6a88da3d8c83. Both applications share records, so editing shared logs affects both.
