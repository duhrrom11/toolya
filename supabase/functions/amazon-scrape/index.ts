import {scrape} from './core.mjs';
const base=Deno.env.get('SUPABASE_URL')!;
const key=Deno.env.get('SUPABASE_ANON_KEY')!;
const admin=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const origins=new Set(['https://toolya.app','https://www.toolya.app','https://duhrrom11.github.io']);
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 if(origins.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Headers']='authorization, apikey, content-type, x-client-info';headers['Access-Control-Allow-Methods']='POST, OPTIONS';}
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(origin&&!origins.has(origin))return reply({error:'Nicht erlaubte Herkunft.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'POST erforderlich.'},405);
 try{
 const authorization=req.headers.get('authorization')||'';
 const auth=await fetch(base+'/auth/v1/user',{headers:{apikey:key,authorization}});
 if(!auth.ok)return reply({error:'Bitte zuerst anmelden.'},401);
 const user=await auth.json();if(!user.id||user.is_anonymous)return reply({error:'Bitte mit einem Konto anmelden.'},401);
 const quota=await fetch(base+'/rest/v1/rpc/toolya_amazon_take_quota',{method:'POST',headers:{apikey:key,authorization,'content-type':'application/json'},body:'{}'});
 if(!quota.ok)return reply({error:'Zu viele Abrufe. Bitte in einer Stunde erneut versuchen.'},429);
 if(Number(req.headers.get('content-length'))>4096)return reply({error:'Anfrage zu groß.'},413);
 const reader=req.body?.getReader();let body='';if(!reader)return reply({error:'Link fehlt.'},400);let size=0;const decoder=new TextDecoder();try{while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>4096)return reply({error:'Anfrage zu groß.'},413);body+=decoder.decode(r.value,{stream:true});}}finally{await reader.cancel()}
 const input=JSON.parse(body);const result=await scrape(input.url);
 if(!result.products.length)return reply({error:'Keine Produkte erkannt.'},422);
 if(!result.complete)return reply({...result,previewId:null});
 const snapshot=await fetch(base+'/rest/v1/toolya_amazon_previews',{method:'POST',headers:{apikey:admin,authorization:'Bearer '+admin,'content-type':'application/json',prefer:'return=representation'},body:JSON.stringify({user_id:user.id,payload:result})});
 if(!snapshot.ok)throw Error('PREVIEW_STORE');
 const rows=await snapshot.json();return reply({...result,previewId:rows[0].id});
 }catch(e){return reply({error:e.code?e.message:'Amazon-Vorschau konnte nicht erstellt werden.',code:e.code||'SCRAPE_FAILED'},422);}
});
