/* Toolya Clever sparen: pure computations. No account, DOM, or network access. */
(function(root){
 'use strict';
 const round=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
 const euro=n=>Number.isFinite(n)?new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n):'–';
 const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00'));
 const ISO=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 const normal=s=>String(s||'').toLocaleLowerCase('de-DE').normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
 const amount=x=>{const n=Number(x);return Number.isFinite(n)&&n>=0?n:NaN};
 const validEntries=data=>(Array.isArray(data)?data:[]).filter(e=>e&&typeof e==='object'&&!Array.isArray(e)&&validDate(e.date)&&Number.isFinite(amount(e.price)));
 const expense=e=>e.entryType!=='einnahme'&&e.category!=='Einnahme';
 const period=(entries,from,to,category=null)=>validEntries(entries).filter(e=>e.date>=from&&e.date<=to&&expense(e)&&(!category||e.category===category)).reduce((sum,e)=>sum+amount(e.price),0);
 const monthStart=date=>ISO(new Date(date.getFullYear(),date.getMonth(),1));
 const endMonth=date=>ISO(new Date(date.getFullYear(),date.getMonth()+1,0));
 const lastMonth=date=>new Date(date.getFullYear(),date.getMonth()-1,1);
 const monthCompare=(entries,now=new Date())=>{
  const thisMonth=monthStart(now),previous=lastMonth(now),day=now.getDate();
  const previousEnd=ISO(new Date(previous.getFullYear(),previous.getMonth(),Math.min(day,new Date(previous.getFullYear(),previous.getMonth()+1,0).getDate())));
  const current=period(entries,thisMonth,ISO(now)),prior=period(entries,monthStart(previous),previousEnd);
  const categories=[...new Set(validEntries(entries).filter(expense).map(x=>x.category||'Sonstiges'))];
  const parts=categories.map(category=>({name:category,now:period(entries,thisMonth,ISO(now),category),previous:period(entries,monthStart(previous),previousEnd,category)})).filter(x=>x.now>0||x.previous>0).sort((a,b)=>(b.now-b.previous)-(a.now-a.previous));
  return {current:round(current),previous:round(prior),difference:round(current-prior),categories:parts,hasPrior:validEntries(entries).some(e=>expense(e)&&e.date>=monthStart(previous)&&e.date<=previousEnd)};
 };
 const weekBounds=(today=new Date())=>{const day=(today.getDay()+6)%7;const monday=new Date(today.getFullYear(),today.getMonth(),today.getDate()-day),sunday=new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+6);return{start:ISO(monday),end:ISO(sunday)}};
 function upcomingFixed(entries,now=new Date(),until=weekBounds(now).end){
  const data=validEntries(entries).filter(e=>expense(e)&&e.isFixkosten);
  const current=ISO(now),startMonth=monthStart(now),monthBefore=monthStart(lastMonth(now));
  const candidates=data.filter(x=>x.date<startMonth&&x.date>=monthBefore);
  const upcoming=[],seen=new Set();
  for(const e of candidates){
   const key=normal(e.title)+'|'+normal(e.store);if(!key.trim()||seen.has(key))continue;seen.add(key);
   const day=Math.min(Number(e.date.slice(8)),new Date(now.getFullYear(),now.getMonth()+1,0).getDate());
   const due=ISO(new Date(now.getFullYear(),now.getMonth(),day));
   if(due<current||due>until)continue;
   const alreadyPaid=data.some(x=>x.date>=startMonth&&normal(x.title)+'|'+normal(x.store)===key);
   if(!alreadyPaid)upcoming.push({title:e.title||'Feste Ausgabe',date:due,price:amount(e.price)});
  }
  return upcoming;
 }
 function weekly(entries,budget,now=new Date()){
  const {start,end}=weekBounds(now),spent=round(period(entries,start,end));
  const pending=upcomingFixed(entries,now,end);
  const reserved=round(pending.reduce((s,x)=>s+x.price,0));
  const limit=amount(budget);
  return {start,end,spent,pending,reserved,limit,remaining:Number.isFinite(limit)&&limit>0?round(limit-spent-reserved):null};
 }
 function prices(entries){
  const observations=[];
  for(const e of validEntries(entries)){
   if(!expense(e)||!Array.isArray(e.lineItems))continue;
   for(const item of e.lineItems){
    if(!item||typeof item!=='object')continue;
    const name=String(item.name||'').trim().slice(0,100),qty=Number(item.quantity),total=Number(item.total);
    if(!name||!Number.isFinite(qty)||qty<=0||!Number.isFinite(total)||total<=0||total>100000)continue;
    const unit=String(item.unit||'Stück').trim().slice(0,24)||'Stück';
    observations.push({key:normal(name)+'|'+normal(unit),name,unit,date:e.date,store:String(e.store||''),quantity:qty,total:round(total),unitPrice:round(total/qty)});
   }
  }
  observations.sort((a,b)=>a.date.localeCompare(b.date));
  const map=new Map();
  for(const item of observations){const arr=map.get(item.key)||[];arr.push(item);map.set(item.key,arr)}
  return map;
 }
 function priceSummary(map){
  return [...map.entries()].map(([key,history])=>{
   const last=history[history.length-1];
   // Multiple identical entries from one shopping day are not a new price comparison.
   const previous=history.slice(0,-1).reverse().find(item=>item.date!==last.date||item.store!==last.store||item.unitPrice!==last.unitPrice)||null;
   return {key,...last,previous,change:previous?round(last.unitPrice-previous.unitPrice):null,count:history.length};
  }).sort((a,b)=>b.date.localeCompare(a.date));
 }
 function findPrice(map,name,unit='Stück'){return map.get(normal(name)+'|'+normal(unit))?.slice(-1)[0]||null}
 function listEstimate(items,map){
  let total=0;const rows=(Array.isArray(items)?items:[]).map(item=>{
   const qty=Number(item.quantity),found=findPrice(map,item.name,item.unit||'Stück');
   const own=Number(item.price);
   const perUnit=Number.isFinite(own)&&own>0?own:found?.unitPrice;
   const value=Number.isFinite(perUnit)&&qty>0?round(qty*perUnit):null;
   if(value!==null)total+=value;
   return{...item,value,perUnit,source:Number.isFinite(own)&&own>0?'eigene Schätzung':found?.date||null}
  });
  return{total:round(total),rows,missing:rows.filter(x=>x.value===null).length};
 }
 function mealEstimate(meal,map){
  const result=listEstimate(meal?.items,map);const servings=Number(meal?.servings);
  return{...result,perServing:Number.isFinite(servings)&&servings>0?round(result.total/servings):null}
 }
 function duplicateAlerts(entries){
  const seen=new Map(),alerts=[];
  for(const entry of validEntries(entries)){
   const key=[entry.date,normal(entry.title),round(amount(entry.price)),expense(entry)?'out':'in'].join('|');
   if(seen.has(key)){alerts.push({kind:'duplicate',label:'Mögliche Doppelbuchung',text:(entry.title||'Buchung')+' am '+entry.date+' – '+euro(amount(entry.price)),ids:[seen.get(key),entry.id]})}
   else seen.set(key,entry.id);
   if(expense(entry)&&Array.isArray(entry.lineItems)&&entry.lineItems.length){
    const rows=entry.lineItems.filter(x=>Number.isFinite(Number(x.total))&&Number(x.total)>0);
    if(rows.length<2)continue;
    const sum=round(rows.reduce((n,x)=>n+Number(x.total),0));
    if(Math.abs(sum-amount(entry.price))>Math.max(1,amount(entry.price)*.05)){
     alerts.push({kind:'receipt',label:'Kassenbon prüfen',text:(entry.title||'Einkauf')+': Artikel '+euro(sum)+', Gesamtbetrag '+euro(amount(entry.price)),ids:[entry.id]});
    }
   }
  }
  // A large expense is a question to review, never proof of an error.
  const dated=validEntries(entries).filter(e=>expense(e)&&!e.isFixkosten).sort((a,b)=>a.date.localeCompare(b.date));
  const histories=new Map();
  for(const row of dated){
   const category=String(row.category||'Sonstiges'),history=histories.get(category)||[];
   const prior=history.filter(x=>x.date<row.date).map(x=>x.price).sort((a,b)=>a-b);
   if(prior.length>=3){
    const mid=Math.floor(prior.length/2),median=prior.length%2?prior[mid]:(prior[mid-1]+prior[mid])/2;
    const value=amount(row.price);
    if(median>0&&value>median*2.5&&value>median+25){
     alerts.push({kind:'high',label:'Ungewöhnlich hoher Betrag',text:(row.title||row.category||'Ausgabe')+': '+euro(value)+' statt sonst etwa '+euro(median),ids:[row.id]});
    }
   }
   history.push({price:amount(row.price),date:row.date});
   if(history.length>12)history.shift();
   histories.set(category,history);
  }
  return alerts.slice(0,35);
 }
 function parser(text){
  const out=[],seen=new Set(),lines=String(text||'').slice(0,18000).split(/\r?\n/).slice(0,120);
  const skip=/\b(summe|gesamt|endbetrag|rückgeld|rueckgeld|kartenzahlung|kreditkarte|barzahlung|zahlung|mwst|steuer|zwischensumme|rabatt|bonnummer|filiale|kassierer|ust|datum|vielen dank|preis pro|gegeben|wechselgeld|storno)\b/i;
  for(let line of lines){
   line=line.trim().replace(/^[*\-•]+\s*/,'').replace(/\s+[A-Z]\s*$/,'');
   if(!line||skip.test(line)||line.length>120)continue;
   const m=line.match(/^(.{2,78}?)\s+(\d{1,6}[,.]\d{2})\s*(?:€|EUR|[AB])?$/i);
   if(!m)continue;
   const name=m[1].replace(/^\d{1,2}\s*x\s*/i,'').trim();
   if(name.length<2||/^\d+[,.]\d+$/.test(name)||/^\d{2}[./]\d{2}/.test(name))continue;
   const cost=Number(m[2].replace(',','.'));
   if(!Number.isFinite(cost)||cost<=0||cost>5000)continue;
   const qtyMatch=line.match(/^(\d{1,2})\s*x\s+/i),quantity=qtyMatch?Number(qtyMatch[1]):1;
   const total=round(cost);
   const key=normal(name)+'|'+total+'|'+out.length;
   if(seen.has(key))continue;seen.add(key);
   out.push({name:name.slice(0,100),quantity,unit:'Stück',total});
  }
  return out.slice(0,45);
 }
 function annualDue(item,now=new Date()){
  const month=Number(item?.month),day=Number(item?.day);
  if(!Number.isInteger(month)||month<1||month>12||!Number.isInteger(day)||day<1||day>31)return null;
  let year=now.getFullYear();
  const date=yr=>new Date(yr,month-1,Math.min(day,new Date(yr,month,0).getDate()));
  let next=date(year);
  if(ISO(next)<ISO(now))next=date(++year);
  return ISO(next);
 }
 function upcomingAnnual(items,now=new Date()){
  return (Array.isArray(items)?items:[]).map(x=>({...x,due:annualDue(x,now)})).filter(x=>x.due).sort((a,b)=>a.due.localeCompare(b.due))
 }
 function warranty(entry,now=new Date()){
  if(!entry||!validDate(entry.date))return null;
  const months=Number(entry.warrantyMonths);if(!Number.isInteger(months)||months<=0)return null;
  const date=new Date(entry.date+'T12:00:00'),day=date.getDate();
  date.setDate(1);date.setMonth(date.getMonth()+months);
  date.setDate(Math.min(day,new Date(date.getFullYear(),date.getMonth()+1,0).getDate()));
  return{until:ISO(date),active:ISO(date)>=ISO(now)};
 }
 const core={round,euro,validDate,ISO,normal,amount,validEntries,expense,period,monthStart,endMonth,monthCompare,weekBounds,upcomingFixed,weekly,prices,priceSummary,findPrice,listEstimate,mealEstimate,duplicateAlerts,parser,annualDue,upcomingAnnual,warranty};
 root.ToolyaBudgetCleverCore=Object.freeze(core);
 if(typeof module!=='undefined'&&module.exports)module.exports=core;
})(typeof window!=='undefined'?window:globalThis);
