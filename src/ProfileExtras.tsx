import {useState} from 'react';
import {dayKey,type Store,type BodyMeasurement} from './engine';
import type {UpdateJournal} from './preferences';
import {downloadCsv} from './export-data';
const fields={waist:'Waist (cm)',hips:'Hips (cm)',chest:'Chest (cm)',arm:'Arm (cm)',thigh:'Thigh (cm)',bodyFat:'Measured body fat (%)'} as const;
export function validateMeasurement(row:BodyMeasurement){
 const parsed=new Date(row.date+'T00:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==row.date||row.date>dayKey())throw Error('Choose a valid measurement date no later than today.');
 const values=Object.keys(fields) as (keyof typeof fields)[];
 if(!values.some(k=>row[k]!==undefined))throw Error('Enter at least one measurement.');
 for(const key of values){const value=row[key];if(value!==undefined&&(!Number.isFinite(value)||value<=0||value>(key==='bodyFat'?100:500)))throw Error(`Enter a valid ${fields[key].toLowerCase()}.`)}
 return row;
}
export default function ProfileExtras({data,save}:{data:Store;save:UpdateJournal}){
 const [notes,setNotes]=useState(data.healthNotes||''),[row,setRow]=useState<BodyMeasurement>({id:crypto.randomUUID(),date:dayKey()}),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[remove,setRemove]=useState('');
 const rows=[...(data.bodyMeasurements||[])].sort((a,b)=>b.date.localeCompare(a.date));
 async function run(action:()=>Promise<boolean>){if(busy)return;setBusy(true);setMessage('');try{setMessage(await action()?'Changes saved':'Not saved. Your entered values are preserved.')}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 return <><section className="card spaced"><h2>Private health notes (optional)</h2><p>Optional notes for your own reference. Included in your export; never sent to the AI chef.</p>
 <label className="field"><span>Your notes</span><textarea maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)}/></label><button className="button secondary" disabled={busy} onClick={()=>void run(()=>save(s=>({...s,healthNotes:notes.trim()})))}>Save notes</button></section>
 <section className="card spaced"><h2>Body measurements</h2><p>Your recorded measurements. No body composition is inferred.</p>
 <form onSubmit={e=>{e.preventDefault();void run(async()=>{const next=validateMeasurement(row);const saved=await save(s=>({...s,bodyMeasurements:[...(s.bodyMeasurements||[]).filter(r=>r.date!==next.date),next]}));if(saved)setRow({id:crypto.randomUUID(),date:dayKey()});return saved})}}>
 <label className="field"><span>Measurement date</span><input required type="date" max={dayKey()} value={row.date} onChange={e=>setRow({...row,date:e.target.value})}/></label>
 <div className="form-grid two">{(Object.keys(fields) as (keyof typeof fields)[]).map(key=><label className="field" key={key}><span>{fields[key]}</span><input type="number" min=".01" max={key==='bodyFat'?100:500} step="any" value={row[key]??''} onChange={e=>{const next={...row};if(e.target.value==='')delete next[key];else next[key]=Number(e.target.value);setRow(next)}}/></label>)}</div>
 <p className="help">Saving replaces the measurement set for the selected date. Existing weight records are unaffected.</p><button className="button" disabled={busy}>Save measurements</button></form>
 {message&&<p role="status">{message}</p>}
 {rows.length>0?<><button className="text-button" onClick={()=>downloadCsv(['Date',...Object.values(fields)],rows.map(r=>[r.date,...(Object.keys(fields) as (keyof typeof fields)[]).map(k=>r[k]??null)]),'calnutrifit-body-measurements.csv')}>Export measurements (CSV)</button><div className="table-scroll" role="region" aria-label="Body measurements" tabIndex={0}><table><caption>Actual recorded measurements. Dash = not measured.</caption><thead><tr><th>Date</th>{Object.values(fields).map(label=><th key={label}>{label}</th>)}<th>Actions</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><th scope="row">{r.date}</th>{(Object.keys(fields) as (keyof typeof fields)[]).map(k=><td key={k}>{r[k]??'—'}</td>)}<td><button onClick={()=>setRow({...r})}>Edit</button><button onClick={()=>setRemove(r.id)}>Delete</button>{remove===r.id&&<><p>Delete this measurement set?</p><button disabled={busy} onClick={()=>void run(async()=>{const result=await save(s=>({...s,bodyMeasurements:s.bodyMeasurements?.filter(x=>x.id!==r.id)}));if(result)setRemove('');return result})}>Confirm</button><button onClick={()=>setRemove('')}>Cancel</button></>}</td></tr>)}</tbody></table></div></>:<p>No body measurements recorded.</p>}
 </section></>;
}
