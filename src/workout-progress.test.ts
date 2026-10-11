import {describe,it,expect} from 'vitest';
import {emptyStore} from './engine';
import {sessionKey,toggleExercise,rolloverDate} from './workout-progress';
import {programs} from './catalog';
import {demonstratedExercises} from './ExerciseDemo';

describe('daily workout checklist',()=>{
 it('starts tomorrow unchecked and retains yesterday for history',()=>{
  const yesterday=sessionKey('2026-10-11',0,'Beginner');
  const tomorrow=sessionKey('2026-10-12',0,'Beginner');
  const store=toggleExercise(emptyStore,yesterday,'Bicep curl');
  expect(store.completed[yesterday]).toEqual(['Bicep curl']);
  expect(store.completed[tomorrow]||[]).toEqual([]);
  const next=toggleExercise(store,tomorrow,'Bicep curl');
  expect(next.completed[yesterday]).toEqual(['Bicep curl']);
  expect(next.completed[tomorrow]).toEqual(['Bicep curl']);
 });
 it('toggles using current progress without losing other movements',()=>{
  let store=toggleExercise(emptyStore,'today','Bicep curl');
  store=toggleExercise(store,'today','Front raise');
  store=toggleExercise(store,'today','Bicep curl');
  expect(store.completed.today).toEqual(['Front raise']);
 });
 it('advances today at midnight but leaves historical dates selected',()=>{
  expect(rolloverDate('2026-10-11','2026-10-11','2026-10-12')).toBe('2026-10-12');
  expect(rolloverDate('2026-10-08','2026-10-11','2026-10-12')).toBe('2026-10-08');
 });
 it('provides a matching animated guide for every program exercise',()=>{
  for(const program of programs)for(const name of program.exercises){
   expect(demonstratedExercises).toContain(name);
  }
 });
});
