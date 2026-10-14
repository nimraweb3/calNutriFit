import fs from "node:fs";
const text = fs.readFileSync(".env.local", "utf8");
const url = text.match(/^VITE_SUPABASE_URL=(.*)$/m)?.[1].trim();
const key = text.match(/^VITE_SUPABASE_ANON_KEY=(.*)$/m)?.[1].trim();
if (!url || !key) throw Error("Missing public connection configuration");
const results = [];
for (const table of [
  "food_entries",
  "workout_entries",
  "weight_logs",
  "fitness_goals",
  "user_settings",
  "recipes",
  "supplement_entries",
]) {
  const r = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
    headers: { apikey: key },
  });
  const body = await r.json();

  results.push({
    table,
    status: r.status,
    anonymousRows: Array.isArray(body) ? body.length : null,
  });
}
console.log(JSON.stringify(results, null, 2));
if (results.some((r) => r.anonymousRows > 0)) process.exitCode = 1;
