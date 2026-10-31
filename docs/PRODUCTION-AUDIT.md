# CalNutriFit production audit — 19 October 2026

## Scope and evidence
Existing React 18 / strict TypeScript / Vite 8 SPA, Radix dialogs, custom CSS, Recharts, Zod, Supabase client; Vercel static hosting; shared Nutrio Lovable Cloud PostgreSQL/auth and chef-chat function. Reviewed source tree, journal adapter, calculations, auth, onboarding, AI callers, analytics, reference migrations/function, deployment and prior live checks. No framework migration or destructive schema work planned.

## Findings before changes
| Severity | Finding                                                                                                                                  | Evidence / next action                                                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High     | Shared AI function source lacks explicit user verification, message size/role limits and application quotas; returns upstream error text | Reference chef-chat source. Deployed gateway settings unverified; requires server deployment access and live abuse tests.                                                 |
| High     | Updates/deletes can succeed with zero affected rows                                                                                      | syncRows only checks error; require returned row and regression tests.                                                                                                    |
| High     | Multi-record saves can partially commit; network uncertainty can cause repeat inserts                                                    | saveJournal is sequential and uses database IDs; requires transactional server RPC/idempotency design before full release. No automatic retries.                          |
| High     | No verified two-user isolation test or self-service account deletion                                                                     | Source policies enforce auth.uid ownership, but source is not proof of deployed policies. Shared-account deletion must cover both apps and require explicit confirmation. |
| Medium   | Measurements required for onboarding, with no skip/sign-out escape                                                                       | Onboarding gate and required profile schema. Add basic logging without a fabricated profile.                                                                              |
| Medium   | AI streams can hang and silently ignore malformed events                                                                                 | ChefAssistant empty catch and unbounded stream; add timeout, size limits, visible errors.                                                                                 |
| Medium   | Portion conversion accepts invalid reference sizes; recipe yield not guarded in business logic                                           | engine portion/recipeFood; validate and add regression tests.                                                                                                             |
| Medium   | No CI pipeline; stale README makes contradictory deployment claims                                                                       | Add repeatable type/test/build/security checks and updated operational documentation.                                                                                     |
| Medium   | Entire journal/catalog and charts loaded eagerly                                                                                         | allRows + static imports. Optimize expensive panels without architecture replacement; field performance not measured.                                                     |
| Medium   | Nutrition catalog provenance unverified; unknown micronutrients often treated as zero                                                    | Legacy and expanded catalogs; do not relabel estimates as verified.                                                                                                       |
| Medium   | Unknown public URLs return HTTP 200 landing page; no published privacy/terms/contact or retention policy                                 | Rewrite catch-all. Real policies require operator identity and retention decisions.                                                                                       |
| Low      | Mobile tap targets, accessible chart alternatives and keyboard coverage need wider testing                                               | CSS and charts; no WCAG conformance claim.                                                                                                                                |

No confirmed critical exploit at this stage. npm audit on 19 October: zero reported vulnerabilities across 149 dependencies; this is not a complete security assessment. Public metadata contains no journal/profile information; public landing HTML, sitemap and noindex on /food verified in previous deployment.

## Implementation order
1. Reproduce baseline tests, inspect live app and anonymous API behavior.
2. Fix silent write failures, invalid calculations and AI failure handling with regression tests.
3. Make onboarding optional, retain sign-out access and add explicit offline feedback.
4. Add CI and update security/deployment/schema documentation, record actual test results.
5. Build/deploy safe changes and inspect production. Keep server-only gaps explicitly open.
6. Defer optional barcode/voice/wearables/offline queues until authorization, nutrition provenance and transactions are verified.

## Release gate
Not yet production-ready. Do not describe missing server controls as fixed by frontend validation. Email delivery/verification, fresh OAuth, two-user RLS, transactional saves, account deletion, operator privacy policy and deployed AI controls need evidence before public launch. No Lighthouse or Core Web Vitals score is claimed.

## Implemented and measured — 19 October
- Updates/deletes require exactly one returned row, so zero-row writes fail visibly; two regression cases cover ownership filters and error propagation.
- Portion calculations reject invalid reference sizes, conversions and missing/nonfinite nutrition; recipe calculations reject invalid yield/empty ingredients.
- Shared bounded AI SSE reader rejects truncated/malformed/oversized responses. Both callers impose a 60-second request limit. This does not replace server quotas/auth.
- Onboarding can be skipped without storing invented measurements or activity preferences; sign-out remains available there. Offline save attempts retain the form and explain reconnection.
- Analytics, recipes, insights and chef panels are lazy loaded. Analytics has a daily table alternative. Small-screen form/nav rules improved.
- Exact SPA route rewrites replace catch-all; unknown addresses get a real 404. Added object/base/frame CSP restrictions, not a complete script CSP.
- Added CI and corrected stale setup/verification documentation. No email contact section added, per owner request.

