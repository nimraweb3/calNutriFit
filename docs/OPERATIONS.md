# Operations, schema and release gates

## Existing data model
CalNutriFit and Nutrio share user-owned rows. user_settings.settings.calnutrifit holds preferences/profile, supplement plans, completion state and shopping lists. food_entries stores quantity in grams and a nutrition snapshot; workout_entries stores duration, estimated calories and exercise metadata; recipes.items stores ingredient snapshots and CalNutriFit metadata; weight_logs uses user/date; fitness_goals holds scheduled goals; supplement_entries holds historical supplement nutrition. Source migrations live on the reference nutrio-pulse-tracker/main remote. Do not reapply these migrations blindly.

PostgreSQL RLS is the authorization boundary, not React route checks. No service-role keys belong in a browser. Metadata, sitemap and static prerender must remain free of account data.

## Setup and checks
Use Node 24, npm ci, copy .env.example to ignored .env.local, and set only public Supabase configuration. npm test runs regression tests. npm run build type-checks, bundles, and renders the public Landing component into HTML. npm run dev starts local development.
CI runs install, tests, build and advisory audit; it becomes active when pushed to GitHub. Browser credentials and .env.demo / .env.audit-test must never be committed.
scripts/check-backend.mjs is read-only anonymous table testing.
scripts/audit-isolation.mjs uses the dedicated demo account plus a second synthetic account, creates one disposable food entry and tests isolation/cleanup. The second account remains for reuse; delete it only through approved administrator procedures.
scripts/demo-adapter-check.mjs writes and removes synthetic food/recipe records in the dedicated demo account. Never repoint these scripts at a personal account.

## Authentication
Google uses the existing Lovable-managed broker, NOT raw Supabase Google OAuth. Preserve the original Nutrio Site URL. Allow only intended callbacks. Test fresh login/logout and redirect errors. Configure real email delivery, confirmation and recovery in the owning Lovable dashboard. Account deletion needs an authenticated server operation and shared-app impact disclosure; it is not implemented.

## AI server work still required
Review deployed chef-chat against the reference source. Add explicit JWT user verification, POST-only handling, content length limits, allowed message roles/counts, bounded content/context, per-user persistent quotas, upstream timeout, safe error mapping and output limits. Keep provider keys server-side. Exercise anonymous, expired-token, oversized-payload, quota, provider-error and timeout tests in staging. Frontend timeouts are not server authorization or spending controls. Include existing Nutrio clients in compatibility tests before replacing a shared function.

## Consistency and release gates
Sequential saves are not atomic. Review an authenticated transaction RPC with ownership validation, stable request IDs and optimistic version checking. Test rollback, response loss, two-device editing, and retries. Do not auto-retry multi-row mutations until this exists.
Extend live two-user tests to every table/operation and weight/settings upserts. Verify deployed RLS and grants through authorized administration. No destructive migration is part of this audit.

## Privacy and monitoring
No analytics SDK was added. Do not collect food entries, profiles, tokens, AI prompts or recipe content in error reports. Provide a real operator name/contact, retention/backups policy and deletion process before publishing legal pages; do not invent these or claim regulatory compliance. Export uses JSON from the signed-in journal. Service retention/backups remain owner review items.

## SEO and performance
Only the public homepage belongs in sitemap.xml today. Account routes return noindex; robots.txt allows crawlers to see it. Unknown paths should return real 404. Search Console: verify production ownership, submit /sitemap.xml, inspect homepage and private route, then monitor indexing and field Core Web Vitals. Schema describes WebSite/SoftwareApplication without fabricated ratings. Rich Results Test and Search Console verification remain manual.
Lazy panels reduce initial chart loading; bundle sizes are not Lighthouse or real-user timing. Collect field data before claiming LCP/INP/CLS targets.

## Deployment and rollback
Deploy passing builds to existing nim12/calnutrifit. Static deployment uses dist with framework null, buildCommand empty, outputDirectory '.', and root rewrites/headers copied across. Exclude .env*, .vercel/ and .git/.
Smoke-test /, /food, /auth/callback, /robots.txt, /sitemap.xml and unknown URL; test sign-in and disposable log round-trip. On regression, promote the last verified deployment in Vercel; never restore an old database over newer user records.

Extended test: scripts/audit-all-tables.mjs checks all seven app tables and weight/settings upserts with two synthetic users; run only with the ignored dedicated credentials. On 19 October all tests passed and fixtures were removed. These checks supersede the earlier food-only scope, not the need for future security regression testing.

The owner requested no email contact section; none was published. This does not change email authentication. A truthful privacy/deletion process remains unresolved and must not be replaced with invented contact details. The current Lovable function source editor is read-only, so backend AI changes require a supported deployment route with administrator access.
