import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
const mock = vi.hoisted(() => {
  const query: Record<string, any> = {};
  for (const name of ['from', 'delete', 'update', 'eq', 'select']) query[name] = vi.fn(() => query);
  query.single = vi.fn(async () => ({ data: null, error: { message: 'No row changed' } }));
  return query;
});
vi.mock('@supabase/supabase-js', () => ({ createClient: () => mock }));
describe('journal mutation confirmation', () => {
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
  });
  afterEach(() => vi.unstubAllEnvs());
  it.each(['update', 'delete'])('does not report a zero-row %s as saved', async operation => {
    const { saveJournal } = await import('./backend');
    const { emptyStore } = await import('./engine');
    const food = { id:'f', name:'Test', category:'Test', grams:100, unit:'g', source:'Synthetic', calories:100, protein:1, carbs:1, fat:1, fiber:1 };
    const entry = { id:'row', date:'2000-01-01', meal:'Lunch', food, quantity:100, unit:'g', grams:100, nutrition:food };
    const before = { ...emptyStore, entries:[entry] };
    const next = { ...before, entries:operation==='delete'?[]:[{...entry,meal:'Dinner'}] };
    await expect(saveJournal('owner', before, next)).rejects.toThrow('No row changed');
    expect(mock.eq).toHaveBeenCalledWith('user_id', 'owner');
    expect(mock.eq).toHaveBeenCalledWith('id', 'row');
    expect(mock.single).toHaveBeenCalledOnce();
  });
});
