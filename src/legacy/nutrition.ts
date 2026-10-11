export interface UserProfile {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goalType: 'fat_loss' | 'maintenance' | 'muscle_gain';
}

export interface NutrientValues {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugar: number;
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  vitaminE: number;
  vitaminK: number;
  vitaminB6: number;
  vitaminB12: number;
  calcium: number;
  iron: number;
  magnesium: number;
  zinc: number;
  potassium: number;
  sodium: number;
  cholesterol: number;
  omega3: number;
  omega6: number;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  servingSize: number; // in servingUnit
  servingUnit: string; // 'g' | 'ml' | 'pieces' | ...
  nutrients: NutrientValues;
  /** Average weight of one piece in grams, for foods counted in pieces. */
  pieceWeight?: number;
  /** Noun used for one piece, e.g. 'egg', 'roti', 'slice'. */
  pieceLabel?: string;
  /** Where the nutrition values come from. */
  source?: string;
}


export interface FoodEntry {
  id: string;
  foodItem: FoodItem;
  quantity: number; // in grams
  mealType: MealType;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface DayLog {
  date: string; // YYYY-MM-DD
  entries: FoodEntry[];
  weight?: number;
}

export interface Recommendation {
  type: 'low' | 'high' | 'good';
  nutrient: string;
  message: string;
  icon: string;
}
