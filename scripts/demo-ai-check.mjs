import fs from 'node:fs';
import {createClient} from '@supabase/supabase-js';
const env=fs.readFileSync('.env.local','utf8'),url=env.match(/^VITE_SUPABASE_URL=(.*)$/m)[1].trim(),key=env.match(/^VITE_SUPABASE_ANON_KEY=(.*)$/m)[1].trim();
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
try{
 const {data,error}=await client.auth.signInWithPassword(JSON.parse(fs.readFileSync('.env.demo','utf8')));if(error||!data.session)throw Error('Demo sign-in failed');
 const response=await fetch(`${url}/functions/v1/chef-chat`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${data.session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:'Synthetic QA check: suggest one simple rice and vegetable dish in one short sentence. No personal profile supplied.'}]}),signal:AbortSignal.timeout(30000)});
 if(!response.ok){console.log(JSON.stringify({status:response.status,streaming:false}));process.exitCode=1;}else{const body=await response.text();console.log(JSON.stringify({status:response.status,streaming:response.headers.get('content-type')?.includes('text/event-stream'),hasContentDelta:body.includes('"content":'),completed:body.includes('[DONE]')}));}
}catch(e){console.log(JSON.stringify({error:e.name==='TimeoutError'?'AI request timed out':'AI smoke test could not complete'}));process.exitCode=1;}
finally{await client.auth.signOut({scope:'local'});}
