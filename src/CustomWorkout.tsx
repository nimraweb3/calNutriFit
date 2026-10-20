import {useState} from 'react';
import {activities} from './catalog';
import {workoutCalories,type Store} from './engine';
import type {UpdateJournal} from './preferences';
export default function CustomWorkout({data,date,save,done}:{data:Store;date:string;save:UpdateJournal;done:()=>void}){
 const [name,setName]=useState(''),[description,setDescription]=useState(''),[index,setIndex]=useState(0),[minutes,setMinutes]=useState(''),[weight,setWeight]=useState(String(data.profile?.weight||'')),[manual,setManual]=useState(''),[sets,setSets]=useState(''),[reps,setReps]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const activity=activities[index];let estimate:number|null=null;try{estimate=workoutCalories(activity.met,+weight,+minutes)}catch{}
 const recent=[...new Map(data.workouts.filter(w=>w.description!==undefined).map(w=>[w.name,w])).values()];
 return <form onSubmit={async e=>{e.preventDefault();if(busy)return;setError('');setBusy(true);try{
  if(!name.trim()||name.length>120||description.length>2000||+minutes<=0||+minutes>600||+weight<30||+weight>300)throw Error('Enter a name, 0–600 active minutes and a weight of 30–300 kg.');
  const calculated=workoutCalories(activity.met,+weight,+minutes),calories=manual===''?calculated:Number(manual);
  if(!Number.isFinite(calories)||calories<0||calories>10000)throw Error('Enter a valid calorie estimate.');
  if(await save(s=>({...s,workouts:[...s.workouts,{id:crypto.randomUUID(),date,name:name.trim(),description,minutes:+minutes,calories,met:activity.met,bodyWeightKg:+weight,calorieMethod:manual===''?'met':'manual',sets:sets?+sets:undefined,reps:reps?+reps:undefined}]})))done();
  else setError('Not saved. Your workout is still in this form.');
 }catch(e){setError((e as Error).message)}finally{setBusy(false)}}}><p>Choose the closest activity category yourself. AI interpretation is not enabled. No duration is inferred from repetitions.</p>
 {recent.length>0&&<label className="field"><span>Reuse a custom activity</span><select defaultValue="" onChange={e=>{const w=recent.find(w=>w.id===e.target.value);if(w){setName(w.name);setDescription(w.description||'');const i=activities.findIndex(a=>a.met===w.met);if(i>=0)setIndex(i)}}}><option value="">Choose a saved activity</option>{recent.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label>}
 <label className="field"><span>Activity name</span><input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
 <label className="field"><span>Description / notes</span><textarea maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)}/></label>
 <label className="field"><span>Closest activity category</span><select value={index} onChange={e=>setIndex(+e.target.value)}>{activities.map((a,i)=><option value={i} key={a.name}>{a.name} · {a.met} MET</option>)}</select></label>
 <div className="form-grid two"><label className="field"><span>Active minutes</span><input required type="number" min=".1" max="600" step="any" value={minutes} onChange={e=>setMinutes(e.target.value)}/></label><label className="field"><span>Body weight (kg)</span><input required type="number" min="30" max="300" step="any" value={weight} onChange={e=>setWeight(e.target.value)}/></label>
 <label className="field"><span>Sets (optional)</span><input type="number" min="1" max="500" value={sets} onChange={e=>setSets(e.target.value)}/></label><label className="field"><span>Repetitions (optional)</span><input type="number" min="1" max="10000" value={reps} onChange={e=>setReps(e.target.value)}/></label></div>
 <p>Estimate: {estimate===null?'enter duration and weight':`${estimate} kcal`} · {activity.met} × 3.5 × kg ÷ 200 × minutes. Category estimates have limited precision for mixed activities.</p>
 <label className="field"><span>Override estimated calories (optional)</span><input type="number" min="0" max="10000" step="any" value={manual} onChange={e=>setManual(e.target.value)}/></label>
 {error&&<p role="alert">{error}</p>}<button className="button" disabled={busy}>{busy?'Saving…':'Confirm and save workout'}</button></form>;
}

