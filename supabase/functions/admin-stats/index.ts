import { createClient } from 'npm:@supabase/supabase-js@2.57.0';
const origin='https://toolya.app';
const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'GET,OPTIONS','Vary':'Origin'};
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const catalog=[
 ['ga4','Google Analytics 4'],['github','GitHub'],['supabase','Supabase'],['brevo','Brevo'],
 ['sav','Sav.com'],['kofi','Ko-fi'],['search-console','Google Search Console'],
 ['ahrefs','Ahrefs'],['openseo','OpenSEO'],['amplitude','Amplitude'],
 ['hosting','Hosting & Verfügbarkeit'],['affiliate','Affiliate & Amazon']
];
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='GET')return reply(405,{error:'Method not allowed'});
 if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply(403,{error:'Origin denied'});
 const token=(req.headers.get('authorization')||'').match(/^Bearer (\S+)$/)?.[1];
 if(!token)return reply(401,{error:'Authentication required'});
 const url=Deno.env.get('SUPABASE_URL')||'';
 const key=Deno.env.get('SUPABASE_ANON_KEY')||'';
 if(!url||!key)return reply(503,{error:'Auth unavailable'});
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.auth.getUser(token);
 if(error||!data.user)return reply(401,{error:'Invalid session'});
 // Fail closed until administrator IDs are explicitly configured as a server secret.
 const allowed=(Deno.env.get('TOOLYA_STATS_ADMIN_USER_IDS')||'').split(',').map(v=>v.trim()).filter(Boolean);
 if(!allowed.length||!allowed.includes(data.user.id))return reply(403,{error:'Administrator authorization required'});
 const days=Number(new URL(req.url).searchParams.get('days')||30);
 if(![7,30,90].includes(days))return reply(400,{error:'Invalid period'});
 return reply(200,{generatedAt:new Date().toISOString(),days,metrics:[],
  sources:catalog.map(([id,label])=>({id,label,status:'not_connected',detail:'API-Datenquelle noch nicht eingerichtet'}))});
});
