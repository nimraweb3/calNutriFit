import type {Profile} from './engine';
import type {NutrientKey} from './nutrient-data';
export type NutrientReference={rda:number;kind:'RDA'|'AI';ul:number|null;scope:'total'|'supplements';source:string;note?:string;cdrr?:number};
// NIH ODS + Health Canada DRI tables, reviewed 2026-10-20.
// General nonpregnant/nonlactating categories. Form-specific ULs are NOT
// compared against aggregate label amounts when the relevant form is unknown.
export function nutrientTarget(key:NutrientKey,p:Profile|null):NutrientReference|null {
 if(!p||p.special||!Number.isInteger(p.age)||p.age<19||p.age>100||!['male','female'].includes(p.sex))return null;
 const base='https://ods.od.nih.gov/factsheets/';
 const tables='https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/';
 const vitamins=tables+'reference-values-vitamins.html',minerals=tables+'reference-values-elements.html';
 const reference=(rda:number,ul:number|null,source:string,kind:'RDA'|'AI'='RDA',note?:string):NutrientReference=>({rda,ul,source,kind,scope:'total',note});
 const male=p.sex==='male';
 switch(key){
  case 'calcium':return reference(p.age>70||(!male&&p.age>=51)?1200:1000,p.age>=51?2000:2500,base+'Calcium-HealthProfessional/');
  case 'vitaminD':return reference(p.age>70?20:15,100,base+'VitaminD-HealthProfessional/');
  case 'magnesium':return {...reference(male?(p.age<=30?400:420):(p.age<=30?310:320),350,base+'Magnesium-HealthProfessional/'),scope:'supplements'};
  case 'vitaminC':return reference(male?90:75,2000,base+'VitaminC-HealthProfessional/','RDA','Nonsmoker reference. Smoking increases the reference by 35 mg/day.');
  case 'vitaminA':return reference(male?900:700,null,vitamins,'RDA','Upper-limit check unavailable: preformed vitamin A is not recorded separately from carotenoids.');
  case 'vitaminB1':return reference(male?1.2:1.1,null,vitamins);
  case 'vitaminB2':return reference(male?1.3:1.1,null,vitamins);
  case 'vitaminB3':return reference(male?16:14,null,vitamins,'RDA','Upper-limit check unavailable: synthetic niacin is not recorded separately.');
  case 'vitaminB5':return reference(5,null,vitamins,'AI');
  case 'vitaminB6':return reference(p.age<=50?1.3:male?1.7:1.5,100,vitamins,'RDA','US/Canada DRI framework; upper limits differ between authorities.');
  case 'vitaminB7':return reference(30,null,vitamins,'AI');
  case 'vitaminB9':return reference(400,null,vitamins,'RDA','Upper-limit check unavailable: folic acid is not recorded separately from DFE.');
  case 'vitaminB12':return reference(2.4,null,vitamins);
  case 'vitaminE':return reference(15,null,vitamins,'RDA','Upper-limit check unavailable: synthetic vitamin E is not recorded separately.');
  case 'vitaminK':return reference(male?120:90,null,vitamins,'AI');
  case 'iron':return reference(!male&&p.age<51?18:8,45,minerals,'RDA','Mixed-diet reference with standard age-based menstruation assumptions. Vegetarian needs and individual circumstances may differ.');
  case 'zinc':return reference(male?11:8,40,minerals,'RDA','Mixed-diet reference; vegetarian needs can differ.');
  case 'potassium':return reference(male?3400:2600,null,minerals,'AI');
  case 'sodium':return {...reference(1500,null,minerals,'AI','CDRR is an intake-reduction reference, not a toxicity upper limit.'),cdrr:2300};
  case 'phosphorus':return reference(700,p.age>70?3000:4000,minerals);
  case 'selenium':return reference(55,400,minerals);
  case 'copper':return reference(900,10000,minerals);
  case 'manganese':return reference(male?2.3:1.8,11,minerals,'AI');
  case 'iodine':return reference(150,1100,minerals);
  default:return null;
 }
}
