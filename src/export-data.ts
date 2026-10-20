export function downloadCsv(headers:string[],rows:(string|number|null)[][],filename:string){
 const cell=(value:string|number|null)=>{
   if(value===null)return '';
   const raw=String(value),safe=typeof value==='string'&&/^[=+\-@\t\r]/.test(raw)?`'${raw}`:raw;
   return `"${safe.replace(/"/g,'""')}"`;
 };
 const text=[headers,...rows].map(row=>row.map(cell).join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
