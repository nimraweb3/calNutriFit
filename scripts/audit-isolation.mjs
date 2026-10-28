import fs from "node:fs";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const config = fs.readFileSync(".env.local", "utf8");
const get = (name) =>
  config
    .match(new RegExp("^" + name + "=(.*)$", "m"))?.[1]
    .trim()
    .replace(/^["']|["']$/g, "");
const url = get("VITE_SUPABASE_URL"),
  key = get("VITE_SUPABASE_PUBLISHABLE_KEY") || get("VITE_SUPABASE_ANON_KEY");
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const a = createClient(url, key, options),
  b = createClient(url, key, options);
const result = [],
  accountFile = ".env.audit-test";
let rowId, owner;
const check = (condition, label) => {
  if (!condition) throw Error(label);
  result.push(label);
};
try {
  const signed = await a.auth.signInWithPassword(
    JSON.parse(fs.readFileSync(".env.demo", "utf8")),
  );
  if (signed.error) throw Error("Dedicated demo sign-in failed");
  owner = signed.data.user.id;
  let second;
  if (fs.existsSync(accountFile)) {
    second = await b.auth.signInWithPassword(
      JSON.parse(fs.readFileSync(accountFile, "utf8")),
    );
  } else {
    const credentials = {
      email: "calnutrifit.audit." + crypto.randomUUID() + "@example.com",
      password: crypto.randomBytes(30).toString("base64url"),
    };
    fs.writeFileSync(accountFile, JSON.stringify(credentials));
    second = await b.auth.signUp(credentials);
  }
  if (second.error || !second.data.session)
    throw Error(
      "Second dedicated account unavailable; check provider configuration",
    );
  const inserted = await a
    .from("food_entries")
    .insert({
      user_id: owner,
      date: "2000-01-03",
      meal_type: "lunch",
      quantity: 100,
      food_item_data: {
        id: "audit-isolation",
        name: "Disposable isolation test",
        servingSize: 100,
        servingUnit: "g",
        nutrients: { calories: 100, protein: 1, carbs: 20, fats: 1, fiber: 0 },
      },
    })
    .select("id")
    .single();
  if (inserted.error) throw Error("Synthetic record creation failed");
  rowId = inserted.data.id;
  const read = await b.from("food_entries").select("id").eq("id", rowId);
  check(!read.error && read.data.length === 0, "Cross-user food SELECT denied");
  const update = await b
    .from("food_entries")
    .update({ quantity: 999 })
    .eq("id", rowId)
    .select("id");
  check(!update.data?.length, "Cross-user food UPDATE denied");
  const del = await b
    .from("food_entries")
    .delete()
    .eq("id", rowId)
    .select("id");
  check(!del.data?.length, "Cross-user food DELETE denied");
  const foreignInsert = await b
    .from("food_entries")
    .insert({
      user_id: owner,
      date: "2000-01-03",
      meal_type: "lunch",
      quantity: 100,
      food_item_data: { id: "audit-forged-owner" },
    })
    .select("id");
  if (foreignInsert.data?.[0]?.id)
    await a.from("food_entries").delete().eq("id", foreignInsert.data[0].id);
  check(Boolean(foreignInsert.error), "Cross-user food INSERT denied");
  const intact = await a
    .from("food_entries")
    .select("quantity")
    .eq("id", rowId)
    .single();
  check(
    !intact.error && intact.data.quantity === 100,
    "Owner record unchanged after isolation checks",
  );
} catch (e) {
  result.push("FAILED: " + e.message);
  process.exitCode = 1;
} finally {
  if (rowId && owner) {
    const cleaned = await a
      .from("food_entries")
      .delete()
      .eq("user_id", owner)
      .eq("id", rowId)
      .select("id");
    if (cleaned.error || cleaned.data?.length !== 1) {
      result.push("FAILED: synthetic record cleanup");
      process.exitCode = 1;
    } else result.push("Disposable owner record removed");
  }
  await Promise.all([
    a.auth.signOut({ scope: "local" }),
    b.auth.signOut({ scope: "local" }),
  ]);
  console.log(JSON.stringify(result, null, 2));
}
