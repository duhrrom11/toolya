import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyCapture,validateCapture,unitPrice,speechFields,occasionTotal,queueReceipts,consumeInbox,ocrLanguage,scanReceiptBatch,bookingCapturePatch} from '../../tools/budget/budget-capture.mjs';
import {validateBudgetSnapshot} from '../../shared/toolya/cloud-controller.mjs';
const photo='data:image/png;base64,AAAA';
const receipt={id:'a',name:'receipt.png',photo};
test('capture defaults, cloud and JSON roundtrip',()=>{
 const capture=validateCapture({templates:[{id:'t',title:'Groceries',store:'Shop',category:'Lebensmittel',cents:1250}],inbox:[receipt],occasions:[{id:'o',title:'Trip',bookingIds:[1,1]}]});
 const snapshot={entries:[],budgets:{},goals:[],capture};
 assert.deepEqual(validateBudgetSnapshot(JSON.parse(JSON.stringify(snapshot))),snapshot);
 assert.deepEqual(validateCapture({}),emptyCapture());
 assert.throws(()=>validateBudgetSnapshot({...snapshot,capture:{inbox:[{...receipt,photo:'javascript:alert(1)'}]}}));
 assert.throws(()=>queueReceipts(capture,[receipt]));
 assert.deepEqual(consumeInbox(capture,'a').inbox,[]);
 assert.throws(()=>consumeInbox(capture,'missing'));
});
test('exact unit prices DE and EN',()=>{
 assert.deepEqual(unitPrice(199,'500','g'),{cents:398,unit:'kg'});
 assert.deepEqual(unitPrice(299,'0.75','l','en'),{cents:399,unit:'l'});
 assert.deepEqual(unitPrice(100,'3','pc'),{cents:33,unit:'pc'});
 assert.throws(()=>unitPrice(100,'0','kg'));
 assert.throws(()=>unitPrice(100,'1.5','kg','de'));
});
test('speech locale and OCR whitelist',()=>{
 assert.deepEqual(speechFields('Einkauf 12,50 Euro'),{title:'Einkauf',cents:1250});
 assert.deepEqual(speechFields('Groceries 12.50 euros','en'),{title:'Groceries',cents:1250});
 assert.deepEqual(speechFields('Groceries','en'),{title:'Groceries'});
 assert.equal(ocrLanguage('deu+eng'),'deu+eng');
 assert.throws(()=>ocrLanguage('unknown'));
});
test('occasion excludes income and transfers',()=>{
 assert.equal(occasionTotal([{id:1,price:12.50},{id:2,price:99,entryType:'einnahme'},{id:3,price:40,transferId:4}],{bookingIds:[1,2,3]}),1250);
});
test('batch isolates individual failures and stops on session change',async()=>{
 const rows=[receipt,{...receipt,id:'b'},{...receipt,id:'c'}];let count=0;
 const results=await scanReceiptBatch(rows,'eng',async()=>{if(++count===2)throw Error('ocr');return 'Total 12.50';});
 assert.deepEqual(results.map(r=>[r.id,r.error]),[['a',false],['b',true],['c',false]]);
 let current=true;
 await assert.rejects(scanReceiptBatch(rows,'deu',async()=>{current=false;return 'text';},()=>current));
});

test('booking and inbox consumption form one immutable backup-compatible patch',()=>{
 const state=queueReceipts(emptyCapture(),[receipt]);
 const entries=[{id:1,title:'Receipt',price:12.50,photos:[photo]}];
 const patch=bookingCapturePatch(entries,state,'a',1);
 assert.equal(patch.entries[0].inboxReceiptId,'a');
 assert.deepEqual(patch.capture.inbox,[]);
 assert.equal(state.inbox.length,1);
 assert.equal(entries[0].inboxReceiptId,undefined);
 assert.throws(()=>bookingCapturePatch(entries,patch.capture,'a',1));
 assert.throws(()=>bookingCapturePatch([{id:1,photos:[]}],state,'a',1));
 assert.throws(()=>bookingCapturePatch([...entries,{id:2,inboxReceiptId:'a'}],state,'a',1));
 const snapshot={...patch,budgets:{},goals:[]};
 assert.deepEqual(validateBudgetSnapshot(JSON.parse(JSON.stringify(snapshot))),snapshot);
});
