import {describe,it,expect} from 'vitest';
import {emptyStore,type Store} from './engine';
import {dailyBalance} from './daily-balance';
import {togglePlannedExercise,sessionKey,removeWorkout} from './workout-progress';
import {foods} from './catalog';
const date='2026-10-11';
const store:Store={...emptyStore,profile:{name:'Test',age:30,weight:70,height:170,sex:'male',activity:1.2,goal:'maintenance',special:false}};
describe('synced daily calories',()=>{
 it('adds food and supplements once, then subtracts exercise for net',()=>{
  const next=togglePlannedExercise(store,date,0,'Beginner','Bicep curl',3);
  next.entries=[{id:'food',date,meal:'Snacks',food:foods[0],quantity:1,unit:'g',grams:1,nutrition:{calories:200,protein:10,carbs:20,fat:8,fiber:2}}];
  next.supplementHistory=[{id:'supp',date,name:'Test whey',quantity:2,unit:'scoop',takenAt:'',nutrition:{calories:240,protein:48,carbs:6,fat:2,fiber:0}}];
  const balance=dailyBalance(next,date);
  expect(balance.nutrients.calories).toBe(440);expect(balance.nutrients.protein).toBe(58);
  expect(balance.burned).toBe(13);expect(balance.net).toBe(427);
  expect(dailyBalance(next,'2026-10-12').nutrients.calories).toBe(0);
 });
 it('unticking removes burn and reticking never duplicates it',()=>{
  let next=togglePlannedExercise(store,date,0,'Beginner','Bicep curl',3);
  next=togglePlannedExercise(next,date,0,'Beginner','Bicep curl',3);
  expect(next.workouts).toHaveLength(0);
  next=togglePlannedExercise(next,date,0,'Beginner','Bicep curl',3);
  expect(next.workouts).toHaveLength(1);
  const tomorrow=togglePlannedExercise(next,'2026-10-12',0,'Beginner','Bicep curl',3);
  expect(tomorrow.workouts).toHaveLength(2);
  const removed=removeWorkout(tomorrow,next.workouts[0].id);
  expect(removed.completed[sessionKey(date,0,'Beginner')]).toEqual([]);
 });
 it('replaces old session totals rather than double counting',()=>{
  const key=sessionKey(date,0,'Beginner');
  const legacy={...store,completed:{[key]:['Bicep curl','Front raise']},workouts:[{id:'old',date,name:'Upper body',identity:key,minutes:18,calories:77}]};
  const next=togglePlannedExercise(legacy,date,0,'Beginner','Front raise',3);
  expect(next.workouts).toHaveLength(1);expect(next.workouts[0].calories).toBe(13);
 });
 it('keeps supplemental products out of the food catalog',()=>{
  expect(foods.some(f=>/supplement|whey|creatine|mass gainer/i.test(f.category+' '+f.name))).toBe(false);
  expect(foods.filter(f=>f.category==='Pakistani Cuisine').length).toBeGreaterThan(40);
 });
});
