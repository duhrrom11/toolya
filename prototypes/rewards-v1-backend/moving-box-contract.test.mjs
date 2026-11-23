import test from 'node:test';
import assert from 'node:assert/strict';
import {checkFirstBoxRequest,makeFirstBoxRequest,MAX_BODY_BYTES} from './moving-box-contract.mjs';
const box=()=>({name:'Bücherkiste',desc:'Zimmer 1',value:39.99,tag:'Wichtig',barcode:'123456',expiry:'2027-01-01',lentTo:'',subItems:[{name:'Buch',value:5}],photo:''});
const req=()=>({expectedRevision:2,locationId:1234567890,box:box()});
test('all nine historical box fields survive conversion',()=>{
 const b=box(),r=makeFirstBoxRequest(2,1234567890,b.name,b.desc,b.value,b.tag,b.barcode,b.expiry,b.lentTo,b.subItems,b.photo);
 assert.deepEqual(r,req());assert.ok(checkFirstBoxRequest(r));
});
test('reject user-specified XP, user ID and unknown JSON keys',()=>{
 assert.equal(checkFirstBoxRequest({...req(),xp:100000}),false);
 assert.equal(checkFirstBoxRequest({...req(),userId:'someone'}),false);
 assert.equal(checkFirstBoxRequest({...req(),box:{...box(),secret:'not supported'}}),false);
});
test('validate basic type, missing name, location and revision',()=>{
 assert.equal(checkFirstBoxRequest({...req(),expectedRevision:0}),false);
 assert.equal(checkFirstBoxRequest({...req(),locationId:-4}),false);
 assert.equal(checkFirstBoxRequest({...req(),box:{...box(),name:'   '}}),false);
 assert.equal(checkFirstBoxRequest({...req(),box:{...box(),value:'39'}}),false);
 assert.equal(checkFirstBoxRequest({...req(),box:{...box(),value:Infinity}}),false);
});
test('accept jpeg png and webp photo payloads with valid base64',()=>{
 for(const mime of ['jpeg','png','webp']) {
   assert.ok(checkFirstBoxRequest({...req(),box:{...box(),photo:'data:image/'+mime+';base64,Zm9v'}}));
 }
});
test('reject dangerous or oversized photo payloads',()=>{
 assert.equal(checkFirstBoxRequest({...req(),box:{...box(),photo:'data:image/svg+xml;base64,PHN2Zz4='}}),false);
 assert.equal(checkFirstBoxRequest({...req(),box:{...box(),photo:'data:image/png;base64,!!!!'}}),false);
 assert.equal(checkFirstBoxRequest({...req(),box:{...box(),photo:'data:image/png;base64,'+'A'.repeat(3100000)}}),false);
});
test('validate subitems and limit',()=>{
 assert.equal(checkFirstBoxRequest({...req(),box:{...box(),subItems:[{name:'Buch',value:NaN}]}}),false);
 assert.equal(checkFirstBoxRequest({...req(),box:{...box(),subItems:[{name:'',value:1}]}}),false);
 assert.equal(checkFirstBoxRequest({...req(),box:{...box(),subItems:[{name:'Buch',value:1,private:true}]}}),false);
 assert.equal(checkFirstBoxRequest({...req(),box:{...box(),subItems:Array.from({length:1001},()=>({name:'x',value:1}))}}),false);
});
test('bounds the whole request',()=>{
 assert.ok(MAX_BODY_BYTES<=4200000);
 assert.equal(checkFirstBoxRequest({...req(),box:{...box(),desc:'a'.repeat(21000)}}),false);
});
test('invalid expiry format fails closed',()=>{
 assert.equal(checkFirstBoxRequest({...req(),box:{...box(),expiry:'01/01/2027'}}),false);
});
