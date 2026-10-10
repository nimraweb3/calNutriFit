import {it,expect} from 'vitest';
import {parseQuickEntry} from './quick-entry';
import {foods} from './catalog';
it('recognizes explicit countable foods for review',()=>{const p=parseQuickEntry('2 eggs and 1 banana',foods);expect(p.map(x=>x.quantity)).toEqual([2,1]);expect(p.map(x=>x.food?.name)).toEqual(['Egg, boiled','Banana'])});
it('does not guess ambiguous or unsupported foods',()=>{expect(parseQuickEntry('a plate of food',foods)[0].food).toBeNull();expect(parseQuickEntry('2 mystery bites',foods)[0].food).toBeNull()});
