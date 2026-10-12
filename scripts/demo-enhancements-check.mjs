import fs from 'node:fs';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
let backend,uid,before;
const prefix='Enhancement QA ';
try{
 backend=await server.ssrLoadModule('/src/backend.ts');
 const {createDemo}=await server.ssrLoadModule('/src/demo-data.ts');
 const {generateRecipes}=await server.ssrLoadModule('/src/recipe-ai.ts');
 const auth=await backend.cloud.auth.signInWithPassword(JSON.parse(fs.readFileSync('.env.demo','utf8')));if(auth.error)throw auth.error;uid=auth.data.user.id;
 before=await backend.loadJournal(uid);
 const recipe={...createDemo().recipes[0],id:crypto.randomUUID(),name:prefix+'recipe',instructions:'Test instructions',cookMinutes:12,origin:'ai'};
 const prefs={...createDemo().preferences,cuisines:'Synthetic QA cuisine'};
 let state=await backend.saveJournal(uid,before,{...before,preferences:prefs,shopping:[...(before.shopping||[]),{id:crypto.randomUUID(),text:prefix+'rice',done:false}],recipes:[...before.recipes,recipe]});
 if(state.preferences?.cuisines!==prefs.cuisines||!state.preferences.completed)throw Error('Preferences did not persist');
 if(!state.shopping.some(s=>s.text===prefix+'rice'))throw Error('Shopping did not persist');
 const saved=state.recipes.find(r=>r.name===recipe.name);if(!saved||saved.instructions!==recipe.instructions||saved.cookMinutes!==12||saved.origin!=='ai')throw Error('Recipe metadata did not persist');
 console.log('PASS: Onboarding preferences, recipe instructions/time/origin and shopping list round-trip');
 const recipes=await generateRecipes('eggs, cooked rice, tomatoes, onions','Regular; no restrictions','Quick (under 20 minutes)',AbortSignal.timeout(60000));
 console.log('PASS: Live structured AI returned '+recipes.length+' validated recipes; nutrition recalculated from catalog');
 state=await backend.loadJournal(uid);
 const aiRecipe={...recipes[0].recipe,name:prefix+'live AI recipe'};
 const savedAi=await backend.saveJournal(uid,state,{...state,recipes:[...state.recipes,aiRecipe]});
 if(!savedAi.recipes.some(r=>r.name===aiRecipe.name&&r.origin==='ai'&&r.ingredients.length))throw Error('Generated recipe did not save');
 console.log('PASS: Generated AI recipe saved and reloaded');
}catch(e){console.error('FAILED: '+e.message);process.exitCode=1}
finally{
 if(uid&&before){const current=await backend.loadJournal(uid);await backend.saveJournal(uid,current,{...current,preferences:before.preferences,shopping:(current.shopping||[]).filter(s=>!s.text.startsWith(prefix)),recipes:current.recipes.filter(r=>!r.name.startsWith(prefix))});console.log('Restored demo preferences and removed synthetic records');}
 if(backend?.cloud)await backend.cloud.auth.signOut({scope:'local'});await server.close();
}
