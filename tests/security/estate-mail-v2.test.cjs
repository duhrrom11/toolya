// Actual Edge handler with synthetic-only Auth/outbox/mail adapters. No network or production data.
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {transform}=require('esbuild');
(async()=>{
 const source=fs.readFileSync('supabase/functions/estate-emergency/index.ts','utf8').replace("import { createClient } from 'npm:@supabase/supabase-js@2.57.0';","const createClient=()=>globalThis.__mailAdmin;");
 const compiled=await transform(source,{loader:'ts',format:'esm',target:'es2022'});
 const originalFetch=global.fetch,originalDeno=global.Deno;
 let count=0;
 async function scenario({env={BREVO_API_KEY:'synthetic-brevo-secret',ESTATE_MAIL_FROM:'sender@example.invalid'},status=201,receipt={messageId:'<synthetic-message>'},kind='alarm',confirmed=true,throws=false,recipient='reporter@example.invalid',deadline='2026-11-14T12:00:00Z',eventTime='2026-11-13T12:00:00Z'}={}){
  const calls=[],delivered=[],rpcs=[],job={id:crypto.randomUUID(),owner:crypto.randomUUID(),kind,recipient,deadline,eventTime};
  global.__mailAdmin={rpc:async(_name,p)=>{rpcs.push(p.p_action);if(p.p_action==='limit')return {data:{allowed:true}};if(p.p_action==='claim')return {data:job};if(p.p_action==='delivered'){delivered.push(p.p_data.id);return {data:{ok:true}};}throw Error('Unexpected RPC');},auth:{admin:{getUserById:async()=>({data:{user:{email:'owner@example.invalid',email_confirmed_at:confirmed?'2026-01-01':null}}})}}};
  global.Deno={env:{get:n=>({SUPABASE_URL:'https://synthetic.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',...env})[n]},serve:()=>{}};
  global.fetch=async(url,options)=>{assert(['https://api.brevo.com/v3/smtp/email','https://api.resend.com/emails'].includes(String(url)));calls.push({url:String(url),headers:options.headers,body:JSON.parse(options.body)});if(throws)throw Error('synthetic timeout');return new Response(JSON.stringify(receipt),{status});};
  const file=path.join(os.tmpdir(),'estate-mail-'+crypto.randomUUID()+'.mjs');fs.writeFileSync(file,compiled.code);
  try{
   const {handler}=await import(pathToFileURL(file));
   const request=action=>handler(new Request('https://synthetic.invalid/functions/v1/estate-emergency',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://toolya.app'},body:JSON.stringify({action})}));
   const health=await (await request('health')).json();assert(!JSON.stringify(health).includes('secret'));
   const response=await request('worker');count++;
   return {calls,delivered,rpcs,job,health,response};
  }finally{fs.unlinkSync(file);}
 }
 try{
  let s=await scenario();assert.deepEqual(s.delivered,[s.job.id]);assert.equal(s.health.mailProvider,'brevo');assert.equal(s.calls[0].headers['api-key'],'synthetic-brevo-secret');assert.deepEqual(s.calls[0].body.sender,{email:'sender@example.invalid',name:'Toolya'});assert.deepEqual(s.calls[0].body.to,[{email:'owner@example.invalid'}]);assert.equal(s.calls[0].body.headers.idempotencyKey,s.job.id);assert(s.calls[0].body.textContent.includes('Notfall gemeldet'));assert(!JSON.stringify(s.calls[0].body).includes('secret'));
  for(const status of [400,401,403,429,500]){s=await scenario({status,receipt:{code:'rejected'}});assert.deepEqual(s.delivered,[]);}
  for(const receipt of [{},{messageId:''},{messageId:123},{code:'duplicate_parameter'}]){s=await scenario({receipt});assert.deepEqual(s.delivered,[]);}
  s=await scenario({status:200});assert.deepEqual(s.delivered,[],'Brevo must return the documented 201 acknowledgement');
  s=await scenario({throws:true});assert.equal(s.response.status,503);assert.deepEqual(s.delivered,[]);
  s=await scenario({confirmed:false});assert.equal(s.calls.length,0);assert.deepEqual(s.delivered,[]);
  for(const env of [{ESTATE_MAIL_FROM:'sender@example.invalid'},{BREVO_API_KEY:'synthetic-brevo-secret'},{BREVO_API_KEY:'synthetic-brevo-secret',ESTATE_MAIL_FROM:'bad\r\nheader@example.invalid'}]){s=await scenario({env});assert.equal(s.health.notifications,false);assert.equal(s.calls.length,0);assert(!s.rpcs.includes('claim'));}
  s=await scenario({kind:'reminder'});assert(s.calls[0].body.textContent.includes('Sie löst keinen Notfallalarm aus'));assert.deepEqual(s.delivered,[s.job.id]);
  for(const kind of ['reporter-started','reporter-stopped']){
   s=await scenario({kind,confirmed:false});assert.deepEqual(s.calls[0].body.to,[{email:'reporter@example.invalid'}]);assert.deepEqual(s.delivered,[s.job.id]);assert(s.calls[0].body.textContent.includes('erben.html'));assert(!s.calls[0].body.textContent.includes('index.html'));
   assert(s.calls[0].body.subject.includes(kind==='reporter-started'?'gestartet':'Entwarnung'));
   if(kind==='reporter-started'){assert(s.calls[0].body.textContent.includes('14.11.2026'));assert(s.calls[0].body.textContent.includes('13:00:00'));assert(s.calls[0].body.textContent.includes('aktuellen Countdown'));}
  }
  for(const recipient of ['', 'wrong', 'x@example.invalid\r\nBcc:bad@example.invalid']){s=await scenario({kind:'reporter-started',recipient});assert.equal(s.calls.length,0);assert.deepEqual(s.delivered,[]);}
  s=await scenario({kind:'reporter-started',deadline:'invalid'});assert.equal(s.calls.length,0);
  s=await scenario({env:{RESEND_API_KEY:'synthetic-resend-secret',ESTATE_MAIL_FROM:'sender@example.invalid'},status:200,receipt:{id:'synthetic-resend-id'}});assert.equal(s.health.mailProvider,'resend');assert.equal(s.calls[0].headers['Idempotency-Key'],'estate-'+s.job.id);assert.deepEqual(s.delivered,[s.job.id]);
  s=await scenario({env:{BREVO_API_KEY:'synthetic-brevo-secret',RESEND_API_KEY:'synthetic-resend-secret',ESTATE_MAIL_FROM:'sender@example.invalid'},status:403,receipt:{code:'unauthorized'}});assert.equal(s.calls.length,1);assert(s.calls[0].url.includes('brevo'));assert.deepEqual(s.delivered,[],'never fall back to a different provider after an ambiguous send');
  console.log('PASS: '+count+' isolated mail cases; Brevo acknowledgement, sender/recipient, UUID deduplication, quota/auth/sender errors, malformed/duplicate acknowledgements, timeout, missing secrets, unconfirmed owner, reminders, Resend compatibility, no fallback and no secret disclosure');
 }finally{global.fetch=originalFetch;global.Deno=originalDeno;delete global.__mailAdmin;}
})().catch(e=>{console.error(e);process.exitCode=1;});
