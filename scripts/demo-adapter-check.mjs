import fs from 'node:fs';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
const results=[];let backend,uid;
try{
 backend=await server.ssrLoadModule('/src/backend.ts');
 const auth=await backend.cloud.auth.signInWithPassword(JSON.parse(fs.readFileSync('.env.demo','utf8')));
 if(auth.error||!auth.data.session)throw Error('Demo sign-in failed');uid=auth.data.user.id;
 const before=await backend.loadJournal(uid);
 results.push('Existing schema loaded through app adapter');
 const food={id:'qa-adapter',name:'QA adapter food',category:'QA',grams:50,unit:'piece',calories:80,protein:6,carbs:1,fat:5,fiber:0,source:'Synthetic test'};
 const entry={id:crypto.randomUUID(),date:'2000-01-02',meal:'Breakfast',food,quantity:2,unit:'piece',grams:100,nutrition:{calories:160,protein:12,carbs:2,fat:10,fiber:0}};
 let state=await backend.saveJournal(uid,before,{...before,entries:[...before.entries,entry]});
 const saved=state.entries.find(e=>e.food.id==='qa-adapter');
 if(!saved||saved.id===entry.id||saved.nutrition.calories!==160)throw Error('Food save/ID/snapshot mismatch');
 results.push('Food save returned database ID and correct snapshot');
 const changed={...saved,quantity:1,grams:50,nutrition:{calories:80,protein:6,carbs:1,fat:5,fiber:0}};
 state=await backend.saveJournal(uid,state,{...state,entries:state.entries.map(e=>e.id===saved.id?changed:e)});
 if(state.entries.find(e=>e.id===saved.id)?.nutrition.calories!==80)throw Error('Food edit mismatch');
 results.push('Food edit persisted and reloaded correctly');
 state=await backend.saveJournal(uid,state,{...state,entries:state.entries.filter(e=>e.id!==saved.id)});
 if(state.entries.some(e=>e.id===saved.id))throw Error('Food delete mismatch');
 results.push('Food delete persisted and reloaded correctly');
 const recipe={id:crypto.randomUUID(),name:'QA adapter recipe',yield:2,ingredients:[{food,quantity:2,unit:'piece'}]};
 state=await backend.saveJournal(uid,state,{...state,recipes:[...state.recipes,recipe]});
 const savedRecipe=state.recipes.find(r=>r.name===recipe.name);
 if(!savedRecipe||savedRecipe.yield!==2||savedRecipe.ingredients[0].quantity!==2)throw Error('Recipe round-trip mismatch');
 results.push('Recipe ingredients and serving yield round-trip passed');
 await backend.saveJournal(uid,state,{...state,recipes:state.recipes.filter(r=>r.id!==savedRecipe.id)});
 results.push('Synthetic recipe removed');
}catch(e){results.push(`FAILED: ${e.message}`);process.exitCode=1;}
finally{if(backend?.cloud)await backend.cloud.auth.signOut();await server.close();console.log(JSON.stringify(results,null,2));}
