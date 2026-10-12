import {describe,it,expect} from 'vitest';
import {emptyStore,dayKey,shiftDay,recipeFood} from './engine';
import {createDemo} from './demo-data';
import {preferencesSchema} from './preferences';
import {analyticsRows,rangeDays,summarize} from './analytics-data';
import {parseRecipes} from './recipe-ai';
import {foods} from './catalog';
describe('personalization and analytics',()=>{
 it('validates onboarding and rejects missing workout preferences',()=>{
  const p=createDemo().preferences!;expect(preferencesSchema.safeParse(p).success).toBe(true);
  expect(preferencesSchema.safeParse({...p,workouts:[]}).success).toBe(false);
  expect(preferencesSchema.safeParse({...p,targetWeight:0}).success).toBe(false);
 });
 it('builds independent demo stores without mutating real records',()=>{
  const a=createDemo(),b=createDemo();a.entries.pop();expect(a.entries.length).not.toBe(b.entries.length);expect(emptyStore.entries).toHaveLength(0);
 });
 it('keeps missing intake as null and includes supplements in period totals',()=>{
  const data=createDemo(),date=dayKey();data.supplementHistory=[{id:'test',date,name:'test',quantity:1,unit:'serving',takenAt:'',nutrition:{calories:100,protein:20,carbs:0,fat:0,fiber:0}}];
  const rows=analyticsRows(data,shiftDay(date,-8),date);expect(rows[0].intake).toBeNull();expect(rows.at(-1)!.intake).toBe(766);expect(summarize(data,shiftDay(date,-6),date).logged).toBe(7);
 });
 it('rejects reversed and overly long ranges',()=>{expect(rangeDays('2026-10-12','2026-10-11')).toEqual([]);expect(rangeDays('2020-01-01','2026-01-01')).toEqual([]);expect(rangeDays('2026-10-12','2026-10-12')).toHaveLength(1)});
});
describe('AI recipe validation',()=>{
 const response={recipes:[{name:'Test bowl',servings:2,cookMinutes:10,instructions:['Prepare ingredients.'],ingredients:[{foodId:foods[0].id,grams:foods[0].grams,available:true}]}]};
 it('calculates nutrition from catalog quantities, ignoring AI calorie claims',()=>{
  const parsed=parseRecipes(JSON.stringify({...response,calories:1}));expect(recipeFood(parsed[0].recipe).calories).toBe(foods[0].calories/2);
 });
 it('rejects unknown ingredients, empty output and invalid quantities',()=>{
  expect(()=>parseRecipes('{"recipes":[]}')).toThrow();
  expect(()=>parseRecipes(JSON.stringify({recipes:[{...response.recipes[0],ingredients:[{foodId:'invented',grams:100,available:true}]}]}))).toThrow();
  expect(()=>parseRecipes(JSON.stringify({recipes:[{...response.recipes[0],servings:0}]}))).toThrow();
 });
 it('accepts a single fenced JSON result',()=>expect(parseRecipes('```json\n'+JSON.stringify(response)+'\n```')).toHaveLength(1));
});
