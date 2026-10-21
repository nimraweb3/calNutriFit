import {dailyBalance} from './daily-balance';
import {shiftDay,type PersonalGoal,type Store} from './engine';
export const goalUnits={weight:'kg',calories:'kcal',protein:'g',water:'ml',workouts:'workouts',steps:'steps',custom:'units'};
export function goalValue(g:PersonalGoal,data:Store,date:string){
 const n=dailyBalance(data,date).nutrients,check=data.dailyCheckIns?.find(d=>d.date===date);
 if(g.kind==='weight')return [...data.weights].filter(w=>w.date<=date).sort((a,b)=>b.date.localeCompare(a.date))[0]?.weight??data.profile?.weight??null;
 if(g.kind==='calories')return n.calories;
 if(g.kind==='protein')return n.protein;
 if(g.kind==='water')return check?.water??0;
 if(g.kind==='steps')return check?.steps??0;
 if(g.kind==='workouts')return data.workouts.filter(w=>w.date>=shiftDay(date,-6)&&w.date<=date).length;
 return g.current??0;
}
export function goalProgress(g:PersonalGoal,value:number|null,data:Store){
 if(value===null)return 0;
 if(g.kind==='weight'){
 const baseline=[...data.weights].filter(w=>w.date<=g.start).sort((a,b)=>b.date.localeCompare(a.date))[0]?.weight??data.profile?.weight;
 if(baseline===undefined)return 0;
 if(baseline===g.target)return value===g.target?100:0;
 return Math.max(0,Math.min(100,(value-baseline)/(g.target-baseline)*100));
 }
 return Math.max(0,Math.min(100,value/g.target*100));
}
export function validateGoal(g:PersonalGoal){
 if(!Object.hasOwn(goalUnits,g.kind))throw Error('Choose a supported goal type.');
 if(!g.name.trim()||g.name.length>80||!Number.isFinite(g.target)||g.target<=0||g.target>1000000||!g.unit.trim()||g.unit.length>20)throw Error('Enter a goal name, unit and positive target.');
 if(g.kind==='weight'&&(g.target<30||g.target>300))throw Error('Target weight must be 30–300 kg.');
 if(g.current!==undefined&&(!Number.isFinite(g.current)||g.current<0))throw Error('Enter valid current progress.');
 const validDate=(d:string)=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
 if(!validDate(g.start)||g.end&&(!validDate(g.end)||g.end<g.start))throw Error('Choose a valid target date after the start.');
 return g;
}
