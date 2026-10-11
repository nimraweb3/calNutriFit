import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
fs.mkdirSync('src/legacy',{recursive:true});
for(const [source,target] of [['src/types/nutrition.ts','nutrition.ts'],['src/data/foodDatabase.ts','foodDatabase.ts'],['src/data/portionUnits.ts','portionUnits.ts']]){
 let content=execFileSync('git',['show',`nutrio-pulse-tracker/main:${source}`],{encoding:'utf8'}).replaceAll("@/types/nutrition","./nutrition").replaceAll("@/data/portionUnits","./portionUnits");
 fs.writeFileSync(`src/legacy/${target}`,content);
}
console.log('Legacy catalog imported for resolving existing recipe ingredient IDs. Source claims remain unverified.');
