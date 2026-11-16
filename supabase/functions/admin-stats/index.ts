import { createClient } from 'npm:@supabase/supabase-js@2.57.0';
const origin='https://toolya.app';
const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'GET,OPTIONS','Vary':'Origin'};
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const catalog=[
 ['ga4','Google Analytics 4'],['bing-webmaster','Bing Webmaster Tools'],['github','GitHub'],['supabase','Supabase'],['brevo','Brevo'],
 ['sav','Sav.com'],['kofi','Ko-fi'],['search-console','Google Search Console'],
 ['ahrefs','Ahrefs'],['openseo','OpenSEO'],['amplitude','Amplitude'],
 ['hosting','Hosting & Verfügbarkeit'],['affiliate','Affiliate & Amazon']
];
type Metric={label:string,value:number,detail:string};
type Source={id:string,label:string,status:string,detail:string};
type SeoPoint={date:string,clicks:number,impressions:number};
type SeoSeries={source:'google'|'bing',points:SeoPoint[]};
const fetchJson=async(url:string,headers:Record<string,string>={})=>{
 const response=await fetch(url,{headers:{Accept:'application/vnd.github+json',...headers},signal:AbortSignal.timeout(7500)});
 if(!response.ok)throw Error('Provider HTTP '+response.status);
 return response.json();
};
async function githubMetrics(days:number):Promise<Metric[]>{
 const headers:Record<string,string>={};
 const githubToken=Deno.env.get('TOOLYA_STATS_GITHUB_TOKEN');
 if(githubToken)headers.Authorization='Bearer '+githubToken;
 const repo=await fetchJson('https://api.github.com/repos/duhrrom11/toolya',headers);
 const prs=await fetchJson('https://api.github.com/search/issues?q=repo%3Aduhrrom11%2Ftoolya+type%3Apr+is%3Aopen&per_page=1',headers);
 const since=new Date(Date.now()-days*86400000).toISOString();
 const commits=await fetchJson('https://api.github.com/repos/duhrrom11/toolya/commits?since='+encodeURIComponent(since)+'&per_page=100',headers);
 return [
  {label:'GitHub Sterne',value:Number(repo.stargazers_count),detail:'Aktueller Gesamtstand · Repository duhrrom11/toolya'},
  {label:'GitHub Forks',value:Number(repo.forks_count),detail:'Repository duhrrom11/toolya'},
  {label:'Offene Issues',value:Number(repo.open_issues_count),detail:'GitHub-Zählung einschließlich Pull Requests'},
  {label:'Offene Pull Requests',value:Number(prs.total_count),detail:'Aktueller GitHub-Stand'},
  {label:'Commits (erste 100)',value:commits.length,detail:'Letzte '+days+' Tage · maximal 100, weitere Seiten nicht enthalten'}
 ];
}
async function supabaseMetrics(url:string):Promise<Metric[]>{
 const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!secret)throw Error('Supabase server key not configured');
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const tables=[['Gespeicherte Nutzer-Datensätze','user_data'],['Wunschlisten','wishlist_lists'],['Wunschlisten-Einträge','wishlist_list_items'],['Amazon-Vorschauen','toolya_amazon_previews'],['Wünsche','wishlist_wishes'],['Produkte','wishlist_products'],['Amazon-Veröffentlichungen','wishlist_amazon_publications'],['Amazon-Scrape-Versuche','wishlist_amazon_scrape_attempts']];
 const results=await Promise.all(tables.map(async([label,table])=>{
  const {count,error}=await admin.from(table).select('*',{count:'exact',head:true});
  if(error||count===null)throw Error('Supabase count unavailable');
  return {label,value:count,detail:'Gesamtbestand · Supabase · '+table};
 }));
 return results;
}
async function ga4Metrics(days:number):Promise<Metric[]>{
 const property=(Deno.env.get('TOOLYA_STATS_GA4_PROPERTY_ID')||'').trim();
 const serviceAccountJson=Deno.env.get('TOOLYA_STATS_GOOGLE_SERVICE_ACCOUNT_JSON')||'';
 if(!/^\d+$/.test(property)||!serviceAccountJson)throw Error('GA4 service account not configured');
 let account:{client_email:string,private_key:string,token_uri?:string};
 try{account=JSON.parse(serviceAccountJson)}catch{throw Error('Invalid service account configuration')}
 if(!account.client_email?.endsWith('.gserviceaccount.com')||!account.private_key?.includes('PRIVATE KEY'))throw Error('Invalid service account');
 const enc=(value:unknown)=>btoa(JSON.stringify(value)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 const now=Math.floor(Date.now()/1000);
 const header=enc({alg:'RS256',typ:'JWT'});
 const claim=enc({iss:account.client_email,scope:'https://www.googleapis.com/auth/analytics.readonly',
  aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
 const keyBytes=Uint8Array.from(atob(account.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'')),c=>c.charCodeAt(0));
 const privateKey=await crypto.subtle.importKey('pkcs8',keyBytes,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const signingInput=header+'.'+claim;
 const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',privateKey,new TextEncoder().encode(signingInput));
 const signed=Array.from(new Uint8Array(signature),b=>String.fromCharCode(b)).join('');
 const assertion=signingInput+'.'+btoa(signed).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{
  method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),
  signal:AbortSignal.timeout(8000)
 });
 if(!tokenResponse.ok)throw Error('Google service account authorization failed');
 const tokenData=await tokenResponse.json();
 if(typeof tokenData.access_token!=='string')throw Error('Google access token missing');
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
 const totals=labels.map((label,i)=>({label,value:Number(row[i].value),detail:'Google Analytics 4 · letzte '+days+' Tage'}));
 // Aggregate popular pages; only page paths and counts, never user IDs or raw events.
 const pagesResponse=await fetch('https://analyticsdata.googleapis.com/v1beta/properties/'+property+':runReport',{
  method:'POST',headers:{Authorization:'Bearer '+tokenData.access_token,'Content-Type':'application/json'},
  body:JSON.stringify({dateRanges:[{startDate:(days-1)+'daysAgo',endDate:'today'}],
   dimensions:[{name:'pagePath'}],metrics:[{name:'screenPageViews'}],
   orderBys:[{metric:{metricName:'screenPageViews'},desc:true}],limit:'10'}),
  signal:AbortSignal.timeout(10000)
 });
 if(!pagesResponse.ok)return totals;
 const pages=await pagesResponse.json();
 const top=(Array.isArray(pages.rows)?pages.rows:[]).slice(0,10).flatMap((entry:unknown)=>{
  const item=entry as {dimensionValues?:{value?:string}[],metricValues?:{value?:string}[]};
  const path=item.dimensionValues?.[0]?.value||'';
  const value=Number(item.metricValues?.[0]?.value);
  if(!path.startsWith('/')||path.length>150||!Number.isFinite(value))return [];
  return [{label:'Seite: '+path,value,detail:'GA4 Seitenaufrufe · letzte '+days+' Tage'}];
 });
 // Aggregate observed GA4 events, not hypothetical click counts.
 const additional:Metric[]=[];
 const reports=[
  {dimensions:[{name:'eventName'}],metrics:[{name:'eventCount'}],orderBys:[{metric:{metricName:'eventCount'},desc:true}],limit:'15'},
  {dimensions:[{name:'date'}],metrics:[{name:'screenPageViews'}],orderBys:[{dimension:{dimensionName:'date'}}],limit:'100'}
 ];
 for(let i=0;i<reports.length;i++){
  try{
   const response=await fetch('https://analyticsdata.googleapis.com/v1beta/properties/'+property+':runReport',{
    method:'POST',headers:{Authorization:'Bearer '+tokenData.access_token,'Content-Type':'application/json'},
    body:JSON.stringify({dateRanges:[{startDate:(days-1)+'daysAgo',endDate:'today'}],...reports[i]}),
    signal:AbortSignal.timeout(10000)
   });
   if(!response.ok)continue;
   const data=await response.json();
   for(const entry of (Array.isArray(data.rows)?data.rows:[])){
    const key=entry.dimensionValues?.[0]?.value;
    const value=Number(entry.metricValues?.[0]?.value);
    if(typeof key!=='string'||!Number.isFinite(value)||value<0)continue;
    if(i===0&&/^[a-zA-Z][a-zA-Z0-9_]{0,60}$/.test(key))
     additional.push({label:'Ereignis: '+key,value,detail:'GA4 Ereignisanzahl · letzte '+days+' Tage'});
    if(i===1&&/^\d{8}$/.test(key))
     additional.push({label:'Tag: '+key,value,detail:'GA4 Seitenaufrufe pro Tag'});
   }
  }catch{/* Optional breakdown must not invalidate confirmed totals. */}
 }
 // Query tool_open explicitly: the top-15 event-name report can omit rare events.
 // Keep this diagnostic independent of the custom dimension and do not fabricate counts.
 try{
  const eventResponse=await fetch('https://analyticsdata.googleapis.com/v1beta/properties/'+property+':runReport',{
   method:'POST',headers:{Authorization:'Bearer '+tokenData.access_token,'Content-Type':'application/json'},
   body:JSON.stringify({dateRanges:[{startDate:(days-1)+'daysAgo',endDate:'today'}],
    metrics:[{name:'eventCount'}],
    dimensionFilter:{filter:{fieldName:'eventName',stringFilter:{value:'tool_open',matchType:'EXACT'}}}}),
   signal:AbortSignal.timeout(10000)
  });
  if(eventResponse.ok){
   const eventData=await eventResponse.json();
   const count=Number(eventData.rows?.[0]?.metricValues?.[0]?.value??0);
   if(Number.isFinite(count)&&count>=0)
    additional.push({label:'GA4-Tool-Open-Gesamt',value:count,detail:'Exakte GA4-Abfrage für tool_open · letzte '+days+' Tage'});
  }
 }catch{/* A failed optional diagnostic must not break other reports. */}
 // Diagnostic status is fixed and sanitized; no Google error bodies or credentials exposed.
 let rankingStatus='GA4-Ranking: Abfrage noch nicht erfolgreich';
 try{
  const rankingResponse=await fetch('https://analyticsdata.googleapis.com/v1beta/properties/'+property+':runReport',{
   method:'POST',headers:{Authorization:'Bearer '+tokenData.access_token,'Content-Type':'application/json'},
   body:JSON.stringify({dateRanges:[{startDate:(days-1)+'daysAgo',endDate:'today'}],
    dimensions:[{name:'customEvent:tool_name'}],metrics:[{name:'eventCount'}],
    dimensionFilter:{filter:{fieldName:'eventName',stringFilter:{value:'tool_open',matchType:'EXACT'}}},
    orderBys:[{metric:{metricName:'eventCount'},desc:true}],limit:'12'}),
   signal:AbortSignal.timeout(10000)
  });
  if(!rankingResponse.ok){
   rankingStatus=rankingResponse.status===400?'GA4-Ranking: Dimension noch nicht abfragbar (HTTP 400)':rankingResponse.status===403?'GA4-Ranking: Berechtigung verweigert (HTTP 403)':'GA4-Ranking: Abfrage fehlgeschlagen (HTTP '+rankingResponse.status+')';
  }else{
   const ranking=await rankingResponse.json();
   const allowed=new Set(['wishes','budget','moving','plants','housemates','estate','car','pet-health','parking','loans','meters','baking']);
   const rows=Array.isArray(ranking.rows)?ranking.rows:[];
   let accepted=0;
   for(const item of rows){
    const name=item.dimensionValues?.[0]?.value;
    const value=Number(item.metricValues?.[0]?.value);
    if(allowed.has(name)&&Number.isFinite(value)&&value>=0){
     additional.push({label:'Tool-Start: '+name,value,detail:'GA4 tool_open · letzte '+days+' Tage'});
     accepted++;
    }
   }
   rankingStatus=accepted?'GA4-Ranking: '+accepted+' Tools mit erfassten Starts':rows.length?'GA4-Ranking: Ereignisse ohne gültige Tool-Kennung':'GA4-Ranking: Abfrage erfolgreich, noch keine tool_open-Daten';
  }
 }catch{rankingStatus='GA4-Ranking: Zeitüberschreitung oder Netzwerkfehler'}
 additional.push({label:'Tool-Ranking-Diagnose',value:0,detail:rankingStatus});
 return [...totals,...top,...additional];
}
// Direct, free Search Console API. Uses an existing server-side Google service account;
// Google Search Console must grant this service account access to the Toolya property.
async function searchConsoleMetrics(days:number,series:SeoSeries[]):Promise<Metric[]>{
 const serviceAccountJson=Deno.env.get('TOOLYA_STATS_GOOGLE_SERVICE_ACCOUNT_JSON')||'';
 if(!serviceAccountJson)throw Error('GSC credentials unavailable');
 let account:{client_email:string,private_key:string};
 try{account=JSON.parse(serviceAccountJson)}catch{throw Error('GSC credentials invalid')}
 if(!account.client_email?.endsWith('.gserviceaccount.com')||!account.private_key?.includes('PRIVATE KEY'))throw Error('GSC credentials invalid');
 const encode=(v:unknown)=>btoa(JSON.stringify(v)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 const now=Math.floor(Date.now()/1000);
 const input=encode({alg:'RS256',typ:'JWT'})+'.'+encode({iss:account.client_email,scope:'https://www.googleapis.com/auth/webmasters.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
 const bytes=Uint8Array.from(atob(account.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'')),c=>c.charCodeAt(0));
 const key=await crypto.subtle.importKey('pkcs8',bytes,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(input));
 const jwt=input+'.'+btoa(Array.from(new Uint8Array(sig),b=>String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt}),signal:AbortSignal.timeout(8000)});
 if(!tokenResponse.ok)throw Error('GSC authorization failed');
 const token=await tokenResponse.json();
 if(typeof token.access_token!=='string')throw Error('GSC token unavailable');
 // Explicitly configured verified property only; no property discovery or arbitrary URL input.
 const site=(Deno.env.get('TOOLYA_STATS_GSC_SITE_URL')||'sc-domain:toolya.app').trim();
 if(site!=='sc-domain:toolya.app'&&site!=='https://toolya.app/')throw Error('GSC property not allowed');
 // Search Console data is often delayed by 2–3 days. Use complete dates in UTC as a conservative boundary.
 const end=new Date(Date.now()-3*86400000);
 const start=new Date(end.getTime()-(days-1)*86400000);
 const iso=(d:Date)=>d.toISOString().slice(0,10);
 const response=await fetch('https://searchconsole.googleapis.com/webmasters/v3/sites/'+encodeURIComponent(site)+'/searchAnalytics/query',{
  method:'POST',headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},
  body:JSON.stringify({startDate:iso(start),endDate:iso(end),type:'web',rowLimit:1}),
  signal:AbortSignal.timeout(10000)
 });
 if(!response.ok)throw Error('GSC API HTTP '+response.status);
 const data=await response.json();
 // Daily data is optional: an unavailable trend must not invalidate verified totals.
 try{
  const dailyResponse=await fetch('https://searchconsole.googleapis.com/webmasters/v3/sites/'+encodeURIComponent(site)+'/searchAnalytics/query',{
   method:'POST',headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},
   body:JSON.stringify({startDate:iso(start),endDate:iso(end),type:'web',dimensions:['date'],rowLimit:100}),
   signal:AbortSignal.timeout(10000)
  });
  if(dailyResponse.ok){
   const daily=await dailyResponse.json();
   if(Array.isArray(daily.rows)){
    const points:SeoPoint[]=daily.rows.flatMap((r:unknown)=>{
     const v=r as {keys?:unknown[],clicks?:unknown,impressions?:unknown};
     const date=v.keys?.[0],clicks=Number(v.clicks),impressions=Number(v.impressions);
     return typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&date>=iso(start)&&date<=iso(end)&&
      Number.isFinite(clicks)&&Number.isFinite(impressions)&&clicks>=0&&impressions>=0?[{date,clicks,impressions}]:[];
    });
    series.push({source:'google',points});
   }
  }
 }catch{/* Optional chart only. */}
 const row=data.rows?.[0];
 if(!row)return [{label:'GSC Klicks',value:0,detail:'Keine Suchdaten · '+iso(start)+' bis '+iso(end)},{label:'GSC Impressionen',value:0,detail:'Keine Suchdaten · '+iso(start)+' bis '+iso(end)}];
 const clicks=Number(row.clicks),impressions=Number(row.impressions),ctr=Number(row.ctr),position=Number(row.position);
 if(![clicks,impressions,ctr,position].every(Number.isFinite))throw Error('GSC invalid values');
 const detail='Google Search Console · '+iso(start)+' bis '+iso(end);
 return [{label:'GSC Klicks',value:clicks,detail},{label:'GSC Impressionen',value:impressions,detail},{label:'GSC CTR (%)',value:Math.round(ctr*10000)/100,detail},{label:'GSC Ø Position',value:Math.round(position*100)/100,detail}];
}
// Bing Webmaster read-only JSON API. API key is a Supabase secret, never sent to browsers.
async function bingWebmasterMetrics(days:number,series:SeoSeries[]):Promise<Metric[]>{
 const key=(Deno.env.get('TOOLYA_STATS_BING_WEBMASTER_API_KEY')||'').trim();
 if(!key)throw Error('BING_NOT_CONFIGURED');
 const site=(Deno.env.get('TOOLYA_STATS_BING_SITE_URL')||'https://toolya.app/').trim();
 if(site!=='https://toolya.app/'&&site!=='https://toolya.app')throw Error('BING_SITE_INVALID');
 const url=new URL('https://ssl.bing.com/webmaster/api.svc/json/GetRankAndTrafficStats');
 url.searchParams.set('siteUrl',site);
 url.searchParams.set('apikey',key);
 let response:Response;
 try{response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000),redirect:'error'});}
 catch{throw Error('BING_NETWORK')}
 if(response.status===401||response.status===403)throw Error('BING_FORBIDDEN');
 if(!response.ok)throw Error('BING_HTTP_'+response.status);
 const data=await response.json();
 if(!Array.isArray(data?.d))throw Error('BING_INVALID_RESPONSE');
 const cutoff=Date.now()-days*86400000;
 let clicks=0,impressions=0,observations=0;
 const points:SeoPoint[]=[];
 for(const row of data.d){
  // Bing JSON API dates use /Date(milliseconds-offset)/.
  const match=typeof row?.Date==='string'?row.Date.match(/^\\?\/Date\((-?\d+)(?:[+-]\d{4})?\)\\?\/$/):null;
  if(!match)continue;
  const time=Number(match[1]);
  if(!Number.isFinite(time)||time<cutoff||time>Date.now()+86400000)continue;
  const c=Number(row.Clicks),i=Number(row.Impressions);
  if(!Number.isFinite(c)||!Number.isFinite(i)||c<0||i<0)continue;
  clicks+=c;impressions+=i;observations++;
  points.push({date:new Date(time).toISOString().slice(0,10),clicks:c,impressions:i});
 }
 series.push({source:'bing',points:points.sort((a,b)=>a.date.localeCompare(b.date))});
 const detail='Bing Webmaster Tools · letzte '+days+' Tage · '+observations+' Datensätze';
 return [{label:'Bing Klicks',value:clicks,detail},{label:'Bing Impressionen',value:impressions,detail},
  {label:'Bing CTR (%)',value:impressions?Math.round(clicks/impressions*10000)/100:0,detail}];
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
 const seoTrends:SeoSeries[]=[];
 const sources:Source[]=catalog.map(([id,label])=>({id,label,status:'not_connected',detail:'API-Datenquelle noch nicht eingerichtet'}));
 const tasks=[
  {id:'github',run:()=>githubMetrics(days)},
  {id:'supabase',run:()=>supabaseMetrics(url)},
  {id:'ga4',run:()=>ga4Metrics(days)},
  {id:'search-console',run:()=>searchConsoleMetrics(days,seoTrends)},
  {id:'bing-webmaster',run:()=>bingWebmasterMetrics(days,seoTrends)}
 ];
 await Promise.all(tasks.map(async({id,run})=>{
  const source=sources.find(s=>s.id===id)!;
  try{
   const values=await run();
   if(values.some(m=>!Number.isFinite(m.value)))throw Error('Invalid provider response');
   metrics.push(...values);
   source.status='connected';source.detail='Live-Daten · '+new Date().toISOString();
  }catch(err){
   const message=err instanceof Error?err.message:'';
   const ga4Missing=id==='ga4'&&message==='GA4 service account not configured';
   source.status=ga4Missing||id==='bing-webmaster'&&message==='BING_NOT_CONFIGURED'?'not_connected':'error';
   // Only expose fixed, non-sensitive diagnostics to the authenticated owner.
   const ga4Codes:Record<string,string>={
    'GA4 service account not configured':'GA4: Property-ID oder Dienstkonto-Secret fehlt',
    'Invalid service account configuration':'GA4: Dienstkonto-JSON ist ungültig',
    'Invalid service account':'GA4: Dienstkonto-Daten unvollständig',
    'Google service account authorization failed':'GA4: Google OAuth hat die Anmeldung abgelehnt',
    'Google access token missing':'GA4: Kein Google-Zugriffstoken erhalten',
    'GA4 report has no usable values':'GA4: Bericht ohne auswertbare Kennzahlen'
   };
   source.detail=id==='bing-webmaster'?(message==='BING_NOT_CONFIGURED'?'Bing: API-Schlüssel noch nicht als Supabase-Secret hinterlegt':message==='BING_FORBIDDEN'?'Bing: API-Schlüssel ungültig oder Website nicht freigegeben':message==='BING_SITE_INVALID'?'Bing: Website-Konfiguration ungültig':'Bing: Datenabruf derzeit nicht möglich'):id==='search-console'?(message==='GSC credentials unavailable'?'GSC: Google-Dienstkonto nicht eingerichtet':message==='GSC API HTTP 403'?'GSC: Dienstkonto hat keinen Zugriff auf die Search-Console-Property':message==='GSC API HTTP 404'?'GSC: Property nicht gefunden oder nicht freigegeben':'GSC: Datenabruf derzeit nicht möglich'):id==='ga4'?(ga4Codes[message]||(/GA4 Data API HTTP (401|403|404|429|500|503)/.test(message)?'GA4: '+message:'GA4: API-Abfrage fehlgeschlagen')):'Datenabruf fehlgeschlagen oder API-Zugang fehlt';
  }
 }));
 return reply(200,{generatedAt:new Date().toISOString(),days,metrics,sources,seoTrends});
});
