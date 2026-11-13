#!/usr/bin/env node
// Production-isolated tests of ACTUAL homepage backup functions in a Node VM.
// No browser profile, network, real storage, credentials, or Supabase is used.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const html=fs.readFileSync('staging/index.html','utf8');
function section(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'source markers missing: '+start);
 return html.slice(a,b);
}
const code=section('function isAuthSessionStorageKey(', '// Password input uses a masked dialog')+
 section('async function exportGlobalBackup()', 'async function importGlobalBackup(')+
 section('async function importGlobalBackup(', '// JS Funktionen Global machen');
const checks=[];
function ok(name,fn){return Promise.resolve().then(fn).then(()=>{checks.push(name);console.log('PASS',name)})}
let store,alerts,downloads,password,confirms,failKey,ctx;
const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
function setup(initial={}){
 const data=new Map(Object.entries(initial));alerts=[];downloads=[];password='a-mock-passphrase-1234';confirms=true;failKey=null;
 store={
  get length(){return data.size},key:i=>[...data.keys()][i]??null,
  getItem:k=>data.has(k)?data.get(k):null,
  setItem(k,v){if(k===failKey){failKey=null;throw Error('synthetic quota failure')}data.set(k,String(v))},
  removeItem:k=>data.delete(k),dump:()=>Object.fromEntries(data)
 };
 class Reader{readAsText(file){queueMicrotask(()=>{this.onload({target:{result:file.content}})})}}
 const mockURL={createObjectURL:blob=>{downloads.push(blob);return 'blob:synthetic'},revokeObjectURL(){}};
 const sandbox={localStorage:store,crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,Date,JSON,Object,Number,String,Array,RegExp,
   FileReader:Reader,Blob,URL:mockURL,alert:msg=>alerts.push(msg),confirm:()=>confirms,
   requestBackupPassword:async()=>password,initFavorites:()=>{},setTimeout:()=>0,
   document:{body:{appendChild(){},removeChild(){}},createElement:()=>({click(){}})},
   btoa:x=>Buffer.from(x,'binary').toString('base64'),atob:x=>Buffer.from(x,'base64').toString('binary'),
   window:{},console};
 ctx=vm.createContext(sandbox);vm.runInContext(code,ctx,{timeout:3000});
 return {data,store};
}
async function exported(){
 await vm.runInContext('exportGlobalBackup(true)',ctx);
 assert.equal(downloads.length,1,'one synthetic export');
 return JSON.parse(await downloads[0].text());
}
async function imported(obj,{expectAlert=true}={}){
 const file={name:'synthetic.json',size:Buffer.byteLength(JSON.stringify(obj)),content:JSON.stringify(obj)};
 await vm.runInContext('importGlobalBackup',ctx)({target:{files:[file],value:'selected'}});
 if(expectAlert){for(let i=0;i<1000 && alerts.length===0;i++)await new Promise(resolve=>setTimeout(resolve,5));
 assert(alerts.length>0,'import did not finish within timeout');}
 else await pause();
}
async function run(){
 await ok('allowlist excludes sessions and unknown keys',async()=>{
  setup({hub_favorites:'[1]',wg_inventory:'[2]','sb-local-auth-token':'SECRET','helferlein-wish-extras:mock':'EXTRAS',digital_estate_vault:'mock-vault'});
  assert.equal(vm.runInContext("isHelferleinBackupKey('hub_favorites')",ctx),true);
  assert.equal(vm.runInContext("isHelferleinBackupKey('sb-local-auth-token')",ctx),false);
  assert.equal(vm.runInContext("isHelferleinBackupKey('helferlein-wish-extras:mock')",ctx),false);
  const backup=await exported();assert.equal(backup.format,'encrypted-backup-v1');
  assert(!JSON.stringify(backup).includes('SECRET'));assert(!JSON.stringify(backup).includes('EXTRAS'));
  global.encrypted=backup;
 });
 await ok('encrypted export/import round-trip to disposable second store',async()=>{
  setup({'hub_favorites':'old'});await imported(global.encrypted);
  assert.equal(store.getItem('hub_favorites'),'[1]');
  assert.equal(store.getItem('wg_inventory'),'[2]');
  assert.equal(store.getItem('digital_estate_vault'),'mock-vault');
  assert.equal(store.getItem('sb-local-auth-token'),null);
 });
 await ok('wrong password does not change store',async()=>{
  setup({hub_favorites:'unchanged'});password='incorrect-passphrase';
  await imported(global.encrypted);assert.equal(store.getItem('hub_favorites'),'unchanged');
  assert(alerts.some(x=>x.includes('Entschlüsselung fehlgeschlagen')));
 });
 await ok('tampered ciphertext does not change store',async()=>{
  setup({hub_favorites:'unchanged'});const bad={...global.encrypted,ciphertext:'AAAA'+global.encrypted.ciphertext.slice(4)};
  await imported(bad);assert.equal(store.getItem('hub_favorites'),'unchanged');
  assert(alerts.some(x=>x.includes('Entschlüsselung fehlgeschlagen')));
 });
 await ok('invalid JSON does not change store',async()=>{
  setup({hub_favorites:'unchanged'});
  await vm.runInContext('importGlobalBackup',ctx)({target:{files:[{name:'bad.json',size:3,content:'{{{'}],value:''}});
  await pause();assert.equal(store.getItem('hub_favorites'),'unchanged');
 });
 await ok('unsupported keys skipped without overwrite',async()=>{
  setup({hub_favorites:'old','sb-local-auth-token':'keep'});
  await imported({app:'Helferlein',version:'2.0',created:new Date().toISOString(),
   localStorage:{hub_favorites:'new','sb-local-auth-token':'overwrite','helferlein-wish-extras:mock':'not-allowed'}});
  assert.equal(store.getItem('hub_favorites'),'new');assert.equal(store.getItem('sb-local-auth-token'),'keep');
  assert.equal(store.getItem('helferlein-wish-extras:mock'),null);
 });
 await ok('quota exception restores previous values',async()=>{
  setup({hub_favorites:'old',wg_inventory:'old2'});failKey='wg_inventory';
  await imported({app:'Helferlein',version:'2.0',created:new Date().toISOString(),
   localStorage:{hub_favorites:'new',wg_inventory:'new2'}});
  assert.equal(store.getItem('hub_favorites'),'old');assert.equal(store.getItem('wg_inventory'),'old2');
  assert(alerts.some(x=>x.includes('vorherige Datenstand')));
 });
 await ok('rejected confirmation does not modify storage',async()=>{
  setup({hub_favorites:'old'});confirms=false;
  await imported({app:'Helferlein',version:'2.0',created:new Date().toISOString(),localStorage:{hub_favorites:'new'}},{expectAlert:false});
  assert.equal(store.getItem('hub_favorites'),'old');
 });
 await ok('estate signup redirect uses current origin and path',async()=>{
  const estate=fs.readFileSync('staging/assets/estate-owner.js','utf8');
  assert.match(estate,/emailRedirectTo:location\.origin\+location\.pathname/);
  const dest=new URL('/tools/estate/index.html','https://toolya.app');
  assert.equal(dest.origin+dest.pathname,'https://toolya.app/tools/estate/index.html');
  assert(!estate.includes('emailRedirectTo:"https://duhrrom11.github.io'));
 });
 console.log('TOTAL',checks.length);
}
run().catch(e=>{console.error('FAIL',e);process.exitCode=1});
