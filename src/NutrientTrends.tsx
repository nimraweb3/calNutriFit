import {useState} from 'react';
import type {Store} from './engine';
import {nutrientDefinitions,type NutrientKey} from './nutrient-data';
import {nutrientTrend} from './nutrient-trends';
import {downloadCsv} from './export-data';
export function NutrientInsights({data,date}:{data:Store;date:string}){
 const keys:NutrientKey[]=['calcium','vitaminD','magnesium','vitaminC'];
 const items=keys.map(key=>({key,...nutrientTrend(data,date,7,key)})).filter(t=>t.knownDays>0).sort((a,b)=>b.aboveLimitDays-a.aboveLimitDays).slice(0,3);
 return <section className="card spaced"><h2>Weekly nutrient observations</h2>{!items.length?<p>No label-based nutrient amounts were recorded this week. Log available label values to see nutrient observations; missing values cannot establish a shortfall.</p>:items.map(t=><div key={t.key}><h3>{nutrientDefinitions[t.key][0]}</h3><p>{t.aboveLimitDays?`${t.aboveLimitDays} days had recorded amounts above the configured upper limit. Check the exact product strength and discuss the record with a qualified clinician.`:`Known amounts averaged ${Number(t.average!.toFixed(2))} ${nutrientDefinitions[t.key][1]} across ${t.knownDays} days with values.`} {t.missingItems?`${t.missingItems} logged items lack this nutrient; totals may be understated.`:''} {t.unloggedDays?`${t.unloggedDays} days have no nutrition logs.`:''}</p>{!t.missingItems&&t.belowDays!==null&&t.belowDays>0&&<p>{t.belowDays} recorded days were below the daily reference. Even entries with nutrient data can omit meals; this is not a diagnosis.</p>}</div>)}</section>;
}
export default function NutrientTrends({data,date}:{data:Store;date:string}){
 const [key,setKey]=useState<NutrientKey>('calcium'),[days,setDays]=useState(7),stats=nutrientTrend(data,date,days,key);
 const format=(n:number|null)=>n===null?'—':Number(n.toFixed(3)).toLocaleString();
 return <section className="card spaced"><h2>Nutrient history</h2><div className="form-grid two"><label className="field"><span>Nutrient</span><select value={key} onChange={e=>setKey(e.target.value as NutrientKey)}>{(Object.keys(nutrientDefinitions) as NutrientKey[]).map(k=><option value={k} key={k}>{nutrientDefinitions[k][0]}</option>)}</select></label><label className="field"><span>Days ending {date}</span><select value={days} onChange={e=>setDays(+e.target.value)}><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option></select></label></div>
 <p>Average known amount: {format(stats.average)} {nutrientDefinitions[key][1]} across {stats.knownDays} days with values. Missing days are excluded; incomplete items can understate totals.</p>
 <button className="button secondary" onClick={()=>downloadCsv(['Date',`Known food ${nutrientDefinitions[key][1]}`,`Known supplements ${nutrientDefinitions[key][1]}`,`Known total ${nutrientDefinitions[key][1]}`,'Logged items missing this nutrient'],stats.rows.map(r=>[r.date,r.food,r.supplements,r.total,r.missing]),`calnutrifit-${key}-${date}.csv`)}>Export nutrient history (CSV)</button>
 <div className="table-scroll" tabIndex={0} role="region" aria-label="Nutrient history"><table><caption>{nutrientDefinitions[key][0]} ({nutrientDefinitions[key][1]}). Dash = unavailable.</caption><thead><tr><th>Date</th><th>Food</th><th>Supplements</th><th>Known total</th><th>Missing items</th></tr></thead><tbody>{stats.rows.map(r=><tr key={r.date}><th scope="row">{r.date}</th><td>{format(r.food)}</td><td>{format(r.supplements)}</td><td>{format(r.total)}</td><td>{r.items?r.missing:'No logs'}</td></tr>)}</tbody></table></div>
 </section>;
}
