import {useState} from 'react';

// Original vector guides. Coordinates: head, neck, hip, left/right elbow,
// left/right hand, left/right knee, left/right foot. Never remote media.
type Point=[number,number];
type Pose=Point[];
const stand:Pose=[[100,30],[100,48],[100,105],[76,72],[124,72],[70,100],[130,100],[84,140],[116,140],[80,175],[120,175]];
const pose=(changes:Record<number,Point>):Pose=>stand.map((p,i)=>changes[i]||p);
const squat=pose({0:[100,67],1:[100,85],2:[110,125],3:[78,90],4:[122,90],5:[90,68],6:[110,68],7:[65,140],8:[145,140],9:[65,175],10:[145,175]});
const hinge=pose({0:[58,70],1:[72,80],2:[125,108],3:[72,109],4:[87,109],5:[72,137],6:[87,137],7:[116,142],8:[136,142],9:[110,175],10:[140,175]});
const plank:Pose=[[43,73],[60,84],[122,102],[57,120],[68,118],[55,155],[75,155],[148,127],[155,127],[172,155],[180,155]];
const floor:Pose=[[35,150],[53,151],[113,154],[72,157],[75,153],[99,160],[99,155],[138,115],[147,115],[166,160],[176,160]];
const lunge=pose({0:[90,53],1:[90,71],2:[98,120],7:[53,124],8:[139,150],9:[45,175],10:[170,175]});
const seated=pose({0:[100,42],1:[100,60],2:[102,120],7:[69,143],8:[141,143],9:[52,168],10:[158,168]});
const rowTop=hinge.map((p,i)=>({3:[103,86],4:[119,90],5:[103,114],6:[119,118]}[i]||p)) as Pose;
export const guides:Record<string,{poses:Pose[];cue:string;view?:string}>={
 'Bicep curl':{poses:[stand,pose({5:[80,48],6:[120,48]})],cue:'Keep upper arms still; curl, then lower slowly.'},
 'Dumbbell shoulder press':{poses:[pose({3:[65,55],4:[135,55],5:[65,28],6:[135,28]}),pose({3:[80,23],4:[120,23],5:[85,8],6:[115,8]})],cue:'Press overhead without arching your lower back.'},
 'Front raise':{poses:[stand,pose({3:[65,49],4:[72,52],5:[32,49],6:[39,52]})],cue:'Raise arms forward to shoulder height, then lower.',view:'Side view'},
 'Lateral raise':{poses:[stand,pose({3:[65,50],4:[135,50],5:[30,53],6:[170,53]})],cue:'Lift out to the sides, stopping at shoulder height.'},
 'Triceps kickback':{poses:[rowTop,hinge.map((p,i)=>({3:[112,95],4:[122,98],5:[147,103],6:[158,106]}[i]||p)) as Pose],cue:'Hold upper arms by your torso; straighten elbows.',view:'Side view'},
 'Incline push-up':{poses:[pose({0:[53,43],1:[65,58],2:[117,108],3:[63,80],4:[74,80],5:[60,108],6:[76,108],7:[145,140],8:[150,140],9:[171,175],10:[180,175]}),pose({0:[40,66],1:[52,80],2:[108,117],3:[42,96],4:[58,99],5:[60,108],6:[76,108],7:[144,144],8:[153,146],9:[171,175],10:[180,175]})],cue:'Use a stable raised surface. Lower your chest, then press.',view:'Side view'},
 'Goblet squat':{poses:[pose({5:[90,65],6:[110,65]}),squat],cue:'Hold one weight close to your chest; sit down between your hips.'},
 'Side lunge':{poses:[stand,pose({0:[67,60],1:[67,78],2:[80,120],7:[48,135],8:[133,146],9:[40,175],10:[175,175]})],cue:'Step sideways, bend that knee and send hips back. Switch sides.'},
 'Glute bridge':{poses:[floor,floor.map((p,i)=>({2:[111,112],3:[72,154],4:[75,151]}[i]||p)) as Pose],cue:'Press through feet to lift hips; lower with control.',view:'Side view'},
 'Calf raise':{poses:[stand,stand.map(([x,y],i)=>[x,i>8?y:y-12] as Point)],cue:'Rise onto the balls of your feet, pause, then lower heels.'},
 'Step-up':{poses:[pose({7:[64,107],9:[60,135]}),pose({0:[85,10],1:[85,28],2:[85,80],7:[70,108],8:[112,98],9:[60,135],10:[130,127]})],cue:'Step onto a stable low platform; step back down. Switch legs.'},
 'Russian twist':{poses:[seated.map((p,i)=>({3:[76,83],4:[95,89],5:[65,103],6:[65,103]}[i]||p)) as Pose,seated.map((p,i)=>({3:[105,89],4:[124,83],5:[135,103],6:[135,103]}[i]||p)) as Pose],cue:'Keep feet grounded; turn your ribcage gently from side to side.'},
 'Mountain climber':{poses:[plank,plank.map((p,i)=>({7:[95,133],9:[111,155]}[i]||p)) as Pose,plank,plank.map((p,i)=>({8:[96,130],10:[113,155]}[i]||p)) as Pose],cue:'From a strong plank, alternate bringing knees forward.',view:'Side view'},
 'Standing oblique crunch':{poses:[pose({3:[70,35],4:[130,35],5:[87,24],6:[113,24]}),pose({0:[120,49],1:[115,66],3:[81,51],4:[140,78],5:[106,42],6:[132,55],8:[140,106],10:[150,140]})],cue:'Bring one knee toward the same-side elbow. Repeat on both sides.'},
 'Plank shoulder tap':{poses:[plank,plank.map((p,i)=>({4:[83,100],6:[60,84]}[i]||p)) as Pose,plank,plank.map((p,i)=>({3:[79,101],5:[65,86]}[i]||p)) as Pose],cue:'Tap the opposite shoulder, alternating hands; keep hips steady.'},
 'High knees':{poses:[pose({7:[64,105],9:[63,142],5:[80,50]}),stand,pose({8:[136,105],10:[137,142],6:[120,50]}),stand],cue:'Alternate lifting knees. March instead of running for lower impact.'},
 'Shoulder opener':{poses:[pose({3:[65,50],4:[135,50],5:[35,53],6:[165,53]}),pose({3:[78,57],4:[122,57],5:[113,59],6:[87,62]})],cue:'Gently open arms, then bring them across your chest.'},
 'Cat-cow':{poses:[pose({0:[42,99],1:[63,104],2:[131,97],3:[61,129],4:[69,128],5:[59,159],6:[69,159],7:[137,158],8:[145,158],9:[172,160],10:[180,160]}),pose({0:[44,71],1:[63,99],2:[131,113],3:[61,129],4:[69,128],5:[59,159],6:[69,159],7:[137,158],8:[145,158],9:[172,160],10:[180,160]})],cue:'On hands and knees, gently round then soften your back with your breath.',view:'Side view'},
 'Hip opener':{poses:[pose({8:[125,106],10:[127,140]}),pose({8:[150,114],10:[151,147]})],cue:'Hold support if needed; lift a knee and gently open it outward.'},
 'Slow squat':{poses:[stand,squat],cue:'Sit hips back and down slowly, then stand comfortably.'},
 'Light dumbbell row':{poses:[hinge,rowTop],cue:'Hinge at hips; draw elbows back, then lower weights.',view:'Side view'},
 'Dumbbell thruster':{poses:[squat,pose({3:[80,23],4:[120,23],5:[85,8],6:[115,8]})],cue:'From a squat with weights at shoulders, stand and press overhead.'},
 'Bent-over row':{poses:[hinge,rowTop],cue:'Keep your back neutral; draw elbows back toward your hips.',view:'Side view'},
 'Dumbbell deadlift':{poses:[stand,hinge],cue:'Keep weights close; hinge at hips with softly bent knees, then stand.',view:'Side view'},
 'Reverse lunge':{poses:[stand,lunge],cue:'Step one foot back and lower both knees; return and switch legs.',view:'Side view'},
 'Standing punch':{poses:[pose({5:[83,51],6:[117,51]}),pose({3:[61,51],5:[29,51],6:[117,51]}),pose({5:[83,51],6:[117,51]}),pose({4:[139,51],6:[171,51],5:[83,51]})],cue:'Alternate controlled punches with soft elbows; avoid locking joints.'},
};
export const demonstratedExercises=Object.keys(guides);
export const guideSlug=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export default function ExerciseDemo({name}:{name:string}) {
 const [playing,setPlaying]=useState(()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const guide=guides[name];
 if(!guide)return null;
 return <figure className="exercise-demo"><img src={`/workouts/${guideSlug(name)}.${playing?'gif':'png'}`} width="400" height="390" loading="lazy" alt={`${name}: simplified animated movement guide`}/><figcaption><button type="button" onClick={()=>setPlaying(p=>!p)} aria-label={`${playing?'Pause':'Play'} ${name} animation`}>{playing?'Pause':'Play'} guide</button><span>{guide.view||'Front view'}</span></figcaption><p>{guide.cue}</p></figure>;
}
