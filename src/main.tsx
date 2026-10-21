import {useEffect, useState, lazy, Suspense, Component, type ReactNode} from 'react';
import {createRoot,hydrateRoot} from 'react-dom/client';
import Landing from './Landing';
import './style.css';
import './premium.css';
const JournalApp=lazy(()=>import('./App'));
type Mode='session'|'auth'|'demo';
function Bootstrap(){
 const [mode,setMode]=useState<Mode|null>(()=>{try{if(localStorage.getItem('calnutrifit-auth')||location.pathname==='/auth/callback'||location.pathname==='/reset-password'||location.hash.includes('access_token=')||new URLSearchParams(location.search).has('code'))return 'session'}catch{}return null});
 const [dark,setDark]=useState(false);
 useEffect(()=>{try{setDark(localStorage.getItem('fitnourish-theme')==='dark')}catch{}},[]);
 useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light'},[dark]);
 const toggle=()=>setDark(value=>{try{localStorage.setItem('fitnourish-theme',value?'light':'dark')}catch{}return !value});
 return mode?<Suspense fallback={<div className="session-loading" role="status"><strong>CalNutriFit</strong><p>Opening your journal…</p></div>}><JournalApp initialMode={mode}/></Suspense>:<Landing dark={dark} toggleTheme={toggle} start={()=>setMode('auth')} explore={()=>setMode('demo')}/>;
}
class StartupBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<div className="session-loading"><h1>We couldn’t open the app.</h1><p>Check your connection and try again. Your saved records are unchanged.</p><button className="button" onClick={()=>location.reload()}>Try again</button></div>:this.props.children}}
const hot=(import.meta as any).hot;
const element=<StartupBoundary><Bootstrap/></StartupBoundary>;
const host=document.getElementById('root')!;
let hasSession=false;try{hasSession=!!localStorage.getItem('calnutrifit-auth')}catch{}
const canHydrate=host.hasChildNodes()&&!hasSession&&!location.hash&&!location.search&&!['/auth/callback','/reset-password'].includes(location.pathname);
const existingRoot=hot?.data.root;
const root=existingRoot??(canHydrate?hydrateRoot(host,element):createRoot(host));
if(hot)hot.data.root=root;
if(existingRoot||!canHydrate)root.render(element);
