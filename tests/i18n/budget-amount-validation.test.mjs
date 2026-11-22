import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const html=readFileSync(resolve(import.meta.dirname,'../../tools/budget/index.html'),'utf8');
const start=html.indexOf('async function saveBudgetsFromModal() {');
const end=html.indexOf('function openAddGoalModal()',start);
assert.ok(start>=0 && end>start,'budget validation function exists');
const functionSource=html.slice(start,end);

async function execute(lang,amount){
 const calls={messages:[],written:[],focus:0,closed:0,rendered:0};
 const input={value:amount,
  getAttribute:key=>key==='data-cat'?'Groceries & <user>':null,
  focus(){calls.focus++;}};
 const context={
  document:{querySelectorAll:selector=>{
   assert.equal(selector,'#budgetInputList input');
   return [input];
  }},
  window:{__toolyaUILocale:lang},
  alert:value=>calls.messages.push(value),
  saveBudgets:async snapshot=>{calls.written.push(JSON.parse(JSON.stringify(snapshot)));return true},
  closeBudgetModal:()=>calls.closed++,
  renderApp:()=>calls.rendered++
 };
 await vm.runInNewContext(functionSource+';saveBudgetsFromModal()',context);
 return calls;
}
test('EN invalid amount translates only the application message, never the category',async()=>{
 const calls=await execute('en','-12');
 assert.deepEqual(calls.messages,['Enter a valid budget amount of at least €0 for Groceries & <user>.']);
 assert.equal(calls.focus,1);assert.equal(calls.written.length,0);
 assert.equal(calls.closed,0);assert.equal(calls.rendered,0);
});
test('DE invalid amount retains the original wording and never writes data',async()=>{
 const calls=await execute('de','NaN');
 assert.deepEqual(calls.messages,['Bitte für Groceries & <user> einen gültigen Budgetbetrag ab 0 € eingeben.']);
 assert.equal(calls.focus,1);assert.equal(calls.written.length,0);
});
test('valid budget persists the exact original category and numeric value without translation',async()=>{
 const calls=await execute('en','12.50');
 assert.deepEqual(calls.messages,[]);
 assert.deepEqual(calls.written,[{'Groceries & <user>':12.5}]);
 assert.equal(calls.closed,1);assert.equal(calls.rendered,1);
});
