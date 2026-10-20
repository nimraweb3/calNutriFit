import {useEffect,useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {cloud} from './backend';
export default function AccountSecurity(){
 const [user,setUser]=useState<User|null>(null),[current,setCurrent]=useState(''),[next,setNext]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{let active=true;cloud?.auth.getUser().then(r=>{if(active){setUser(r.data.user);if(r.error)setMessage('Could not load account methods.')}});return()=>{active=false}},[]);
 if(!user)return <p role="status">{message||'Sign in to manage your account.'}</p>;
 const providers=[...new Set(user.identities?.map(i=>i.provider)||[])],passwordAccount=providers.includes('email');
 async function run(action:()=>Promise<void>){if(busy)return;setBusy(true);setMessage('');try{await action()}catch(e){setMessage((e as Error).message)}finally{setBusy(false);setCurrent('');setNext('');setConfirm('')}}
 return <section><h3>Account & security</h3><p>Login methods: {providers.join(', ')||'Unavailable'}. This account is shared with Nutrio.</p>
 {passwordAccount?<form onSubmit={e=>{e.preventDefault();void run(async()=>{
   if(next!==confirm)throw Error('New passwords do not match.');
   if(next.length<12)throw Error('Use at least 12 characters.');
   if(!user.email||!cloud)throw Error('Account is unavailable.');
   const auth=await cloud.auth.signInWithPassword({email:user.email,password:current});
   if(auth.error||auth.data.user?.id!==user.id)throw Error('Current password could not be verified.');
   const result=await cloud.auth.updateUser({password:next});if(result.error)throw result.error;
   setMessage('Password updated for your shared CalNutriFit / Nutrio account.');
 })}}><label className="field"><span>Current password</span><input required type="password" autoComplete="current-password" value={current} onChange={e=>setCurrent(e.target.value)}/></label>
 <label className="field"><span>New password (12+ characters)</span><input required minLength={12} type="password" autoComplete="new-password" value={next} onChange={e=>setNext(e.target.value)}/></label>
 <label className="field"><span>Confirm new password</span><input required minLength={12} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><button disabled={busy} className="button">Change password</button></form>:<p>Manage your password through {providers.join(' / ')||'your login provider'}. No local password form is shown for this account.</p>}
 <button className="button secondary spaced" disabled={busy} onClick={()=>void run(async()=>{const result=await cloud!.auth.signOut({scope:'others'});if(result.error)throw result.error;setMessage('Other refresh sessions were signed out. Existing access tokens may remain valid until they expire.');})}>Sign out other sessions</button>
 <p role="status">{message}</p><p className="help">Email changes and account deletion require verified backend workflows and are not enabled here yet. Export your journal using the button below.</p>
 </section>;
}
