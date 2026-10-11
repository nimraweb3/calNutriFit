# CalNutriFit

React 18 + TypeScript + Vite nutrition and fitness journal, connected to the existing Nutrio Pulse Tracker Supabase infrastructure.

Run `npm install`, `npm run dev`, `npm test`, and `npm run build`. Existing public project configuration is saved in ignored `.env.local`; private server keys were not copied. Configure the same public variables on the hosting provider.

## Infrastructure reuse

`src/backend.ts` connects the original food, workout, weight, goals, recipes, supplement history and user settings tables. Queries are user-scoped and existing row-level security remains the authorization boundary. Inserts accept database-generated IDs. CalNutriFit-specific preferences and supplement plans use a namespaced property in existing user settings. Prior supplement history contributes to nutrition totals. New supplement plan completion is not mirrored into the old Nutrio log.

`src/ChefAssistant.tsx` calls the existing chef function using the signed-in user's token. Provider keys remain on the server. Streaming, cancellation and retry are implemented. Only entered ingredients/preferences are sent; the health profile and journal are not attached.

The frontend has its own CalNutriFit logo, colors and protected sign-in experience. Both applications share account-owned records: editing a food or workout here affects the same record in Nutrio.

## Verification and remaining work

The auth settings endpoint returned 200 and reported email and Google enabled. Anonymous reads returned zero rows from seven journal tables; this is not a two-user isolation test. Automated tests cover calculations, parser behavior and legacy schema mappings. Real login, cloud mutations, OAuth redirects, email delivery, AI generation and two-user isolation still need authenticated testing.

No remote migration, function replacement, deployment or paid subscription was performed. The original chef function still needs review for payload validation, rate limiting and error redaction. New CalNutriFit recipes can contain food identifiers that the old Nutrio recipe UI does not understand. Multiple-row saves are not transactional; failed saves reload the server state and are not automatically retried. History is paginated but loads all records; bounded UI loading remains a scaling task.

The complete master specification is not finished: full onboarding, verified nutrition sources, verified animated exercise media, complete differentiated programs/player/timers, water, extended micronutrients, favorites, richer goals, agent consent/audit, and full accessibility/device regression work remain. This build is not production-ready.

Source reused from `nimraweb3/nutrio-pulse-tracker` at `df1441c2ceb4d2eab2cc1dc96cfb6a88da3d8c83`. Imported catalog claims have not been independently verified.
