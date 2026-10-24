import { isDeepStrictEqual } from "node:util";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = fs.readFileSync(".env.local", "utf8");
const get = (n) =>
  env
    .match(new RegExp("^" + n + "=(.*)$", "m"))?.[1]
    .trim()
    .replace(/^["']|["']$/g, "");
const url = get("VITE_SUPABASE_URL"),
  key = get("VITE_SUPABASE_PUBLISHABLE_KEY") || get("VITE_SUPABASE_ANON_KEY");
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const owner = createClient(url, key, options),
  other = createClient(url, key, options);
const fixtures = [
  [
    "food_entries",
    {
      date: "1900-01-03",
      food_item_data: {
        name: "Audit only",
        id: "audit",
        servingSize: 100,
        nutrients: { calories: 100, protein: 1, carbs: 1, fats: 1, fiber: 1 },
      },
      quantity: 100,
      meal_type: "lunch",
    },
    { quantity: 999 },
  ],
  [
    "workout_entries",
    {
      date: "1900-01-03",
      exercise_data: { name: "Audit only" },
      duration: 10,
      calories_burned: 20,
    },
    { duration: 999 },
  ],
  ["weight_logs", { date: "1900-01-03", weight: 70 }, { weight: 999 }],
  [
    "fitness_goals",
    {
      type: "weekly",
      title: "Audit only",
      start_date: "1900-01-03",
      end_date: "1900-01-04",
      target_workouts: 1,
    },
    { title: "Unauthorized change" },
  ],
  [
    "recipes",
    { name: "Audit only", items: [] },
    { name: "Unauthorized change" },
  ],
  [
    "supplement_entries",
    {
      date: "1900-01-03",
      supplement_data: { name: "Audit only" },
      quantity: 1,
      taken_at: "1900-01-03T12:00:00Z",
    },
    { quantity: 999 },
  ],
  [
    "user_settings",
    { settings: { auditOnly: true } },
    { settings: { unauthorized: true } },
  ],
];
const results = [];
let uid;
try {
  const first = await owner.auth.signInWithPassword(
    JSON.parse(fs.readFileSync(".env.audit-test", "utf8")),
  );
  const second = await other.auth.signInWithPassword(
    JSON.parse(fs.readFileSync(".env.demo", "utf8")),
  );
  if (first.error || second.error) throw Error("Dedicated test sign-in failed");
  uid = first.data.user.id;
  for (const [table, payload, change] of fixtures) {
    let id;
    const extraIds = [];
    try {
      const row = { user_id: uid, ...payload };
      const created = await owner.from(table).insert(row).select("id").single();
      if (created.error)
        throw Error("Cannot create isolated fixture: " + created.error.code);
      id = created.data.id;
      const read = await other.from(table).select("id").eq("id", id);
      if (read.error || read.data.length)
        throw Error("Cross-user read not denied");
      for (const op of ["update", "delete"]) {
        const query =
          op === "update"
            ? other.from(table).update(change)
            : other.from(table).delete();
        const attempt = await query.eq("id", id).select("id");
        if (attempt.error && attempt.error.code !== "42501")
          throw Error(op + " returned unexpected failure");
        if (attempt.data?.length)
          throw Error("Cross-user " + op + " succeeded");
      }
      const forged = await other.from(table).insert(row).select("id");
      if (forged.data?.length) extraIds.push(...forged.data.map((r) => r.id));
      if (forged.error?.code !== "42501")
        throw Error("Forged owner insert did not return RLS denial");
      if (table === "weight_logs" || table === "user_settings") {
        const upsert = await other
          .from(table)
          .upsert(
            { ...row, ...change },
            {
              onConflict: table === "weight_logs" ? "user_id,date" : "user_id",
            },
          )
          .select("id");
        if (upsert.error?.code !== "42501")
          throw Error("Cross-user upsert did not return RLS denial");
      }
      const intact = await owner.from(table).select("*").eq("id", id).single();
      if (intact.error) throw Error("Owner record disappeared");
      for (const k of Object.keys(payload))
        if (!isDeepStrictEqual(intact.data[k], payload[k]))
          throw Error("Owner fixture changed");
      results.push({
        table,
        status: "PASS",
        checks:
          "cross-user SELECT/INSERT/UPDATE/DELETE denied; owner record intact",
      });
    } catch (e) {
      results.push({ table, status: "FAIL", reason: e.message });
      process.exitCode = 1;
    } finally {
      for (const rowId of [...extraIds, ...(id ? [id] : [])]) {
        const cleanup = await owner
          .from(table)
          .delete()
          .eq("user_id", uid)
          .eq("id", rowId)
          .select("id");
        if (cleanup.error || cleanup.data?.length !== 1) {
          results.push({
            table,
            status: "FAIL",
            reason: "Fixture cleanup needs review",
          });
          process.exitCode = 1;
        }
      }
    }
  }
} catch (e) {
  results.push({ status: "FAIL", reason: e.message });
  process.exitCode = 1;
} finally {
  await Promise.all([
    owner.auth.signOut({ scope: "local" }),
    other.auth.signOut({ scope: "local" }),
  ]);
  console.log(JSON.stringify(results, null, 2));
}
