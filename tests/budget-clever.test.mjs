import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const file=readFileSync(new URL('../tools/budget/clever-core.js',import.meta.url),'utf8');
const context={window:{},module:{exports:{}}};
runInNewContext(file,context,{timeout:2000});
const C=context.module.exports;
const receipts=[
  {id:1,date:'2026-10-12',title:'Wocheneinkauf',category:'Lebensmittel',store:'Laden A',price:4.8,
   lineItems:[{name:'Butter 250g',quantity:1,unit:'Stück',total:1.79},{name:'Milch 1l',quantity:2,unit:'Stück',total:3.01}]},
  {id:2,date:'2026-11-12',title:'Wocheneinkauf',category:'Lebensmittel',store:'Laden B',price:5.2,
   lineItems:[{name:'Butter 250g',quantity:1,unit:'Stück',total:2.29},{name:'Milch 1l',quantity:2,unit:'Stück',total:2.91}]}
];

test('price memory compares confirmed individual items',()=>{
 const prices=C.prices(receipts);
 assert.equal(prices.size,2);
 const butter=C.priceSummary(prices).find(x=>x.name==='Butter 250g');
 assert.equal(butter.unitPrice,2.29);
 assert.equal(butter.change,.5);
 assert.equal(butter.store,'Laden B');
});

test('next shopping total reports missing prices rather than inventing them',()=>{
 const value=C.listEstimate([{name:'Butter 250g',quantity:2,unit:'Stück'},{name:'Kirschen',quantity:1,unit:'Stück'}],C.prices(receipts));
 assert.equal(value.total,4.58);
 assert.equal(value.missing,1);
});

test('meal cost and cost per serving use the remembered shop price',()=>{
 const value=C.mealEstimate({servings:4,items:[{name:'Butter 250g',quantity:2,unit:'Stück'}]},C.prices(receipts));
 assert.equal(value.total,4.58);
 assert.equal(value.perServing,1.15);
});

test('weekly left subtracts paid and known upcoming fixed spending',()=>{
 const entries=[{id:4,date:'2026-10-21',title:'Versicherung',category:'Sonstiges',price:45,isFixkosten:true},
 {id:5,date:'2026-11-19',title:'Wocheneinkauf',category:'Lebensmittel',price:50}];
 const w=C.weekly(entries,200,new Date(2026,10,20));
 assert.equal(w.spent,50);
 assert.equal(w.reserved,45);
 assert.equal(w.remaining,105);
});

test('monthly comparison uses same number of elapsed days',()=>{
 const records=[
 {date:'2026-10-03',category:'Lebensmittel',price:20},
 {date:'2026-10-27',category:'Lebensmittel',price:80},
 {date:'2026-11-03',category:'Lebensmittel',price:35}
 ];
 const m=C.monthCompare(records,new Date(2026,10,20));
 assert.equal(m.previous,20);
 assert.equal(m.current,35);
 assert.equal(m.difference,15);
 assert.equal(m.hasPrior,true);
});

test('annual costs and February birthdays are valid even after a non-leap year',()=>{
 assert.equal(C.annualDue({month:2,day:29},new Date(2026,10,21)),'2027-02-28');
});

test('warranty status is based on the booked date',()=>{
 assert.equal(C.warranty({date:'2026-01-01',warrantyMonths:12},new Date(2026,10,21)).active,true);
 assert.equal(C.warranty({date:'2025-01-01',warrantyMonths:12},new Date(2026,10,21)).active,false);
});

test('detector flags likely duplicates without removing anything',()=>{
 const data=[{id:1,date:'2026-11-17',title:'Bäcker',price:8.5},
 {id:2,date:'2026-11-17',title:'Bäcker',price:8.5}];
 assert.equal(C.duplicateAlerts(data).filter(x=>x.kind==='duplicate').length,1);
 assert.equal(data.length,2);
});

test('receipt detective flags confirmed item-total differences',()=>{
 const data=[{id:3,date:'2026-11-17',title:'Kassenbon',price:40,
 lineItems:[{name:'Milch',quantity:1,total:2},{name:'Eier',quantity:1,total:4}]}];
 assert.equal(C.duplicateAlerts(data).filter(x=>x.kind==='receipt').length,1);
});

test('detector flags high expenses only with enough prior comparison',()=>{
 const data=[12,14,16,100].map((price,i)=>({id:i+1,title:'Kauf '+i,category:'Freizeit',date:'2026-0'+(i+1)+'-15',price}));
 assert.equal(C.duplicateAlerts(data).filter(x=>x.kind==='high').length,1);
});

test('OCR parser ignores sum, taxes and date lines',()=>{
 const items=C.parser('BUTTER 250G 2,29\nMILCH 1L 1,29\nSUMME 3,58\nMWST 0,24\nDATUM 21.11.2026');
 assert.equal(items.length,2);
 assert.equal(items[0].name,'BUTTER 250G');
});

test('never treats missing bookings as account balances',()=>{
 assert.equal(C.weekly([],null,new Date(2026,10,21)).remaining,null);
 assert.equal(C.monthCompare([],new Date(2026,10,21)).hasPrior,false);
});
