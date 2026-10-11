import { FoodItem } from './nutrition';

/**
 * Household / piece portion weights.
 *
 * Reference weights come from USDA FoodData Central "Foundation Foods" and
 * "SR Legacy" household measures, plus the Pakistan Food Composition Table
 * (PARC/FAO) for local items. Values are edible-portion averages in grams.
 */
interface PieceRule {
  match: RegExp;
  grams: number;
  label: string;
}

const PIECE_RULES: PieceRule[] = [
  // Eggs
  { match: /omelette|omelet/i, grams: 110, label: 'omelette' },
  { match: /\begg/i, grams: 50, label: 'egg' },
  // Fruit (USDA medium sizes)
  { match: /banana/i, grams: 118, label: 'banana' },
  { match: /apple/i, grams: 182, label: 'apple' },
  { match: /orange/i, grams: 131, label: 'orange' },
  { match: /mango/i, grams: 200, label: 'mango' },
  { match: /guava/i, grams: 55, label: 'guava' },
  { match: /peach|plum|kiwi/i, grams: 75, label: 'piece' },
  { match: /date/i, grams: 24, label: 'date' },
  { match: /grapes?$/i, grams: 5, label: 'grape' },
  // Breads & flatbreads
  { match: /bread|toast|slice/i, grams: 28, label: 'slice' },
  { match: /chapati|roti/i, grams: 40, label: 'roti' },
  { match: /naan/i, grams: 90, label: 'naan' },
  { match: /paratha/i, grams: 80, label: 'paratha' },
  { match: /puri|bun|rusk/i, grams: 35, label: 'piece' },
  // Pakistani snacks & sweets
  { match: /samosa/i, grams: 80, label: 'samosa' },
  { match: /pakora/i, grams: 25, label: 'pakora' },
  { match: /kebab|kabab/i, grams: 60, label: 'kebab' },
  { match: /gulab jamun/i, grams: 45, label: 'piece' },
  { match: /barfi|burfi|ladoo|laddu|jalebi/i, grams: 30, label: 'piece' },
  { match: /chilla|cheela|chilaa/i, grams: 70, label: 'chilla' },
  { match: /momo/i, grams: 25, label: 'momo' },
  { match: /nugget/i, grams: 17, label: 'nugget' },
  { match: /wing/i, grams: 40, label: 'wing' },
  { match: /biscuit|cookie/i, grams: 12, label: 'biscuit' },
  { match: /chapli|shami|tikki|cutlet/i, grams: 70, label: 'piece' },
];

const LIQUID_HINTS = /milk|chai|tea|coffee|juice|lassi|water|shake|soup|smoothie|drink|cola|soda/i;

export function pieceInfoFor(food: Pick<FoodItem, 'name' | 'servingUnit'>): { grams: number; label: string } | null {
  if (!/^(g|gram|grams)$/i.test(food.servingUnit)) return null;
  const rule = PIECE_RULES.find(r => r.match.test(food.name));
  return rule ? { grams: rule.grams, label: rule.label } : null;
}

/** Attach piece metadata to every food that is naturally counted in pieces. */
export function withPortionUnits(foods: FoodItem[]): FoodItem[] {
  for (const food of foods) {
    if (food.pieceWeight) continue;
    const info = pieceInfoFor(food);
    if (info) {
      food.pieceWeight = info.grams;
      food.pieceLabel = info.label;
    }
  }
  return foods;
}

export interface UnitOption {
  id: string;
  /** How many "base units" (the unit of food.servingSize) one of this unit equals. */
  factor: number;
  label: string;
  /** Sensible default count when this unit is picked. */
  defaultCount: number;
}

/**
 * Units a food can be logged in. `factor` converts the entered count into the
 * quantity that is stored on the entry (always in the food's base unit).
 */
export function getUnitOptions(food: FoodItem): UnitOption[] {
  const base = (food.servingUnit || 'g').toLowerCase();
  const options: UnitOption[] = [];

  if (base === 'g' || base === 'ml') {
    const isLiquid = base === 'ml' || LIQUID_HINTS.test(food.name);
    if (food.pieceWeight) {
      options.push({
        id: 'piece',
        factor: food.pieceWeight,
        label: food.pieceLabel && food.pieceLabel !== 'piece' ? `${food.pieceLabel}(s)` : 'pieces',
        defaultCount: 1,
      });
    }
    options.push({ id: base, factor: 1, label: base, defaultCount: 100 });
    if (isLiquid) {
      options.push({ id: 'cup', factor: 240, label: 'cup (240 ml)', defaultCount: 1 });
      options.push({ id: 'glass', factor: 250, label: 'glass (250 ml)', defaultCount: 1 });
    } else {
      options.push({ id: 'cup', factor: 150, label: 'cup (~150 g)', defaultCount: 1 });
      options.push({ id: 'tbsp', factor: 15, label: 'tbsp', defaultCount: 1 });
    }
    options.push({ id: 'serving', factor: food.servingSize, label: `serving (${food.servingSize} ${base})`, defaultCount: 1 });
  } else {
    // Foods already measured in pieces / tablets / slices etc.
    options.push({ id: 'unit', factor: 1, label: base, defaultCount: 1 });
    if (food.servingSize > 1) {
      options.push({ id: 'serving', factor: food.servingSize, label: `serving (${food.servingSize} ${base})`, defaultCount: 1 });
    }
  }
  return options;
}

/** Human-readable portion label for a stored quantity. */
export function describeQuantity(food: FoodItem, quantity: number): string {
  const base = (food.servingUnit || 'g').toLowerCase();
  if (base !== 'g' && base !== 'ml') {
    return `${round(quantity)} ${base}`;
  }
  if (food.pieceWeight) {
    const pieces = quantity / food.pieceWeight;
    const rounded = Math.round(pieces * 4) / 4;
    if (Math.abs(pieces - rounded) < 0.05 && rounded > 0) {
      const noun = food.pieceLabel && food.pieceLabel !== 'piece' ? food.pieceLabel : 'pc';
      return `${round(rounded)} ${noun}${rounded === 1 ? '' : 's'} · ${round(quantity)}${base}`;
    }
  }
  return `${round(quantity)}${base}`;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
