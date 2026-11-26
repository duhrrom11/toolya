import {guardedWishlistWrite} from './wishlist-auth.mjs';
import {profileIdentity} from './profile-identity.mjs';
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
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let user=null,own=null,page=0,generation=0,authGeneration=0;
const key='toolya-public-profile-favorites-v1';
function readFavorites(){try{const a=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(a)?a.filter(p=>uuid.test(p.user_id)&&typeof p.display_name==='string').slice(0,100):[]}catch{return []}}
let favorites=readFavorites();
const profileUrl=id=>new URL('./public.html?profile='+encodeURIComponent(id)+'#selectedProfile',location.href).href;
function affiliateLink(label,url){const a=text('a',label,'button');a.href=url;a.target='_blank';a.rel='noopener noreferrer sponsored';return a}
function renderFavorites(){const wrap=$('favoriteItems');wrap.replaceChildren();$('favorites').hidden=!favorites.length;$('favoriteCount').textContent=String(favorites.length);for(const p of favorites){const a=text('a',p.display_name);a.href=profileUrl(p.user_id);wrap.append(a)}}
function favorite(p){const b=text('button','♡','secondary favorite');b.type='button';const sync=()=>{const on=favorites.some(x=>x.user_id===p.user_id);b.textContent=on?'♥':'♡';b.setAttribute('aria-label',(on?'Profil nicht mehr merken: ':'Profil merken: ')+p.display_name);b.setAttribute('aria-pressed',String(on))};sync();b.onclick=()=>{favorites=favorites.some(x=>x.user_id===p.user_id)?favorites.filter(x=>x.user_id!==p.user_id):[...favorites,{user_id:p.user_id,display_name:p.display_name}].slice(-100);try{localStorage.setItem(key,JSON.stringify(favorites))}catch{}document.querySelectorAll('[data-profile-favorite="'+p.user_id+'"]').forEach(x=>{x.textContent=favorites.some(y=>y.user_id===p.user_id)?'♥':'♡';x.setAttribute('aria-pressed',String(favorites.some(y=>y.user_id===p.user_id)));x.setAttribute('aria-label',(favorites.some(y=>y.user_id===p.user_id)?'Profil nicht mehr merken: ':'Profil merken: ')+p.display_name)});sync();renderFavorites()};b.dataset.profileFavorite=p.user_id;return b}
function card(p,detail=false,preview=false){
 const full=detail||preview;
 const root=text('article','','profile-card'+(full?' profile-card--detail':' profile-card--compact'));
 const hero=text('div','','profile-hero');
 const person=text('div','','person');
 const avatar=text('span',p.display_name.split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase(),'avatar');
 avatar.setAttribute('aria-hidden','true');
 if(p.imported){
  const img=document.createElement('img');img.alt='Symbol der importierten Wunschliste von '+p.display_name;img.loading='lazy';img.referrerPolicy='no-referrer';img.className='imported-logo';
  const fallback=()=>new URL('../../assets/toolya/headers/toolya_wishlist_'+(window.toolyaBuddy?.character==='purple'?'purple':'turquoise')+'_welcome_400.webp',import.meta.url).href;
  img.src=sourceFavicon(p.source_url)||fallback();
  img.onerror=()=>{img.onerror=null;img.src=fallback()};
  avatar.replaceChildren(img);
 }
 const info=text('div','','profile-identity');
 info.append(text('span',p.imported?'Öffentlich gefunden':'Öffentliches Wunschprofil','profile-eyebrow'));
 info.append(text(full?'h2':'h3',p.display_name));
 const location=[p.city,p.country].filter(Boolean).join(' · ');
 if(location)info.append(text('p','📍 '+location,'location'));
 person.append(avatar,info);
 hero.append(person);
 if(!preview)hero.append(favorite(p));
 root.append(hero);
 if(p.imported){
  root.append(text('p','Name aus öffentlich verlinkter Quelle · Identität nicht von Toolya bestätigt.','profile-source-note'));
  if(p.source_url&&/^https:\/\//.test(p.source_url)){
   const source=text('a','Quelle des Eintrags ansehen ↗','profile-source-link');
   source.href=p.source_url;source.target='_blank';source.rel='noopener noreferrer';root.append(source);
  }
 }
 const lists=Array.isArray(p.lists)?p.lists:[];
 if(full){
  const section=text('div','','profile-lists');
  const heading=text('div','','profile-lists-heading');
  heading.append(text('h3',p.imported?'Original-Wunschliste bei Amazon':'Meine öffentlichen Wunschlisten'));
  heading.append(text('span',lists.length+' '+(lists.length===1?'Liste':'Listen'),'profile-list-count'));
  section.append(heading);
  const links=text('div','','list-links');
  for(const l of lists){
   const url=amazonListUrl(l.url);if(!url)continue;
   const a=text('a','','profile-wishlist-link');a.href=url;a.target='_blank';a.rel='noopener noreferrer sponsored';
   a.append(text('span','🎁','profile-wishlist-icon'));
   const copy=text('span','','profile-wishlist-copy');
   copy.append(text('strong',l.name));
   if(l.occasion)copy.append(text('span',l.occasion,'profile-wishlist-occasion'));
   else copy.append(text('span','Öffentliche Wunschliste bei Amazon','profile-wishlist-occasion'));
   a.append(copy,text('span','↗','profile-wishlist-arrow'));
   links.append(a);
  }
  section.append(links);root.append(section);
  if(!preview&&p.imported){
   const report=text('a','Falschen Namen oder nicht mehr öffentliche Liste melden ↗','profile-report-link');
   const subject='Korrektur eines öffentlichen Amazon-Wunschlisten-Eintrags';
   const message='Bitte diesen Toolya-Eintrag prüfen:\n'+profileUrl(p.user_id)+'\n\nGrund der Meldung (bitte ergänzen):\n';
   report.href='mailto:info@toolya.app?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(message);
   root.append(report);
  }
 }else{
  root.append(text('p',lists.length+' '+(lists.length===1?'öffentliche Wunschliste':'öffentliche Wunschlisten'),'profile-summary'));
  const a=text('a','Wunschprofil ansehen','profile-open-link');a.href=profileUrl(p.user_id);a.append(text('span','→','profile-open-arrow'));root.append(a);
 }
 return root;
}
function hasSearchCriteria(){return Boolean($('search').value.trim()||$('countryFilter').value||$('occasionFilter').value)}
function makePublicCarouselCard(p){
 const a=document.createElement('a');a.className='wish-public-card';a.href=profileUrl(p.user_id);a.setAttribute('aria-label','Öffentliches Wunschprofil von '+p.display_name+' ansehen');
 const media=document.createElement('div');media.className='wish-public-card-media';
 const icon=document.createElement('span');icon.className='wish-public-card-graphic';icon.textContent=/tier|pfoten|hund|katze|animal/i.test(p.display_name+' '+(p.bio||''))?'🐾':/baby|familie/i.test(p.display_name+' '+(p.bio||''))?'🧸':/hochzeit/i.test(p.display_name+' '+(p.bio||''))?'💍':/schule|bildung|buch/i.test(p.display_name+' '+(p.bio||''))?'📚':'🎁';media.append(icon);
 if(p.logo_url&&/^https:\/\//i.test(p.logo_url)){const img=document.createElement('img');img.src=p.logo_url;img.loading='lazy';img.alt='Logo von '+p.display_name;img.referrerPolicy='no-referrer';img.onerror=()=>img.remove();media.append(img)}
 const body=document.createElement('div');body.className='wish-public-card-body';
 const name=document.createElement('h3');name.textContent=p.display_name;
 const description=document.createElement('p');description.textContent=(p.bio||'Öffentliche Amazon-Wunschliste ansehen und Wünsche entdecken.').trim().slice(0,145);
 const footer=document.createElement('span');footer.className='wish-public-card-footer';footer.textContent=([p.city,p.country].filter(Boolean).join(' · ')||'Öffentliches Wunschprofil')+'  ·  Profil ansehen ↗';body.append(name,description,footer);a.append(media,body);return a;
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
 track.replaceChildren(text('p','Öffentliche Profile werden geladen …','wish-showcase-loading'));
 updateCarouselMotion();
 let response;
 try{response=await deadline(()=>publicDb.from('wishlist_directory').select('user_id,display_name,city,country,bio,logo_url,lists').order('updated_at',{ascending:false}).limit(80))}catch{response={error:true}}
 if(currentGeneration!==generation)return;
 if(response.error){track.replaceChildren(text('p','Die veröffentlichten Profile konnten gerade nicht geladen werden. Verwende die Suche oben.','wish-showcase-loading'));return}
 const profiles=(response.data||[]).filter(p=>p&&p.user_id&&p.display_name&&Array.isArray(p.lists)&&p.lists.some(l=>l.url));
 for(let i=profiles.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[profiles[i],profiles[j]]=[profiles[j],profiles[i]]}
 const unique=[...new Map(profiles.map(p=>[p.user_id,p])).values()].slice(0,12);
 if(!unique.length){track.replaceChildren(text('p','Noch keine veröffentlichten Wunschlisten vorhanden.','wish-showcase-loading'));return}
 const group=document.createElement('div');group.className='wish-public-group';for(const p of unique)group.append(makePublicCarouselCard(p));
 track.replaceChildren(group);
 if(unique.length>2){const cloned=group.cloneNode(true);cloned.setAttribute('aria-hidden','true');cloned.inert=true;for(const a of cloned.querySelectorAll('a'))a.tabIndex=-1;track.append(cloned);track.style.setProperty('--wish-scroll-seconds',Math.max(25,unique.length*5)+'s')}
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
 status('detailStatus','Wunschprofil wird geladen …');
 try{
  if(!id&&uuid.test(list||'')){
   const legacy=await publicDb.from('wishlist_amazon_publications').select('user_id').eq('id',list).maybeSingle();
   if(legacy.error)throw legacy.error;
   id=legacy.data?.user_id;
  }
  const r=uuid.test(id||'')?await publicDb.from('wishlist_directory').select('*').eq('user_id',id).maybeSingle():{data:null};
  if(g!==detailGeneration)return;
  if(r.error)throw r.error;
  if(!r.data){
   status('detailStatus','Dieses Wunschprofil ist nicht mehr verfügbar.');
   return;
  }
  document.title=r.data.display_name+' – öffentliche Amazon-Wunschlisten | Toolya';
  document.querySelector('meta[name="description"]').content='Entdecke die öffentlichen Amazon-Wunschlisten von '+r.data.display_name+'.';
  $('profileDetail').replaceChildren(card(r.data,true));
  status('detailStatus','');
 }catch(error){
  if(g!==detailGeneration)return;
  console.error('Wunschprofil konnte nicht geladen werden:',error);
  status('detailStatus','Das Wunschprofil konnte gerade nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.');
  retry.hidden=false;
 }
}
$('retryDetail').onclick=detail;
function renumberLists(){const fields=$('listFields');[...fields.children].forEach((fs,index)=>{fs.querySelector('legend').textContent='Wunschliste '+(index+1);const input=fs.querySelector('[name=url]');if(index===0)input.id='amazonUrl';else input.removeAttribute('id')});$('addList').disabled=fields.children.length>=5}
function listField(value={}){const fields=$('listFields');if(fields.children.length>=5)return;const index=fields.children.length,fs=document.createElement('fieldset');fs.append(text('legend','Wunschliste '+(index+1)));for(const [name,label,type,max]of[['name','Name der Wunschliste *','text',100],['url','Amazon-Wunschlisten-Link *','url',2048],['occasion','Anlass (freiwillig)','text',80]]){const l=text('label',label),i=document.createElement('input');i.type=type;i.name=name;i.required=name!=='occasion';i.maxLength=max;i.value=value[name]||'';if(name==='url'&&index===0)i.id='amazonUrl';if(name==='occasion'){i.placeholder='Geburtstag, Hochzeit, Baby …';}l.append(i);fs.append(l)}const remove=text('button','Diese Liste entfernen','secondary');remove.type='button';remove.onclick=()=>{if(fields.children.length===1){status('profileStatus','Bitte mindestens eine Wunschliste eintragen.');return}const neighbor=fs.nextElementSibling||fs.previousElementSibling;fs.remove();renumberLists();neighbor.querySelector('[name=name]').focus()};fs.append(remove);fields.append(fs);renumberLists();return fs}
function selectedProfileKind(){return document.querySelector('input[name="profileKind"]:checked')?.value||'person'}
function updateProfileKind(){
 const org=selectedProfileKind()==='organization';
 $('personNameFields').hidden=org;
 $('organizationNameFields').hidden=!org;
 $('firstName').required=!org;$('lastName').required=!org;$('organizationName').required=org;
}
for(const option of document.querySelectorAll('input[name="profileKind"]'))option.addEventListener('change',updateProfileKind);
updateProfileKind();
function payload(){
 updateProfileKind();
 const identity=profileIdentity(selectedProfileKind(),$('firstName').value,$('lastName').value,$('organizationName').value,$('country').value);
 if(!$('profileForm').reportValidity())return null;
 const lists=[...$('listFields').children].map(fs=>({name:fs.querySelector('[name=name]').value.trim(),url:amazonListUrl(fs.querySelector('[name=url]').value),occasion:fs.querySelector('[name=occasion]').value.trim()}));
 if(lists.some(l=>!l.url||!l.name))throw new Error('Bitte gültige Amazon-Wunschlisten-Links und Listennamen eingeben.');
 return {...identity,city:$('city').value.trim(),bio:own?.bio||'',interests:own?.interests||[],lists};
}
async function loadProfile(token,verifiedUser){const g=++authGeneration;let r;try{r=verifiedUser!==undefined?{data:{user:verifiedUser}}:await deadline(()=>(globalThis.toolyaAuth?.forClient(db) || db.auth).getUser(token))}catch(error){r={error}}if(g!==authGeneration)return;user=!r.error&&!r.data?.user?.is_anonymous?r.data?.user:null;$('auth').hidden=!!user;$('profileForm').hidden=true;own=null;$('listFields').replaceChildren();if(!user){listField();status('profileStatus',r.error&&r.error.name!=='AuthSessionMissingError'?'Anmeldestatus gerade nicht verfügbar. Bitte erneut anmelden.':'');return}let result;try{result=await deadline(()=>db.from('wishlist_public_profiles').select('*').eq('user_id',user.id).maybeSingle())}catch(error){result={error}}if(g!==authGeneration)return;if(result.error){status('profileStatus','Dein Profil konnte nicht geladen werden. Bitte lade die Seite erneut.');$('profileForm').hidden=true;return}own=result.data;
 $('profileForm').hidden=false;
 $('firstName').value=own?.first_name||'';
 $('lastName').value=own?.last_name||'';
 $('organizationName').value=own?.organization_name||'';
 let kind=own?own.profile_kind:'person';
 if(kind!=='person'&&kind!=='organization'){
  // Legacy profiles only had one display name. Prefill as an organization
  // to preserve the complete name without guessing a person's name parts.
  kind='organization';$('organizationName').value=own?.display_name||'';
 }
 document.querySelector('input[name="profileKind"][value="'+kind+'"]').checked=true;
 updateProfileKind();
 for(const [id,prop]of[['country','country'],['city','city']])$(id).value=own?.[prop]||'';for(const l of own?.lists||[{}])listField(l);$('deleteProfile').hidden=!own;status('profileStatus',own?'Dein gespeichertes Profil ist öffentlich sichtbar.':'Dein Profil wird beim Speichern öffentlich sichtbar.')}
$('profileForm').onsubmit=async e=>{
 e.preventDefault();
 if(!user)return;
 let p;
 try{p=payload()}catch(error){status('profileStatus',error.message);return}
 if(!p)return;
 const b=$('saveProfile'),writer=user.id;
 b.disabled=true;
 status('profileStatus','Dein Wunschprofil wird gespeichert …');
 try{
  const r=await guardedWishlistWrite(db,writer,()=>db.from('wishlist_public_profiles').upsert({user_id:writer,...p},{onConflict:'user_id'}).select('user_id').single());
  if(r.error)throw r.error;
  own=p;
  $('deleteProfile').hidden=false;
  status('profileStatus','Gespeichert. Dein Wunschprofil ist jetzt öffentlich sichtbar.');
 }catch(error){
  console.error('Wunschprofil konnte nicht bestätigt werden:',error);
  status('profileStatus',error.message==='Anmeldung nicht gültig oder Konto gewechselt.'
   ? 'Deine Anmeldung ist abgelaufen oder du hast das Konto gewechselt. Melde dich erneut an.'
   : 'Toolya konnte die Speicherung deines Wunschprofils nicht bestätigen. Deine Eingaben bleiben im Formular. Prüfe dein öffentliches Profil, bevor du noch einmal speicherst.');
  return;
 }finally{b.disabled=false}
 await Promise.allSettled([filters(),search(),detail()]);
};
$('deleteProfile').onclick=async()=>{if(!user||!confirm('Dein öffentliches Wunschprofil mit allen verlinkten Listen löschen? Die Original-Listen bei Amazon bleiben erhalten.'))return;const b=$('deleteProfile');b.disabled=true;try{const writer=user.id;const r=await guardedWishlistWrite(db,writer,()=>db.from('wishlist_public_profiles').delete().eq('user_id',writer).select('user_id'));if(r.error||r.data?.length!==1)throw new Error('Das Profil konnte nicht gelöscht werden.');await loadProfile();status('profileStatus','Dein öffentliches Profil wurde gelöscht.');$('profileDetail').replaceChildren();await filters();await search();await detail()}catch(e){status('profileStatus',e.message)}finally{b.disabled=false}};
// The shared account controller owns all credentials and recovery actions.
$('profileAccountOpen').onclick=()=>window.openSettings();
$('settingsToProfile').onclick=()=>window.closeSettings();
$('addList').onclick=()=>listField()?.querySelector('[name=name]').focus();$('previewProfile').onclick=()=>{try{const p=payload();if(!p)return;$('previewContent').replaceChildren(card(p,true,true));$('previewDialog').showModal()}catch(e){status('profileStatus',e.message)}};$('closePreview').onclick=()=>$('previewDialog').close();
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
renderFavorites();
let observedAccountId;
function applyAccountState(state){
 const verified=db&&state&&!state.error&&!state.recovery?state.user:null;
 const id=verified?.id||null;
 if(id===observedAccountId)return;
 observedAccountId=id;
 void loadProfile(undefined,verified||null);
}
document.addEventListener('toolya:account-state',event=>applyAccountState(event.detail));
if(window.toolyaAccountState)applyAccountState(window.toolyaAccountState);
else {$('profileForm').hidden=true;$('auth').hidden=false;}
window.addEventListener('storage',e=>{if(e.key===key){favorites=readFavorites();renderFavorites()}});await Promise.allSettled([filters(),search(),detail()]);
