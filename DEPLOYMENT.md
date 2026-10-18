# CalNutriFit deployment

Deploy the Vite frontend on Vercel and retain the existing Nutrio Pulse Tracker Supabase project. No replacement database or tracker_state migration is needed.

## Current deployment

Live site: https://calnutrifit.vercel.app/ . Deployed on 2026-10-12 using Vercel Drop to Deploy with the compiled dist archive. This deployment is not connected to GitHub auto-deploys: the existing Vercel GitHub installation does not currently have access to calNutriFit. Local source changes remain in this workspace. To update the direct deployment, rebuild and upload the new output; to enable Git builds, grant the Vercel installation access to this repository and connect it in project settings.

## Vercel

Import nimraweb3/calNutriFit. Framework: Vite. Build: `npm run build`. Output: `dist`. Use Node 22. `vercel.json` handles client-side routes and response headers.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`) from the existing ignored `.env.local`. These are browser-public credentials protected by Supabase row-level security. Never add service-role keys, database passwords, AI keys, `.env.demo`, or administrator tokens to frontend variables or Git. Redeploy after changing build variables.

## Authentication setup requiring Supabase administrator access

Preserve Nutrio's existing settings and redirect URLs. Add these CalNutriFit URLs to the Auth redirect allowlist, substituting the actual Vercel production origin:

- `http://127.0.0.1:5173/auth/callback`
- `http://127.0.0.1:5173/reset-password`
- `https://calnutrifit.vercel.app/auth/callback`
- `https://calnutrifit.vercel.app/reset-password`

Do not replace the shared Site URL without reviewing its effect on Nutrio. CalNutriFit supplies explicit redirect URLs.

The provider was observed to have email auto-confirm enabled. Enable Confirm email for genuine email verification; this affects new signups in both apps. In the confirmation email template include `{{ .Token }}` for the app's code-entry screen, and retain the confirmation link using `{{ .ConfirmationURL }}`. Configure production SMTP and test delivery, resend, expired codes, and recovery. Existing auto-confirmed users are not retroactively verified by changing this setting.

Google is enabled in the public provider settings, but a complete OAuth login still needs verification. Its Google Console authorized redirect URI is `https://ydlcbisiardwepgjyawb.supabase.co/auth/v1/callback`. Google client secrets belong in Supabase only. Test consent, callback, returning-user onboarding, and password recovery on the actual deployed origin.

References: [Vercel Vite deployment](https://vercel.com/docs/frameworks/frontend/vite), [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google).

## Verification and limits

Local production build and all 37 tests passed. Live checks verified preferences, shopping lists, recipe metadata, AI recipe generation and recipe saving against the existing backend. Browser checks verified password sign-in, saved onboarding after reload, and analytics filters. Provider email delivery, Google consent and production redirects require separate end-to-end verification.

Recipes store small optional images (up to 150 KB) in existing recipe metadata. The existing chef-chat function and private server-side secrets are reused, not redeployed. Catalog nutrition is approximate; not every Pakistani food or supplement is represented. Saves span multiple tables and are not one database transaction; simultaneous edits from multiple devices can conflict. Review these limits before broad public use.

Production checks: password sign-in succeeded on calnutrifit.vercel.app, existing journal data loaded, and a shopping-list checkbox save persisted after reloading /recipes. This also verified direct-route serving. Source changes are not yet pushed to GitHub.

Administrator-access check: signed in to Supabase using the existing nimraweb3 GitHub session. The account has no visible organizations and the Nutrio project URL redirects to the organization list. Use the project's owning Supabase account (or its managing platform) to complete the remaining auth settings.

## Confirmed Google sign-in blocker (2026-10-12)

The public `/auth/v1/authorize?provider=google` endpoint returns HTTP 400 with `Unsupported provider: missing OAuth secret`, including when the CalNutriFit production callback is supplied. The Google-enabled flag alone does not mean the provider is fully configured.

The project administrator must configure a Google Web OAuth client ID and client secret in Supabase Authentication > Sign In / Providers > Google. Keep the secret server-side. Google must authorize `https://ydlcbisiardwepgjyawb.supabase.co/auth/v1/callback`; Supabase must allow `https://calnutrifit.vercel.app/auth/callback`. Then verify actual Google consent and the returning session. The current GitHub-authenticated Supabase account has no access to this project, so this configuration could not be applied.

## Google sign-in repair (2026-10-13)

The Nutrio project is Lovable Cloud with Google set to Managed by Lovable. The missing-secret response from the direct Supabase OAuth endpoint was caused by calling the wrong flow; it does not mean a new Google client secret needs to be created. With the user's approval, added and saved the exact redirect `https://calnutrifit.vercel.app/auth/callback` in Lovable Cloud > Users > Auth settings > Advanced, retaining the original Site URL and redirects.

AuthPanel now uses the official @lovable.dev/cloud-auth-js SDK and the existing Nutrio broker at `https://nutrio-pulse-tracker.lovable.app/~oauth/initiate`. Google login deliberately returns to the approved production callback, including when initiated in a local preview. Do not use the raw Supabase Google endpoint with this managed configuration. A browser check through the broker successfully returned to authenticated CalNutriFit onboarding. All 37 tests and the production build passed after the integration change.

## Google fix deployed (2026-10-18)

Published the tested compiled build to the existing nim12/calnutrifit project. Deployment dpl_5Ps1FjkaYqAzaPWWjuZGVqnHQCs1 is READY and aliased to https://calnutrifit.vercel.app. Public HTTP verification confirmed index-BRTy0elE.js is served. Reloading production restored the existing signed-in session and displayed onboarding step 1; personal profile answers were left for the user. The managed Google broker callback was verified earlier; a new sign-in button click was not repeated because this browser is already authenticated. No new OAuth secrets were needed.

## Public landing SEO (2026-10-18)

Deployed refreshed landing copy, feature descriptions and FAQs; static public HTML generated from the same Landing component; canonical, Open Graph/Twitter metadata and WebSite/SoftwareApplication JSON-LD; robots.txt and a homepage-only sitemap. Private app paths return X-Robots-Tag: noindex, follow (this is an indexing directive, not access control). TypeScript and Vite compilation passed; prerender output and sitemap validated. Live HTTP checks confirmed indexable homepage content, sitemap/robots delivery and /food noindex headers. Browser verified the deployed landing page. Search Console verification/submission and search rankings are not included or claimed.
