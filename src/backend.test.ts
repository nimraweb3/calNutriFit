import { describe, it, expect } from "vitest";
import { decodeFood, encodeFood, decodeProfile } from "./backend";
import { foods } from "./catalog";
import { portion } from "./engine";
describe("Nutrio schema compatibility", () => {
  it("maps existing per-reference nutrition without treating the quantity as servings", () => {
    const e = decodeFood({
      id: "db-id",
      date: "2026-10-11",
      meal_type: "lunch",
      quantity: 200,
      food_item_data: {
        id: "legacy",
        name: "Rice",
        category: "Grains",
        servingSize: 100,
        servingUnit: "g",
        nutrients: {
          calories: 130,
          protein: 2.7,
          carbs: 28.2,
          fats: 0.3,
          fiber: 0.4,
        },
      },
    });
    expect(e.nutrition.calories).toBe(260);
    expect(e.grams).toBe(200);
    expect(e.meal).toBe("Lunch");
  });
  it("preserves the original quantity and snapshot while accepting database-generated IDs", () => {
    const food = foods[0],
      entry = {
        id: "temporary",
        date: "2026-10-11",
        meal: "Dinner",
        food,
        quantity: 2,
        unit: food.unit,
        ...portion(food, 2, food.unit),
      };
    const row = encodeFood(entry, "owner");
    expect(row).not.toHaveProperty("id");
    const loaded = decodeFood({ ...row, id: "database-id" });
    expect(loaded.id).toBe("database-id");
    expect(loaded.quantity).toBe(2);
    expect(loaded.nutrition).toEqual(entry.nutrition);
  });
  it("maps existing profile activity and goals", () => {
    expect(
      decodeProfile({
        age: 30,
        height: 170,
        weight: 70,
        gender: "female",
        activityLevel: "moderate",
        goalType: "fat_loss",
      }),
    ).toMatchObject({ activity: 1.55, goal: "loss", sex: "female" });
  });
  it("does not invent a profile for a new account", () =>
    expect(decodeProfile({})).toBeNull());
  it("rejects invalid historical reference amounts without changing data", () =>
    expect(() =>
      decodeFood({ food_item_data: { servingSize: 0, nutrients: {} } }),
    ).toThrow());
  it("honors a quantity edited later in Nutrio instead of showing a stale snapshot", () => {
    const food = foods[0],
      entry = {
        id: "temporary",
        date: "2026-10-11",
        meal: "Dinner",
        food,
        quantity: 2,
        unit: food.unit,
        ...portion(food, 2, food.unit),
      };
    const row = encodeFood(entry, "owner");
    const edited = decodeFood({ ...row, id: "saved", quantity: food.grams });
    expect(edited.quantity).toBe(food.grams);
    expect(edited.nutrition.calories).toBe(food.calories);
  });
  it("keeps existing micronutrients when correcting portions", () => {
    const entry = decodeFood({
      id: "saved",
      date: "2026-10-11",
      meal_type: "lunch",
      quantity: 100,
      food_item_data: {
        id: "legacy",
        name: "Rice",
        category: "Grains",
        servingSize: 100,
        servingUnit: "g",
        nutrients: {
          calories: 130,
          protein: 2.7,
          carbs: 28.2,
          fats: 0.3,
          fiber: 0.4,
          iron: 1.2,
          sodium: 50,
        },
      },
    });
    const saved = encodeFood(
      { ...entry, quantity: 200, ...portion(entry.food, 200, "g") },
      "owner",
    );
    expect(saved.food_item_data.nutrients).toMatchObject({
      iron: 1.2,
      sodium: 50,
    });
    expect(saved.food_item_data.calnutrifit).not.toHaveProperty("sourceData");
  });
});
