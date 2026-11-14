import { createClient } from 'npm:@supabase/supabase-js@2.57.0';
const ORIGIN = 'https://toolya.app';
const URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(URL, SERVICE, {auth:{persistSession:false,autoRefreshToken:false}});
const BREVO_KEY = Deno.env.get('BREVO_API_KEY')?.trim();
const RESEND_KEY = Deno.env.get('RESEND_API_KEY')?.trim();
const MAIL_FROM = Deno.env.get('ESTATE_MAIL_FROM')?.trim();
// Choose one provider before sending. Never retry a rejected Brevo send via another provider.
const mailProvider = BREVO_KEY ? 'brevo' : 'resend';
const mailReady = Boolean(MAIL_FROM && (BREVO_KEY || RESEND_KEY))
 && (!BREVO_KEY || /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(MAIL_FROM!));
const hex = /^[a-f0-9]{64}$/;
async function hash(s:string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join(''); }
async function rpc(action:string, owner:string|null, data:Record<string,unknown>={}) {
 const {data:result,error}=await admin.rpc('estate_release_v2',{p_action:action,p_owner:owner,p_data:data});
 if(error) throw Error('database_unavailable');
 return result;
}
async function deliverOne() {
 if(!mailReady) return;
 const job=await rpc('claim',null);
 if(!job.id) return;
 const reporter=job.kind==='reporter-started'||job.kind==='reporter-stopped';
 let recipient:string;
 if(reporter){
  if(typeof job.recipient!=='string'||job.recipient.length>254||!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(job.recipient))return;
  recipient=job.recipient;
 }else{
  const {data,error}=await admin.auth.admin.getUserById(job.owner);
  if(error || !data.user?.email || !data.user.email_confirmed_at) return;
  recipient=data.user.email;
 }
 const portal='https://toolya.app/tools/estate/heirs.html';
 const ownerPortal='https://toolya.app/tools/estate/index.html#lebenszeichen';
 const format=(date:string)=>new Date(date).toLocaleString('de-DE',{timeZone:'Europe/Paris',timeZoneName:'short'});
 const alarm=job.kind==='alarm',started=job.kind==='reporter-started';
 if(reporter&&(!Number.isFinite(Date.parse(job.eventTime))||(started&&!Number.isFinite(Date.parse(job.deadline)))))return;
 const subject=reporter?(started?'Toolya: Dein Notfallalarm wurde gestartet':'Toolya: Entwarnung – dein Notfallalarm wurde beendet'):(alarm?'Toolya: Bitte gib jetzt ein Lebenszeichen':'Toolya: Zeit für dein Lebenszeichen');
 const text=reporter
  ?(started?'Du hast einen Notfall gemeldet. Der Besitzer wurde per E-Mail benachrichtigt. Die 24-Stunden-Frist hat am '+format(job.eventTime)+' begonnen.\n\nFrühester Zugang mit einem Schlüssel: '+format(job.deadline)+'. Das gilt nur, wenn der Besitzer nicht vorher Entwarnung gibt.\n\nDen aktuellen Countdown und Alarmstatus findest du im Portal. Gib dort deinen persönlichen Schlüssel ein. Eine E-Mail kann keinen zuverlässig laufenden Countdown anzeigen.':
    'Der Besitzer hat deinen Notfallalarm am '+format(job.eventTime)+' beendet. Für neue Zugriffe sind wieder zwei verschiedene persönliche Schlüssel erforderlich. Bereits gelesene oder gespeicherte Kopien bleiben erhalten.')
    +'\n\nAktuellen Status im Portal prüfen:\n'+portal+'\n\nDiese Nachricht bestätigt den genannten Zeitpunkt. Maßgeblich ist der aktuelle Status im Portal. Dein persönlicher Schlüssel steht nicht in dieser Nachricht.'
  :(alarm?'Eine deiner Vertrauenspersonen hat einen Notfall gemeldet. Ohne Entwarnung kann nach 24 Stunden eine Vertrauensperson deine Unterlagen lesen.':'Deine regelmäßige Erinnerung. Sie löst keinen Notfallalarm aus.')
    +'\n\nÖffne Toolya, melde dich an und wähle „❤️ Ich lebe noch“:\n'+ownerPortal+'\n\nDeine Unterlagen und Schlüssel stehen nicht in dieser Nachricht.';
 const link=reporter?portal:ownerPortal;
 let response:Response;
 if(mailProvider==='brevo') {
  const escaped=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  response=await fetch('https://api.brevo.com/v3/smtp/email',{
   method:'POST',signal:AbortSignal.timeout(15000),
   headers:{'api-key':BREVO_KEY!,'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify({sender:{email:MAIL_FROM,name:'Toolya'},to:[{email:recipient}],subject,textContent:text,
    htmlContent:'<!doctype html><html lang="de"><body><p>'+escaped.replace(/\n/g,'<br>')+'</p><p><a href="'+link+'">'+(reporter?'Aktuellen Countdown und Status öffnen':'Toolya öffnen und Lebenszeichen geben')+'</a></p></body></html>',
    // Brevo expects a UUID in the JSON headers. The outbox job ID stays stable across retries.
    headers:{idempotencyKey:job.id}})
  });
 }else{
  response=await fetch('https://api.resend.com/emails',{
   method:'POST',signal:AbortSignal.timeout(15000),
   headers:{Authorization:'Bearer '+RESEND_KEY,'Content-Type':'application/json','Idempotency-Key':'estate-'+job.id},
   body:JSON.stringify({from:MAIL_FROM,to:[recipient],subject,text})
  });
 }
 // Quota, sender-verification, authentication, malformed and duplicate-key errors
 // never start the 24h clock. A retry can notify again after the provider's deduplication TTL.
 if(!response.ok)return;
 const receipt=await response.json();
 const accepted=mailProvider==='brevo'
  ?response.status===201&&typeof receipt.messageId==='string'&&receipt.messageId.length>0
  :typeof receipt.id==='string'&&receipt.id.length>0;
 if(accepted)await rpc('delivered',null,{id:job.id});

}
export async function handler(req:Request):Promise<Response> {
 const headers=new Headers({'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'});
 const origin=req.headers.get('Origin');
 if(origin===ORIGIN){headers.set('Access-Control-Allow-Origin',ORIGIN);headers.set('Access-Control-Allow-Headers','authorization,apikey,content-type,x-client-info');headers.set('Access-Control-Allow-Methods','POST,OPTIONS');}
 const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS') return new Response(null,{status:origin===ORIGIN?204:403,headers});
 if(origin && origin!==ORIGIN) return reply(403,{error:'forbidden'});
 if(req.method!=='POST')return reply(405,{error:'method'});
 if(!req.headers.get('Content-Type')?.startsWith('application/json'))return reply(415,{error:'content_type'});
 try {
  // Bounded streaming read, independent of an attacker-controlled Content-Length.
  const reader=req.body?.getReader(); if(!reader)return reply(400,{error:'invalid_request'});
  let size=0;const chunks:Uint8Array[]=[];
  try {while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>1500000){await reader.cancel();return reply(413,{error:'too_large'});}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  const b=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  if(!b||typeof b!=='object'||Array.isArray(b))return reply(400,{error:'invalid_request'});
  const action=b.action;
  if(action==='health')return reply(200,{ready:true,notifications:mailReady,mailProvider:mailReady?mailProvider:null});
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  // Only platform proxy headers are used; database limits stay authoritative across instances.
  if(!(await rpc('limit',null,{bucket:'ip:'+await hash(ip)})).allowed)return reply(429,{error:'rate_limited'});
  if(action==='worker') {await deliverOne();return reply(200,{ok:true});}
  if(['publish','status','cancel'].includes(action)) {
   const token=/^Bearer (\S+)$/.exec(req.headers.get('Authorization')||'')?.[1];
   if(!token)return reply(401,{error:'login_required'});
   const {data,error}=await admin.auth.getUser(token);
   if(error||!data.user||!data.user.email_confirmed_at)return reply(401,{error:'login_required'});
   const claims=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
   if(!claims.session_id)return reply(401,{error:'login_required'});
   if(action==='cancel' && !claims.amr?.some((x:{method:string,timestamp:number})=>x.method==='password'&&x.timestamp>=Date.now()/1000-120))return reply(401,{error:'reauthenticate'});
   const result=await rpc(action,data.user.id,{...b,session:claims.session_id});
   return reply(result.error?409:200,{...result,notifications:mailReady});
  }
  if(!['open','alarm','trustee-status'].includes(action)||typeof b.key!=='string'||!hex.test(b.key) || (b.secondKey!==undefined && (typeof b.secondKey!=='string'||!hex.test(b.secondKey))))return reply(400,{error:'invalid_keys'});
  if(action==='alarm'&&!mailReady)return reply(503,{error:'notification_unavailable'});
  const keyHash=await hash(b.key);
  if(!(await rpc('limit',null,{bucket:'key:'+keyHash})).allowed)return reply(429,{error:'rate_limited'});
  const result=await rpc(action,null,{hash:keyHash,...(b.secondKey?{secondHash:await hash(b.secondKey)}:{})});
  if(action==='alarm'&&!result.error){await deliverOne();const status=await rpc('trustee-status',null,{hash:keyHash});return reply(200,status);}
  return reply(result.error?403:200,result);
 }catch{return reply(503,{error:'unavailable'});}
}
Deno.serve(handler);
