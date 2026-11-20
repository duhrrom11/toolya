/**
 * Toolya Connect: Gießplan is the single source of truth for watering tasks.
 * No separate dashboard task copies, no user_data writes without revision CAS.
 * Plant names and dates are user-owned; the dashboard must use the same verified account.
 */
import { createCloudRepository } from './cloud-repository.mjs';
import { validatePlantsSnapshot } from './cloud-controller.mjs';

export const PLANTS_TOOL = 'pflanzenpflege-giessplan';
const DAY = 86400000;
export const isCalendarDay = text => {
  if (typeof text !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const d = new Date(text + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === text;
};
const toDate = text => new Date(text + 'T00:00:00Z');
export const todayLocal = (date = new Date()) => [
  date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')
].join('-');
export function wateringDueDate(plant) {
  if (!plant || !isCalendarDay(plant.lastWatered)) return null;
  const n=Number(plant.interval), interval=Number.isFinite(n)&&n>0?Math.min(3650,Math.floor(n)):7;
  const scheduled = new Date(toDate(plant.lastWatered).getTime()+interval*DAY).toISOString().slice(0,10);
  return isCalendarDay(plant.connectDue) ? plant.connectDue : scheduled;
}
export function projectWateringTasks(snapshot, today=todayLocal()) {
  validatePlantsSnapshot(snapshot);
  if (!isCalendarDay(today)) throw Error('Ungültiges Tagesdatum.');
  return snapshot.plants.filter(p => p && Number.isSafeInteger(p.id) && p.id >= 0 &&
      typeof p.name === 'string' && p.name.trim() && wateringDueDate(p))
    .map(p => ({id:String(p.id),name:p.name.trim(),due:wateringDueDate(p),
      overdue:wateringDueDate(p)<today,source:'pflanzenpflege-giessplan',planned:isCalendarDay(p.connectDue)}))
    .sort((a,b)=>a.due.localeCompare(b.due)||a.name.localeCompare(b.name,'de'));
}
export function scheduleWatering(snapshot, plantId, date, today=todayLocal()) {
  validatePlantsSnapshot(snapshot);
  if (!isCalendarDay(date) || date<today) throw Error('Bitte einen gültigen zukünftigen Gießtag wählen.');
  const plant=snapshot.plants.find(p=>String(p.id)===String(plantId));
  if (!plant) throw Error('Pflanze im Gießplan nicht mehr vorhanden.');
  const existing=wateringDueDate(plant);
  if (!existing) throw Error('Pflanze hat keinen gültigen Gießrhythmus.');
  if (date<=plant.lastWatered) throw Error('Der neue Gießtag muss nach dem letzten Gießen liegen.');
  if (plant.connectDue===date) return false;
  plant.connectDue=date;
  return true;
}
export function applyWatering(snapshot,plantId,today=todayLocal()) {
  validatePlantsSnapshot(snapshot);
  if(!isCalendarDay(today)) throw Error('Ungültiges Tagesdatum.');
  const plant=snapshot.plants.find(p=>String(p.id)===String(plantId));
  if(!plant) throw Error('Pflanze nicht mehr vorhanden.');
  if(!isCalendarDay(plant.lastWatered)) throw Error('Gießdatum der Pflanze ist ungültig.');
  if(plant.lastWatered===today || (Array.isArray(plant.waterHistory)&&plant.waterHistory.includes(today)))
    throw Error('Diese Pflanze wurde heute bereits gegossen.');
  plant.lastWatered=today;
  plant.waterHistory=[today,...(Array.isArray(plant.waterHistory)?plant.waterHistory:[])
    .filter(d=>isCalendarDay(d)&&d!==today)].slice(0,5);
  delete plant.connectDue;
  const raw=Number(plant.potSize), pot=Number.isFinite(raw)&&raw>0?raw:15;
  const used=(pot<=10?120:pot<=15?300:pot<=20?600:1500)/1000;
  const old=Number(snapshot.monthWaterLiters);
  snapshot.monthWaterLiters=(Number.isFinite(old)&&old>=0?old:0)+used;
  const maxRaw=Number(snapshot.cisternMax), max=Number.isFinite(maxRaw)&&maxRaw>0?maxRaw:500;
  const currentRaw=snapshot.cisternCurrent===undefined?max:Number(snapshot.cisternCurrent);
  const available=Number.isFinite(currentRaw)?Math.min(max,Math.max(0,currentRaw)):max;
  snapshot.cisternCurrent=Math.max(0,available-used);
  return true;
}
export function createWateringConnect(client) {
  const repository=createCloudRepository(client,PLANTS_TOOL);
  let owner=null,reading=false;
  async function checkedUser() {
    const {data,error}=await client.auth.getUser();
    if(error||!data?.user?.id||data.user.is_anonymous)throw Error('Angemeldetes Toolya-Konto erforderlich.');
    return data.user.id;
  }
  async function read() {
    const uid=await checkedUser();
    const result=await repository.read();
    if((await checkedUser())!==uid)throw Error('Konto während des Lesens gewechselt.');
    if(!result.exists)return {userId:uid,revision:null,tasks:[],plants:[],exists:false};
    const data=validatePlantsSnapshot(result.data);
    return {userId:uid,revision:result.revision,exists:true,
      tasks:projectWateringTasks(data),plants:projectWateringTasks(data).map(x=>({id:x.id,name:x.name}))};
  }
  async function mutate(plantId,action,date) {
    const uid=await checkedUser();
    const result=await repository.read();
    if(!result.exists)throw Error('Noch kein Gießplan in Toolya Cloud vorhanden.');
    const snapshot=validatePlantsSnapshot(result.data);
    const changed=action==='schedule'?scheduleWatering(snapshot,plantId,date):applyWatering(snapshot,plantId);
    if(!changed)return read();
    if((await checkedUser())!==uid)throw Error('Konto während des Speicherns gewechselt.');
    await repository.save(snapshot,result.revision);
    if((await checkedUser())!==uid)throw Error('Konto während des Speicherns gewechselt.');
    return read();
  }
  return Object.freeze({read,schedule:(id,date)=>mutate(id,'schedule',date),complete:id=>mutate(id,'complete')});
}
