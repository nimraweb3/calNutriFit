import { describe, it, expect } from 'vitest';
import { foods } from './catalog';
import { portion, recipeFood } from './engine';
describe('invalid nutrition records', () => {
  it.each([0, -1, NaN, Infinity])('rejects invalid reference grams %s', grams => {
    expect(() => portion({ ...foods[0], grams }, 1, 'g')).toThrow('reference');
  });
  it('rejects unsupported or negative conversions', () => {
    expect(() => portion({ ...foods[0], units: { cup: -10 } }, 1, 'cup')).toThrow('conversion');
  });
  it('does not turn missing nutrient data into a plausible total', () => {
    expect(() => portion({ ...foods[0], calories: NaN }, 1, 'g')).toThrow('nutrition');
  });
  it.each([0, -1, NaN, Infinity])('rejects invalid recipe yield %s', servings => {
    expect(() => recipeFood({ id: 'test', name: 'Test', yield: servings, ingredients: [{food:foods[0],quantity:1,unit:'g'}] })).toThrow('serving count');
  });
});
