import {legacyCents,parseBankDate,decimalCents} from './budget-domain.mjs';
const date=v=>parseBankDate(v,'ISO');
const nonnegative=v=>{if(typeof v!=='number'||!Number.isFinite(v)||v<0)throw Error('number');return v;};
const key=v=>{if(!Number.isSafeInteger(v)||v<0)throw Error('id');return v;};
export function meterEstimates(snapshot, electricityRate='HT'){
 if(!['HT','NT'].includes(electricityRate))throw Error('rate');
 const groups=new Map();
 for(const r of snapshot.readings){if(!r||!['Strom','Wasser','Gas'].includes(r.type)||typeof r.name!=='string')continue;
 try{date(r.date);nonnegative(r.value);key(r.id);}catch{continue;}
 const k=JSON.stringify([r.type,r.name,r.location||'']);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
 const out=[];
 for(const rows of groups.values()){
 rows.sort((a,b)=>a.date.localeCompare(b.date));const b=rows.at(-1),a=rows.at(-2);
 if(!a||b.date===a.date||b.isExchange||b.value<a.value)continue;
 const tariff=snapshot.tarifs[b.type];if(!tariff)continue;
 try{
 const rate=nonnegative(b.type==='Strom'?tariff['price'+electricityRate]:tariff.price);
 const factor=b.type==='Gas'?nonnegative(tariff.calib):1;if(!factor||!rate)continue;
 const consumption=b.value-a.value,raw=consumption*factor*rate*100,cents=Math.round(raw);
 if(!Number.isSafeInteger(cents))continue;
 out.push({type:b.type,name:b.name,location:b.location||'',from:a.date,to:b.date,consumption,rate,factor,cents,electricityRate});
 }catch{}
 }
 return out;
}
export function carCandidates(snapshot){
 const counts=new Map();for(const e of snapshot.events){if(e&&Number.isSafeInteger(e.id))counts.set(e.id,(counts.get(e.id)||0)+1);}
 const out=[];
 for(const e of snapshot.events){try{
 if(counts.get(e.id)!==1)continue;
 const id=key(e.id),carId=key(e.carId),cents=legacyCents(e.cost);if(cents<=0)continue;
 if(typeof e.title!=='string'||!e.title.trim())continue;
 out.push({sourceKey:'car:'+id,carId,title:e.title.trim(),date:date(e.date),cents});
 }catch{}}
 return out;
}
const matches=(r,c)=>r.date===c.date&&r.title===c.title&&legacyCents(r.price)===c.cents;
export function carReview(entries,candidates){
 const byKey=new Map(candidates.map(c=>[c.sourceKey,c]));
 const existing=new Map();
 for(const r of entries){if(r.carSource?.sourceKey){if(existing.has(r.carSource.sourceKey))throw Error('duplicate source');existing.set(r.carSource.sourceKey,r);}}
 const result=[];
 for(const c of candidates){const r=existing.get(c.sourceKey);result.push({kind:!r?'new':matches(r,c)?'same':'changed',candidate:c,bookingId:r?.id});}
 for(const [sourceKey,r] of existing)if(!byKey.has(sourceKey))result.push({kind:'missing',sourceKey,bookingId:r.id});
 return result;
}
export function applyCarReview(entries,item,confirmed,newId){
 if(confirmed!==true)throw Error('confirmation required');
 if(item.kind==='new'){
 const c=item.candidate;if(entries.some(r=>r.carSource?.sourceKey===c.sourceKey||r.id===newId))throw Error('duplicate');
 return [...entries,{id:key(newId),title:c.title,date:date(c.date),price:Number(decimalCents(c.cents)),category:'Auto',entryType:'ausgabe',photos:[],carSource:{sourceKey:c.sourceKey,carId:c.carId}}];
 }
 const r=entries.find(x=>x.id===item.bookingId);if(!r||r.transferId!=null||r.refundOf!=null||r.splits?.length||entries.some(x=>x.refundOf===r.id))throw Error('linked or missing booking');
 if(item.kind==='changed'){
 const c=item.candidate;if(r.carSource?.sourceKey!==c.sourceKey)throw Error('source');
 return entries.map(x=>x.id===r.id?{...x,title:c.title,date:date(c.date),price:Number(decimalCents(c.cents)),carSource:{sourceKey:c.sourceKey,carId:c.carId}}:x);
 }
 if(item.kind==='missing'){if(r.carSource?.sourceKey!==item.sourceKey)throw Error('source');return entries.map(x=>{if(x.id!==r.id)return x;const {carSource,...rest}=x;return rest;});}
 throw Error('review action');
}
