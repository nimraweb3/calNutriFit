import {scaleDetails} from './nutrient-data';
import { createClient } from "@supabase/supabase-js";
import {
  emptyStore,
  portion,
  type Entry,
  type Food,
  type Store,
  type Profile,
} from "./engine";
import { foodDatabase } from "./legacy/foodDatabase";
const env = (import.meta as any).env;
export const backendUrl = String(env.VITE_SUPABASE_URL || "").replace(
  /\/$/,
  "",
);
export const publicKey = String(
  env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || "",
);
if (publicKey.startsWith("sb_secret_"))
  throw Error("A private key must never be configured in the frontend.");
if (publicKey.startsWith("eyJ")) {
  try {
    const payload = JSON.parse(atob(publicKey.split(".")[1]));
    if (payload.role !== "anon")
      throw Error("Only anonymous public project keys are allowed.");
  } catch {
    throw Error("Invalid or privileged browser key.");
  }
}
export const cloud =
  backendUrl && publicKey
    ? createClient(backendUrl, publicKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "calnutrifit-auth",
        },
      })
    : null;
type Row = Record<string, any>;
// Keep the exact database values outside the serializable journal/export.
// Each loaded journal owns its snapshot, including when another tab reloads.
const rowSnapshots = new WeakMap<Store, Record<string, Row[]>>();
function guardRow(query: any, row: Row) {
  for (const [column, value] of Object.entries(row)) {
    if (column === "id" || column === "user_id" || column === "created_at" || value === undefined) continue;
    query = value === null ? query.is(column, null)
      : query.eq(column, typeof value === "object" ? JSON.stringify(value) : value);
  }
  return query;
}
function confirmedMutation(result: {error:any;data:any}) {
  if (result.error?.code === "PGRST116" || (!result.error && !result.data))
    throw Error("This record changed or was removed on another device. Reload and review it before saving.");
  return checked(result);
}
function checked<T extends { error: any }>(r: T): T {
  if (r.error) throw Error(r.error.message || "Database operation failed.");
  return r;
}
const activities: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};
export function decodeFood(row: Row): Entry {
  const original = row.food_item_data;
  const { calnutrifit: snapshot, ...sourceData } = original;
  if (snapshot) {
    const quantity = Number(row.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0)
      throw Error("Invalid saved food quantity.");
    const changed = quantity !== snapshot.grams;
    return {
      ...snapshot,
      ...(changed
        ? { quantity, unit: "g", ...portion(snapshot.food, quantity, "g") }
        : {}),
      sourceData,
      id: row.id,
      date: row.date,
      meal: row.meal_type.charAt(0).toUpperCase() + row.meal_type.slice(1),
    };
  }
  const n = original.nutrients;
  if (
    !n ||
    !Number.isFinite(Number(original.servingSize)) ||
    Number(original.servingSize) <= 0
  )
    throw Error(
      "An existing food record has an invalid serving basis. No records were changed.",
    );
  const food: Food = {
    id: original.id,
    name: original.name,
    category: original.category,
    grams: Number(original.servingSize),
    unit: "serving",
    calories: Number(n.calories),
    protein: Number(n.protein),
    carbs: Number(n.carbs),
    fat: Number(n.fats),
    fiber: Number(n.fiber),
    source:
      original.source ||
      "Nutrio catalog · provenance not independently verified",
  };
  const q = Number(row.quantity),
    ratio = q / food.grams;
  return {
    id: row.id,
    date: row.date,
    meal: row.meal_type.charAt(0).toUpperCase() + row.meal_type.slice(1),
    food,
    quantity: q,
    unit: original.servingUnit === "ml" ? "ml" : "g",
    grams: q,
    sourceData,
    nutrition: {
      calories: food.calories * ratio,
      protein: food.protein * ratio,
      carbs: food.carbs * ratio,
      fat: food.fat * ratio,
      fiber: food.fiber * ratio,
    },
  };
}
export function encodeFood(entry: Entry, userId: string) {
  const f = entry.food;
  const { sourceData, ...snapshot } = entry;
  return {
    user_id: userId,
    date: entry.date,
    meal_type: entry.meal.toLowerCase(),
    quantity: entry.grams,
    food_item_data: {
      ...sourceData,
      id: f.id,
      name: f.name,
      category: f.category,
      servingSize: f.grams,
      servingUnit: sourceData?.servingUnit || "g",
      source: f.source,
      nutrients: {
        ...((sourceData?.nutrients as Row) || {}),
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fats: f.fat,
        fiber: f.fiber,
      },
      calnutrifit: snapshot,
    },
  };
}
export function decodeProfile(settings: Row): Profile | null {
  if (settings.calnutrifit?.profile) return settings.calnutrifit.profile;
  if (!settings.age || !settings.weight || !settings.height) return null;
  return {
    name: settings.name || "Your profile",
    age: settings.age,
    weight: settings.weight,
    height: settings.height,
    sex: settings.gender,
    activity: activities[settings.activityLevel] || 1.2,
    goal:
      settings.goalType === "fat_loss"
        ? "loss"
        : settings.goalType === "muscle_gain"
          ? "gain"
          : "maintenance",
    special: false,
  };
}
async function allRows(table: string, userId: string) {
  const rows: Row[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = checked(
      await cloud!
        .from(table)
        .select("*")
        .eq("user_id", userId)
        .order("id")
        .range(offset, offset + 499),
    );
    rows.push(...(result.data || []));
    if ((result.data?.length || 0) < 500) break;
  }
  return rows;
}
export async function loadJournal(userId: string): Promise<Store> {
  const [
    settings,
    entries,
    workouts,
    weights,
    goals,
    legacyRecipes,
    supplementRows,
  ] = await Promise.all([
    cloud!
      .from("user_settings")
      .select("settings")
      .eq("user_id", userId)
      .maybeSingle()
      .then(checked),
    allRows("food_entries", userId),
    allRows("workout_entries", userId),
    allRows("weight_logs", userId),
    allRows("fitness_goals", userId),
    allRows("recipes", userId),
    allRows("supplement_entries", userId),
  ]);
  const prefs = settings.data?.settings || {},
    extra = prefs.calnutrifit || {};
  const supplementHistory = supplementRows.map((r) => {
    const p = r.supplement_data,
      n = p.nutrients || {},
      q = Number(r.quantity);
    return {
      id: r.id,
      date: r.date,
      name: p.name,
      quantity: q,
      unit: p.servingUnit || "serving",
      takenAt: r.taken_at,
      productId:p.calnutrifitProductId,
      nutrition: {
        calories: Number(n.calories || 0) * q,
        protein: Number(n.protein || 0) * q,
        carbs: Number(n.carbs || 0) * q,
        fat: Number(n.fats || 0) * q,
        fiber: Number(n.fiber || 0) * q,
        ...(p.calnutrifitDetails?{details:scaleDetails(p.calnutrifitDetails,q)}:{}),
      },
    };
  });
  const convertedRecipes = legacyRecipes.map((r) => ({
    id: r.id,
    name: r.name,
    ...(r.items?.[0]?.calnutrifitRecipe || {}),
    yield: r.items?.[0]?.calnutrifitYield || 1,
    ingredients: (r.items || []).map((i: Row) => {
      if (i.food) return { food: i.food, quantity: i.quantity, unit: i.unit };
      const legacy = foodDatabase.find((f) => f.id === i.foodId);
      if (!legacy)
        throw Error(
          "An existing recipe references a missing food. Resolve it in Nutrio before editing recipes.",
        );
      return {
        food: decodeFood({
          id: "ingredient",
          date: "",
          meal_type: "snacks",
          quantity: i.quantity,
          food_item_data: legacy,
        }).food,
        quantity: Number(i.quantity),
        unit: "g",
      };
    }),
  }));
  const journal: Store = {
    ...emptyStore,
    preferences: extra.preferences,
    shopping: extra.shopping || [],
    supplementProducts: extra.supplementProducts,
    healthNotes:extra.healthNotes,bodyMeasurements:extra.bodyMeasurements,
    supplementHistory,
    profile: decodeProfile(prefs),
    entries: entries.map(decodeFood),
    workouts: workouts.map((r) => ({
      id: r.id,
      date: r.date,
      name: r.exercise_data.name || "Recorded workout",
      minutes: Number(r.duration),
      calories: Number(r.calories_burned),
      identity: r.exercise_data.calnutrifitIdentity,
      sets: r.exercise_data.sets,
      reps: r.exercise_data.reps,
      weightKg: r.exercise_data.weightKg,
      description:r.exercise_data.description,met:r.exercise_data.met,bodyWeightKg:r.exercise_data.bodyWeightKg,calorieMethod:r.exercise_data.calorieMethod,
    })),
    weights: weights.map((r) => ({
      id: r.id,
      date: r.date,
      weight: Number(r.weight),
    })),
    goals: goals.map((r) => ({
      id: r.id,
      title: r.title,
      start: r.start_date,
      end: r.end_date,
      workouts: Number(r.target_workouts) || 0,
      status: r.status,
    })),
    recipes: [...convertedRecipes, ...(extra.recipes || [])],
    supplements: extra.supplements || [],
    completed: extra.completed || {},
    level: extra.level || "Beginner",
  };
  rowSnapshots.set(journal, {
    food_entries: entries, workout_entries: workouts, weight_logs: weights,
    fitness_goals: goals, recipes: legacyRecipes, supplement_entries: supplementRows,
  });
  return journal;
}
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
async function syncRows<T extends { id: string }>(
  table: string,
  before: T[],
  after: T[],
  userId: string,
  encode: (v: T) => Row,
  snapshots?: Row[],
) {
  for (const row of before.filter((r) => !after.some((a) => a.id === r.id)))
    confirmedMutation(
      await guardRow(cloud!.from(table).delete().eq("user_id", userId).eq("id", row.id),
        snapshots?.find(r => r.id === row.id) || encode(row)).select("id").single(),
    );
  for (const row of after) {
    const old = before.find((b) => b.id === row.id);
    if (old && same(old, row)) continue;
    if (old) {
      confirmedMutation(
        await guardRow(cloud!
          .from(table)
          .update(encode(row))
          .eq("user_id", userId)
          .eq("id", row.id), snapshots?.find(r => r.id === row.id) || encode(old))
          .select("id").single(),
      );
    } else {
      checked(
        await cloud!.from(table).insert(encode(row)).select("id").single(),
      );
    }
  }
}
export async function saveJournal(userId: string, before: Store, next: Store) {
  const snapshots = rowSnapshots.get(before);
  // Validate all weights before any network mutation.
  for (const w of next.weights)
    if (!Number.isFinite(w.weight) || w.weight < 30 || w.weight > 300)
      throw Error("Enter a weight between 30 and 300 kg.");
  // Changes are scoped to individual records; no whole-journal replacement.
  await syncRows("food_entries", before.entries, next.entries, userId, (e) =>
    encodeFood(e, userId),
    snapshots?.food_entries,
  );
  await syncRows(
    "supplement_entries",
    before.supplementHistory,
    next.supplementHistory,
    userId,
    (r) => ({
      user_id: userId,
      date: r.date,
      quantity: r.quantity,
      taken_at: r.takenAt,
      supplement_data: {
        name: r.name,
        servingUnit: r.unit,
        calnutrifitProductId:r.productId,
        calnutrifitDetails: scaleDetails(r.nutrition.details,1/r.quantity),
        nutrients: {
          calories: r.nutrition.calories / r.quantity,
          protein: r.nutrition.protein / r.quantity,
          carbs: r.nutrition.carbs / r.quantity,
          fats: r.nutrition.fat / r.quantity,
          fiber: r.nutrition.fiber / r.quantity,
        },
      },
    }), snapshots?.supplement_entries,
  );
  await syncRows(
    "workout_entries",
    before.workouts,
    next.workouts,
    userId,
    (w) => ({
      user_id: userId,
      date: w.date,
      exercise_data: {
        name: w.name,
        calnutrifitIdentity: w.identity,
        sets: w.sets,
        reps: w.reps,
        weightKg: w.weightKg,
        description:w.description,met:w.met,bodyWeightKg:w.bodyWeightKg,calorieMethod:w.calorieMethod,
      },
      duration: w.minutes,
      calories_burned: w.calories,
    }), snapshots?.workout_entries,
  );
  for (const w of before.weights.filter(w => !next.weights.some(n => n.date === w.date))) {
    confirmedMutation(await cloud!.from("weight_logs").delete().eq("user_id", userId).eq("id", w.id).eq("date",w.date).eq("weight",w.weight).select("id").single());
  }
  for (const w of next.weights) {
    if (!Number.isFinite(w.weight) || w.weight < 30 || w.weight > 300)
      throw Error("Enter a weight between 30 and 300 kg.");
    if (
      same(
        w,
        before.weights.find((b) => b.date === w.date),
      )
    )
      continue;
    const oldWeight = before.weights.find(b => b.date === w.date);
    if (oldWeight) {
      confirmedMutation(await cloud!.from("weight_logs").update({weight:w.weight})
        .eq("user_id",userId).eq("id",oldWeight.id).eq("date",oldWeight.date)
        .eq("weight",oldWeight.weight).select("id").single());
    } else {
      // A competing insert must fail the existing user/date uniqueness constraint.
      // Upsert would silently overwrite a measurement unseen by this tab.
      checked(await cloud!.from("weight_logs")
        .insert({user_id:userId,date:w.date,weight:w.weight}).select("id").single());
    }
  }
  await syncRows("fitness_goals", before.goals, next.goals, userId, (g) => ({
    user_id: userId,
    title: g.title,
    start_date: g.start,
    end_date: g.end,
    target_workouts: g.workouts,
    status: g.status,
    type: "weekly",
  }), snapshots?.fitness_goals);
  await syncRows("recipes", before.recipes, next.recipes, userId, (r) => ({
    user_id: userId,
    name: r.name,
    items: r.ingredients.map((i) => ({
      ...i,
      foodId: i.food.id,
      calnutrifitYield: r.yield,
      calnutrifitRecipe: {
        instructions: r.instructions,
        cookMinutes: r.cookMinutes,
        image: r.image,
        origin: r.origin,
      },
    })),
  }), snapshots?.recipes);
  const keys = [
    "profile",
    "supplements",
    "completed",
    "level",
    "preferences",
    "shopping",
    "supplementProducts",
    "healthNotes",
    "bodyMeasurements",
  ] as const;
  if (keys.some((k) => !same(before[k], next[k]))) {
    const result = checked(
      await cloud!
        .from("user_settings")
        .select("settings,updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
    );
    const old = result.data?.settings || {};
    const extra = { ...old.calnutrifit };
    // Compare the fields being edited with the snapshot the user actually saw.
    // A fresh updated_at alone cannot detect edits made before this SELECT.
    for (const k of keys) {
      if (same(before[k], next[k])) continue;
      const remote = k === "profile" ? decodeProfile(old)
        : extra[k] ?? (k === "preferences" ? undefined : emptyStore[k]);
      if (!same(remote, before[k]) && !same(remote, next[k]))
        throw Error("These settings changed on another device. Reload and review them before saving.");
    }
    for (const k of keys) if (!same(before[k], next[k])) extra[k] = next[k];
    const profile = next.profile;
    const settings = {
      ...old,
      calnutrifit: extra,
      ...(!same(before.profile, next.profile) && profile
        ? {
            age: profile.age,
            weight: profile.weight,
            height: profile.height,
            gender: profile.sex,
            activityLevel: Object.keys(activities).find(
              (k) => activities[k] === profile.activity,
            ),
            goalType:
              profile.goal === "loss"
                ? "fat_loss"
                : profile.goal === "gain"
                  ? "muscle_gain"
                  : "maintenance",
          }
        : {}),
    };
    if (result.data) {
      const updated = checked(
        await cloud!
          .from("user_settings")
          .update({ settings, updated_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("updated_at", result.data.updated_at)
          .select("user_id"),
      );
      if (!updated.data?.length)
        throw Error(
          "Settings changed on another device. Reload and try again.",
        );
    } else
      checked(
        await cloud!
          .from("user_settings")
          .insert({ user_id: userId, settings }),
      );
  }
  return loadJournal(userId);
}
