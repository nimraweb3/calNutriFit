import {total,zero,type Store} from './engine';
export function dailyBalance(data:Store,date:string){
 const food=total(data.entries.filter(e=>e.date===date).map(e=>e.nutrition));
 const supplements=total([...data.supplementHistory.filter(r=>r.date===date).map(r=>r.nutrition),...data.supplements.filter(s=>s.taken.includes(date)).map(s=>({...zero,calories:s.calories,protein:s.protein}))]);
 const nutrients=total([food,supplements]);
 const burned=data.workouts.filter(w=>w.date===date).reduce((sum,w)=>sum+w.calories,0);
 return {food,supplements,nutrients,burned,net:nutrients.calories-burned};
}
