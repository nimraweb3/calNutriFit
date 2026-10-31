# Copy, motion and startup improvements — 21 October 2026

Published at https://calnutrifit.vercel.app, deployment dpl_8WJ5rszc23pFH7YejFj8VMXfH2Jb.

## Changes
- Revised landing, onboarding, sign-in, dashboard, food, workouts, calendar, goals, supplements, recipes, profile, analytics and insights copy. Kept nutrition uncertainty and shared-account explanations.
- Lightweight headline movement, card entrances and native smooth anchor scrolling; reduced-motion overrides. No scroll hijacking.
- Optional Three.js orbit around the sample preview. A visible play/pause button loads it on demand. Renderer pauses off-screen/in hidden tabs, caps pixel ratio and frame rate, and disposes GPU resources on cleanup. Reduced-motion/data-saving preferences prevent initialization. Automatic WebGL initially worsened performance and was replaced with explicit user control.
- Public landing no longer eagerly imports the full journal, catalogs or account client. Reuses prerendered HTML through hydration. Account/reset/callback routes and returning sessions still open the journal.
- Removed duplicated startup caused by development StrictMode remounts; simultaneous same-user journal loads share one promise, which is cleared on completion or failure. Separate users never share requests. Writes still fetch fresh data independently. No new persistent cache of private journal data.
- Slow account/journal connections show a retry action after ten seconds; authentication checks remain intact.
- Nonblocking font stylesheet, improved muted-text contrast, and a main landmark.

## Measured results
Lighthouse CLI, default mobile simulation, same public production URL and machine. These are single lab runs, not field Core Web Vitals or a guarantee for every device.

| Metric                   | Before | Final |
| ------------------------ | -----: | ----: |
| Performance              |     69 |    80 |
| Accessibility            |     93 |   100 |
| Best practices           |    100 |   100 |
| SEO                      |    100 |   100 |
| Total blocking time      | 510 ms |  0 ms |
| First contentful paint   |  3.6 s | 3.7 s |
| Largest contentful paint |  3.6 s | 3.7 s |
| Layout shift             |      0 | 0.003 |

Initial entry bundle: roughly 720 KB to 148 KB uncompressed (the new entry is ~49 KB gzip, plus a ~3 KB gzip shared runtime). The journal and Three.js remain substantial deferred chunks; Vite still reports large-chunk warnings. Initial paint did not improve in this run and remains an optimization opportunity.

All 86 tests in 14 suites passed; TypeScript, production build and prerender passed. Added request-sharing, user-separation and failed-request retry tests. Browser checks confirmed demo entry, sign-in form, restored live session, rendering/cleanup of the optional orbit, and no captured console errors. Local screenshot: screenshots/landing-motion.png. Lighthouse reported no production console errors.

Read-only synthetic account check: sign-in ~3.45 s, journal fetch ~2.93 s, simultaneous loads shared. These backend timings are not compared with a measured pre-change baseline. The test account has no completed personalization, so it correctly opens onboarding. No journal records were changed by this check. Existing photo uploads remain disabled pending backend migration.

During deployment a rebuilt output folder lost its Vercel link and created an unintended project named dist. It was deleted through the Vercel API; the final build was explicitly linked and published to the existing calnutrifit project.

References consulted: https://web.dev/articles/optimize-lcp and https://threejs.org/manual/pages/cleanup.html.
