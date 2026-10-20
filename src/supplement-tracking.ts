import {zero,type Nutrients,type SupplementProduct,type SupplementRecord} from './engine';
import {scaleDetails} from './nutrient-data';
export function scaleNutrition(n:Nutrients,factor:number):Nutrients{
 if(!Number.isFinite(factor)||factor<=0)throw Error('Enter a positive serving amount.');
 const result={...zero};
 for(const k of Object.keys(zero) as (keyof typeof zero)[]){
  const scaled=n[k]*factor;
  if(!Number.isFinite(scaled)||scaled<0)throw Error('Nutrition amounts must be finite and nonnegative.');
  result[k]=scaled;
 }
 return {...result,...(n.details?{details:scaleDetails(n.details,factor)}:{})};
}
export function scheduledOn(product:SupplementProduct,date:string){
 if(product.started&&date<product.started)return false;
 return product.frequency==='daily'||(product.frequency==='weekly'&&new Date(date+'T12:00:00').getDay()===(product.weekday??0));
}
export function supplementStatus(product:SupplementProduct,date:string,history:SupplementRecord[]){
 if(history.some(r=>r.productId===product.id&&r.date===date))return 'Taken';
 if(product.skippedDates?.includes(date))return 'Skipped';
 return scheduledOn(product,date)?'Scheduled':'As needed';
}
export function resizeDose(record:SupplementRecord,quantity:number):SupplementRecord{
 if(!Number.isFinite(quantity)||quantity<=0||quantity>100||!Number.isFinite(record.quantity)||record.quantity<=0)throw Error('Enter 0–100 servings, greater than zero.');
 return {...record,quantity,nutrition:scaleNutrition(record.nutrition,quantity/record.quantity)};
}
