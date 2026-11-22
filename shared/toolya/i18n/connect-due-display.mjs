/**
 * Source-owned DE/EN due reminder presentation. Never translate user-entered
 * names or titles, and never write projected metadata to a CloudOnly snapshot.
 */
const types=Object.freeze({'TÜV / HU':'Vehicle inspection',Inspektion:'Service',Versicherung:'Insurance','Kfz-Steuer':'Vehicle tax'});
const txt=x=>typeof x==='string'?x:'';
export function formatDueTaskDisplay(item,lang='de'){
 if(!item||typeof item.text!=='string')return '';
 if(lang!=='en')return item.text;
 const v=item.display;
 if(!v||typeof v!=='object')return item.text;
 let value;
 if(item.source==='loans'&&v.kind==='loan-return'){
  value='Return: '+txt(v.title)+(v.person?' · '+txt(v.person):'');
 }else if(item.source==='car'&&v.kind==='car-deadline'){
  if(!Object.hasOwn(types,v.type))return item.text;
  value=(txt(v.vehicle)||'Vehicle')+' · '+types[v.type]+(v.title?' · '+txt(v.title):'');
 }else if(item.source==='pet'&&v.kind==='pet-vaccine'){
  value=(txt(v.pet)||'Pet')+' · Vaccination booster due'+(v.title?' · '+txt(v.title):'');
 }else if(item.source==='pet'&&v.kind==='pet-deworming'){
  value=(txt(v.pet)||'Pet')+' · Check deworming';
 }else return item.text;
 return value.slice(0,160);
}
