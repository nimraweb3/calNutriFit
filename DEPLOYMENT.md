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
