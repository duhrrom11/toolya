/**
 * Toolya Connect: Rückgaben and upcoming car/pet deadlines.
 * Each source owns its snapshot. No cross-tool copies and no invented completion.
 */
import {createCloudRepository} from './cloud-repository.mjs';
import {validateLoansSnapshot,validateCarSnapshot,validatePetHealthSnapshot} from './cloud-controller.mjs';

const sources=Object.freeze({
 loans:{tool:'verliehene-gegenstaende-verwalten',url:'/tools/loans/',origin:'Verliehene Dinge',validate:validateLoansSnapshot},
 car:{tool:'autokosten-reifenwechsel',url:'/tools/car/',origin:'Autokosten',validate:validateCarSnapshot},
 pet:{tool:'haustier-gesundheitspass',url:'/tools/pet-health/',origin:'Tiergesundheit',validate:validatePetHealthSnapshot}
});
export function validDay(v){
 if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
 const d=new Date(v+'T00:00:00Z');
 return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===v;
}
export function addDays(day,count){
 if(!validDay(day)||!Number.isSafeInteger(count))return null;
 return new Date(Date.parse(day+'T00:00:00Z')+count*86400000).toISOString().slice(0,10);
}
const label=x=>typeof x==='string'?x.trim().slice(0,160):'';
const safeId=x=>(typeof x==='number'&&Number.isSafeInteger(x)&&x>=0)||
 (typeof x==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(x));
const task=(source,itemId,text,due,readonly,extra={})=>({
 source,kind:'task',id:source+':'+itemId,itemId:String(itemId),
 text:label(text),due,done:false,readonly,origin:sources[source].origin,url:sources[source].url,...extra
});
export function projectDueTasks(source,snapshot,today=new Date().toLocaleDateString('sv-SE')){
 if(!sources[source])throw Error('Unbekannte Aufgabenquelle.');
 sources[source].validate(snapshot);
 if(!validDay(today))throw Error('Ungültiges Tagesdatum.');
 const horizon=addDays(today,30);
 let result=[];
 if(source==='loans')result=snapshot.items.filter(i=>
  i&&safeId(i.id)&&i.status==='active'&&validDay(i.returnDate)&&i.returnDate<=horizon&&label(i.title))
  .map(i=>task(source,i.id,'Rückgabe: '+i.title+(label(i.person)?' · '+i.person:''),i.returnDate,false,
    {display:{kind:'loan-return',title:label(i.title),person:label(i.person)}}));
 if(source==='car'){
  const names=new Map(snapshot.cars.filter(c=>c&&safeId(c.id)).map(c=>[String(c.id),label(c.name)]));
  result=snapshot.events.filter(e=>e&&safeId(e.id)&&
    ['TÜV / HU','Inspektion','Versicherung','Kfz-Steuer'].includes(e.type)&&
    validDay(e.date)&&e.date>=today&&e.date<=horizon)
    .map(e=>task(source,e.id,(names.get(String(e.carId))||'Fahrzeug')+' · '+e.type+(label(e.title)?' · '+e.title:''),e.date,true,
      {display:{kind:'car-deadline',vehicle:names.get(String(e.carId))||'',type:e.type,title:label(e.title)}}));
 }
 if(source==='pet'){
  const names=new Map(snapshot.pets.filter(p=>p&&safeId(p.id)).map(p=>[String(p.id),label(p.name)]));
  result=snapshot.events.filter(e=>e&&safeId(e.id)&&e.type==='Impfung'&&
    validDay(e.expiryDate)&&e.expiryDate<=horizon)
    .map(e=>task(source,'vaccine-'+e.id,(names.get(String(e.petId))||'Haustier')+
      ' · Impfung auffrischen'+(label(e.title)?' · '+e.title:''),e.expiryDate,true,
      {display:{kind:'pet-vaccine',pet:names.get(String(e.petId))||'',title:label(e.title)}}));
  // Worming is calculated by the source tool from the last recorded event +90 days.
  const latest=new Map();
  for(const e of snapshot.events){
   if(!e||!safeId(e.id)||e.type!=='Entwurmung'||!safeId(e.petId)||!validDay(e.date))continue;
   const key=String(e.petId),old=latest.get(key);
   if(!old||e.date>old.date)latest.set(key,e);
  }
  for(const [petId,e] of latest){
   const due=addDays(e.date,90);
   if(due<=horizon)result.push(task(source,'worm-'+petId,
     (names.get(petId)||'Haustier')+' · Entwurmung prüfen',due,true,
     {display:{kind:'pet-deworming',pet:names.get(petId)||''}}));
  }
 }
 return result.filter(x=>x.text&&validDay(x.due)).sort((a,b)=>a.due.localeCompare(b.due)||a.id.localeCompare(b.id));
}
export function createDueSource(client,source){
 const config=sources[source];if(!config)throw Error('Unbekannte Aufgabenquelle.');
 const repo=createCloudRepository(client,config.tool);
 let owner=null,revision=null,visibleIds=new Set(),last=null;
 async function verified(){
  const {data,error}=await client.auth.getUser();
  if(error||!data?.user?.id||data.user.is_anonymous)throw Error('Toolya-Anmeldung erforderlich.');
  return data.user.id;
 }
 async function load(){
  const uid=await verified(),row=await repo.read();
  if((await verified())!==uid)throw Error('Konto beim Lesen gewechselt.');
  owner=uid;revision=row.revision;last=row.exists?config.validate(row.data):null;
  const tasks=row.exists?projectDueTasks(source,last):[];
  visibleIds=new Set(tasks.map(t=>t.id));
  return {shopping:[],tasks};
 }
 async function setDone(item,done){
  const uid=await verified();
  if(uid!==owner||!visibleIds.has(item?.id)||item.source!==source||
   item.kind!=='task')throw Error('Aufgabe muss zuerst neu geladen werden.');
  if(source!=='loans')throw Error('Diese Frist kann nur im Original-Tool bestätigt werden.');
  if(done!==true)throw Error('Rückgaben können nur im Original-Tool zurückgesetzt werden.');
  // Re-read before mutation, and CAS against that latest revision.
  const row=await repo.read();
  if((await verified())!==uid)throw Error('Konto beim Speichern gewechselt.');
  if(!row.exists)throw Error('Rückgabe nicht mehr vorhanden.');
  const data=config.validate(row.data);
  const record=data.items.find(i=>i&&String(i.id)===item.itemId);
  if(!record||record.status!=='active'||!validDay(record.returnDate))
   throw Error('Rückgabe wurde bereits verändert.');
  if(record.returnDate!==item.due)throw Error('Rückgabetermin wurde geändert. Bitte neu laden.');
  record.status='returned';
  await repo.save(data,row.revision);
  if((await verified())!==uid)throw Error('Konto während des Speicherns gewechselt.');
  return load();
 }
 return Object.freeze({load,setDone});
}
