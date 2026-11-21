import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const tools=[
 {name:'moving',start:'async function saveData(data) {',end:'function checkDeepLink()',call:'saveData(payload)',ready:'movingCloudReady',controller:'movingCloudController',user:'movingCloudUserId',client:'window'},
 {name:'plants',start:'async function saveData(data){',end:'function loadLocationDropdown()',call:'saveData(payload)',ready:'plantsCloudReady',controller:'plantsCloudController',user:'plantsCloudUserId',client:'global'},
 {name:'baking',start:'async function persistRecipes(recipes){',end:'async function saveRecipeToStorage(',call:'persistRecipes(payload)',ready:'bakingCloudReady',controller:'bakingCloudController',user:'bakingCloudUserId',client:'global'}
];

for(const tool of tools){
 test(tool.name+' cloud save notice is DE/EN and emitted only after a confirmed write',async()=>{
  const html=await readFile(new URL('../../tools/'+tool.name+'/index.html',import.meta.url),'utf8');
  const begin=html.indexOf(tool.start),end=html.indexOf(tool.end,begin);
  assert.ok(begin>0&&end>begin,'isolated existing save function');
  const functionSource=html.slice(begin,end);
  for(const [lang,expected] of [['en','Saved to Toolya Cloud.'],['de','In Toolya Cloud gespeichert.']]){
   const saved=[],notices=[],blocked=[];
   const payload=tool.name==='baking'?[{name:'Privates Rezept',factor:2}]:{boxes:[{name:'Private box'}],plants:[{name:'Private plant'}]};
   const original=JSON.stringify(payload);
   const auth={getUser:async()=>({data:{user:{id:'fixture-user',is_anonymous:false}},error:null})};
   const controller={ready:true,replace:async data=>saved.push(data)};
   const context={
    payload,console:{error(){}},
    window:{__toolyaUILocale:lang,toolyaNotice:(type,text)=>notices.push([type,text]),supabaseClient:{auth}},
    supabaseClient:{auth},[tool.ready]:true,[tool.controller]:controller,[tool.user]:'fixture-user',
    movingCloudBlock:reason=>blocked.push(reason),
    plantsCloudBlock:reason=>blocked.push(reason),
    bakingCloudBlock:reason=>blocked.push(reason)
   };
   const ok=await runInNewContext(functionSource+';'+tool.call,context);
   assert.equal(ok,true);
   assert.equal(saved.length,1,'one and only one confirmed write');
   assert.equal(JSON.stringify(saved[0]),tool.name==='baking'?JSON.stringify({recipes:payload}):original,'cloud payload retains original schema');
   assert.deepEqual(notices,[['success',expected]]);
   assert.deepEqual(blocked,[]);
   assert.equal(JSON.stringify(payload),original,'user content unchanged');
   // Rejecting the write must not display an optimistic translated success.
   controller.replace=async()=>{throw Error('synthetic save rejection')};
   notices.length=0;saved.length=0;
   assert.equal(await runInNewContext(functionSource+';'+tool.call,context),false);
   assert.deepEqual(notices,[]);
   assert.deepEqual(blocked,['save-unconfirmed']);
  }
 });
}

const additional=[
 ['budget','async function toolyaCloudSave(patch) {','function toolyaCloudBlock('],
 ['car','async function toolyaCloudSave(patch) {','function toolyaCloudBlock('],
 ['loans','async function saveData(data) {','async function saveContact()'],
 ['meters','async function saveData(data) {','function loadTarifs()'],
 ['parking','async function saveData(data){','function requestNotificationPermission()'],
 ['pet-health','async function saveData(data){','async function petImage(']
];
test('six further tool save notices translate only confirmed saves, without translating payloads',async()=>{
 for(const [name,start,end] of additional){
  const html=await readFile(new URL('../../tools/'+name+'/index.html',import.meta.url),'utf8');
  const first=html.indexOf(start);
  const last=html.indexOf(end,first);
  assert.ok(first>0&&last>first,name+': existing cloud save path');
  const source=html.slice(first,last);
  const notice=source.match(/window\.toolyaNotice\?\.\('success',([^\n]+)\)/);
  assert.ok(notice,name+': success toast remains after awaited controller replacement');
  assert.ok(source.indexOf('await ')<source.indexOf('window.toolyaNotice'),name+': no optimistic success before write');
  for(const [locale,expected] of [['en','Saved to Toolya Cloud.'],['de','In Toolya Cloud gespeichert.']]){
   const translated=runInNewContext(notice[1],{window:{__toolyaUILocale:locale}});
   assert.equal(translated,expected,name+': '+locale);
  }
  assert.match(source,/save-unconfirmed/,name+': failure still blocks access');
  assert.doesNotMatch(source,/localStorage\.(setItem|removeItem)/,name+': no browser data writes by language change');
 }
});
