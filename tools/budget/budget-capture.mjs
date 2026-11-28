import {parseCents,legacyCents,parseBankDate,addCents} from './budget-domain.mjs';
const clean=(v,max=200)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('text');return v.trim();};
const id=v=>clean(v,100);
const amount=v=>{if(!Number.isSafeInteger(v)||v<=0)throw Error('amount');return v;};
const unique=rows=>{if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('duplicate');return rows;};
const list=v=>{if(!Array.isArray(v)||v.length>500)throw Error('list');return v;};
export const emptyCapture=()=>({templates:[],inbox:[],occasions:[]});
export function validateCapture(s={}){
 if(!s||typeof s!=='object'||Array.isArray(s))throw Error('capture');
 return {
 templates:unique(list(s.templates??[]).map(r=>({id:id(r.id),title:clean(r.title),store:String(r.store??'').slice(0,200),category:clean(r.category),cents:amount(r.cents)}))),
 inbox:unique(list(s.inbox??[]).map(r=>{if(typeof r.photo!=='string'||!/^data:image\/(jpeg|png|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(r.photo)||r.photo.length>5600000)throw Error('photo');return {id:id(r.id),name:clean(r.name),photo:r.photo};})),
 occasions:unique(list(s.occasions??[]).map(r=>({id:id(r.id),title:clean(r.title),bookingIds:[...new Set(list(r.bookingIds).map(n=>{if(!Number.isSafeInteger(n))throw Error('booking');return n;}))]})))
 };
}
export function unitPrice(cents,quantity,unit,locale='de'){
 amount(cents);const q=String(quantity).trim();const pattern=locale==='de'?/^\d+(?:,\d{1,6})?$/:/^\d+(?:\.\d{1,6})?$/;
 if(!pattern.test(q))throw Error('quantity');const [whole,fraction='']=q.replace(',','.').split('.');const scaled=BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,'0'));if(scaled<=0n)throw Error('quantity');
 const factor={g:1000,kg:1,ml:1000,l:1,pc:1}[unit];if(!factor)throw Error('unit');
 const result=(BigInt(cents)*BigInt(factor)*1000000n+scaled/2n)/scaled;if(result>BigInt(Number.MAX_SAFE_INTEGER))throw Error('amount');return {cents:Number(result),unit:['g','kg'].includes(unit)?'kg':['ml','l'].includes(unit)?'l':'pc'};
}
export function speechFields(text,locale='de'){
 const raw=clean(text,500);const m=locale==='de'?/^(.*?)\s+(\d+(?:,\d{1,2})?)\s*(?:euro|€)?$/i.exec(raw):/^(.*?)\s+(\d+(?:\.\d{1,2})?)\s*(?:euros?|€)?$/i.exec(raw);
 if(!m)return {title:raw};return {title:clean(m[1]),cents:amount(parseCents(m[2],locale))};
}
export function occasionTotal(entries,occasion){return addCents(...entries.filter(r=>occasion.bookingIds.includes(r.id)&&r.entryType!=='einnahme'&&r.category!=='Einnahme'&&r.transferId==null).map(r=>legacyCents(r.price)));}
export function queueReceipts(state,rows){return validateCapture({...state,inbox:[...state.inbox,...rows]});}
export function removeInbox(state,key){return validateCapture({...state,inbox:state.inbox.filter(r=>r.id!==key)});}
export const ocrLanguage=(v)=>{if(!['deu','eng','deu+eng'].includes(v))throw Error('language');return v;};
