// Toolya public release integrity check. No sign-in, cookies, or production customer data.
// Compares the GitHub workspace files with the actual publicly delivered website.
'use strict';
const {readFileSync}=require('node:fs');
const {createHash}=require('node:crypto');
const {setTimeout:delay}=require('node:timers/promises');
const {resolve}=require('node:path');

const base=process.env.TOOLYA_LIVE_BASE||'https://toolya.app';
const retries=Math.max(1,Math.min(16,Number(process.env.TOOLYA_LIVE_RETRIES)||10));
const pauseMs=Number(process.env.TOOLYA_LIVE_RETRY_DELAY_MS)||12000;
const items=[
 {remote:'/tools/budget/',local:'tools/budget/index.html',type:'text/html'},
 {remote:'/tools/budget/clever-core.js',local:'tools/budget/clever-core.js',type:'javascript'},
 {remote:'/tools/budget/clever-ui.js',local:'tools/budget/clever-ui.js',type:'javascript'},
 {remote:'/tools/budget/clever.css',local:'tools/budget/clever.css',type:'text/css'}
];
const digest=data=>createHash('sha256').update(data).digest('hex');
const pathSafe=item=>resolve(process.cwd(),item.local);
async function checkOne(item,attempt){
 const url=new URL(item.remote,base);
 url.searchParams.set('toolya_release_check',String(attempt));
 const response=await fetch(url,{
  headers:{'Accept':'*/*','Cache-Control':'no-cache','Pragma':'no-cache'},
  redirect:'follow',signal:AbortSignal.timeout(14000)
 });
 if(!response.ok)throw Error(item.remote+': HTTP '+response.status+' '+response.statusText);
 if(!String(response.headers.get('content-type')||'').toLowerCase().includes(item.type))
  throw Error(item.remote+': falscher Content-Type '+response.headers.get('content-type'));
 const actual=Buffer.from(await response.arrayBuffer());
 if(actual.length>2500000)throw Error(item.remote+': unerwartet große Datei');
 const expected=readFileSync(pathSafe(item));
 if(digest(actual)!==digest(expected))throw Error(
  item.remote+': veröffentlichte Version weicht von GitHub ab (online '+digest(actual).slice(0,12)+', main '+digest(expected).slice(0,12)+')'
 );
 return item.remote+' ('+actual.byteLength+' Bytes)';
}
async function run(){
 if(new URL(base).protocol!=='https:')throw Error('Live-Check nur über HTTPS erlaubt.');
 let lastErrors=[];
 for(let attempt=1;attempt<=retries;attempt++){
  const result=await Promise.allSettled(items.map(item=>checkOne(item,attempt)));
  const pass=result.filter(x=>x.status==='fulfilled').map(x=>x.value);
  lastErrors=result.filter(x=>x.status==='rejected').map(x=>x.reason?.message||String(x.reason));
  console.log('Release-Check '+attempt+'/'+retries+': '+pass.length+'/'+items.length+' Dateien korrekt');
  if(pass.length===items.length){
   for(const p of pass)console.log('✓ '+p);
   console.log('PASS: Das neue Haushaltsbuch wird unter '+base+' unverändert und vollständig ausgeliefert.');
   return;
  }
  for(const err of lastErrors)console.log('  '+err);
  if(attempt<retries)await delay(pauseMs);
 }
 throw Error('Live-Veröffentlichung konnte nicht bestätigt werden: '+lastErrors.join(' | '));
}
run().catch(e=>{console.error('FAIL: '+e.message);process.exitCode=1});
