# Dashboard and profile redesign — 21 October 2026

## Reference and design
The accessible Nutrio reference displayed its sign-in screen. Read-only computed styles confirmed background rgb(22,20,19), text rgb(241,240,238), border rgb(51,48,46), accent rgb(42,192,137), Manrope body and Sora headings. Dashboard structure was assessed from the user-supplied screenshot, not a live authenticated Nutrio dashboard. CalNutriFit retains its branding and light theme.

## Implemented
- Warm charcoal theme tokens, compact cards, restrained green accents, responsive columns and reduced-motion support through existing global rules.
- Personalized dashboard with logged intake, remaining/over-target calories, macros, water, check-ins, inline nutrients, real seven-day intake, workout-day count and recent record dates. Exact event timestamps are not fabricated where old records only contain dates.
- Personal goals for weight, calories, protein, water, weekly workouts, steps and custom values. Create/edit/complete/reopen/delete, optional due date and progress from actual records. Optional goal suggestions reuse existing profile targets. Tracking goals do not silently change nutrition allowances. Legacy workout goals remain available.
- Water and steps are explicitly entered daily totals, not device measurements. Goals, check-ins and theme use existing user_settings CalNutriFit JSON, with existing ownership/conflict protection.
- Nutrients removed from navigation; the old /nutrition URL renders the food log for compatibility. Compact inline overview and expandable full reference/history views retain unknown-value semantics and separate food/supplement contributions.
- Profile header, initials avatar, real account email/member-since when available, grouped information, real summary stats and kg/lb chart toggle. Existing edits and weight history reused. Health notes remain optional and are not sent to AI.
- Concise confirmed-save messages and optional per-food nutrition breakdowns.

## Private photos: implemented but NOT enabled or live-verified
ProgressPhotos.tsx and progress-photos.ts implement local image decoding/resizing/re-encoding, JPEG/PNG/WebP input up to 5 MB, date/category/note validation, upload, expiring signed previews, responsive gallery, enlarged views/comparison, and confirmed storage+metadata deletion. Re-encoding occurs on the user's device; no third-party image processor is used. File capture input can invoke a device camera where supported; actual camera hardware has not been tested.

The read-only authenticated backend probe returned PGRST205 for calnutrifit_progress_photos. A storage list returning an empty success does not establish that a private bucket and correct policies are provisioned. There is no supported administrator SQL deployment tool in this session. Therefore VITE_PROGRESS_PHOTOS_ENABLED stays unset/false and upload controls are disabled. No personal photos were uploaded.

Required administrator work:
1. Review and apply supabase/migrations/20261021_private_progress_photos.sql on the existing backend. It adds a private bucket and metadata table, user ownership policies, bucket size/MIME restrictions and restrictive policies protecting this bucket from broader existing storage policies. It does not replace Nutrio journal tables.
2. Verify with two disposable users: own upload/list/signed preview/delete succeeds; the other user and anonymous requests cannot read, sign, overwrite, insert into or delete the owner's objects or metadata. Verify the bucket is private and inspect existing policy interaction. Run a real image decoding/metadata deletion round-trip; invalid file metadata and oversized payloads must fail.
3. Verify failed metadata saves clean up uploaded objects, and interrupted deletion can be retried. These two-service operations are not atomic; monitor orphan cleanup.
4. Only then set VITE_PROGRESS_PHOTOS_ENABLED=true and rebuild. This frontend flag is a rollout switch, not authorization. Database and Storage policies are the actual boundary.

Sources used for the migration design: https://supabase.com/docs/guides/storage/security/access-control and https://supabase.com/docs/guides/storage/buckets/creating-buckets . SQL is prepared, not claimed deployed or verified.

## Remaining limits
No progress-photo slider or uploaded avatar is claimed. The profile uses initials. Height is displayed in the preferred unit, while the existing profile editor still accepts canonical cm. New tracking goals store weight in kg. Goal/check-in validation runs before adapter writes; stronger server validation of shared settings JSON remains backend work. Multi-record saves are still not atomic. There is no lint command configured in package.json. Existing server AI hardening, account deletion and wider operational gates remain open.

## Verification
- All 83 tests in 13 suites passed; TypeScript, Vite production build and landing-page prerender passed. Vite still reports a non-failing large-chunk warning.
- Live synthetic-account checks passed: settings, new goals, goal edits/completion, daily check-ins and theme survive fresh loads/logout/login; existing journal and profile persistence, stale-write protection and fixture cleanup also passed.
- Browser demo checks covered desktop dark dashboard, light mobile dashboard/food log, inline nutrients and mobile profile with kg/lb toggle. Dashboard and food log measured 375px content within a 375px viewport; profile had no horizontal overflow. No browser console errors were captured during these checks. These are targeted checks, not exhaustive coverage of every device or screen.
- Screenshot: screenshots/dashboard-upgrade-dark.png (clearly labeled demo data).
- Private-photo backend probe returned a missing-table error. Upload, camera hardware and two-user storage isolation remain unverified and disabled.

## Deployment
Published to https://calnutrifit.vercel.app on 21 October 2026 (deployment dpl_Fe8tTBxf9vSbXivxLtuQP6wQWtGy). Public HTTP checks confirmed the new index-D6zEe35u.js build at /, /profile and /food with HTTP 200; journal routes retain noindex headers. Private photos remain disabled. Source changes are retained locally and have not been committed or pushed in this upgrade turn.
