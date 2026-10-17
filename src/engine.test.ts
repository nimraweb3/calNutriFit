import { describe, it, expect } from "vitest";
import {
  targets,
  portion,
  workoutCalories,
  streak,
  shiftDay,
  recipeFood,
  total,
  zero,
  type Profile,
} from "./engine";
import { foods } from "./catalog";
const profile: Profile = {
  name: "Test",
  age: 30,
  weight: 70,
  height: 175,
  sex: "male",
  activity: 1.2,
  goal: "maintenance",
  special: false,
};
describe("adult nutrition estimates", () => {
  it("uses Mifflin St Jeor and the activity multiplier", () => {
    expect(targets(profile)?.calories).toBe(1979);
    expect(targets(profile)?.protein).toBe(126);
  });
  it("does not generate targets for special circumstances or invalid ages", () => {
    expect(targets({ ...profile, special: true })).toBeNull();
    expect(targets({ ...profile, age: 17 })).toBeNull();
    expect(targets({ ...profile, weight: NaN })).toBeNull();
  });
  it("never produces negative carbohydrate targets", () =>
    expect(
      targets({ ...profile, weight: 290, goal: "gain", target: 1200 })!.carbs,
    ).toBe(0));
});
describe("portion snapshots", () => {
  const egg = foods.find((f) => f.name === "Egg, boiled")!;
  it("scales two eggs to 100g and 156 kcal", () => {
    const p = portion(egg, 2, "piece");
    expect(p.grams).toBe(100);
    expect(p.nutrition.calories).toBe(156);
  });
  it("supports gram scaling without inventing cup conversions", () => {
    expect(portion(egg, 25, "g").nutrition.calories).toBe(39);
    expect(() => portion(egg, 1, "cup")).toThrow();
  });
  it("rejects invalid amounts", () => {
    expect(() => portion(egg, 0, "piece")).toThrow();
    expect(() => portion(egg, Infinity, "piece")).toThrow();
  });
  it("calculates recipe yield with the same engine", () => {
    const f = recipeFood({
      id: "r",
      name: "Eggs",
      yield: 2,
      ingredients: [{ food: egg, quantity: 4, unit: "piece" }],
    });
    expect(f.calories).toBe(156);
    expect(f.grams).toBe(100);
  });
  it("empty totals are valid arithmetic but do not imply a complete day", () =>
    expect(total([])).toEqual(zero));
});
describe("activity and local dates", () => {
  it("computes MET energy using active minutes", () =>
    expect(workoutCalories(3.5, 70, 30)).toBe(129));
  it("rejects zero and nonfinite durations", () => {
    expect(() => workoutCalories(3.5, 70, 0)).toThrow();
    expect(() => workoutCalories(3.5, 70, NaN)).toThrow();
  });
  it("preserves yesterday’s streak on an unfinished current day", () =>
    expect(streak(["2026-10-08", "2026-10-09"], "2026-10-10")).toEqual({
      current: 2,
      best: 2,
    }));
  it("does not count duplicates and excludes future records", () =>
    expect(
      streak(["2026-10-09", "2026-10-09", "2026-10-11"], "2026-10-10"),
    ).toEqual({ current: 1, best: 1 }));
  it("handles leap-year and year boundaries", () => {
    expect(shiftDay("2024-03-01", -1)).toBe("2024-02-29");
    expect(shiftDay("2026-01-01", -1)).toBe("2025-12-31");
  });
});
