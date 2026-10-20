import { beforeEach, describe, it, expect, vi } from 'vitest';
const mock = vi.hoisted(() => {
  const query: Record<string, any> = {};
  for (const name of ['from', 'delete', 'update', 'insert', 'eq', 'is', 'select']) query[name] = vi.fn(() => query);
  query.single = vi.fn(async () => ({ data: null, error: { message: 'No row changed' } }));
  return query;
});
vi.mock('@supabase/supabase-js', () => ({ createClient: () => mock }));
describe('journal mutation confirmation', () => {
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks();
    // Public test configuration is supplied at transform time by vitest.config.ts.
  });
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
    expect(mock.eq).toHaveBeenCalledWith('meal_type', 'lunch');
    expect(mock.eq).toHaveBeenCalledWith('quantity', 100);
    expect(mock.single).toHaveBeenCalledOnce();
  });
  it.each(['update','delete'])('protects a weight %s with the previously seen value',async operation=>{
    const {saveJournal}=await import('./backend');
    const {emptyStore}=await import('./engine');
    const before={...emptyStore,weights:[{id:'weight-row',date:'2000-01-01',weight:70}]};
    const next={...before,weights:operation==='delete'?[]:[{...before.weights[0],weight:71}]};
    await expect(saveJournal('owner',before,next)).rejects.toThrow('No row changed');
    expect(mock.eq).toHaveBeenCalledWith('weight',70);
    expect(mock.eq).toHaveBeenCalledWith('id','weight-row');
  });
  it('inserts a new measurement without overwriting a concurrent insert',async()=>{
    const {saveJournal}=await import('./backend');
    const {emptyStore}=await import('./engine');
    await expect(saveJournal('owner',emptyStore,{...emptyStore,weights:[{id:'new',date:'2000-01-01',weight:70}]})).rejects.toThrow();
    expect(mock.insert).toHaveBeenCalledWith({user_id:'owner',date:'2000-01-01',weight:70});
    expect(mock.update).not.toHaveBeenCalled();
  });
  it('validates weights before changing other records',async()=>{
    const {saveJournal}=await import('./backend');
    const {emptyStore}=await import('./engine');
    await expect(saveJournal('owner',emptyStore,{...emptyStore,weights:[{id:'bad',date:'2000-01-01',weight:NaN}]})).rejects.toThrow('Enter a weight');
    expect(mock.from).not.toHaveBeenCalled();
  });
  it('explains a database comparison conflict without reporting success',async()=>{
    const {saveJournal}=await import('./backend');
    const {emptyStore}=await import('./engine');
    mock.single.mockResolvedValueOnce({data:null,error:{code:'PGRST116',message:'JSON object requested, multiple (or no) rows returned'}});
    const before={...emptyStore,weights:[{id:'old',date:'2000-01-01',weight:70}]};
    await expect(saveJournal('owner',before,{...before,weights:[]})).rejects.toThrow('changed or was removed on another device');
  });
});
