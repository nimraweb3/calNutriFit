import ProfileExtras from './ProfileExtras';
import {useState} from 'react';
import {LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine} from 'recharts';
import {dayKey, shiftDay, targets, type Store} from './engine';
import type {UpdateJournal} from './preferences';
import {canonicalWeight, displayWeight, weightSummary, type WeightUnit} from './measurements';

export function WeightEntry({data, save, date, done}: {data:Store;save:UpdateJournal;date:string;done:()=>void}) {
  const [unit,setUnit] = useState<WeightUnit>(data.preferences?.units === 'imperial' ? 'lb':'kg');
  const [value,setValue] = useState(()=>{const existing=data.weights.find(w=>w.date===date);return existing?String(displayWeight(existing.weight,unit)):''});
  const [error,setError] = useState(''), [busy,setBusy] = useState(false);
  return <form onSubmit={async e=>{
    e.preventDefault(); if(busy)return; setBusy(true);setError('');
    try {
      const weight = canonicalWeight(Number(value),unit);
      if(await save(s=>({...s,weights:[...s.weights.filter(w=>w.date!==date),{id:s.weights.find(w=>w.date===date)?.id??crypto.randomUUID(),date,weight}],
        preferences:s.preferences?{...s.preferences,units:unit==='lb'?'imperial':'metric'}:s.preferences})))done();
      else setError('Not saved. Your measurement remains in this form.');
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }}><p>Measurement date: {date}. Saving replaces any measurement on this date.</p>
    <div className="form-grid two"><label className="field"><span>Weight</span><input required type="number" step="any" min="0" value={value} onChange={e=>setValue(e.target.value)}/></label>
    <label className="field"><span>Weight unit</span><select value={unit} onChange={e=>{
      const next=e.target.value as WeightUnit;
      if(value && Number.isFinite(+value))setValue(String(displayWeight(unit==='lb'?+value/2.2046226218487757:+value,next)));
      setUnit(next);
    }}><option value="kg">Kilograms (kg)</option><option value="lb">Pounds (lb)</option></select></label></div>
    {error&&<p role="alert">{error}</p>}<button className="button" disabled={busy}>{busy?'Saving…':'Save measurement'}</button>
  </form>;
}

export default function ProfileView({data,save,open,progressOnly=false}: {data:Store;save:UpdateJournal;open:(s:string)=>void;progressOnly?:boolean}) {
  const [range,setRange]=useState('30'),[date,setDate]=useState(dayKey()),[edit,setEdit]=useState(false),[remove,setRemove]=useState('');
  const unit:WeightUnit=data.preferences?.units==='imperial'?'lb':'kg';
  const rows=[...data.weights].filter(w=>w.date<=dayKey()&&(range==='all'||w.date>=shiftDay(dayKey(),1-Number(range)))).sort((a,b)=>a.date.localeCompare(b.date));
  const stats=weightSummary(rows),t=targets(data.profile),weight=(kg:number)=>`${displayWeight(kg,unit).toFixed(2)} ${unit}`;
  return <><div className="page-heading"><div><h1>{progressOnly?'Your progress':'My profile'}</h1><p>Your saved preferences and measurements. Missing days stay missing.</p></div><button className="button" onClick={()=>open('profile')}>Edit profile</button></div>
    {!progressOnly&&<section className="card"><h2>{data.profile?.name||'Your personal profile'}</h2>
      <div className="settings-list"><p>Height <strong>{data.profile?`${data.profile.height} cm`:'Not provided'}</strong></p>
      <p>Profile weight <strong>{data.profile?weight(data.profile.weight):'Not provided'}</strong></p>
      <p>Daily calorie estimate <strong>{t?`${t.calories} kcal`:'Not set'}</strong></p>
      <p>Dietary preferences <strong>{data.preferences?.diet||'Not provided'}</strong></p>
      <p>Allergies <strong>{data.preferences?.allergies||'Not provided'}</strong></p></div>
      <button className="button secondary" onClick={()=>open('preferences')}>Edit goals, units & preferences</button>
      <button className="text-button" onClick={()=>open('settings')}>Account & data settings</button>
    </section>}
    <section className="card"><h2>Weight history</h2><div className="form-grid two">
      <label className="field"><span>Time range</span><select value={range} onChange={e=>setRange(e.target.value)}>{[['7','7 days'],['30','30 days'],['90','90 days'],['183','6 months'],['365','1 year'],['all','All time']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
      <label className="field"><span>Measurement date</span><input type="date" required max={dayKey()} value={date} onChange={e=>setDate(e.target.value)}/></label>
    </div><button className="button" disabled={!date||date>dayKey()} onClick={()=>setEdit(!edit)}>Record / edit weight</button>
    {edit&&<WeightEntry key={date} data={data} save={save} date={date} done={()=>setEdit(false)}/>}
    <p>{stats.count} measurements in this range. {stats.first&&stats.last&&<>Starting: {weight(stats.first.weight)} · Latest: {weight(stats.last.weight)} · Change: {weight(stats.change!)}{stats.weekly!==null&&<> · Average change: {weight(stats.weekly)} / week</>}</>}</p>
    {stats.last&&data.preferences?.targetWeight&&<p>Difference from your goal: {weight(Math.abs(stats.last.weight-data.preferences.targetWeight))}</p>}
    {rows.length?<><div style={{height:260,minWidth:0}}><ResponsiveContainer width="100%" height="100%"><LineChart data={rows.map(w=>({...w,value:displayWeight(w.weight,unit),time:Date.parse(w.date)}))}>
      <XAxis dataKey="time" type="number" domain={['dataMin','dataMax']} tickFormatter={v=>new Date(v).toISOString().slice(5,10)}/><YAxis domain={['auto','auto']} unit={` ${unit}`} width={75}/>
      <Tooltip labelFormatter={v=>new Date(Number(v)).toISOString().slice(0,10)} formatter={v=>[`${Number(v).toFixed(2)} ${unit}`,'Weight']}/>
      <Line dataKey="value" stroke="var(--emerald)" dot type="linear" isAnimationActive={false}/>
      {data.preferences?.targetWeight&&<ReferenceLine y={displayWeight(data.preferences.targetWeight,unit)} stroke="var(--muted)" label="Goal"/>}
    </LineChart></ResponsiveContainer></div>
    <div className="table-scroll"><table><caption>Recorded measurements ({unit})</caption><thead><tr><th>Date</th><th>Weight</th><th>Actions</th></tr></thead><tbody>{[...rows].reverse().map(w=><tr key={w.id}><td>{w.date}</td><td>{weight(w.weight)}</td><td><button className="text-button" onClick={()=>{setDate(w.date);setEdit(true)}}>Edit</button><button className="text-button" onClick={()=>setRemove(w.id)}>Delete</button>{remove===w.id&&<><span>Delete this measurement?</span><button onClick={async()=>{if(await save(s=>({...s,weights:s.weights.filter(x=>x.id!==w.id)})))setRemove('')}}>Confirm deletion</button><button onClick={()=>setRemove('')}>Cancel</button></>}</td></tr>)}</tbody></table></div></>:<p>No measurements in this range. Record one or choose a wider range.</p>}
    </section>{!progressOnly&&<ProfileExtras data={data} save={save}/>}</>;
}
