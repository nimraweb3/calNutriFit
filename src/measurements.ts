export type WeightUnit = 'kg' | 'lb';
export const POUNDS_PER_KG = 2.2046226218487757;
export const displayWeight = (kg: number, unit: WeightUnit) => unit === 'lb' ? kg * POUNDS_PER_KG : kg;
export function canonicalWeight(value: number, unit: WeightUnit) {
  const kg = unit === 'lb' ? value / POUNDS_PER_KG : value;
  if (!Number.isFinite(kg) || kg < 30 || kg > 300) throw Error('Enter a weight between 30 and 300 kg (66.14–661.39 lb).');
  return kg;
}
export function weightSummary(rows: {date: string; weight: number}[]) {
  const sorted = [...rows].sort((a,b) => a.date.localeCompare(b.date));
  const first = sorted[0], last = sorted.at(-1);
  const days = first && last ? (Date.parse(last.date) - Date.parse(first.date)) / 86400000 : 0;
  return {first, last, count: sorted.length, change: first && last ? last.weight-first.weight : null,
    weekly: first && last && days >= 7 && sorted.length >= 3 ? (last.weight-first.weight)/days*7 : null};
}
