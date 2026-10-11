# CalNutriFit deployment

Reuse the existing Nutrio Pulse Tracker Supabase project. Do not create a replacement database or run the former tracker_state migration.

The ignored .env.local already holds the original public URL and publishable key. Use the same public variables when building on Cloudflare Pages (build: npm run build; output: dist; Node: 22). Never put service-role keys, database passwords, or AI keys in frontend variables.

Add CalNutriFit's exact local and deployed origins and /reset-password URLs to the existing Supabase Auth redirect allowlist. Preserve the original Nutrio redirects. Project-admin access is required to verify or update those settings. Use your existing account to test real sign-in before publishing.

The existing chef-chat function and server-side secrets are reused. It has not been redeployed or independently hardened. No published deployment has been made. See README.md for verified checks, data compatibility, security limitations and remaining requirements.
