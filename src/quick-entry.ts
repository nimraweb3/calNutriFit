import type {Food} from './engine';
export function parseQuickEntry(text:string,catalog:Food[]){
 const aliases:Record<string,string>={egg:'Egg, boiled',eggs:'Egg, boiled',banana:'Banana',bananas:'Banana',roti:'Roti (whole wheat)',rotis:'Roti (whole wheat)',apple:'Apple',apples:'Apple',date:'Dates',dates:'Dates'};
 const parts=text.toLowerCase().split(/\s+and\s+|,/).map(s=>s.trim()).filter(Boolean);
 return parts.map(part=>{const match=part.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);if(!match)return {text:part,food:null,quantity:0};const quantity=Number(match[1]),term=match[2];const name=aliases[term]||term;const food=catalog.find(f=>f.name.toLowerCase()===name.toLowerCase())||null;return {text:part,food,quantity}});
}
