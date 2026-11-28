import {addCents,parseBankDate,legacyCents} from './budget-domain.mjs';
import {cashflow} from './budget-relations.mjs';
const date=s=>parseBankDate(s,'ISO');
const month=(s)=>date(s).slice(0,7);
const validCents=(v,positive=false)=>{if(!Number.isSafeInteger(v)||(positive?v<=0:v<0))throw Error('invalid-money');return v;};
const label=s=>{const v=String(s??'').trim();if(!v||v.length>160)throw Error('invalid-label');return v;};
const id=s=>{if(typeof s!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(s))throw Error('invalid-id');return s;};
const day=(v)=>{if(!Number.isInteger(v)||v<1||v>31)throw Error('invalid-day');return v;};
export function monthDate(year,monthIndex,d){
 const dt=new Date(Date.UTC(year,monthIndex+1,0));dt.setUTCDate(Math.min(day(d),dt.getUTCDate()));return dt.toISOString().slice(0,10);
}
export function shiftMonth(value,delta,d=Number(value.slice(8))){
 date(value);if(!Number.isSafeInteger(delta)||Math.abs(delta)>1200)throw Error('invalid-offset');
 const [y,m]=value.split('-').map(Number);return monthDate(y,m-1+delta,d);
}
export function validatePlan(p){
 if(!p||typeof p!=='object'||Array.isArray(p))throw Error('invalid-plan');
 const start=date(p.start),end=p.end?date(p.end):null;
 if(end&&end<start)throw Error('invalid-end');
 if(!['monthly','quarterly','yearly','weekly'].includes(p.interval)||!['income','expense'].includes(p.direction))throw Error('invalid-plan');
 const changes=(p.changes||[]).map(c=>({date:date(c.date),cents:validCents(c.cents,true)})).sort((a,b)=>a.date.localeCompare(b.date));
 if(new Set(changes.map(c=>c.date)).size!==changes.length||changes.some(c=>c.date<start))throw Error('invalid-change');
 return {id:id(p.id),title:label(p.title),start,end,interval:p.interval,direction:p.direction,cents:validCents(p.cents,true),changes,cancelBy:p.cancelBy?date(p.cancelBy):null};
}
export function occurrences(plan,from,to){
 const p=validatePlan(plan);date(from);date(to);if(to<from)throw Error('invalid-range');
 const out=[];let due=p.start;
 const interval={monthly:1,quarterly:3,yearly:12}[p.interval];
 for(let i=0;due<=to&&(!p.end||due<=p.end);i++){
  if(i>=10000)throw Error('range-limit');
  if(due>=from){const change=p.changes.filter(x=>x.date<=due).at(-1);out.push({key:p.id+':'+due,planId:p.id,title:p.title,date:due,direction:p.direction,cents:change?.cents??p.cents});}
  if(interval)due=shiftMonth(p.start,(i+1)*interval);
  else {const dt=new Date(due+'T00:00:00Z');dt.setUTCDate(dt.getUTCDate()+7);due=dt.toISOString().slice(0,10);}
 }
 return out;
}
export function validateBill(b){
 const due=date(b.due);return {id:id(b.id),title:label(b.title),due,cents:validCents(b.cents,true),paidBookingId:b.paidBookingId==null?null:validCents(b.paidBookingId,true)};
}
export function validateReserve(r){
 return {id:id(r.id),title:label(r.title),target:validCents(r.target,true),saved:validCents(r.saved),due:date(r.due)};
}
export function reserveMonthly(r,today){
 r=validateReserve(r);date(today);
 const [y,m]=month(today).split('-').map(Number),[dy,dm]=month(r.due).split('-').map(Number);
 const months=Math.max(1,(dy-y)*12+dm-m+1);
 return Math.ceil(Math.max(0,addCents(r.target,-r.saved))/months);
}
export function payPeriod(today,payday){
 date(today);day(payday);const current=shiftMonth(today,0,payday);
 const start=today>=current?current:shiftMonth(today,-1,payday);
 const next=shiftMonth(start,1,payday),end=new Date(next+'T00:00:00Z');end.setUTCDate(end.getUTCDate()-1);
 return {start,end:end.toISOString().slice(0,10)};
}
export function validatePlanning(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid-planning');
 const list=(key,fn)=>{const a=value[key]??[];if(!Array.isArray(a)||a.length>1000)throw Error('invalid-list');const rows=a.map(fn);if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('duplicate-id');return rows;};
 return {plans:list('plans',validatePlan),bills:list('bills',validateBill),reserves:list('reserves',validateReserve),payday:day(value.payday??1),carryover:value.carryover===true};
}
export function forecast(entries,planning,from,to,openingCents=0){
 const p=validatePlanning(planning);date(from);date(to);if(to<from)throw Error('invalid-range');
 if(!Number.isSafeInteger(openingCents))throw Error('invalid-opening');
 const actual=cashflow(entries,from,to);
 const fulfilled=new Set(entries.filter(r=>r?.planOccurrence&&r.transferId==null&&r.refundOf==null).map(r=>r.planOccurrence));
 const pending=p.plans.flatMap(plan=>occurrences(plan,from,to)).filter(o=>!fulfilled.has(o.key));
 for(const b of p.bills){
  if(b.due<from||b.due>to)continue;
  const paid=entries.find(r=>r?.id===b.paidBookingId&&r.transferId==null&&r.entryType!=='einnahme'&&r.category!=='Einnahme');
  let settled=false;try{settled=!!paid&&legacyCents(paid.price)===b.cents;}catch{}
  if(!settled)pending.push({key:'bill:'+b.id,title:b.title,date:b.due,direction:'expense',cents:b.cents});
 }
 pending.sort((a,b)=>a.date.localeCompare(b.date)||a.key.localeCompare(b.key));
 const expectedIncome=addCents(...pending.filter(x=>x.direction==='income').map(x=>x.cents));
 const expectedExpense=addCents(...pending.filter(x=>x.direction==='expense').map(x=>x.cents));
 const reserve=addCents(...p.reserves.map(r=>reserveMonthly(r,from)));
 return {actual,pending,expectedIncome,expectedExpense,reserve,projected:addCents(openingCents,actual.balance,expectedIncome,-expectedExpense,-reserve)};
}
export function openingCarryover(entries,planning,start){
 date(start);if(!validatePlanning(planning).carryover)return 0;
 const prior=new Date(start+'T00:00:00Z');prior.setUTCDate(prior.getUTCDate()-1);
 return cashflow(entries,'0001-01-01',prior.toISOString().slice(0,10)).balance;
}

