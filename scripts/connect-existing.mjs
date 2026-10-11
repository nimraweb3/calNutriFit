import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const source=execFileSync('git',['show','nutrio-pulse-tracker/main:src/integrations/supabase/safeClient.ts'],{encoding:'utf8'});
const url=source.match(/const FALLBACK_URL = '([^']+)'/)?.[1];
const key=source.match(/const FALLBACK_KEY = '(sb_publishable_[^']+)'/)?.[1];
if(!url||!key)throw Error('Expected public connection settings were not found.');
if(fs.existsSync('.env.local'))throw Error('Existing local configuration preserved; inspect before replacing.');
fs.writeFileSync('.env.local',`VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_ANON_KEY=${key}\n`);
console.log('Existing project public configuration saved in ignored .env.local. No private secrets copied.');
try{const r=await fetch(`${url}/auth/v1/settings`,{headers:{apikey:key}});const body=await r.json();console.log(JSON.stringify({authStatus:r.status,emailEnabled:body.external?.email,googleEnabled:body.external?.google}));}catch{console.log('Auth reachability could not be verified from this environment.');}
