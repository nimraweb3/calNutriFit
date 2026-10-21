import NutrientTrends,{NutrientInsights} from './NutrientTrends';
import {useState} from 'react';
import {dayKey,zero,type Store} from './engine';
import {detailContribution,nutrientDefinitions,type NutrientKey} from './nutrient-data';
import {nutrientTarget} from './nutrient-targets';
export default function NutritionView({data,initialDate,embedded=false}:{data:Store;initialDate:string;embedded?:boolean}){
 const [date,setDate]=useState(initialDate);
 const food=data.entries.filter(e=>e.date===date).map(e=>e.nutrition);
 const supplements=[...data.supplementHistory.filter(e=>e.date===date).map(e=>e.nutrition),...data.supplements.filter(s=>s.taken.includes(date)).map(()=>({...zero}))];
 return <>{!embedded&&<h2>Vitamins & Minerals</h2>}
 <label className="field"><span>Nutrition date</span><input type="date" max={dayKey()} value={date} onChange={e=>setDate(e.target.value)}/></label>
 <details><summary>Reference notes</summary><p className="help">Unknown is not zero. Adult US/Canada references are not prescriptions or deficiency diagnoses. Pregnancy, lactation and individual medical needs require separate guidance.</p></details>
 <section className="card"><div className="table-scroll"><table><caption>Daily nutrients — {date}</caption><thead><tr><th>Nutrient</th><th>Food</th><th>Supplements</th><th>Known total</th><th>Daily reference</th><th>Status</th></tr></thead><tbody>
 {(Object.keys(nutrientDefinitions) as NutrientKey[]).map(key=>{
  const f=detailContribution(food,key),s=detailContribution(supplements,key),t=nutrientTarget(key,data.profile),known=f.known+s.known>0,amount=(f.value??0)+(s.value??0),missing=f.missing+s.missing;
  const over=t&&t.ul!==null&&(t.scope==='supplements'?(s.value??0):amount)>t.ul;
  const format=(v:number|null)=>v===null?'—':Number(v.toFixed(3)).toLocaleString();
  return <tr key={key}><th scope="row">{nutrientDefinitions[key][0]}<small> ({nutrientDefinitions[key][1]})</small></th><td>{format(f.value)}</td><td>{format(s.value)}</td><td>{known?format(amount):'—'}</td><td>{t?<a href={t.source} target="_blank" rel="noreferrer">{t.rda} ({t.kind})</a>:'Not configured'}</td><td>
  {over?`Above established upper limit (${t!.ul}; ${t!.scope}). Review the label and discuss with a clinician.`:t?.cdrr&&amount>t.cdrr?'Above sodium CDRR reference':!known?'Data unavailable':missing?'Data incomplete':!t?'Recorded amount':amount<t.rda?'Below daily reference':amount===t.rda?'Target reached':'Intake above reference target'}
  {known&&t&&<progress aria-label={`${nutrientDefinitions[key][0]} reference progress`} value={Math.min(amount,t.rda)} max={t.rda}/>}
  {t?.note&&<details><summary>Reference note</summary><small>{t.note}</small></details>}{t&&t.ul===null&&!t.note&&<small>No upper limit established; this does not establish safety. </small>}{missing>0&&<small> {missing} logged items lack this nutrient.</small>}
  </td></tr>;
 })}</tbody></table></div><p className="help">Amounts entered from labels are user reported. Upper limits are not intake goals. Magnesium's limit applies to supplements and medicines, not food; medicines are not tracked here. No alert does not establish safety.</p></section><NutrientInsights data={data} date={date}/><NutrientTrends data={data} date={date}/></>;
}