export function assignOccurrence(entries,planning,key,bookingId){
 const p=validatePlanning(planning);
 const [planId,due]=String(key).split(':');
 const plan=p.plans.find(x=>x.id===planId);
 const occurrence=plan&&occurrences(plan,due,due).find(x=>x.key===key);
 if(!occurrence)throw Error('unknown-occurrence');
 const booking=entries.find(x=>x?.id===bookingId);
 if(!booking||booking.transferId!=null||booking.refundOf!=null||legacyCents(booking.price)!==occurrence.cents||
  (booking.entryType==='einnahme'||booking.category==='Einnahme')!==(occurrence.direction==='income'))throw Error('invalid-booking');
 if(booking.planOccurrence&&booking.planOccurrence!==key||entries.some(x=>x?.id!==bookingId&&x?.planOccurrence===key)||p.bills.some(b=>b.paidBookingId===bookingId))throw Error('already-assigned');
 return entries.map(x=>x?.id===bookingId?{...x,planOccurrence:key}:x);
}
export function assignBill(entries,planning,billId,bookingId){
 const p=validatePlanning(planning),bill=p.bills.find(b=>b.id===billId),booking=entries.find(r=>r?.id===bookingId);
 if(!bill||!booking||booking.transferId!=null||booking.refundOf!=null||booking.planOccurrence||booking.entryType==='einnahme'||booking.category==='Einnahme'||legacyCents(booking.price)!==bill.cents||p.bills.some(b=>b.id!==billId&&b.paidBookingId===bookingId))throw Error('invalid-payment');
 return {...p,bills:p.bills.map(b=>b.id===billId?{...b,paidBookingId:bookingId}:b)};
}
