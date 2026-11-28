import {legacyCents,addCents,validateSplit,parseBankDate} from './budget-domain.mjs';
import {categories} from './budget-organization.mjs';
export const isIncome=r=>r.entryType==='einnahme'||r.category==='Einnahme';
export const centsOf=r=>legacyCents(r.price);
const find=(entries,id)=>{const r=entries.find(x=>x?.id===id);if(!r)throw Error('missing-booking');return r;};
const linked=r=>r.transferId!=null||r.refundOf!=null;
export function validateRelations(entries){
  const ids=new Map();
  for(const r of entries){if(!r||typeof r!=='object')continue;if(ids.has(r.id))throw Error('duplicate-id');ids.set(r.id,r);}
  const refunded=new Map();
  for(const r of ids.values()){
    if(r.splits?.length){
      if(isIncome(r)||linked(r)||!validateSplit(centsOf(r),r.splits)||r.splits.some(p=>!categories.includes(p.category)))throw Error('invalid-split');
    }
    if(r.transferId!=null){
      const other=ids.get(r.transferId);
      if(!other||other===r||other.transferId!==r.id||isIncome(other)===isIncome(r)||centsOf(other)!==centsOf(r)||r.refundOf!=null||other.refundOf!=null||r.isTax||r.isFixkosten||!r.accountLabel||!other.accountLabel||r.accountLabel.trim().toLowerCase()===other.accountLabel.trim().toLowerCase())throw Error('invalid-transfer');
    }
    if(r.refundOf!=null){
      const original=ids.get(r.refundOf);
      if(!original||isIncome(original)||linked(original)||!isIncome(r)||r.date<original.date||centsOf(r)<=0)throw Error('invalid-refund');
      const sum=addCents(refunded.get(original.id)||0,centsOf(r));
      if(sum>centsOf(original))throw Error('refund-exceeds-purchase');
      refunded.set(original.id,sum);
    }
  }
  return entries;
}
export function setSplits(entries,id,parts){
  find(entries,id);
  const next=entries.map(r=>r.id===id?{...r,splits:parts}:r);
  return validateRelations(next);
}
export function linkRefund(entries,refundId,purchaseId){
  find(entries,refundId);find(entries,purchaseId);
  return validateRelations(entries.map(r=>r.id===refundId?{...r,refundOf:purchaseId}:r));
}
export function linkTransfer(entries,a,b,accountA,accountB){
  find(entries,a);find(entries,b);
  if(a===b||linked(find(entries,a))||linked(find(entries,b)))throw Error('already-linked');
  const label=v=>{const s=String(v??'').trim();if(!s||s.length>120)throw Error('account');return s;};
  return validateRelations(entries.map(r=>r.id===a?{...r,transferId:b,accountLabel:label(accountA)}:r.id===b?{...r,transferId:a,accountLabel:label(accountB)}:r));
}
export function unlinkBooking(entries,id){
  const target=find(entries,id);
  return validateRelations(entries.map(r=>{
    if(r.id===id||r.id===target.transferId){const {transferId,refundOf,...rest}=r;return rest;}return r;
  }));
}
export function purchaseNet(entries,id){
  const original=find(entries,id);
  if(isIncome(original)||linked(original))throw Error('invalid-purchase');
  const refunds=entries.filter(r=>r.refundOf===id);
  const gross=centsOf(original),returned=addCents(...refunds.map(centsOf));
  return {gross,returned,net:addCents(gross,-returned),refunds};
}
export function transferCandidates(entries,id){
  const r=find(entries,id);
  if(linked(r)||r.splits?.length)return [];
  return entries.filter(o=>{
    if(!o||o.id===id||linked(o)||o.splits?.length||isIncome(o)===isIncome(r))return false;
    try{return centsOf(o)===centsOf(r)&&Math.abs(Date.parse(parseBankDate(o.date,'ISO'))-Date.parse(parseBankDate(r.date,'ISO')))<=3*86400000;}catch{return false;}
  });
}
// Cash flow: refunds are inflows in their actual period; purchase net is separate.
export function cashflow(entries,from='0001-01-01',to='9999-12-31'){
  let income=0,expense=0,fixed=0,refunds=0,invalid=0;
  const byCategory=Object.create(null);
  for(const r of entries){
    if(!r||r.transferId!=null||typeof r.date!=='string'||r.date<from||r.date>to)continue;
    let cents;try{cents=centsOf(r);parseBankDate(r.date,'ISO');}catch{invalid++;continue;}
    if(isIncome(r)){income=addCents(income,cents);if(r.refundOf!=null)refunds=addCents(refunds,cents);continue;}
    expense=addCents(expense,cents);if(r.isFixkosten)fixed=addCents(fixed,cents);
    const parts=r.splits?.length?r.splits:[{category:r.category||'Sonstiges',cents}];
    for(const p of parts)byCategory[p.category]=addCents(byCategory[p.category]||0,p.cents);
  }
  return {income,expense,fixed,refunds,balance:addCents(income,-expense),byCategory,invalid};
}
