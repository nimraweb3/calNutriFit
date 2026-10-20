export const nutrientDefinitions = {
  vitaminA:['Vitamin A','mcg RAE'], vitaminB1:['Thiamin (B1)','mg'], vitaminB2:['Riboflavin (B2)','mg'],
  vitaminB3:['Niacin (B3)','mg NE'], vitaminB5:['Pantothenic acid (B5)','mg'], vitaminB6:['Vitamin B6','mg'],
  vitaminB7:['Biotin (B7)','mcg'], vitaminB9:['Folate (B9)','mcg DFE'], vitaminB12:['Vitamin B12','mcg'],
  vitaminC:['Vitamin C','mg'], vitaminD:['Vitamin D','mcg'], vitaminE:['Vitamin E','mg alpha-tocopherol'],
  vitaminK:['Vitamin K','mcg'], calcium:['Calcium','mg'], iron:['Iron','mg'], magnesium:['Magnesium','mg'],
  zinc:['Zinc','mg'], potassium:['Potassium','mg'], sodium:['Sodium','mg'], phosphorus:['Phosphorus','mg'],
  selenium:['Selenium','mcg'], copper:['Copper','mcg'], manganese:['Manganese','mg'], iodine:['Iodine','mcg'],
  sugar:['Sugar','g'], saturatedFat:['Saturated fat','g'],
} as const;
export type NutrientKey = keyof typeof nutrientDefinitions;
export type Details = Partial<Record<NutrientKey,number>>;
export function scaleDetails(details:Details|undefined, factor:number):Details|undefined {
  if(!details)return undefined;
  if(!Number.isFinite(factor)||factor<0)throw Error('Invalid serving multiplier.');
  const result:Details={};
  for(const key of Object.keys(nutrientDefinitions) as NutrientKey[]){
    const value=details[key];if(value===undefined)continue;
    if(!Number.isFinite(value)||value<0)throw Error(`Invalid ${nutrientDefinitions[key][0]} amount.`);
    const scaled=value*factor;
    if(!Number.isFinite(scaled))throw Error(`The ${nutrientDefinitions[key][0]} amount is too large.`);
    result[key]=scaled;
  }
  return result;
}
export function detailContribution(values:({calories:number;details?:Details})[],key:NutrientKey){
  const known=values.filter(v=>Number.isFinite(v.details?.[key]));
  return {value:known.length?known.reduce((sum,v)=>sum+v.details![key]!,0):null,known:known.length,missing:values.length-known.length};
}
