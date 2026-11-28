import {directoryFavorites} from './directory-favorites.mjs';
import {directoryUrl, editorUrl, httpsUrl, identityId as uuid, mascotUrl, verifiedAccount} from './directory-links.mjs';
import {wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs?v=20261128-profile-claims';
import {readAppLocale} from '../../shared/toolya/i18n/locale.mjs';
// Deployment must explicitly choose production or preview; never infer it from URL parameters.
const PROD_PROJECT = 'yheogmeaosuigyaxkwth';
const PROD_PUBLISHABLE_KEY = 'sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv';
const configured = window.HELPERLEIN_SUPABASE_CONFIG;
const valid = configured && typeof configured.url === 'string' &&
  typeof configured.publishableKey === 'string' &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(configured.url) &&
  configured.publishableKey.startsWith('sb_publishable_');
const project = valid ? new URL(configured.url).hostname.split('.')[0] : null;
const production = valid && configured.mode === 'production' &&
  project === PROD_PROJECT && configured.publishableKey === PROD_PUBLISHABLE_KEY;
const preview = valid && configured.mode === 'preview' &&
  project !== PROD_PROJECT && configured.publishableKey !== PROD_PUBLISHABLE_KEY;
if (!production && !preview) {
  throw new Error('Supabase-Konfiguration gesperrt: expliziter Modus und passende Projektkonfiguration erforderlich.');
}
const db = window.toolyaAccountClient;
// Public reads do not depend on the account SDK's session lock. No auth client or private access is created for this read-only directory.
const publicDb=window.supabase.createClient(configured.url,configured.publishableKey,{accessToken:async()=>null});
import {amazonListUrl} from './public-profile-model.mjs';
// Browser-only fallback: the public directory must not depend on a deployed Edge Function source file.
function sourceFavicon(value){
 try{const u=new URL(value),h=u.hostname.toLowerCase();if(u.protocol!=='https:'||u.username||u.password||u.port||h.includes(':')||/^\d+(\.\d+){3}$/.test(h)||!h.includes('.')||/\.(local|internal|localhost|test|invalid)$/.test(h))return '';return u.origin+'/favicon.ico'}catch{return ''}
}
async function deadline(operation,ms=10000){
 let timer;
 try{return await Promise.race([Promise.resolve().then(operation),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Die Verbindung dauert zu lange. Bitte erneut versuchen.')),ms)})])}
 finally{clearTimeout(timer)}
}
const $=id=>document.getElementById(id), text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value??'';if(cls)e.className=cls;return e};
const status=(id,value)=>$(id).textContent=value;
// Only app-authored fragments are translated; profile names, descriptions,
// locations and list names are interpolated unchanged.
const language=()=>window.__toolyaWishesLocale||readAppLocale();
const ui=value=>wishesText(value,language());
const copyBindings=new WeakMap();
function localize(node,render){
 copyBindings.set(node,render);
 node.setAttribute('data-wish-public-copy','');
 render();
 return node;
}
function copyText(tag,value,cls){
 const node=text(tag,'',cls);
 return localize(node,()=>{node.textContent=ui(value)});
}
function refreshPublicCopy(){
 for(const node of document.querySelectorAll('[data-wish-public-copy]'))copyBindings.get(node)?.();

}
document.addEventListener('toolya:wishes-locale-change',refreshPublicCopy);
let page=0,generation=0;
const profileUrl=id=>directoryUrl('profile',id,location.origin).href;
const listUrl=id=>directoryUrl('list',id,location.origin).href;
const targetParams=new URLSearchParams(location.search);
const editorMode=targetParams.get('card')==='1';
const detailMode=targetParams.has('profile')||targetParams.has('list');
if(editorMode||detailMode){
 const robots=document.createElement('meta');robots.name='robots';robots.content='noindex,follow';document.head.append(robots);
}
let favoritesRevision=0;
function favoriteError(){status('favoriteStatus',ui('Gemerkt konnte gerade nicht aktualisiert werden.'))}
const favorites=directoryFavorites(db,()=>{refreshPublicCopy();void renderFavorites()},favoriteError);
function favorite(p){
 const b=text('button','♡','secondary favorite');b.type='button';b.dataset.profileFavorite=p.user_id;
 localize(b,()=>{
  const on=favorites.has(p.user_id);b.textContent=on?'♥':'♡';
  b.setAttribute('aria-label',ui(on?'Profil nicht mehr merken: ':'Profil merken: ')+p.display_name);
  b.setAttribute('aria-pressed',String(on));
 });
 b.onclick=()=>favorites.toggle(p.user_id);
 return b;
}
async function renderFavorites(){
 const revision=++favoritesRevision,ids=favorites.ids;
 const wrap=$('favoriteItems');wrap.replaceChildren();status('favoriteStatus','');
 $('favoriteCount').textContent=String(ids.length);
 const results=await Promise.allSettled(ids.map(id=>publicDb.rpc('get_wishlist_public_profile',{profile_id:id})));
 if(revision!==favoritesRevision)return;
 for(const [i,result] of results.entries()){
  const profile=result.status==='fulfilled'&&!result.value.error?result.value.data:null;
  const row=text('div');
  if(profile){
   const a=text('a',profile.display_name);a.href=profileUrl(ids[i]);row.append(a);
  }else row.append(copyText('span','Profil gerade nicht verfügbar'));
  const remove=copyText('button','Entfernen','secondary');remove.type='button';remove.onclick=()=>favorites.toggle(ids[i]);
  row.append(remove);wrap.append(row);
 }
 if(!ids.length)wrap.append(copyText('p','Du hast noch keine Profile gemerkt.'));
}
function shareLink(kind,id){
 const a=copyText('a',kind==='profile'?'Profil teilen':'Liste teilen','button');
 a.href=editorUrl(kind,id);return a;
}
function listSummary(l,direct=false){
 const url=amazonListUrl(l.url);if(!url)return null;
 const row=text('div','','list-links');
 const target=direct?url:listUrl(l.id);
 const a=text('a','','profile-wishlist-link');a.href=target;
 if(direct){a.target='_blank';a.rel='noopener noreferrer sponsored';}
 a.append(text('span','🎁','profile-wishlist-icon'));
 const label=text('span','','profile-wishlist-copy');
 label.append(direct?copyText('strong','Originalliste bei Amazon öffnen'):text('strong',l.name));
 if(!direct&&l.occasion)label.append(text('span',l.occasion,'profile-wishlist-occasion'));
 a.append(label,text('span','↗','profile-wishlist-arrow'));
 row.append(a,shareLink('list',l.id));return row;
}
function claimProfile(id){
 const section=text('div');
 section.append(copyText('p','Gehört dieses Profil dir oder deinem Verein? Schreib uns, wenn du es übernehmen möchtest.','profile-source-note'));
 const link=text('a','','profile-source-link');
 localize(link,()=>{
  link.textContent=ui('Profil beanspruchen – info@toolya.app');
  const subject=ui('Toolya-Wunschprofil beanspruchen');
  const message=ui('Ich möchte dieses Toolya-Wunschprofil für mich oder meinen Verein beanspruchen.')+'\n\n'+directoryUrl('profile',id).href+'\n\n'+ui('Mein Bezug zum Profil:')+'\n';
  link.href='mailto:info@toolya.app?'+new URLSearchParams({subject,body:message}).toString().replaceAll('+','%20');
 });
 section.append(link);
 return section;
}

function card(p,detail=false){
 const full=detail;
 const root=text('article','','profile-card'+(full?' profile-card--detail':' profile-card--compact'));
 const hero=text('div','','profile-hero');
 const person=text('div','','person');
 const avatar=text('span','','avatar');
 avatar.setAttribute('aria-hidden','true');
 const img=document.createElement('img');img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';img.className='imported-logo';
 img.src=httpsUrl(p.logo_url||'')||(p.imported&&sourceFavicon(p.source_url))||mascotUrl();
 img.onerror=()=>{img.onerror=null;img.src=mascotUrl()};
 avatar.append(img);
 const info=text('div','','profile-identity');
 info.append(copyText('span',p.imported?'Von Toolya hinzugefügt':'Öffentliches Wunschprofil','profile-eyebrow'));
 info.append(text(full?'h2':'h3',p.display_name));
 const location=[p.city,p.country].filter(Boolean).join(' · ');
 if(location)info.append(text('p','📍 '+location,'location'));
 person.append(avatar,info);
 hero.append(person);
 hero.append(favorite(p));
 root.append(hero);
 if(p.imported){
  root.append(copyText('p','Name aus öffentlich verlinkter Quelle · Identität nicht von Toolya bestätigt.','profile-source-note'));
  if(p.source_url&&/^https:\/\//.test(p.source_url)){
   const source=copyText('a','Quelle des Eintrags ansehen ↗','profile-source-link');
   source.href=p.source_url;source.target='_blank';source.rel='noopener noreferrer';root.append(source);
  }
 }
 const lists=Array.isArray(p.lists)?p.lists:[];
 if(full){
  const section=text('div','','profile-lists');
  const heading=text('div','','profile-lists-heading');
  heading.append(copyText('h3',p.imported?'Original-Wunschliste bei Amazon':'Meine öffentlichen Wunschlisten'));
  const count=text('span','','profile-list-count');localize(count,()=>{count.textContent=lists.length+' '+ui(lists.length===1?'Liste':'Listen')});heading.append(count);
  section.append(heading);
  const links=text('div','','list-links');
  for(const l of lists){const row=listSummary(l);if(row)links.append(row);}
  section.append(links);root.append(shareLink('profile',p.user_id),section);
  if(httpsUrl(p.website||'')){
   const website=copyText('a','Website des Vereins ↗');website.href=httpsUrl(p.website);website.rel='noopener noreferrer';root.append(website);
  }
  if(p.imported){
   root.append(claimProfile(p.user_id));
   const report=copyText('a','Falschen Namen oder nicht mehr öffentliche Liste melden ↗','profile-report-link');
   const subject='Korrektur eines öffentlichen Amazon-Wunschlisten-Eintrags';
   const message='Bitte diesen Toolya-Eintrag prüfen:\n'+profileUrl(p.user_id)+'\n\nGrund der Meldung (bitte ergänzen):\n';
   report.href='mailto:info@toolya.app?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(message);
   root.append(report);
  }
 }else{
  const summary=text('p','','profile-summary');localize(summary,()=>{summary.textContent=lists.length+' '+ui(lists.length===1?'öffentliche Wunschliste':'öffentliche Wunschlisten')});root.append(summary);
  const a=text('a','','profile-open-link');a.href=profileUrl(p.user_id);a.append(copyText('span','Wunschprofil ansehen'),text('span','→','profile-open-arrow'));root.append(a);
 }
 return root;
}
function hasSearchCriteria(){return Boolean($('search').value.trim()||$('countryFilter').value||$('occasionFilter').value)}
function makePublicCarouselCard(p){
 const a=document.createElement('a');a.className='wish-public-card';a.href=profileUrl(p.user_id);a.setAttribute('data-user-content','');localize(a,()=>{a.setAttribute('aria-label',ui('Öffentliches Wunschprofil von ')+p.display_name+(language()==='de'?' ansehen':''))});
 const media=document.createElement('div');media.className='wish-public-card-media';
 const img=document.createElement('img');img.src=httpsUrl(p.logo_url||'')||mascotUrl();img.loading='lazy';img.alt='';img.referrerPolicy='no-referrer';
 img.onerror=()=>{img.onerror=null;img.src=mascotUrl()};media.append(img);
 const body=document.createElement('div');body.className='wish-public-card-body';
 const name=document.createElement('h3');name.textContent=p.display_name;
 const description=document.createElement('p');if(p.bio)description.textContent=p.bio.trim().slice(0,145);else localize(description,()=>{description.textContent=ui('Öffentliche Amazon-Wunschliste ansehen und Wünsche entdecken.')});
 const footer=document.createElement('span');footer.className='wish-public-card-footer';
 localize(footer,()=>{
  const location=[p.city,p.country].filter(Boolean).join(' · ');
  const origin=p.imported?ui('Von Toolya hinzugefügt'):'';
  footer.textContent=[location,origin||(!location?ui('Öffentliches Wunschprofil'):''),ui('Profil ansehen ↗')].filter(Boolean).join(' · ');
 });
 body.append(name,description,footer);a.append(media,body);return a;
}
const carouselViewport=$('wishPublicViewport');
const carouselTrack=$('wishPublicTrack');
const carouselToggle=$('wishPublicToggle');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let carouselPaused=false;
function updateCarouselMotion(){
 const group=carouselTrack.querySelector('.wish-public-group');
 const canAnimate=Boolean(group?.nextElementSibling&&group.offsetWidth>carouselViewport.clientWidth&&!reducedMotion.matches);
 carouselToggle.hidden=!canAnimate;
 carouselToggle.textContent=carouselPaused?'Karussell fortsetzen':'Karussell anhalten';
 carouselViewport.classList.toggle('is-auto',canAnimate&&!carouselPaused);
}
carouselToggle.onclick=()=>{
 const offset=carouselViewport.getBoundingClientRect().left-carouselTrack.getBoundingClientRect().left;
 carouselPaused=!carouselPaused;
 updateCarouselMotion();
 carouselViewport.scrollLeft=carouselPaused?Math.max(0,offset):0;
};
if(typeof ResizeObserver==='function')new ResizeObserver(updateCarouselMotion).observe(carouselViewport);
else window.addEventListener('resize',updateCarouselMotion);
if(typeof reducedMotion.addEventListener==='function')reducedMotion.addEventListener('change',updateCarouselMotion);
else reducedMotion.addListener?.(updateCarouselMotion);
async function refreshCloud(currentGeneration){
 const track=carouselTrack;
 track.replaceChildren(copyText('p','Öffentliche Profile werden geladen …','wish-showcase-loading'));
 updateCarouselMotion();
 let response;
 try{response=await deadline(()=>publicDb.from('wishlist_directory').select('user_id,display_name,city,country,bio,logo_url,lists,imported').order('updated_at',{ascending:false}).limit(80))}catch{response={error:true}}
 if(currentGeneration!==generation)return;
 if(response.error){track.replaceChildren(copyText('p','Die veröffentlichten Profile konnten gerade nicht geladen werden. Verwende die Suche oben.','wish-showcase-loading'));return}
 const profiles=(response.data||[]).filter(p=>p&&p.user_id&&p.display_name&&Array.isArray(p.lists)&&p.lists.some(l=>l.url));
 for(let i=profiles.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[profiles[i],profiles[j]]=[profiles[j],profiles[i]]}
 const unique=[...new Map(profiles.map(p=>[p.user_id,p])).values()].slice(0,12);
 if(!unique.length){track.replaceChildren(copyText('p','Noch keine veröffentlichten Wunschlisten vorhanden.','wish-showcase-loading'));return}
 const group=document.createElement('div');group.className='wish-public-group';for(const p of unique)group.append(makePublicCarouselCard(p));
 track.replaceChildren(group);
 if(unique.length>2){const cloned=document.createElement('div');cloned.className=group.className;for(const p of unique)cloned.append(makePublicCarouselCard(p));cloned.setAttribute('aria-hidden','true');cloned.inert=true;for(const a of cloned.querySelectorAll('a'))a.tabIndex=-1;track.append(cloned);track.style.setProperty('--wish-scroll-seconds',Math.max(25,unique.length*5)+'s')}
 updateCarouselMotion();
}
async function search(){
 clearTimeout(debounce);
 const g=++generation;
 const retry=$('retrySearch');
 if(!hasSearchCriteria()){
  $('wishlistCloudSection').hidden=false;
  $('results').hidden=true;
  $('resultPagination').hidden=true;
  retry.hidden=true;
  await refreshCloud(g);
  return;
 }
 $('wishlistCloudSection').hidden=true;
 $('results').hidden=false;
 $('resultPagination').hidden=false;
 if(document.activeElement===retry)$('search').focus();
 retry.hidden=true;
 $('prevPage').disabled=$('nextPage').disabled=true;
 status('searchStatus','Öffentliche Amazon-Wunschlisten werden gesucht …');
 let r;
 try{r=await deadline(()=>publicDb.rpc('search_wishlist_directory',{search_term:$('search').value.trim(),country_filter:$('countryFilter').value,occasion_filter:$('occasionFilter').value,interest_filter:'',page_offset:page*24}))}catch{r={error:true}}
 if(g!==generation)return;
 if(r.error){
  $('results').replaceChildren();
  status('searchStatus','Die Amazon-Wunschlisten konnten gerade nicht geladen werden.');
  retry.hidden=false;
  return;
 }
 const rows=r.data||[];$('results').replaceChildren(...rows.slice(0,24).map(p=>card(p)));status('searchStatus',rows.length?Math.min(rows.length,24)+' passende Einträge auf dieser Seite.':'Keine passende öffentliche Amazon-Wunschliste im Verzeichnis gefunden. Prüfe die Schreibweise oder entferne Filter. Nicht alle öffentlichen Amazon-Listen sind bereits erfasst.');$('prevPage').disabled=page===0;$('nextPage').disabled=rows.length<=24
}
async function filters(){const r=await deadline(()=>publicDb.rpc('wishlist_directory_filters'));if(r.error)return;for(const [id,prop]of[['countryFilter','countries'],['occasionFilter','occasions']]){const s=$(id),value=s.value;s.replaceChildren(s.options[0]);const values=[...new Set((r.data?.[prop]||[]).map(v=>typeof v==='string'?v.trim():v).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de'));for(const v of values){const o=text('option',v);o.value=v;s.append(o)}s.value=value.trim()}}
let detailGeneration=0;
async function detail(){
 const params=new URL(location.href).searchParams;
 let id=params.get('profile');
 const list=params.get('list');
 if(!id&&!params.has('list'))return;
 const g=++detailGeneration;
 const retry=$('retryDetail');
 $('selectedProfile').hidden=false;
 if(document.activeElement===retry)$('selectedProfile').querySelector('a').focus();
 retry.hidden=true;
 $('profileDetail').replaceChildren();
 status('detailStatus',ui('Wunschprofil wird geladen …'));
 try{
  if(params.has('list')){
   const response=uuid.test(list||'')?await deadline(()=>publicDb.rpc('get_wishlist_public_list',{list_id:list})):{data:null};
   if(g!==detailGeneration)return;
   if(response.error)throw response.error;
   const {list: item,profile_id,other_lists=[]}=response.data||{};
   const root=text('article','','profile-card profile-card--detail');
   if(item){
    root.append(text('h2',item.name));
    if(item.occasion)root.append(text('p',item.occasion));
    const summary=listSummary(item,true);if(summary)root.append(summary);
    if(other_lists.length){
     root.append(copyText('h3','Weitere öffentliche Wunschlisten'));
     for(const other of other_lists){const row=listSummary(other);if(row)root.append(row);}
    }
   }else root.append(copyText('p','Diese Wunschliste ist nicht mehr verfügbar.'));
   if(profile_id){
    const link=copyText('a','Zum Wunschprofil');link.href=profileUrl(profile_id);root.append(link);
   }
   $('profileDetail').replaceChildren(root);
  }else{
   const r=uuid.test(id||'')?await deadline(()=>publicDb.rpc('get_wishlist_public_profile',{profile_id:id})):{data:null};
   if(g!==detailGeneration)return;
   if(r.error)throw r.error;
   if(!r.data){
    status('detailStatus',ui('Dieses Wunschprofil ist nicht mehr verfügbar.'));
    return;
   }
   document.title=r.data.display_name+' | Toolya';
   $('profileDetail').replaceChildren(card(r.data,true));
  }
  status('detailStatus','');
 }catch(error){
  if(g!==detailGeneration)return;
  console.error('Wunschprofil konnte nicht geladen werden:',error);
  status('detailStatus',ui('Das Wunschprofil konnte gerade nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.'));
  retry.hidden=false;
 }
}
$('retryDetail').onclick=detail;
$('settingsToProfile').onclick=()=>window.closeSettings();
$('retrySearch').onclick=search;
let debounce;
$('search').oninput=()=>{
 clearTimeout(debounce);
 ++generation;
 page=0;
 $('retrySearch').hidden=true;
 $('prevPage').disabled=$('nextPage').disabled=true;
 $('results').replaceChildren();
 status('searchStatus','Öffentliche Amazon-Wunschlisten werden gesucht …');
 debounce=setTimeout(search,250);
};
$('submitSearch').onclick=()=>{page=0;search()};
for(const id of['countryFilter','occasionFilter'])$(id).onchange=()=>{page=0;search()};$('resetFilters').onclick=()=>{$('search').value='';for(const id of['countryFilter','occasionFilter'])$(id).value='';page=0;search()};$('prevPage').onclick=()=>{page=Math.max(0,page-1);search()};$('nextPage').onclick=()=>{page++;search()};
refreshPublicCopy();
if(editorMode){
 for(const section of $('wishCardEditor').parentElement.children){
  if(section!==$('wishCardEditor'))section.hidden=true;
 }
 $('wishCardEditor').hidden=false;
 const {mountCardEditor}=await import('./directory-card-editor.mjs');
 mountCardEditor($('wishCardEditor'),{db,publicDb,params:targetParams});
}else{
 document.addEventListener('toolya:account-state',event=>void favorites.account(verifiedAccount(event.detail)?.id||null));
 if(window.toolyaAccountState)void favorites.account(verifiedAccount()?.id||null);
 void renderFavorites();
 await Promise.allSettled([filters(),search(),detail()]);
}
