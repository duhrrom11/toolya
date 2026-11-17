import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
import {parseHTML} from 'npm:linkedom@0.18.12';
import ipaddr from 'npm:ipaddr.js@2.2.0';
import {AMAZON,canonicalList,publicUrl,candidate,robotsAllowed} from './model.mjs';
const cors={'Access-Control-Allow-Origin':'https://toolya.app','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin'};
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
const must=(r:any)=>{if(r.error)throw Error('Datenbankabfrage fehlgeschlagen.');return r.data};
async function safeFetch(value:string,limit=600000):Promise<{html:string,url:string}>{
 let url=publicUrl(value);if(!url||AMAZON.test(new URL(url).hostname))throw Error('Quelladresse nicht erlaubt.');
 for(let redirects=0;redirects<4;redirects++){
  const host=new URL(url).hostname;const ips=(await Promise.allSettled([Deno.resolveDns(host,'A'),Deno.resolveDns(host,'AAAA')])).flatMap(r=>r.status==='fulfilled'?r.value:[]);
  if(!ips.length||ips.some(ip=>!ipaddr.isValid(ip)||ipaddr.parse(ip).range()!=='unicast'))throw Error('Netzwerkadresse nicht erlaubt.');
  const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(6500),headers:{'User-Agent':'ToolyaWishlistFinder/1.0 (+https://toolya.app)','Accept':'text/html,text/plain'}});
  if([301,302,303,307,308].includes(r.status)){const next=publicUrl(new URL(r.headers.get('location')||'',url).href);await r.body?.cancel();if(!next||AMAZON.test(new URL(next).hostname))throw Error('Weiterleitung nicht erlaubt.');url=next;continue}
  if(!r.ok)throw Error('Webseite HTTP '+r.status);
  const reader=r.body?.getReader();if(!reader)throw Error('Leere Seite.');let bytes=0;const chunks=[];try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>limit)throw Error('Seite zu groß.');chunks.push(value)}}finally{await reader.cancel()}
  const result=new Uint8Array(bytes);let pos=0;for(const chunk of chunks){result.set(chunk,pos);pos+=chunk.length}return {html:new TextDecoder().decode(result),url};
 }
 throw Error('Zu viele Weiterleitungen.');
}
async function permitted(url:string){try{const u=new URL(url);const robot=await safeFetch(u.origin+'/robots.txt',100000);return robotsAllowed(robot.html,u.pathname+u.search)}catch(e){return e instanceof Error&&e.message==='Webseite HTTP 404'}}
async function collect(db:any,url:string,country:string){
 const source=publicUrl(url);if(!source||AMAZON.test(new URL(source).hostname))return {added:0,skipped:1};
 // Atomic claim: repeated or overlapping searches do not fetch a source twice.
 const claim=await db.from('wishlist_discovery_sources').upsert({source_url:source},{onConflict:'source_url',ignoreDuplicates:true}).select('source_url');must(claim);if(!claim.data.length)return {added:0,skipped:1};
 try{
  if(!await permitted(source))throw Error('robots.txt nicht freigegeben oder nicht erreichbar.');
  const result=await safeFetch(source);const {document}=parseHTML(result.html);const resolve=(v:string)=>{try{return new URL(v,result.url).href}catch{return ''}};
  const name=(document.querySelector('meta[property="og:site_name"]')?.getAttribute('content')||document.querySelector('title')?.textContent||document.querySelector('h1')?.textContent||new URL(source).hostname).trim().slice(0,160);
  const logo=resolve(document.querySelector('[itemprop="logo"]')?.getAttribute('src')||document.querySelector('header img[alt*="Logo" i]')?.getAttribute('src')||document.querySelector('meta[property="og:image"]')?.getAttribute('content')||'');
  const email=(document.querySelector('a[href^="mailto:"]')?.getAttribute('href')||'').replace(/^mailto:/i,'').split('?')[0]||(document.body?.textContent||'').match(/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+/)?.[0]||'';
  let added=0;const links=new Set<string>();for(const a of document.querySelectorAll('a[href]')){const value=resolve(a.getAttribute('href')||'');if(canonicalList(value))links.add(value)}
  for(const link of links){const c=candidate({name,logo_url:logo,wishlist_url:link,email,source_url:source,country});const r=await db.from('wishlist_discovery_candidates').upsert(c,{onConflict:'list_key',ignoreDuplicates:true}).select('id,status');must(r);added+=r.data.filter((x:any)=>x.status==='new').length}
  must(await db.from('wishlist_discovery_sources').update({status:'checked'}).eq('source_url',source));return {added,skipped:0};
 }catch(e){must(await db.from('wishlist_discovery_sources').update({status:'failed'}).eq('source_url',source));return {added:0,skipped:0,error:e instanceof Error?e.message:'Seite konnte nicht gelesen werden.'}}
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return reply(405,{error:'Methode nicht erlaubt.'});
 if(req.headers.get('origin')&&req.headers.get('origin')!=='https://toolya.app')return reply(403,{error:'Zugriff verweigert.'});
 const token=(req.headers.get('authorization')||'').match(/^Bearer (\S+)$/)?.[1];if(!token)return reply(401,{error:'Bitte anmelden.'});
 const auth=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false}});const {data,error}=await auth.auth.getUser(token);
 if(error||!data.user)return reply(401,{error:'Sitzung abgelaufen.'});
 if(data.user.id!=='53d185ba-d248-4e8e-899e-836e4090e87f'||data.user.email?.toLowerCase()!=='info@toolya.app'||data.user.app_metadata?.toolya_stats_admin!==true)return reply(403,{error:'Nur für Administratoren.'});
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
 try{
  if(Number(req.headers.get('content-length')||0)>1500000)return reply(413,{error:'Datei zu groß.'});
  const raw=await req.text();if(raw.length>1500000)return reply(413,{error:'Datei zu groß.'});const body=JSON.parse(raw);
  if(body.action==='configure'){must(await db.rpc('wishlist_tavily_key',{new_key:String(body.key||'').trim()}));return reply(200,{configured:true})}
  const key=must(await db.rpc('wishlist_tavily_key'));
  const quota=must(await db.rpc('wishlist_tavily_quota',{claim:false}));
  if(body.action==='list'){
   const offset=Math.max(0,Math.min(100000,Number(body.offset)||0));const rows=must(await db.from('wishlist_discovery_candidates').select('*').order('found_at',{ascending:false}).order('id').range(offset,offset+199));
   return reply(200,{rows,configured:!!key,offset,quota,searchProvider:'Tavily'});
  }
  if(body.action==='stage'){
   if(!Array.isArray(body.rows)||body.rows.length>200)return reply(400,{error:'Maximal 200 Einträge pro Stapel.'});
   const valid=body.rows.map(candidate);const result=must(await db.from('wishlist_discovery_candidates').upsert(valid,{onConflict:'list_key',ignoreDuplicates:true}).select('id,status'));const added=result.filter((r:any)=>r.status==='new').length;return reply(200,{added,duplicates:valid.length-added});
  }
  if(body.action==='publish'){
   if(!Array.isArray(body.ids)||body.ids.length>200||body.ids.some((v:any)=>typeof v!=='string'||!/^[0-9a-f-]{36}$/i.test(v)))return reply(400,{error:'Ungültige Auswahl.'});
   return reply(200,must(await db.rpc('publish_discovered_wishlists',{candidate_ids:body.ids})));
  }
  if(body.action==='edit'){
   const existing=must(await db.from('wishlist_discovery_candidates').select('*').eq('id',body.id).eq('status','new').single());
   const edited=candidate({...existing,...body.values,wishlist_url:existing.wishlist_url,source_url:existing.source_url});
   must(await db.from('wishlist_discovery_candidates').update(edited).eq('id',body.id).eq('status','new'));return reply(200,{ok:true});
  }
  if(body.action==='withdraw'){
   // Fail closed: a matching list key alone does not establish that this row
   // still represents the entry originally published by the finder.
   if(typeof body.id!=='string'||!/^[0-9a-f-]{36}$/i.test(body.id))return reply(400,{error:'Ungültige Auswahl.'});
   const existing=must(await db.from('wishlist_discovery_candidates')
    .select('id,list_key,name,logo_url,wishlist_url,source_url,country,found_at')
    .eq('id',body.id).eq('status','published').single());
   const matching=must(await db.from('wishlist_imported_entries')
    .select('id,created_at').eq('list_key',existing.list_key)
    .eq('display_name',existing.name).eq('logo_url',existing.logo_url)
    .eq('wishlist_url',existing.wishlist_url).eq('source_url',existing.source_url)
    .eq('country',existing.country).limit(2));
   if(matching.length!==1||new Date(matching[0].created_at).getTime()<new Date(existing.found_at).getTime())
    return reply(409,{error:'Veröffentlichung wurde zwischenzeitlich verändert oder stammt nicht eindeutig aus diesem Finder. Kein Eintrag gelöscht.'});
   const removed=must(await db.from('wishlist_imported_entries')
    .delete().eq('id',matching[0].id).eq('list_key',existing.list_key)
    .eq('display_name',existing.name).eq('logo_url',existing.logo_url)
    .eq('wishlist_url',existing.wishlist_url).eq('source_url',existing.source_url)
    .eq('country',existing.country).select('id'));
   if(removed.length!==1)return reply(409,{error:'Veröffentlichung nicht unverändert gefunden. Kein weiterer Eintrag gelöscht.'});
   const updated=must(await db.from('wishlist_discovery_candidates')
    .update({status:'new'}).eq('id',body.id).eq('status','published').select('id'));
   if(updated.length!==1)return reply(409,{error:'Veröffentlichung entfernt; Finderstatus konnte nicht aktualisiert werden. Bitte Administrator prüfen lassen.'});
   return reply(200,{ok:true});
  }
  if(body.action==='dismiss'){if(!Array.isArray(body.ids)||body.ids.length>200)return reply(400,{error:'Ungültige Auswahl.'});must(await db.from('wishlist_discovery_candidates').update({status:'dismissed'}).in('id',body.ids).eq('status','new'));return reply(200,{ok:true})}
  if(body.action==='crawl'){
   if(!Array.isArray(body.urls)||body.urls.length>3)return reply(400,{error:'Maximal drei Quellseiten pro Durchlauf.'});const results=[];for(const url of body.urls){const normalized=publicUrl(String(url));if(normalized)must(await db.from('wishlist_discovery_sources').delete().eq('source_url',normalized).eq('status','failed'));results.push(await collect(db,String(url),''))}return reply(200,{results});
  }
  if(body.action==='search'){
   if(!key)return reply(503,{error:'Bitte zuerst einen Tavily-API-Schlüssel hinterlegen.'});
   if(quota.remaining<=0)return reply(200,{done:true,message:'Kostenloses Tavily-Monatslimit (900 Credits) erreicht. Suche pausiert bis zum nächsten UTC-Monat.',quota});
   const topics=['Tierheim','Tierschutzverein','Obdachlosenhilfe','Kinderhilfe','Schule','Verein','Privatperson','Blog','Initiative','Bibliothek','Frauenhaus','Wildtierhilfe'];
   const seeds=[];for(const topic of topics)for(const [country,lang,extra] of [['DE','de','Deutschland'],['AT','de','Österreich'],['CH','de','Schweiz'],['ALL','de','Liechtenstein'],['ALL','de','Luxemburg'],['ALL','fr','Luxembourg'],['ALL','fr','Lëtzebuerg'],['ALL','de','']])seeds.push({query:`${topic} ${extra} "Amazon" "Wunschliste" -site:amazon.de -site:amazon.com -site:amazon.fr`,country,lang});
   // French/Luxembourg terms supplement German queries, not just German translations.
   for(const term of ['"liste de souhaits"','"liste d’envies"','"Wonschlëscht"','"wishlist"'])seeds.push({query:`Amazon ${term} Luxembourg -site:amazon.fr -site:amazon.de -site:amazon.com`,country:'ALL',lang:'fr'});
   must(await db.from('wishlist_discovery_queries').upsert(seeds,{onConflict:'query,country,lang',ignoreDuplicates:true}));
   const q=must(await db.from('wishlist_discovery_queries').select('*').lt('page',10).order('page').order('query').limit(1))[0];if(!q)return reply(200,{done:true,message:'Suchplan abgeschlossen. Es besteht keine Vollständigkeitsgarantie.'});
   // Tavily does not expose Brave-style pagination: each seed is queried only once.
   const credit=must(await db.rpc('wishlist_tavily_quota',{claim:true}));
   if(!credit.allowed)return reply(200,{done:true,message:'Kostenloses Tavily-Monatslimit erreicht. Keine Anfrage versendet.',quota:credit});
   const response=await fetch('https://api.tavily.com/search',{
    method:'POST',
    headers:{Authorization:'Bearer '+key,'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({query:q.query,search_depth:'basic',max_results:20,topic:'general',include_answer:false,include_raw_content:false,exclude_domains:['amazon.de','amazon.com','amazon.fr']}),
    signal:AbortSignal.timeout(12000)
   });
   if(!response.ok)return reply(response.status===429?429:502,{error:'Tavily-Suche HTTP '+response.status+'. Suchfortschritt bleibt erhalten; ein Credit wurde vorsorglich reserviert.'});
   const found=await response.json();
   const urls=(Array.isArray(found.results)?found.results:[]).map((r:any)=>publicUrl(r.url)).filter((s:any)=>s&&!AMAZON.test(new URL(s).hostname));
   // Store search hits before advancing the cursor; crawl separate bounded requests.
   // Candidate source claims remain separate from pending URLs.
   must(await db.from('wishlist_discovery_pending').upsert(urls.map((source_url:string)=>({source_url,country:q.country==='ALL'?'':({DE:'Deutschland',AT:'Österreich',CH:'Schweiz'} as any)[q.country]})),{onConflict:'source_url',ignoreDuplicates:true}));
   must(await db.from('wishlist_discovery_queries').update({page:10}).eq('query',q.query).eq('country',q.country).eq('lang',q.lang));
   return reply(200,{query:q.query,pages:1,found:urls.length,quota:credit});
  }
  if(body.action==='next'){
   const pending=must(await db.from('wishlist_discovery_pending').select('*').order('created_at').limit(2));const results=[];
   for(const item of pending){results.push(await collect(db,item.source_url,item.country));must(await db.from('wishlist_discovery_pending').delete().eq('source_url',item.source_url))}
   return reply(200,{results,pending:pending.length});
  }
  return reply(400,{error:'Unbekannte Aktion.'});
 }catch(e){return reply(400,{error:e instanceof Error?e.message:'Aktion fehlgeschlagen.'})}
});
