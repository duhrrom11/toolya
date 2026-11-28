import test from 'node:test';
import assert from 'node:assert/strict';
import {setSplits,linkRefund,linkTransfer,unlinkBooking,purchaseNet,cashflow,transferCandidates,validateRelations} from '../../tools/budget/budget-relations.mjs';
const purchase={id:1,title:'Market',date:'2026-11-28',price:10.01,category:'Lebensmittel',entryType:'ausgabe'};
const refund={id:2,title:'Refund',date:'2026-12-01',price:2.01,category:'Einnahme',entryType:'einnahme'};
const refund2={...refund,id:3,price:3};
test('split counts purchase once and categories exactly',()=>{
 const rows=setSplits([purchase],1,[{category:'Lebensmittel',cents:500},{category:'Haustiere',cents:501}]);
 const summary=cashflow(rows);
 assert.equal(summary.expense,1001);assert.equal(summary.byCategory.Lebensmittel,500);assert.equal(summary.byCategory.Haustiere,501);
 assert.throws(()=>setSplits(rows,1,[{category:'Auto',cents:500},{category:'Haustiere',cents:500}]));
});
test('multiple refunds across months and purchase net',()=>{
 let rows=linkRefund([purchase,refund,refund2],2,1);rows=linkRefund(rows,3,1);
 assert.equal(cashflow(rows,'2026-11-01','2026-11-30').expense,1001);
 assert.equal(cashflow(rows,'2026-12-01','2026-12-31').income,501);
 assert.equal(purchaseNet(rows,1).net,500);
 assert.throws(()=>validateRelations(rows.map(x=>x.id===3?{...x,price:10}:x)));
 assert.throws(()=>validateRelations(rows.filter(x=>x.id!==1)));
});
test('paired transfer is excluded from flow and unlink restores both',()=>{
 const other={...refund,id:4,price:10.01,date:'2026-11-29'};
 assert.deepEqual(transferCandidates([purchase,other],1).map(x=>x.id),[4]);
 const rows=linkTransfer([purchase,other],1,4,'Checking','Savings');
 assert.equal(cashflow(rows).income,0);assert.equal(cashflow(rows).expense,0);
 assert.throws(()=>validateRelations(rows.slice(0,1)));
 assert.throws(()=>linkTransfer([purchase,other],1,4,'Checking','checking'));
 const unlinked=unlinkBooking(rows,1);assert.equal(cashflow(unlinked).expense,1001);assert.equal(cashflow(unlinked).income,1001);
});
