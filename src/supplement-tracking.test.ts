import {describe,it,expect} from 'vitest';
import {emptyStore,zero,type SupplementProduct,type SupplementRecord} from './engine';
import {resizeDose,scheduledOn,supplementStatus} from './supplement-tracking';
import {dailyBalance} from './daily-balance';
import {nutrientTrend} from './nutrient-trends';
import {nutrientTarget} from './nutrient-targets';
import {validateMeasurement} from './ProfileExtras';
const product:SupplementProduct={id:'p',name:'Synthetic product',unit:'tablet',nutrition:{...zero,calories:10,details:{calcium:500}},frequency:'weekly',weekday:2,started:'2026-10-20',skippedDates:['2026-10-20']};
const dose:SupplementRecord={id:'d',productId:'p',name:product.name,date:'2026-10-20',quantity:2,unit:'tablet',takenAt:'2026-10-20T12:00:00Z',nutrition:{...zero,calories:20,details:{calcium:1000}}};
describe('supplement routines and nutrient trends',()=>{
 it('schedules by local calendar date and never before the start',()=>{
  expect(scheduledOn(product,'2026-10-20')).toBe(true);
  expect(scheduledOn(product,'2026-10-21')).toBe(false);
  expect(scheduledOn(product,'2026-10-13')).toBe(false);
 });
 it('does not count a saved or skipped product as intake; counts a dose once',()=>{
  const store={...emptyStore,supplementProducts:[product]};
  expect(dailyBalance(store,dose.date).nutrients.calories).toBe(0);
  expect(supplementStatus(product,dose.date,[])).toBe('Skipped');
  expect(dailyBalance({...store,supplementHistory:[dose]},dose.date).nutrients.calories).toBe(20);
  expect(supplementStatus(product,dose.date,[dose])).toBe('Taken');
 });
 it('edits quantity from the historical snapshot without mutating it',()=>{
  const changed=resizeDose(dose,.5);
  expect(changed.nutrition.details?.calcium).toBe(250);
  expect(dose.nutrition.details?.calcium).toBe(1000);
  expect(()=>resizeDose(dose,0)).toThrow();
 });
 it('preserves archived legacy intakes in calorie history',()=>{
  const store={...emptyStore,supplements:[{id:'old',name:'Old routine',amount:'1 tablet',calories:5,protein:0,taken:[dose.date],archived:true}]};
  expect(dailyBalance(store,dose.date).nutrients.calories).toBe(5);
 });
 it('excludes missing days from nutrient averages and reports unknown items',()=>{
  const store={...emptyStore,supplementHistory:[dose,{...dose,id:'unknown',date:'2026-10-19',nutrition:{...zero}}]};
  const trend=nutrientTrend(store,dose.date,7,'calcium');
  expect(trend.knownDays).toBe(1);expect(trend.average).toBe(1000);expect(trend.missingItems).toBe(1);expect(trend.unloggedDays).toBe(5);
 });
 it('keeps AI, CDRR and form-specific upper limits distinct',()=>{
  const p={name:'Test',age:40,weight:70,height:170,sex:'female' as const,activity:1.2,goal:'maintenance' as const,special:false};
  expect(nutrientTarget('vitaminK',p)).toMatchObject({kind:'AI',rda:90,ul:null});
  expect(nutrientTarget('sodium',p)).toMatchObject({kind:'AI',rda:1500,ul:null,cdrr:2300});
  expect(nutrientTarget('vitaminA',p)?.ul).toBeNull();
  expect(nutrientTarget('vitaminB9',p)?.ul).toBeNull();
  expect(nutrientTarget('iron',p)?.rda).toBe(18);
  expect(nutrientTarget('iron',{...p,age:51})?.rda).toBe(8);
 });
 it('validates optional measurements without inventing missing values',()=>{
  expect(validateMeasurement({id:'m',date:'2020-01-01',waist:80}).hips).toBeUndefined();
  expect(()=>validateMeasurement({id:'m',date:'2020-01-01'})).toThrow();
  expect(()=>validateMeasurement({id:'m',date:'2020-01-01',bodyFat:101})).toThrow();
 });
});
