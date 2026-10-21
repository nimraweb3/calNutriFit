import {describe,it,expect} from 'vitest';
import {emptyStore,type PersonalGoal} from './engine';
import {goalValue,goalProgress,validateGoal} from './personal-goals';
import {validatePhotoMetadata,preparePhoto,deletePhoto} from './progress-photos';
const goal:PersonalGoal={id:'g',name:'My goal',kind:'water',target:2000,unit:'ml',start:'2026-01-01',completed:false};
describe('personal goal progress',()=>{
 it('uses saved water and steps for the selected date only',()=>{const data={...emptyStore,dailyCheckIns:[{date:'2026-01-01',water:750,steps:3000}]};expect(goalValue(goal,data,'2026-01-01')).toBe(750);expect(goalValue({...goal,kind:'steps'},data,'2026-01-01')).toBe(3000);expect(goalValue(goal,data,'2026-01-02')).toBe(0)});
 it('uses actual intake including supplements once',()=>{const data={...emptyStore,supplements:[{id:'s',name:'Test',amount:'one',calories:40,protein:10,taken:['2026-01-01']}]};expect(goalValue({...goal,kind:'protein'},data,'2026-01-01')).toBe(10)});
 it('measures weight progress in the requested direction',()=>{const data={...emptyStore,weights:[{id:'w',date:'2026-01-01',weight:80}]};expect(goalProgress({...goal,kind:'weight',target:70},75,data)).toBe(50);expect(goalProgress({...goal,kind:'weight',target:90},85,data)).toBe(50);expect(goalProgress({...goal,kind:'weight',target:70},85,data)).toBe(0)});
 it('rejects invalid targets before saving',()=>{expect(()=>validateGoal({...goal,target:NaN})).toThrow();expect(()=>validateGoal({...goal,end:'2025-01-01'})).toThrow();expect(()=>validateGoal({...goal,kind:'weight',target:10})).toThrow()});
});
describe('private photo boundaries',()=>{
 it('rejects impossible dates and oversized notes',()=>{expect(()=>validatePhotoMetadata('2026-02-30','','Front')).toThrow();expect(()=>validatePhotoMetadata('2020-01-01','x'.repeat(301),'Front')).toThrow();expect(()=>validatePhotoMetadata('2020-01-01','','Public')).toThrow()});
 it('rejects files before decoding unsupported or oversized content',async()=>{await expect(preparePhoto(new File(['<svg/>'],'image.svg',{type:'image/svg+xml'}))).rejects.toThrow('JPEG');await expect(preparePhoto(new File([new Uint8Array(5*1024*1024+1)],'large.jpg',{type:'image/jpeg'}))).rejects.toThrow('5 MB')});
 it('rejects cross-account deletion before contacting storage',async()=>{await expect(deletePhoto('owner',{id:'x',user_id:'someone-else',path:'someone-else/x.jpg',taken_on:'2020-01-01',category:'Front',note:'',created_at:''})).rejects.toThrow('not available')});
});
