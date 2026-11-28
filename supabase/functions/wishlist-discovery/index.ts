import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
import {parseHTML} from 'npm:linkedom@0.18.12';
import ipaddr from 'npm:ipaddr.js@2.2.0';
import {AMAZON,canonicalList,publicUrl,candidate,robotsAllowed,sourceFavicon} from './model.mjs';
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
  const fallbackName=(document.querySelector('meta[property="og:site_name"]')?.getAttribute('content')||document.querySelector('title')?.textContent||document.querySelector('h1')?.textContent||new URL(source).hostname).trim().slice(0,160);
  // Explicit link labels provide *suggestions*, never verified identities.
  const explicitOwner=(anchor:any)=>{
    const label=[anchor.getAttribute('aria-label')||'',anchor.getAttribute('title')||'',anchor.textContent||''].join(' ').replace(/\s+/g,' ').trim().slice(0,350);
    const match=label.match(/(?:amazon[- ]?)?(?:wunschliste|wunschzettel|wishlist|wish list|lista de deseos|lista de regalos|lista dei desideri|liste de souhaits|liste d[’']envies|verlanglijst)\s+(?:von|of|de|di|van)\s+([\p{L}\p{N}][\p{L}\p{N} .&'’-]{2,75})/iu);
    return match?.[1]?.trim().replace(/[.,;\s]+$/,'').slice(0,80)||null;
  };
  const iconHref=document.querySelector('link[rel="icon"],link[rel="shortcut icon"]')?.getAttribute('href')||'';
  const favicon=sourceFavicon(source,iconHref);
  const email=(document.querySelector('a[href^="mailto:"]')?.getAttribute('href')||'').replace(/^mailto:/i,'').split('?')[0]||(document.body?.textContent||'').match(/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+/)?.[0]||'';
  let added=0;const links=new Map<string,{url:string,name:string}>();for(const a of document.querySelectorAll('a[href]')){const value=resolve(a.getAttribute('href')||'');const canonical=canonicalList(value);if(canonical){const suggested=explicitOwner(a);const previous=links.get(canonical.key);if(!previous||previous.name===fallbackName)links.set(canonical.key,{url:value,name:suggested||fallbackName})}}
  for(const item of links.values()){const c=candidate({name:item.name,favicon_url:favicon,wishlist_url:item.url,email,source_url:source,country});const r=await db.from('wishlist_discovery_candidates').upsert(c,{onConflict:'list_key',ignoreDuplicates:true}).select('id,status');must(r);added+=r.data.filter((x:any)=>x.status==='new').length}
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


  if(typeof body.action==='string'&&body.action.startsWith('directory_admin_')){
   const actor=data.user.id;
   const validId=(x:any)=>typeof x==='string'&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(x);
   const audit=async(action:string,id:string,details:any={})=>must(await db.from('wishlist_admin_audit').insert({actor_id:actor,action,entity_id:id,details}));
   const owned=async(id:any)=>{if(!validId(id))throw Error('Ungültige ID.');return must(await db.from('wishlist_directory_profiles').select('*').eq('id',id).eq('owner_id',actor).single())};
   const v=body.values||{};
   const visibility=(x:any)=>['private','link','directory'].includes(x)?x:'private';
   if(body.action==='directory_admin_list'){
    const offset=Math.max(0,Math.min(100000,Math.floor(Number(body.offset)||0)));
    const profiles=must(await db.from('wishlist_directory_profiles').select('*,wishlist_directory_lists(*)').eq('owner_id',actor).order('display_name').order('id').range(offset,offset+99));
    return reply(200,{profiles});
   }
   if(body.action==='directory_admin_audit'){
    const rows=must(await db.from('wishlist_admin_audit').select('action,entity_id,details,created_at').eq('actor_id',actor).order('id',{ascending:false}).limit(100));return reply(200,{rows});
   }
   if(body.action==='directory_admin_save'){
    const name=String(v.display_name||'').trim(),image=String(v.image_url||'').trim(),country=String(v.country||'').trim(),bio=String(v.bio||'').trim();
    if(!name||name.length>161||country.length>80||bio.length>600||image.length>2048||(image&&!publicUrl(image)))return reply(400,{error:'Ungültige Profildaten.'});
    let id=body.id;
    const values={display_name:name,country,bio,image_url:image?publicUrl(image):'',visibility:visibility(v.visibility),show_other_lists:true};
    if(id){const p=await owned(id);const changes:any={...values};if(!p.managed_by_finder){if(p.kind==='organization'){if(name.length>80)return reply(400,{error:'Name zu lang.'});changes.organization_name=name}else if(p.kind==='person'){changes.display_name=p.display_name}}must(await db.from('wishlist_directory_profiles').update(changes).eq('id',id).eq('owner_id',actor));}
    else{id=must(await db.from('wishlist_directory_profiles').insert({...values,owner_id:actor,kind:'organization',managed_by_finder:true}).select('id').single()).id}
    await audit('profile_save',id);return reply(200,{id});
   }
   if(body.action==='directory_admin_merge'){
    await owned(body.id);await owned(body.target);must(await db.rpc('wishlist_admin_merge',{p_actor:actor,p_source:body.id,p_target:body.target}));return reply(200,{ok:true});
   }
   if(body.action==='directory_admin_delete'){
    await owned(body.id);must(await db.from('wishlist_directory_profiles').delete().eq('id',body.id).eq('owner_id',actor));await audit('profile_delete',body.id);return reply(200,{ok:true});
   }
   if(body.action==='directory_admin_list_save'||body.action==='directory_admin_list_delete'){
    await owned(body.profile_id);
    if(body.id&&!validId(body.id))return reply(400,{error:'Ungültige Listen-ID.'});
    if(body.action==='directory_admin_list_delete'){
     if(!body.id)return reply(400,{error:'Listen-ID fehlt.'});
     const rows=must(await db.from('wishlist_directory_lists').delete().eq('id',body.id).eq('profile_id',body.profile_id).select('id'));if(rows.length!==1)return reply(404,{error:'Liste nicht gefunden.'});await audit('list_delete',body.id);return reply(200,{ok:true});
    }
    const list=canonicalList(String(v.url||'')),name=String(v.name||'').trim(),occasion=String(v.occasion||'').trim();
    if(!list||!name||name.length>100||occasion.length>80)return reply(400,{error:'Ungültige Wunschliste.'});
    const target=v.profile_id||body.profile_id;await owned(target);
    const values={profile_id:target,name,url:list.url,occasion,visibility:visibility(v.visibility)};
    let id=body.id;
    if(id){const rows=must(await db.from('wishlist_directory_lists').update(values).eq('id',id).eq('profile_id',body.profile_id).select('id'));if(rows.length!==1)return reply(404,{error:'Liste nicht gefunden.'})}
    else{id=must(await db.from('wishlist_directory_lists').insert(values).select('id').single()).id}
    await audit('list_save',id,{profile_id:target});return reply(200,{id});
   }
   return reply(400,{error:'Unbekannte Admin-Aktion.'});
  }
  if(['managed_list','managed_save','managed_delete'].includes(body.action))return reply(409,{error:'Bitte die neue Profilverwaltung verwenden.'});
  if(body.action==='configure'){must(await db.rpc('wishlist_tavily_key',{new_key:String(body.key||'').trim()}));return reply(200,{configured:true})}
  const key=must(await db.rpc('wishlist_tavily_key'));
  const quota=must(await db.rpc('wishlist_tavily_quota',{claim:false}));
  if(body.action==='list'){
   const offset=Math.max(0,Math.min(100000,Number(body.offset)||0));
   const status=['new','published','duplicate','dismissed'].includes(body.status)?body.status:'all';
   let listing=db.from('wishlist_discovery_candidates').select('*');
   listing=status==='all'?listing.neq('status','dismissed'):listing.eq('status',status);
   const rows=must(await listing.order('found_at',{ascending:false}).order('id').range(offset,offset+199));
   const health=must(await db.rpc('wishlist_link_health_summary'));
   const healthReview=must(await db.rpc('wishlist_link_health_review'));
   return reply(200,{rows,configured:!!key,offset,quota,searchProvider:'Tavily',health,healthReview});
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
   if(typeof body.id!=='string'||!/^[0-9a-f-]{36}$/i.test(body.id))return reply(400,{error:'Ungültige Auswahl.'});
   return reply(200,must(await db.rpc('wishlist_admin_withdraw',{p_actor:data.user.id,p_candidate:body.id})));
  }
  if(body.action==='dismiss'){
   if(!Array.isArray(body.ids)||body.ids.length<1||body.ids.length>200||body.ids.some((id:any)=>typeof id!=='string'||!/^[0-9a-f-]{36}$/i.test(id)))return reply(400,{error:'Ungültige Auswahl.'});
   const updated=must(await db.from('wishlist_discovery_candidates').update({status:'dismissed'}).in('id',body.ids).in('status',['new','duplicate']).select('id'));
   return reply(200,{ok:true,dismissed:updated.length});
  }
  if(body.action==='restore'){
   if(typeof body.id!=='string'||!/^[0-9a-f-]{36}$/i.test(body.id))return reply(400,{error:'Ungültige Auswahl.'});
   const updated=must(await db.from('wishlist_discovery_candidates').update({status:'new'}).eq('id',body.id).eq('status','dismissed').select('id'));
   if(updated.length!==1)return reply(409,{error:'Eintrag ist nicht mehr ausgeblendet.'});
   return reply(200,{ok:true});
  }
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
   // Search for the wording used on organizations' own pages and personal blogs.
   // Do not multiply these phrases by every topic/country: one focused query costs one Tavily credit.
   const directPhrases=[
    '"unsere Amazon Wunschliste"',
    '"meine Amazon Wunschliste"',
    '"unsere Amazon-Wunschliste"',
    '"meine Amazon-Wunschliste"',
    '"unsere Wunschliste bei Amazon"',
    '"meine Wunschliste bei Amazon"',
    '"unser Amazon Wunschzettel"',
    '"mein Amazon Wunschzettel"',
    '"unser Wunschzettel bei Amazon"',
    '"mein Wunschzettel bei Amazon"',
    '"Amazon Wunschliste unterstützen"',
    '"Amazon-Wunschliste unterstützen"',
    '"Amazon Wunschliste Sachspenden"',
    '"Amazon Wunschliste Spenden"',
    '"Amazon Wunschliste Tierheim"',
    '"Amazon Wunschliste Tierschutz"',
    '"Amazon Wunschliste Kinderhilfe"',
    '"Amazon Wunschliste Verein"',
    '"Amazon Wunschliste für unser Tierheim"',
    '"hier ist unsere Amazon Wunschliste"',
    '"hier findet ihr unsere Amazon Wunschliste"',
    '"Amazon Wunschliste für uns"',
    '"wünscht euch etwas von unserer Amazon Wunschliste"',
    '"Amazon wishlist" "support us"'
   ];
   for(const phrase of directPhrases)seeds.push({query:phrase+' -site:amazon.de -site:amazon.com -site:amazon.fr',country:'ALL',lang:'de'});
   // Amazon share links commonly contain ?ref_=wl_share. Search indexed pages
   // quoting this literal marker; no wildcard (search providers do not reliably
   // interpret asterisks as URL glob patterns). Other retailers remain excluded
   // by canonicalList(), which accepts only valid Amazon wish-list URLs.
   seeds.push({query:'"ref_=wl_share" "Amazon" -site:amazon.de -site:amazon.com -site:amazon.fr',country:'ALL',lang:'de'});
   const multilingualPhrases=[
    ['"notre liste de souhaits Amazon"','fr'],
    ['"ma liste de souhaits Amazon"','fr'],
    ['"notre liste d’envies Amazon"','fr'],
    ['"ma liste d’envies Amazon"','fr'],
    ['"Amazon Wunschliste" Luxembourg','de'],
    ['"my Amazon wishlist"','en'],
    ['"our Amazon wishlist"','en'],
    ['"Amazon wishlist" "charity"','en'],
    ['"Amazon wishlist" "animal rescue"','en'],
    ['"Amazon wishlist" "school supplies"','en'],
    ['"my Amazon wish list"','en'],
    ['"our Amazon wish list"','en'],
    ['"lista de deseos de Amazon"','es'],
    ['"mi lista de deseos Amazon"','es'],
    ['"nuestra lista de deseos Amazon"','es'],
    ['"lista de regalos Amazon"','es'],
    ['"lista dei desideri Amazon"','it'],
    ['"la mia lista desideri Amazon"','it'],
    ['"lista desideri Amazon" "associazione"','it'],
    ['"liste de souhaits Amazon"','fr'],
    ['"notre liste Amazon"','fr'],
    ['"ma liste Amazon"','fr'],
    ['"Amazon verlanglijst"','nl'],
    ['"mijn Amazon verlanglijst"','nl'],
    ['"Amazon önskelista"','sv'],
    ['"Amazon lista życzeń"','pl'],
    ['"Amazon ほしい物リスト"','ja'],
    ['"Amazon wish list" "Canada"','en'],
    ['"Amazon wishlist" "Australia"','en'],
    ['"eis Amazon Wonschlëscht"','de']
   ];
   for(const [phrase,lang] of multilingualPhrases)seeds.push({query:phrase+' -site:amazon.de -site:amazon.com -site:amazon.fr',country:'ALL',lang});

   // International coverage across languages and regions; all candidates remain staged for review.
   const worldwidePhrases=[
    ['"Amazon lista de desejos"','pt'],['"minha lista de desejos Amazon"','pt'],['"nossa lista de desejos Amazon"','pt'],
    ['"Amazon lista de presentes"','pt'],['"Amazon wishlist" "Brasil"','pt'],
    ['"Amazon wish list" "India"','en'],['"Amazon wishlist" "Nigeria"','en'],
    ['"Amazon wishlist" "Kenya"','en'],['"Amazon wishlist" "South Africa"','en'],
    ['"Amazon wishlist" "New Zealand"','en'],['"Amazon wishlist" "Philippines"','en'],
    ['"Amazon wishlist" "Pakistan"','en'],['"Amazon wishlist" "Ireland"','en'],
    ['"Amazon wishlist" "Singapore"','en'],['"Amazon wishlist" "Malaysia"','en'],
    ['"Amazon wishlist" "United Kingdom"','en'],['"Amazon wishlist" "United States"','en'],
    ['"Amazon listă de dorințe"','ro'],['"lista mea de dorințe Amazon"','ro'],
    ['"Amazon seznam přání"','cs'],['"můj seznam přání Amazon"','cs'],
    ['"Amazon kívánságlista"','hu'],['"Amazon kívánságlistám"','hu'],
    ['"Amazon ønskeliste"','da'],['"Amazon ønskeliste" "Norge"','no'],
    ['"Amazon toivelista"','fi'],['"Amazon önskelista" "Finland"','sv'],
    ['"Amazon lista de deseos" "México"','es'],['"Amazon lista de deseos" "Argentina"','es'],
    ['"Amazon lista de deseos" "Colombia"','es'],['"Amazon lista de deseos" "Chile"','es'],
    ['"Amazon lista de deseos" "Perú"','es'],['"Amazon lista de deseos" "España"','es'],
    ['"Amazon dilek listesi"','tr'],['"Amazon istek listesi"','tr'],
    ['"Amazon список желаний"','ru'],['"мой список желаний Amazon"','ru'],
    ['"Amazon список бажань"','uk'],['"мій список бажань Amazon"','uk'],
    ['"Amazon λίστα επιθυμιών"','el'],['"η λίστα μου Amazon"','el'],
    ['"Amazon قائمة الأمنيات"','ar'],['"قائمة رغبات أمازون"','ar'],
    ['"Amazon רשימת משאלות"','he'],
    ['"Amazon इच्छा सूची"','hi'],['"अमेज़न विशलिस्ट"','hi'],
    ['"Amazon ইচ্ছা তালিকা"','bn'],['"Amazon خواہشات کی فہرست"','ur'],
    ['"Amazon 欲しいものリスト"','ja'],['"私のAmazonほしい物リスト"','ja'],
    ['"Amazon 愿望清单"','zh'],['"亚马逊心愿单"','zh'],
    ['"Amazon 위시리스트"','ko'],['"아마존 위시리스트"','ko'],
    ['"Amazon daftar keinginan"','id'],['"daftar keinginan Amazon"','id'],
    ['"Amazon senarai hajat"','ms'],['"senarai keinginan Amazon"','ms'],
    ['"Amazon รายการสิ่งที่อยากได้"','th'],['"Amazon ของขวัญ wishlist"','th'],
    ['"Amazon danh sách mong muốn"','vi'],['"danh sách yêu thích Amazon"','vi'],
    ['"Amazon orodha ya matamanio"','sw'],['"Amazon wishlist" "Tanzania"','sw'],
    ['"Amazon wishlist" "Ghana"','en'],['"Amazon wishlist" "Uganda"','en'],
    ['"Amazon wishlist" "UAE"','en'],['"Amazon wishlist" "Saudi Arabia"','en']
   ];
   for(const [phrase,lang] of worldwidePhrases)
    seeds.push({query:phrase+' -site:amazon.com -site:amazon.de -site:amazon.fr',country:'ALL',lang});


   must(await db.from('wishlist_discovery_queries').upsert(seeds,{onConflict:'query,country,lang',ignoreDuplicates:true}));
   const q=must(await db.from('wishlist_discovery_queries').select('*').lt('page',10).order('page').order('query').limit(1))[0];if(!q)return reply(200,{done:true,message:'Suchplan abgeschlossen. Es besteht keine Vollständigkeitsgarantie.'});
   // Tavily does not expose Brave-style pagination: each seed is queried only once.
   const credit=must(await db.rpc('wishlist_tavily_quota',{claim:true}));
   if(!credit.allowed)return reply(200,{done:true,message:'Kostenloses Tavily-Monatslimit erreicht. Keine Anfrage versendet.',quota:credit});
   const response=await fetch('https://api.tavily.com/search',{
    method:'POST',
    headers:{Authorization:'Bearer '+key,'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({query:q.query,search_depth:'basic',max_results:20,topic:'general',include_answer:false,include_raw_content:false,exclude_domains:['amazon.de','amazon.com','amazon.fr','amazon.co.uk','amazon.es','amazon.it','amazon.nl','amazon.pl','amazon.se','amazon.co.jp','amazon.ca','amazon.com.au','amazon.com.be']}),
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
