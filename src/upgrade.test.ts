import {describe,it,expect} from 'vitest';
import {canonicalWeight,displayWeight,weightSummary} from './measurements';
import {portion,total,recipeFood,zero,type Food,type Profile} from './engine';
import {scaleDetails,detailContribution} from './nutrient-data';
import {nutrientTarget} from './nutrient-targets';
import {encodeFood,decodeFood} from './backend';
const food:Food={id:'label',name:'Label',category:'Custom food',unit:'serving',grams:100,source:'Synthetic test',...zero,details:{calcium:400,vitaminD:0}};
const profile:Profile={name:'Test',age:30,sex:'female',weight:60,height:160,activity:1.2,goal:'maintenance',special:false};
describe('persistent nutrition and weight upgrade',()=>{
 it('round trips kg and pounds without changing the canonical measurement',()=>{
  expect(canonicalWeight(displayWeight(72.345678,'lb'),'lb')).toBeCloseTo(72.345678,12);
  expect(()=>canonicalWeight(NaN,'kg')).toThrow();
 });
 it('does not invent missing measurements or a weekly trend from a single point',()=>{
  const one=weightSummary([{date:'2026-10-01',weight:75}]);expect(one.weekly).toBeNull();expect(one.count).toBe(1);
  expect(weightSummary([{date:'2026-10-01',weight:75},{date:'2026-10-08',weight:74},{date:'2026-10-15',weight:73}]).weekly).toBe(-1);
 });
 it('scales declared nutrients and preserves zero versus unknown',()=>{
  const n=portion(food,50,'g').nutrition;
  expect(n.details).toEqual({calcium:200,vitaminD:0});expect(n.details?.iron).toBeUndefined();
  expect(()=>scaleDetails({iron:-1},1)).toThrow();
 });
 it('keeps partially known totals distinguishable from complete totals',()=>{
  const known={...zero,details:{calcium:400}};
  expect(detailContribution([known,{...zero}],'calcium')).toEqual({value:400,known:1,missing:1});
  expect(total([known,{...zero}]).details?.calcium).toBeUndefined();
  expect(total([known,{...zero,details:{calcium:500}}]).details?.calcium).toBe(900);
 });
 it('retains recipe micronutrients only when all ingredients provide them',()=>{
  expect(recipeFood({id:'r',name:'Test',yield:2,ingredients:[{food,quantity:1,unit:'serving'}]}).details?.calcium).toBe(200);
 });
 it('round trips food snapshots and resizes details when Nutrio changes quantity',()=>{
  const entry={id:'e',date:'2026-10-20',meal:'Lunch',food,quantity:1,unit:'serving',...portion(food,1,'serving')};
  const encoded=encodeFood(entry,'owner');
  expect(decodeFood({...encoded,id:'db'}).nutrition.details).toEqual(food.details);
  expect(decodeFood({...encoded,id:'db',quantity:50}).nutrition.details?.calcium).toBe(200);
 });
 it('applies age/sex reference boundaries and supplement-only magnesium limit',()=>{
  expect(nutrientTarget('magnesium',profile)).toMatchObject({rda:310,ul:350,scope:'supplements'});
  expect(nutrientTarget('magnesium',{...profile,age:31})?.rda).toBe(320);
  expect(nutrientTarget('calcium',{...profile,age:51})?.rda).toBe(1200);
  expect(nutrientTarget('vitaminD',{...profile,age:71})?.rda).toBe(20);
  expect(nutrientTarget('calcium',{...profile,age:18})).toBeNull();
  expect(nutrientTarget('calcium',{...profile,special:true})).toBeNull();
 });
});
