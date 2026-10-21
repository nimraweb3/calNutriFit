import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
let backend,uid,original;
const marker=`upgrade-${Date.now()}`;
const date='1999-01-03';
try{
 backend=await server.ssrLoadModule('/src/backend.ts');
 const credentials=JSON.parse(fs.readFileSync('.env.audit-test','utf8'));
 const login=await backend.cloud.auth.signInWithPassword(credentials);
 if(login.error)throw Error('Synthetic account sign-in failed');
 uid=login.data.user.id;original=await backend.loadJournal(uid);
 if(original.weights.some(w=>w.date===date))throw Error('Fixture date already occupied; no records changed');
 const nutrition={calories:10,protein:1,carbs:1,fat:0,fiber:0,details:{calcium:500,vitaminD:0}};
 const food={...nutrition,id:crypto.randomUUID(),name:marker,category:'Test fixture',grams:100,unit:'g',source:'Synthetic test only'};
 const product={id:crypto.randomUUID(),name:marker,unit:'tablet',nutrition,brand:'Synthetic test brand',frequency:'weekly',weekday:2,started:date,skippedDates:[date]};
 const next={...original,uiTheme:"dark",personalGoals:[...(original.personalGoals||[]),{id:crypto.randomUUID(),name:marker,kind:"water",target:2000,unit:"ml",start:date,completed:false}],dailyCheckIns:[...(original.dailyCheckIns||[]).filter(c=>c.date!==date),{date,water:750,steps:3500}],healthNotes:marker,bodyMeasurements:[...(original.bodyMeasurements||[]),{id:crypto.randomUUID(),date,waist:80.25}],
  supplementProducts:[...(original.supplementProducts||[]),product],
  entries:[...original.entries,{id:crypto.randomUUID(),date,meal:'Lunch',food,quantity:100,unit:'g',grams:100,nutrition}],
  goals:[...original.goals,{id:crypto.randomUUID(),title:marker,start:date,end:date,workouts:1,status:'active'}],
  recipes:[...original.recipes,{id:crypto.randomUUID(),name:marker,yield:1,ingredients:[{food,quantity:100,unit:'g'}]}],
  supplementHistory:[...original.supplementHistory,{id:crypto.randomUUID(),date,name:marker,productId:product.id,quantity:2,unit:'tablet',takenAt:new Date().toISOString(),nutrition:{...nutrition,details:{calcium:1000,vitaminD:0}}}],
  workouts:[...original.workouts,{id:crypto.randomUUID(),date,name:marker,minutes:20,calories:70,description:'Synthetic custom activity',met:3.5,bodyWeightKg:60,calorieMethod:'manual'}],
  weights:[...original.weights,{id:crypto.randomUUID(),date,weight:72.345678}]};
 await backend.saveJournal(uid,original,next);
 await backend.cloud.auth.signOut({scope:'local'});
 const relogin=await backend.cloud.auth.signInWithPassword(credentials);
 if(relogin.error)throw Error('Synthetic reauthentication failed');
 const loaded=await backend.loadJournal(uid);
 assert.equal(loaded.healthNotes,marker);
 assert.equal(loaded.uiTheme,"dark");assert.equal(loaded.personalGoals.find(g=>g.name===marker).target,2000);assert.equal(loaded.dailyCheckIns.find(c=>c.date===date).water,750);
 assert.equal(loaded.bodyMeasurements.find(r=>r.date===date).waist,80.25);
 assert.equal(loaded.supplementProducts.find(p=>p.id===product.id).frequency,'weekly');
 assert.equal(loaded.supplementHistory.find(p=>p.name===marker).productId,product.id);
 assert.deepEqual(loaded.supplementProducts.find(p=>p.id===product.id).nutrition.details,nutrition.details);
 assert.deepEqual(loaded.supplementHistory.find(p=>p.name===marker).nutrition.details,{calcium:1000,vitaminD:0});
 assert.equal(loaded.workouts.find(w=>w.name===marker).description,'Synthetic custom activity');
 assert.equal(loaded.workouts.find(w=>w.name===marker).calorieMethod,'manual');
 assert.equal(loaded.weights.find(w=>w.date===date).weight,72.345678);
 const goalEdited=await backend.saveJournal(uid,loaded,{...loaded,personalGoals:loaded.personalGoals.map(g=>g.name===marker?{...g,target:2500,completed:true}:g)});
 assert.equal(goalEdited.personalGoals.find(g=>g.name===marker).target,2500);assert.equal(goalEdited.personalGoals.find(g=>g.name===marker).completed,true);
 console.log('PASS: goals, check-ins and theme survived reload; goal editing/completion persisted.');
 console.log('PASS: product schedules, dose nutrients/linkage, notes, body measurements, custom workout metadata and weight survived logout/login and fresh database load.');
 // Reject an edit using the pre-save settings snapshot.
 await assert.rejects(()=>backend.saveJournal(uid,original,{...original,supplementProducts:[{...product,name:'stale write'}]}),/another device/);
 console.log('PASS: stale product-settings update rejected.');
 // Two independently loaded journals model two devices editing the same rows.
 for(const [collection,find,edit] of [
  ['entries',r=>r.food.name===marker,r=>({...r,meal:r.meal==='Lunch'?'Dinner':'Snacks'})],
  ['goals',r=>r.title===marker,r=>({...r,workouts:r.workouts+1})],
  ['recipes',r=>r.name===marker,r=>({...r,yield:r.yield+1})],
  ['workouts',r=>r.name===marker,r=>({...r,minutes:r.minutes+1})],
  ['supplementHistory',r=>r.name===marker,r=>({...r,takenAt:new Date(Date.parse(r.takenAt)+1000).toISOString()})],
  ['weights',r=>r.date===date,r=>({...r,weight:r.weight+1})],
 ]){
  const deviceA=await backend.loadJournal(uid),deviceB=await backend.loadJournal(uid);
  const saved=await backend.saveJournal(uid,deviceA,{...deviceA,[collection]:deviceA[collection].map(r=>find(r)?edit(r):r)});
  await assert.rejects(()=>backend.saveJournal(uid,deviceB,{...deviceB,[collection]:deviceB[collection].map(r=>find(r)?edit(edit(r)):r)}),/another device/);
  await assert.rejects(()=>backend.saveJournal(uid,deviceB,{...deviceB,[collection]:deviceB[collection].filter(r=>!find(r))}),/another device/);
  const verified=await backend.loadJournal(uid);
  assert.deepEqual(verified[collection].find(find),saved[collection].find(find));
 }
 console.log('PASS: stale food, goal, recipe, workout, supplement and weight edits/deletes rejected; newer values preserved.');
}catch(e){console.error(e.message);process.exitCode=1}
finally{
 if(uid&&original){
  try{
   const current=await backend.loadJournal(uid);
   const cleaned=await backend.saveJournal(uid,current,{...current,
    personalGoals:original.personalGoals,dailyCheckIns:original.dailyCheckIns,uiTheme:original.uiTheme,supplementProducts:original.supplementProducts,healthNotes:original.healthNotes,bodyMeasurements:original.bodyMeasurements,
    entries:current.entries.filter(r=>r.food.name!==marker),
    goals:current.goals.filter(r=>r.title!==marker),
    recipes:current.recipes.filter(r=>r.name!==marker),
    supplementHistory:current.supplementHistory.filter(r=>r.name!==marker),
    workouts:current.workouts.filter(r=>r.name!==marker),
    weights:current.weights.filter(r=>r.date!==date)});
   assert.equal(cleaned.weights.some(r=>r.date===date),false);
   console.log('PASS: fixture cleanup and persistent weight deletion.');
  }catch(e){console.error('Cleanup failed:',e.message);process.exitCode=1}
 }
 if(backend?.cloud)await backend.cloud.auth.signOut({scope:'local'});
 await server.close();
}
