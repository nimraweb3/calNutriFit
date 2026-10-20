import {shiftDay,zero,type Store} from './engine';
import {detailContribution,type NutrientKey} from './nutrient-data';
import {nutrientTarget} from './nutrient-targets';
export function nutrientDays(data:Store,end:string,count:number,key:NutrientKey){
 if(!Number.isInteger(count)||count<1||count>366)throw Error('Choose 1–366 days.');
 return Array.from({length:count},(_,i)=>{
  const date=shiftDay(end,i-count+1);
  const food=data.entries.filter(e=>e.date===date).map(e=>e.nutrition);
  const supplements=[...data.supplementHistory.filter(e=>e.date===date).map(e=>e.nutrition),...data.supplements.filter(s=>s.taken.includes(date)).map(()=>({...zero}))];
  const f=detailContribution(food,key),s=detailContribution(supplements,key),known=f.known+s.known;
  return {date,food:f.value,supplements:s.value,total:known?(f.value??0)+(s.value??0):null,missing:f.missing+s.missing,items:food.length+supplements.length};
 });
}
export function nutrientTrend(data:Store,end:string,count:number,key:NutrientKey){
 const rows=nutrientDays(data,end,count,key),known=rows.filter(r=>r.total!==null),target=nutrientTarget(key,data.profile);
 return {rows,knownDays:known.length,unloggedDays:rows.filter(r=>!r.items).length,
  missingItems:rows.reduce((n,r)=>n+r.missing,0),
  average:known.length?known.reduce((sum,r)=>sum+r.total!,0)/known.length:null,
  belowDays:target?rows.filter(r=>r.total!==null&&r.missing===0&&r.total<target.rda).length:null,
  aboveLimitDays:target&&target.ul!==null?rows.filter(r=>(target.scope==='supplements'?(r.supplements??0):(r.total??0))>target.ul!).length:0};
}
