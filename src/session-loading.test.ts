import {beforeEach, expect, it, vi} from 'vitest';
const db=vi.hoisted(()=>({from:vi.fn()}));
vi.mock('@supabase/supabase-js',()=>({createClient:()=>db}));
beforeEach(()=>{vi.resetModules();db.from.mockReset();db.from.mockImplementation(()=>{
 const query:any={};for(const method of ['select','eq','order'])query[method]=()=>query;
 query.maybeSingle=async()=>({data:{settings:{}},error:null});
 query.range=async()=>({data:[],error:null});return query;
})});
it('shares simultaneous same-user loads but fetches again after they finish',async()=>{
 const {loadJournal}=await import('./backend');
 const first=loadJournal('one'),second=loadJournal('one');
 expect(first).toBe(second);await first;expect(db.from).toHaveBeenCalledTimes(7);
 await loadJournal('one');expect(db.from).toHaveBeenCalledTimes(14);
});
it('does not share journals between different users',async()=>{
 const {loadJournal}=await import('./backend');
 const first=loadJournal('one'),second=loadJournal('two');expect(first).not.toBe(second);
 await Promise.all([first,second]);expect(db.from).toHaveBeenCalledTimes(14);
});
it('clears a failed request so retry can succeed',async()=>{
 db.from.mockImplementationOnce(()=>{throw Error('Offline')});
 const {loadJournal}=await import('./backend');await expect(loadJournal('one')).rejects.toThrow('Offline');
 await expect(loadJournal('one')).resolves.toHaveProperty('entries',[]);
});
