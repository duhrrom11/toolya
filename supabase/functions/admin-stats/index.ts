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
type Metric={label:string,value:number,detail:string};
type Source={id:string,label:string,status:string,detail:string};
const fetchJson=async(url:string,headers:Record<string,string>={})=>{
 const response=await fetch(url,{headers:{Accept:'application/vnd.github+json',...headers},signal:AbortSignal.timeout(7500)});
 if(!response.ok)throw Error('Provider HTTP '+response.status);
 return response.json();
};
async function githubMetrics():Promise<Metric[]>{
 const headers:Record<string,string>={};
 const githubToken=Deno.env.get('TOOLYA_STATS_GITHUB_TOKEN');
 if(githubToken)headers.Authorization='Bearer '+githubToken;
 const repo=await fetchJson('https://api.github.com/repos/duhrrom11/toolya',headers);
 const prs=await fetchJson('https://api.github.com/search/issues?q=repo%3Aduhrrom11%2Ftoolya+type%3Apr+is%3Aopen&per_page=1',headers);
 return [
  {label:'GitHub Sterne',value:Number(repo.stargazers_count),detail:'Repository duhrrom11/toolya'},
  {label:'GitHub Forks',value:Number(repo.forks_count),detail:'Repository duhrrom11/toolya'},
  {label:'Offene Issues',value:Number(repo.open_issues_count),detail:'GitHub-Zählung einschließlich Pull Requests'},
  {label:'Offene Pull Requests',value:Number(prs.total_count),detail:'Aktueller GitHub-Stand'}
 ];
}
async function supabaseMetrics(url:string):Promise<Metric[]>{
 const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!secret)throw Error('Supabase server key not configured');
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const tables=[['Registrierte Toolya-Konten','user_data'],['Wunschlisten','wishlist_lists'],['Wunschlisten-Einträge','wishlist_list_items'],['Amazon-Vorschauen','toolya_amazon_previews']];
 const results=await Promise.all(tables.map(async([label,table])=>{
  const {count,error}=await admin.from(table).select('*',{count:'exact',head:true});
  if(error||count===null)throw Error('Supabase count unavailable');
  return {label,value:count,detail:'Supabase · '+table};
 }));
 return results;
}
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
 const metrics:Metric[]=[];
 const sources:Source[]=catalog.map(([id,label])=>({id,label,status:'not_connected',detail:'API-Datenquelle noch nicht eingerichtet'}));
 const tasks=[
  {id:'github',run:()=>githubMetrics()},
  {id:'supabase',run:()=>supabaseMetrics(url)}
 ];
 await Promise.all(tasks.map(async({id,run})=>{
  const source=sources.find(s=>s.id===id)!;
  try{
   const values=await run();
   if(values.some(m=>!Number.isFinite(m.value)))throw Error('Invalid provider response');
   metrics.push(...values);
   source.status='connected';source.detail='Live-Daten · '+new Date().toISOString();
  }catch{
   source.status='error';source.detail='Datenabruf fehlgeschlagen oder API-Zugang fehlt';
  }
 }));
 return reply(200,{generatedAt:new Date().toISOString(),days,metrics,sources});
});
