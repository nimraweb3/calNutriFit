import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const env=fs.readFileSync('.env.local','utf8');
const url=env.match(/^VITE_SUPABASE_URL=(.*)$/m)?.[1].trim();
const key=env.match(/^VITE_SUPABASE_ANON_KEY=(.*)$/m)?.[1].trim();
if(!url||!key)throw Error('Missing public backend configuration');
const makeClient=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const check=(r,label)=>{if(r.error)throw Error(`${label}: ${r.error.message}`);return r.data};
const path='.env.demo';
let credentials;
if(fs.existsSync(path))credentials=JSON.parse(fs.readFileSync(path,'utf8'));
else{credentials={email:`calnutrifit-demo-${crypto.randomUUID()}@example.com`,password:crypto.randomBytes(30).toString('base64url')};fs.writeFileSync(path,JSON.stringify(credentials,null,2),{flag:'wx'});}
const client=makeClient();
let signed=await client.auth.signInWithPassword(credentials);
if(signed.error){signed=await client.auth.signUp({...credentials,options:{data:{display_name:'CalNutriFit Demo',purpose:'Synthetic application QA'}}});}
const session=check(signed,'Demo authentication').session;
if(!session)throw Error('Email verification is required; no authenticated tests ran.');
const uid=session.user.id;
const report={account:'Demo account created or restored',email:credentials.email,checks:[],cleanup:[]};
const created=[];
try{
 const definitions={
 food_entries:{date:'2026-10-11',meal_type:'breakfast',quantity:100,food_item_data:{id:'qa-oats',name:'QA oats — synthetic test',category:'QA',servingSize:100,servingUnit:'g',nutrients:{calories:100,protein:5,carbs:15,fats:2,fiber:3}}},
 workout_entries:{date:'2026-10-11',exercise_data:{name:'QA walk — synthetic test'},duration:20,calories_burned:80},
 weight_logs:{date:'2000-01-01',weight:70},
 fitness_goals:{title:'QA goal — synthetic test',type:'weekly',start_date:'2026-10-11',end_date:'2026-10-17',target_workouts:3,status:'active'},
 recipes:{name:'QA recipe — synthetic test',items:[]},
 supplement_entries:{date:'2026-10-11',supplement_data:{id:'qa',name:'QA supplement — synthetic test',servingUnit:'serving',nutrients:{calories:0,protein:0,carbs:0,fats:0,fiber:0}},quantity:1,taken_at:new Date().toISOString()},
 };
 for(const [table,values] of Object.entries(definitions)){
  const row=check(await client.from(table).insert({...values,user_id:uid}).select('id').single(),`${table} insert`);created.push({table,id:row.id});
  const read=check(await client.from(table).select('id').eq('id',row.id).eq('user_id',uid).single(),`${table} read`);
  if(read.id!==row.id)throw Error(`${table}: read mismatch`);
  check(await client.from(table).update(values).eq('id',row.id).eq('user_id',uid).select('id').single(),`${table} update`);
  report.checks.push(`${table}: insert/read/update passed`);
 }
 const current=check(await client.from('user_settings').select('settings').eq('user_id',uid).maybeSingle(),'Read demo settings');
 check(await client.from('user_settings').upsert({user_id:uid,settings:{...current?.settings,calnutrifit:{...current?.settings?.calnutrifit,profile:{name:'Demo Tester',age:30,weight:70,height:170,sex:'female',activity:1.2,goal:'maintenance',special:false}}}},{onConflict:'user_id'}).select('id').single(),'Save demo settings');
 report.checks.push('user_settings: demo profile saved (synthetic measurements)');
 const anon=makeClient();for(const {table,id} of created){const rows=check(await anon.from(table).select('id').eq('id',id),'Anonymous isolation');if(rows.length)throw Error(`${table}: anonymous data exposure`)}
 report.checks.push('Anonymous access to known demo record IDs: blocked');
 const fresh=makeClient();check(await fresh.auth.signInWithPassword(credentials),'Fresh sign-in');check(await fresh.auth.signOut({scope:'local'}),'Sign-out');report.checks.push('Fresh password sign-in and sign-out passed');
}catch(error){report.error=error.message;process.exitCode=1;}
finally{
 for(const {table,id} of created){const result=await client.from(table).delete().eq('user_id',uid).eq('id',id);if(result.error){report.cleanup.push(`${table}: failed`);process.exitCode=1;}else{const read=await client.from(table).select('id').eq('id',id);report.cleanup.push(`${table}: ${!read.error&&read.data.length===0?'delete verified':'delete not verified'}`);}}
 await client.auth.signOut({scope:'local'});
 fs.writeFileSync('demo-check-results.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}