## Test evidence
- npm audit: zero reported advisories (149 dependencies).
- Tests: 53 passed across 9 suites after updates. Initial sandbox runs failed to load temporary transformed modules; unsandboxed runs passed. One old required-workouts expectation was updated for intentional optional onboarding.
- npm run build: TypeScript, Vite and public prerender passed.
- Live anonymous SELECT: zero rows from seven journal tables.
- Two synthetic users: food SELECT/INSERT/UPDATE/DELETE cross-user attempts denied; owner row unchanged; disposable record removed. Other-table two-user isolation remains unverified.
- Dedicated demo adapter: food creation, portion edit, deletion, recipe save/reload/yield preservation and cleanup passed.
- Tracked-file scan: no sb_secret/private-key PEM patterns found. This limited pattern scan is not a full secret-history audit.
- Initial JavaScript before: index 387.81 kB + charts 385.60 kB + vendor 172.29 kB + auth 214.48 kB (raw build sizes). Intermediate split still pulled React into the charts chunk; inspection caught this. Removed manual chunk grouping. Final initial index is 756.11 kB raw / 199.14 kB gzip versus roughly 315.06 kB gzip across previous initial index/charts/vendor/auth chunks. Analytics is now a separate 386.05 kB raw / 102.47 kB gzip dynamic chunk. The remaining initial bundle is still large; further catalog/auth splitting is a medium-priority task. No Lighthouse/field Core Web Vitals measured.

## Remaining roadmap / release blockers
High: deployed AI authorization/validation/quotas; atomic multi-record saves with retry-safe IDs; all-table isolation; secure shared-account deletion; verified email delivery/confirmation. Medium: independent nutrition provenance, account privacy/retention controls, resumable partial onboarding, paginated history queries, full keyboard/screen-reader/browser matrix, mobile performance/field metrics, GitHub CI activation and monitoring. Optional: barcode/voice/wearables, offline logging queue, verified external food lookup and wider regional translations. These are not represented as completed features.

## Follow-up verification and core food improvements
All seven application tables passed two-user SELECT/INSERT/UPDATE/DELETE isolation checks using disposable rows. weight_logs and user_settings also rejected cross-user upserts with RLS error 42501. Owner payloads remained intact; test cleanup completed. The initial JSON property-order comparison produced a false failure on food_entries; it was corrected to semantic comparison and the full test rerun passed. This supersedes the earlier food-only verification limitation; admin/service-role paths and future schema changes still require separate review.

Added Urdu/Roman Urdu normalization and ranked food search, debounced queries, 50-result batches with a Show more control, and access to previously logged foods. Food edit now preserves input and displays failure feedback. Final regression result: 57 passed across 10 suites; TypeScript/Vite/prerender passed. Final initial JS: 757.51 kB raw / 199.75 kB gzip; analytics loads separately. Large initial-bundle warning remains, accurately recorded rather than suppressed.

Production browser verification: sign-out from onboarding and fresh Continue with Google returned to authenticated onboarding. No profile answers changed. At 320px, onboarding, demo dashboard and analytics/table showed no horizontal page overflow. Analytics table rendered seven demo rows. This is a limited responsive smoke test, not WCAG certification. Live HTTP checks verified homepage/private routes, robots/sitemap, noindex headers and real 404 responses.

No email contact section was published, per owner instruction. Server AI controls, atomic saves, shared-account deletion, verification email delivery, independently verified food data and full privacy/retention policy remain release blockers. CI is prepared locally; not yet pushed/activated. Search Console/Rich Results/Lighthouse remain unverified.

## Final deployment verification
Latest deployment: https://calnutrifit-9m4sxdp5a-nim12.vercel.app (dpl_DuxEjHDNNY21Yj5HqiFjsPFjDTAf), aliased to https://calnutrifit.vercel.app. A fresh HTTP check confirmed the production homepage serves index-DTqyu38-.js; homepage, food, robots and sitemap return 200, private food route returns noindex, and an unknown route returns 404 with noindex.

The connected Lovable dashboard exposes chef-chat source in a read-only editor (aria-readonly true, contenteditable false). No shared server function was changed or deployed. Server-side AI protections therefore remain open pending authorized deployment access. The client reliability improvements must not be described as fixing those controls.
