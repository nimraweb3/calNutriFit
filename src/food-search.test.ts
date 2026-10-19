import { describe, it, expect } from 'vitest';
import { searchFoods, normalizeFoodQuery } from './food-search';
import { foods } from './catalog';
describe('Pakistani food search', () => {
  it('normalizes Urdu and common Roman Urdu spellings', () => {
    expect(normalizeFoodQuery('چپاتی')).toBe('roti');
    expect(normalizeFoodQuery('DAAL')).toBe('dal');
    expect(normalizeFoodQuery('chicken biriyani')).toBe('chicken biryani');
  });
  it('finds the same food for chapati and roti', () => {
    expect(searchFoods(foods,'chapati').map(f=>f.id)).toEqual(searchFoods(foods,'roti').map(f=>f.id));
    expect(searchFoods(foods,'roti').length).toBeGreaterThan(0);
  });
  it('matches every query token without depending on word order', () => {
    expect(searchFoods(foods,'biryani chicken').map(f=>f.id)).toEqual(searchFoods(foods,'chicken biryani').map(f=>f.id));
  });
  it('does not invent records for an unknown query', () => {
    expect(searchFoods(foods,'unknownfoodxyz')).toEqual([]);
  });
});
