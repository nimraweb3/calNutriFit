import { NutrientValues } from './nutrition';

export interface Supplement {
  id: string;
  name: string;
  category: string;
  servingSize: number;
  servingUnit: string;
  nutrients: NutrientValues;
  description: string;
}

export const supplementDatabase: Supplement[] = [
  // === Pakistani Supplements ===
  { id: 'sup1', name: 'Surbex Z (B-Complex + Zinc)', category: 'Multivitamin', servingSize: 1, servingUnit: 'tablet', description: 'Popular B-complex with zinc supplement in Pakistan',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 0, vitaminC: 60, vitaminD: 0, vitaminE: 15, vitaminK: 0, vitaminB6: 2, vitaminB12: 6, calcium: 0, iron: 0, magnesium: 0, zinc: 22.5, potassium: 0, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },
  { id: 'sup2', name: 'Surbex T (B-Complex + Iron)', category: 'Multivitamin', servingSize: 1, servingUnit: 'tablet', description: 'B-complex with iron for energy and blood health',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 0, vitaminC: 60, vitaminD: 0, vitaminE: 15, vitaminK: 0, vitaminB6: 2, vitaminB12: 6, calcium: 0, iron: 27, magnesium: 0, zinc: 0, potassium: 0, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },

  // === Essential Vitamins ===
  { id: 'sup3', name: 'Vitamin D3 (1000 IU)', category: 'Vitamin', servingSize: 1, servingUnit: 'tablet', description: 'Essential for bone health and immunity',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 0, vitaminC: 0, vitaminD: 25, vitaminE: 0, vitaminK: 0, vitaminB6: 0, vitaminB12: 0, calcium: 0, iron: 0, magnesium: 0, zinc: 0, potassium: 0, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },
  { id: 'sup4', name: 'Vitamin D3 (2000 IU)', category: 'Vitamin', servingSize: 1, servingUnit: 'tablet', description: 'Higher dose vitamin D for deficiency',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 0, vitaminC: 0, vitaminD: 50, vitaminE: 0, vitaminK: 0, vitaminB6: 0, vitaminB12: 0, calcium: 0, iron: 0, magnesium: 0, zinc: 0, potassium: 0, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },
  { id: 'sup5', name: 'Vitamin C (500mg)', category: 'Vitamin', servingSize: 1, servingUnit: 'tablet', description: 'Immunity booster and antioxidant',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 0, vitaminC: 500, vitaminD: 0, vitaminE: 0, vitaminK: 0, vitaminB6: 0, vitaminB12: 0, calcium: 0, iron: 0, magnesium: 0, zinc: 0, potassium: 0, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },
  { id: 'sup6', name: 'Vitamin C (1000mg)', category: 'Vitamin', servingSize: 1, servingUnit: 'tablet', description: 'High-dose vitamin C',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 0, vitaminC: 1000, vitaminD: 0, vitaminE: 0, vitaminK: 0, vitaminB6: 0, vitaminB12: 0, calcium: 0, iron: 0, magnesium: 0, zinc: 0, potassium: 0, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },
  { id: 'sup7', name: 'Vitamin E (400 IU)', category: 'Vitamin', servingSize: 1, servingUnit: 'capsule', description: 'Antioxidant for skin and cell health',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 268, vitaminK: 0, vitaminB6: 0, vitaminB12: 0, calcium: 0, iron: 0, magnesium: 0, zinc: 0, potassium: 0, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },
  { id: 'sup8', name: 'Vitamin B12 (1000mcg)', category: 'Vitamin', servingSize: 1, servingUnit: 'tablet', description: 'Essential for nerve function and energy',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0, vitaminB6: 0, vitaminB12: 1000, calcium: 0, iron: 0, magnesium: 0, zinc: 0, potassium: 0, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },

  // === Minerals ===
  { id: 'sup9', name: 'Zinc (50mg)', category: 'Mineral', servingSize: 1, servingUnit: 'tablet', description: 'Supports immunity and testosterone',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0, vitaminB6: 0, vitaminB12: 0, calcium: 0, iron: 0, magnesium: 0, zinc: 50, potassium: 0, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },
  { id: 'sup10', name: 'Magnesium (400mg)', category: 'Mineral', servingSize: 1, servingUnit: 'tablet', description: 'Supports muscle, nerve function & sleep',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0, vitaminB6: 0, vitaminB12: 0, calcium: 0, iron: 0, magnesium: 400, zinc: 0, potassium: 0, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },
  { id: 'sup11', name: 'Calcium (600mg) + Vitamin D', category: 'Mineral', servingSize: 1, servingUnit: 'tablet', description: 'Bone health with vitamin D for absorption',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 0, vitaminC: 0, vitaminD: 10, vitaminE: 0, vitaminK: 0, vitaminB6: 0, vitaminB12: 0, calcium: 600, iron: 0, magnesium: 0, zinc: 0, potassium: 0, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },
  { id: 'sup12', name: 'Iron (65mg)', category: 'Mineral', servingSize: 1, servingUnit: 'tablet', description: 'For iron deficiency and anemia prevention',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0, vitaminB6: 0, vitaminB12: 0, calcium: 0, iron: 65, magnesium: 0, zinc: 0, potassium: 0, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },
  { id: 'sup13', name: 'Potassium (99mg)', category: 'Mineral', servingSize: 1, servingUnit: 'tablet', description: 'Heart health and muscle function',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0, vitaminB6: 0, vitaminB12: 0, calcium: 0, iron: 0, magnesium: 0, zinc: 0, potassium: 99, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },

  // === Fish Oil / Omega ===
  { id: 'sup14', name: 'Fish Oil / Omega-3 (1000mg)', category: 'Omega', servingSize: 1, servingUnit: 'softgel', description: 'Heart & brain health, anti-inflammatory',
    nutrients: { calories: 10, protein: 0, carbs: 0, fats: 1, fiber: 0, sugar: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 1, vitaminK: 0, vitaminB6: 0, vitaminB12: 0, calcium: 0, iron: 0, magnesium: 0, zinc: 0, potassium: 0, sodium: 0, cholesterol: 5, omega3: 0.3, omega6: 0 } },

  // === Protein & Fitness ===
  { id: 'sup15', name: 'Whey Protein (1 Scoop)', category: 'Protein', servingSize: 30, servingUnit: 'g', description: 'Muscle building and recovery',
    nutrients: { calories: 120, protein: 24, carbs: 3, fats: 1.5, fiber: 0, sugar: 1, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0, vitaminB6: 0, vitaminB12: 0, calcium: 100, iron: 0, magnesium: 0, zinc: 0, potassium: 150, sodium: 50, cholesterol: 30, omega3: 0, omega6: 0 } },
  { id: 'sup16', name: 'Creatine Monohydrate (5g)', category: 'Fitness', servingSize: 5, servingUnit: 'g', description: 'Strength & muscle performance',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0, vitaminB6: 0, vitaminB12: 0, calcium: 0, iron: 0, magnesium: 0, zinc: 0, potassium: 0, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },

  // === Multivitamins ===
  { id: 'sup17', name: 'Multivitamin (General)', category: 'Multivitamin', servingSize: 1, servingUnit: 'tablet', description: 'Complete daily multivitamin',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 900, vitaminC: 90, vitaminD: 15, vitaminE: 15, vitaminK: 120, vitaminB6: 1.7, vitaminB12: 2.4, calcium: 200, iron: 8, magnesium: 100, zinc: 11, potassium: 80, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },
  { id: 'sup18', name: 'Centrum (Adult)', category: 'Multivitamin', servingSize: 1, servingUnit: 'tablet', description: 'Popular complete multivitamin',
    nutrients: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, vitaminA: 750, vitaminC: 60, vitaminD: 15, vitaminE: 13.5, vitaminK: 25, vitaminB6: 2, vitaminB12: 6, calcium: 200, iron: 4, magnesium: 50, zinc: 5, potassium: 80, sodium: 0, cholesterol: 0, omega3: 0, omega6: 0 } },
];

export function searchSupplements(query: string): Supplement[] {
  const q = query.toLowerCase().trim();
  if (!q) return supplementDatabase;
  return supplementDatabase.filter(s =>
    s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
  );
}
