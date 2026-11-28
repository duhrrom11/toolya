import test from 'node:test';
import assert from 'node:assert/strict';
import {occurrences,forecast,payPeriod,openingCarryover,reserveMonthly,validatePlanning,assignOccurrence,assignBill} from '../../tools/budget/budget-planning.mjs';
import {cashflow} from '../../tools/budget/budget-relations.mjs';
const plan={id:'rent',title:'Rent',start:'2026-01-31',interval:'monthly',direction:'expense',cents:10000,changes:[{date:'2026-03-01',cents:11000}],cancelBy:'2026-05-01',end:'2026-06-30'};
const bill={id:'bill',title:'Bill',due:'2026-03-10',cents:2000};
const reserve={id:'reserve',title:'Reserve',due:'2026-05-01',target:10001,saved:1000};
const planning={plans:[plan],bills:[bill],reserves:[reserve],payday:31,carryover:true};
test('recurrences clamp dates, retain anchor and apply dated price changes',()=>{
 assert.deepEqual(occurrences(plan,'2026-02-01','2026-04-30').map(x=>[x.date,x.cents]),[['2026-02-28',10000],['2026-03-31',11000],['2026-04-30',11000]]);
 assert.equal(occurrences(plan,'2026-07-01','2026-07-31').length,0);
 assert.equal(validatePlanning(planning).plans[0].cancelBy,'2026-05-01');
 assert.throws(()=>validatePlanning({...planning,payday:32}));
});
test('payday period, carryover and reserve cents',()=>{
 assert.deepEqual(payPeriod('2026-03-01',31),{start:'2026-02-28',end:'2026-03-30'});
 assert.equal(reserveMonthly(reserve,'2026-03-01'),3001);
 assert.equal(openingCarryover([{id:1,date:'2026-02-01',price:100,entryType:'einnahme'}],planning,'2026-03-01'),10000);
});
test('forecast and explicit payment matching',()=>{
 const rows=[{id:1,date:'2026-03-31',price:110,entryType:'ausgabe'},{id:2,date:'2026-03-10',price:20,entryType:'ausgabe'}];
 const f=forecast([],planning,'2026-03-01','2026-03-31',20000);
 assert.equal(f.expectedExpense,13000);assert.equal(f.projected,3999);
 const linked=assignOccurrence(rows,planning,'rent:2026-03-31',1);
 const p=assignBill(linked,planning,'bill',2);
 assert.equal(forecast(linked,p,'2026-03-01','2026-03-31',20000).projected,3999);
 assert.throws(()=>assignOccurrence(rows,planning,'rent:2026-03-31',2));
 assert.throws(()=>assignBill(linked,p,'bill',1));
});
test('signed historical adjustments are not lost',()=>{
 const f=cashflow([{date:'2026-03-01',price:40,entryType:'ausgabe'},{date:'2026-03-02',price:-12.5,entryType:'ausgabe'},{date:'2026-03-03',price:100,entryType:'einnahme'},{date:'2026-03-04',price:-5,entryType:'einnahme'}]);
 assert.equal(f.expense,2750);assert.equal(f.income,9500);assert.equal(f.balance,6750);
});
