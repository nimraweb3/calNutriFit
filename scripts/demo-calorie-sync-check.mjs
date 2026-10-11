import fs from 'node:fs';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
let backend,userId,before;
const date='1999-01-04',prefix='CalNutriFit sync QA ';
try{
 backend=await server.ssrLoadModule('/src/backend.ts');
 const {dailyBalance}=await server.ssrLoadModule('/src/daily-balance.ts');
 const {foods}=await server.ssrLoadModule('/src/catalog.ts');
 const {supplementCatalog}=await server.ssrLoadModule('/src/expanded-catalog.ts');
 const auth=await backend.cloud.auth.signInWithPassword(JSON.parse(fs.readFileSync('.env.demo','utf8')));
 if(auth.error)throw Error('Demo sign-in failed');userId=auth.data.user.id;
 before=await backend.loadJournal(userId);
 const nutrition={calories:100,protein:10,carbs:10,fat:2,fiber:1};
 const entries=['Breakfast','Lunch','Dinner','Snacks'].map(meal=>({id:crypto.randomUUID(),date,meal,food:{id:crypto.randomUUID(),name:prefix+meal,category:'QA',grams:100,unit:'serving',source:'Synthetic test',...nutrition},quantity:1,unit:'serving',grams:100,nutrition}));
 const supplement={id:crypto.randomUUID(),date,name:prefix+'supplement',quantity:2,unit:'scoop',takenAt:new Date().toISOString(),nutrition:{calories:240,protein:48,carbs:6,fat:2,fiber:0}};
 const workout={id:crypto.randomUUID(),date,name:prefix+'exercise',identity:prefix+'identity',minutes:3,calories:13};
 const saved=await backend.saveJournal(userId,before,{...before,entries:[...before.entries,...entries],supplementHistory:[...before.supplementHistory,supplement],workouts:[...before.workouts,workout]});
 const baseline=dailyBalance(before,date),balance=dailyBalance(saved,date);
 if(balance.nutrients.calories-baseline.nutrients.calories!==640||balance.nutrients.protein-baseline.nutrients.protein!==88||balance.burned-baseline.burned!==13||balance.net-baseline.net!==627)throw Error('Synced totals mismatch');
 for(const meal of ['Breakfast','Lunch','Dinner','Snacks'])if(!saved.entries.some(e=>e.date===date&&e.meal===meal&&e.food.name===prefix+meal))throw Error('Meal round trip failed');
 console.log(JSON.stringify({cloud:'All four meals, supplement quantity/macros and exercise calories persisted correctly',intakeAdded:640,burnAdded:13,netAdded:627,foodChoices:foods.length,pakistaniChoices:foods.filter(f=>f.category==='Pakistani Cuisine').length,supplementChoices:supplementCatalog.length}));
}catch(e){console.error(e.message);process.exitCode=1}
finally{
 if(userId&&before){const current=await backend.loadJournal(userId);await backend.saveJournal(userId,current,{...current,entries:current.entries.filter(e=>!(e.date===date&&e.food.name.startsWith(prefix))),supplementHistory:current.supplementHistory.filter(e=>!(e.date===date&&e.name.startsWith(prefix))),workouts:current.workouts.filter(e=>!(e.date===date&&e.name.startsWith(prefix)))});console.log('Synthetic QA records removed');}
 if(backend?.cloud)await backend.cloud.auth.signOut();await server.close();
}
