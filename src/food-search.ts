import type { Food } from './engine';
const aliases: Record<string, string> = {
  daal: 'dal', dhal: 'dal', chapati: 'roti', chapatti: 'roti', chappati: 'roti',
  biriyani: 'biryani', biriani: 'biryani', channay: 'chana', chole: 'chana',
  'بریانی': 'biryani', 'روٹی': 'roti', 'چپاتی': 'roti', 'دال': 'dal', 'چنا': 'chana',
  'نہاری': 'nihari', 'حلیم': 'haleem', 'پراٹھا': 'paratha',
};
export function normalizeFoodQuery(value: string) {
  return value.normalize('NFKC').toLowerCase().replace(/[()،,.-]/g, ' ').split(/\s+/).filter(Boolean).map(word => aliases[word] || word).join(' ');
}
export function searchFoods(catalog: Food[], query: string): Food[] {
  const term = normalizeFoodQuery(query);
  if (!term) return catalog;
  const tokens = term.split(' ');
  return catalog.map((food,index) => {
    const name = normalizeFoodQuery(food.name);
    const matches = tokens.every(token => name.includes(token));
    const score = !matches ? 0 : name === term ? 100 : name.startsWith(term) ? 80 : 50;
    return { food, score, index };
  }).filter(item => item.score > 0).sort((a,b) => b.score-a.score || a.index-b.index).map(item => item.food);
}
