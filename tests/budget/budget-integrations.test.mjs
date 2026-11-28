import test from 'node:test';
import assert from 'node:assert/strict';
import {meterEstimates,carCandidates,carReview,applyCarReview} from '../../tools/budget/budget-integrations.mjs';
import {validateBudgetSnapshot} from '../../shared/toolya/cloud-controller.mjs';
const reading=(id,date,value,extra={})=>({id,date,value,type:'Strom',name:'A',location:'Home',...extra});
test('meter estimates use selected tariff and never mutate readings',()=>{
 const snapshot={readings:[reading(2,'2026-02-01',150),reading(1,'2026-01-01',100)],tarifs:{Strom:{priceHT:.35,priceNT:.25}}};
 const before=JSON.stringify(snapshot);
 assert.equal(meterEstimates(snapshot)[0].cents,1750);
 assert.equal(meterEstimates(snapshot,'NT')[0].cents,1250);
 assert.equal(JSON.stringify(snapshot),before);
});
test('meter exchanges, falling values and missing tariffs are excluded',()=>{
 for(const r of [reading(2,'2026-02-01',150,{isExchange:true}),reading(2,'2026-02-01',90)])assert.deepEqual(meterEstimates({readings:[reading(1,'2026-01-01',100),r],tarifs:{Strom:{priceHT:.35}}}),[]);
 assert.deepEqual(meterEstimates({readings:[reading(1,'2026-01-01',100),reading(2,'2026-02-01',150)],tarifs:{}}),[]);
});
test('gas conversion and separate meter locations',()=>{
 const readings=[reading(1,'2026-01-01',10,{type:'Gas'}),reading(2,'2026-02-01',20,{type:'Gas'}),reading(3,'2026-02-01',999,{type:'Gas',location:'Other'})];
 assert.equal(meterEstimates({readings,tarifs:{Gas:{price:.1,calib:11.2}}})[0].cents,1120);
});
const event={id:101,carId:1,title:'Fuel',date:'2026-02-01',cost:42.50};
test('car import requires confirmation and prevents duplicate source',()=>{
 const candidates=carCandidates({events:[event]});const [item]=carReview([],candidates);
 assert.equal(item.kind,'new');assert.throws(()=>applyCarReview([],item,false,1));
 const entries=applyCarReview([],item,true,1);
 assert.equal(entries[0].price,42.5);assert.equal(carReview(entries,candidates)[0].kind,'same');
 assert.throws(()=>applyCarReview(entries,item,true,2));
 assert.deepEqual(carCandidates({events:[event,event]}),[]);
 const snapshot={entries,budgets:{},goals:[]};
 assert.deepEqual(validateBudgetSnapshot(JSON.parse(JSON.stringify(snapshot))),snapshot);
});
test('changed and missing sources require confirmation and retain private booking',()=>{
 const entries=applyCarReview([],carReview([],carCandidates({events:[event]}))[0],true,1);
 const [changed]=carReview(entries,carCandidates({events:[{...event,cost:50}]}));
 assert.equal(changed.kind,'changed');assert.throws(()=>applyCarReview(entries,changed,false,2));
 const updated=applyCarReview(entries,changed,true,2);assert.equal(updated[0].price,50);
 const [missing]=carReview(updated,[]);assert.equal(missing.kind,'missing');
 assert.throws(()=>applyCarReview(updated,missing,false,2));
 const detached=applyCarReview(updated,missing,true,2);assert.equal(detached.length,1);assert.equal(detached[0].carSource,undefined);
 assert.throws(()=>applyCarReview([{...updated[0],transferId:3}],missing,true,2));
});
