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
  {label:'GitHub Sterne',value:Number(repo.stargazers_count),detail:'Aktueller Gesamtstand · Repository duhrrom11/toolya'},
  {label:'GitHub Forks',value:Number(repo.forks_count),detail:'Repository duhrrom11/toolya'},
  {label:'Offene Issues',value:Number(repo.open_issues_count),detail:'GitHub-Zählung einschließlich Pull Requests'},
  {label:'Offene Pull Requests',value:Number(prs.total_count),detail:'Aktueller GitHub-Stand'}
 ];
}
async function supabaseMetrics(url:string):Promise<Metric[]>{
 const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!secret)throw Error('Supabase server key not configured');
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const tables=[['Gespeicherte Nutzer-Datensätze','user_data'],['Wunschlisten','wishlist_lists'],['Wunschlisten-Einträge','wishlist_list_items'],['Amazon-Vorschauen','toolya_amazon_previews']];
 const results=await Promise.all(tables.map(async([label,table])=>{
  const {count,error}=await admin.from(table).select('*',{count:'exact',head:true});
  if(error||count===null)throw Error('Supabase count unavailable');
  return {label,value:count,detail:'Gesamtbestand · Supabase · '+table};
 }));
 return results;
}
async function ga4Metrics(days:number):Promise<Metric[]>{
 const property=(Deno.env.get('TOOLYA_STATS_GA4_PROPERTY_ID')||'').trim();
 const clientId=Deno.env.get('TOOLYA_STATS_GOOGLE_CLIENT_ID')||'';
 const clientSecret=Deno.env.get('TOOLYA_STATS_GOOGLE_CLIENT_SECRET')||'';
 const refreshToken=Deno.env.get('TOOLYA_STATS_GOOGLE_REFRESH_TOKEN')||'';
 if(!/^\d+$/.test(property)||!clientId||!clientSecret||!refreshToken)throw Error('GA4 credentials not configured');
 const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{
  method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,refresh_token:refreshToken,grant_type:'refresh_token'}),
  signal:AbortSignal.timeout(8000)
 });
 if(!tokenResponse.ok)throw Error('Google OAuth failed');
 const tokenData=await tokenResponse.json();
 if(typeof tokenData.access_token!=='string')throw Error('Google OAuth token missing');
 const reportResponse=await fetch('https://analyticsdata.googleapis.com/v1beta/properties/'+property+':runReport',{
  method:'POST',headers:{Authorization:'Bearer '+tokenData.access_token,'Content-Type':'application/json'},
  body:JSON.stringify({dateRanges:[{startDate:(days-1)+'daysAgo',endDate:'today'}],
   metrics:[{name:'activeUsers'},{name:'sessions'},{name:'screenPageViews'},{name:'eventCount'}]}),
  signal:AbortSignal.timeout(10000)
 });
 if(!reportResponse.ok)throw Error('GA4 Data API HTTP '+reportResponse.status);
 const report=await reportResponse.json();
 const row=report.rows?.[0]?.metricValues;
 if(!Array.isArray(row)||row.length!==4)throw Error('GA4 report has no usable values');
 const labels=['Aktive Nutzer','Sitzungen','Seitenaufrufe','Ereignisse'];
 return labels.map((label,i)=>({label,value:Number(row[i].value),detail:'Google Analytics 4 · letzte '+days+' Tage'}));
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
 // App metadata is server-managed (unlike user_metadata). Require all three
 // properties, including the fixed owner identity, to fail closed.
 const ownerId='53d185ba-d248-4e8e-899e-836e4090e87f';
 if(data.user.id!==ownerId||data.user.email?.toLowerCase()!=='info@toolya.app'||data.user.app_metadata?.toolya_stats_admin!==true)
  return reply(403,{error:'Administrator authorization required'});
 const days=Number(new URL(req.url).searchParams.get('days')||30);
 if(![7,30,90].includes(days))return reply(400,{error:'Invalid period'});
 const metrics:Metric[]=[];
 const sources:Source[]=catalog.map(([id,label])=>({id,label,status:'not_connected',detail:'API-Datenquelle noch nicht eingerichtet'}));
 const tasks=[
  {id:'github',run:()=>githubMetrics()},
  {id:'supabase',run:()=>supabaseMetrics(url)},
  {id:'ga4',run:()=>ga4Metrics(days)}
 ];
 await Promise.all(tasks.map(async({id,run})=>{
  const source=sources.find(s=>s.id===id)!;
  try{
   const values=await run();
   if(values.some(m=>!Number.isFinite(m.value)))throw Error('Invalid provider response');
   metrics.push(...values);
   source.status='connected';source.detail='Live-Daten · '+new Date().toISOString();
  }catch{
   source.status=id==='ga4'&&!Deno.env.get('TOOLYA_STATS_GOOGLE_REFRESH_TOKEN')?'not_connected':'error';
   source.detail=source.status==='not_connected'?'Google Analytics API-Zugang noch nicht eingerichtet':'Datenabruf fehlgeschlagen oder API-Zugang fehlt';
  }
 }));
 return reply(200,{generatedAt:new Date().toISOString(),days,metrics,sources});
});
