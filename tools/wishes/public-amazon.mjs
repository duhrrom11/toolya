import {guardedWishlistWrite} from './wishlist-auth.mjs';
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
const db = window.supabase.createClient(configured.url, configured.publishableKey);
import {amazonListUrl,amazonSearchUrl,splitInterests,rankProducts} from './public-profile-model.mjs';
import {sampleCloud} from './wishlist-cloud.mjs';
import {sourceFavicon} from '../../supabase/functions/wishlist-discovery/model.mjs';
const $=id=>document.getElementById(id), text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value??'';if(cls)e.className=cls;return e};
const status=(id,value)=>$(id).textContent=value;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let user=null,own=null,page=0,generation=0,authGeneration=0,catalog=[];
const key='toolya-public-profile-favorites-v1';
function readFavorites(){try{const a=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(a)?a.filter(p=>uuid.test(p.user_id)&&typeof p.display_name==='string').slice(0,100):[]}catch{return []}}
let favorites=readFavorites();
const profileUrl=id=>new URL('./public.html?profile='+encodeURIComponent(id)+'#selectedProfile',location.href).href;
function affiliateLink(label,url){const a=text('a',label,'button');a.href=url;a.target='_blank';a.rel='noopener noreferrer sponsored';return a}
function renderFavorites(){const wrap=$('favoriteItems');wrap.replaceChildren();if(!favorites.length){wrap.append(text('p','Merke dir Profile mit dem Herz.'));return}for(const p of favorites){const a=text('a',p.display_name);a.href=profileUrl(p.user_id);wrap.append(a)}}
function favorite(p){const b=text('button','♡','secondary favorite');b.type='button';const sync=()=>{const on=favorites.some(x=>x.user_id===p.user_id);b.textContent=on?'♥':'♡';b.setAttribute('aria-label',(on?'Profil nicht mehr merken: ':'Profil merken: ')+p.display_name);b.setAttribute('aria-pressed',String(on))};sync();b.onclick=()=>{favorites=favorites.some(x=>x.user_id===p.user_id)?favorites.filter(x=>x.user_id!==p.user_id):[...favorites,{user_id:p.user_id,display_name:p.display_name}].slice(-100);try{localStorage.setItem(key,JSON.stringify(favorites))}catch{}document.querySelectorAll('[data-profile-favorite="'+p.user_id+'"]').forEach(x=>{x.textContent=favorites.some(y=>y.user_id===p.user_id)?'♥':'♡';x.setAttribute('aria-pressed',String(favorites.some(y=>y.user_id===p.user_id)));x.setAttribute('aria-label',(favorites.some(y=>y.user_id===p.user_id)?'Profil nicht mehr merken: ':'Profil merken: ')+p.display_name)});sync();renderFavorites()};b.dataset.profileFavorite=p.user_id;return b}
function card(p,detail=false,preview=false){
 const root=text('article','','profile-card');const person=text('div','','person'),avatar=text('span',p.display_name.split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase(),'avatar');avatar.setAttribute('aria-hidden','true');const info=document.createElement('div'),heading=text(detail?'h2':'h3',p.display_name);info.append(heading,text('p',[p.city,p.country].filter(Boolean).join(' · '),'location'));if(p.imported){const img=document.createElement('img');img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';img.className='imported-logo';const fallback=()=>new URL('../../assets/toolya/originals/toolya_wishlist_'+(window.toolyaBuddy?.character==='purple'?'purple':'turquoise')+'_welcome_1024.png',import.meta.url).href;img.src=sourceFavicon(p.source_url)||fallback();img.onerror=()=>{img.onerror=null;img.src=fallback()};avatar.replaceChildren(img)}person.append(avatar,info);if(!preview)person.append(favorite(p));root.append(person);if(p.imported){root.append(text('p','Name aus öffentlich verlinkter Quelle · Identität nicht von Toolya bestätigt.','muted'));const source=text('a','Öffentlich gefunden · Quelle ↗','muted');source.href=/^https:\/\//.test(p.source_url||'')?p.source_url:'#';source.target='_blank';source.rel='noopener noreferrer';root.append(source)}if(p.bio)root.append(text('p',p.bio));const chips=text('div','','chips');for(const i of p.interests||[])chips.append(text('span',i,'chip'));root.append(chips);
 if(detail||preview){root.append(text('h3',p.imported?'Original-Amazon-Wunschliste':'Öffentliche Amazon-Wunschlisten'));const lists=text('div','','list-links');for(const l of p.lists||[]){const url=amazonListUrl(l.url);if(url)lists.append(affiliateLink('🎁 '+l.name+' · Original bei Amazon öffnen ↗',url))}root.append(lists);if(!preview){if(p.imported){const report=text('a','Falschen Namen oder nicht mehr öffentliche Liste melden ↗','muted');const subject='Korrektur eines öffentlichen Amazon-Wunschlisten-Eintrags';const message='Bitte diesen Toolya-Eintrag prüfen:\n'+profileUrl(p.user_id)+'\n\nGrund der Meldung (bitte ergänzen):\n';report.href='mailto:info@toolya.app?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(message);root.append(report)}const ideas=document.createElement('div');root.append(ideas);renderIdeas(ideas,p);root.append(text('p','Anzeige · Als Amazon-Partner verdiene ich an qualifizierten Verkäufen.','muted'))}}
 else{root.append(text('p',(p.lists||[]).map(x=>x.name).join(' · '),'muted'));const a=text('a','Amazon-Wunschliste ansehen →','button');a.href=profileUrl(p.user_id);root.append(a)}return root;
}
function renderIdeas(root,p){const products=rankProducts(catalog,p).slice(0,3);root.append(text('h3','Vielleicht interessiert dich …'));if(!products.length){root.append(text('p','Entdecke passende Geschenkideen bei Amazon.','muted'));const cats=text('div','','categories');for(const term of (p.interests?.length?p.interests:['Bücher','Wohnen','Geschenke']).slice(0,3))cats.append(affiliateLink(term+' ↗',amazonSearchUrl(term)));root.append(cats);return}const grid=text('div','','products');for(const product of products){const e=text('article','','product');if(product.image_url&&/^https:\/\/(?:[a-z0-9-]+\.)?(?:media-amazon|images-amazon)\.com\//i.test(product.image_url)){const img=document.createElement('img');img.src=product.image_url;img.alt=product.title;img.loading='lazy';img.referrerPolicy='no-referrer';e.append(img)}e.append(text('h3',product.title),affiliateLink('Bei Amazon ansehen ↗','https://www.amazon.de/dp/'+product.asin+'?tag=duhrrom-21'));grid.append(e)}root.append(grid)}
function hasSearchCriteria(){return Boolean($('search').value.trim()||$('countryFilter').value||$('occasionFilter').value||$('interestFilter').value)}
async function refreshCloud(currentGeneration){
 const cloud=$('wishlistCloud');
 cloud.replaceChildren();
 status('searchStatus','Zufällige Wunschlisten werden zusammengestellt …');
 const counted=await db.from('wishlist_directory').select('user_id',{count:'exact'}).limit(1);
 if(currentGeneration!==generation||hasSearchCriteria())return;
 if(counted.error){status('searchStatus','Die Namenswolke konnte nicht geladen werden. Die Suche ist weiterhin verfügbar.');return}
 const total=counted.count||0;
 if(!total){status('searchStatus','Noch keine öffentlichen Wunschlisten im Verzeichnis.');return}
 const windowSize=Math.min(120,total);
 const start=Math.floor(Math.random()*(total-windowSize+1));
 const fetched=await db.from('wishlist_directory').select('user_id,display_name').order('created_at',{ascending:false}).range(start,start+windowSize-1);
 if(currentGeneration!==generation||hasSearchCriteria())return;
 if(fetched.error){status('searchStatus','Die Namenswolke konnte nicht geladen werden. Die Suche ist weiterhin verfügbar.');return}
 const chosen=sampleCloud(fetched.data,42);
 for(let i=0;i<chosen.length;i++){
  const p=chosen[i],entry=text('span','','cloud-entry');
  entry.setAttribute('role','listitem');
  const a=text('a',p.display_name,'cloud-word cloud-size-'+(i%5));
  a.href=profileUrl(p.user_id);
  a.title='Öffentliche Amazon-Wunschliste von '+p.display_name+' ansehen';
  entry.append(a);cloud.append(entry);
 }
 status('searchStatus',chosen.length+' zufällig ausgewählte Wunschlisten. Suche gezielt nach Namen, um weitere zu finden.');
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
 try{r=await db.rpc('search_wishlist_directory',{search_term:$('search').value.trim(),country_filter:$('countryFilter').value,occasion_filter:$('occasionFilter').value,interest_filter:$('interestFilter').value,page_offset:page*24})}catch{r={error:true}}
 if(g!==generation)return;
 if(r.error){
  $('results').replaceChildren();
  status('searchStatus','Die Amazon-Wunschlisten konnten gerade nicht geladen werden.');
  retry.hidden=false;
  return;
 }
 const rows=r.data||[];$('results').replaceChildren(...rows.slice(0,24).map(p=>card(p)));status('searchStatus',rows.length?Math.min(rows.length,24)+' passende Einträge auf dieser Seite.':'Keine passende öffentliche Amazon-Wunschliste im Verzeichnis gefunden. Prüfe die Schreibweise oder entferne Filter. Nicht alle öffentlichen Amazon-Listen sind bereits erfasst.');$('prevPage').disabled=page===0;$('nextPage').disabled=rows.length<=24
}
async function filters(){const r=await db.rpc('wishlist_directory_filters');if(r.error)return;for(const [id,prop]of[['countryFilter','countries'],['occasionFilter','occasions'],['interestFilter','interests']]){const s=$(id),value=s.value;s.replaceChildren(s.options[0]);const values=[...new Set((r.data?.[prop]||[]).map(v=>typeof v==='string'?v.trim():v).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de'));for(const v of values){const o=text('option',v);o.value=v;s.append(o)}s.value=value.trim()}}
async function detail(){const params=new URL(location.href).searchParams;let id=params.get('profile');if(!id&&params.get('list')&&uuid.test(params.get('list'))){const legacy=await db.from('wishlist_amazon_publications').select('user_id').eq('id',params.get('list')).maybeSingle();id=legacy.data?.user_id}if(!id&&!params.has('list'))return;$('selectedProfile').hidden=false;if(!uuid.test(id||'')){status('detailStatus','Dieses Wunschprofil ist nicht verfügbar.');return}const r=await db.from('wishlist_directory').select('*').eq('user_id',id).maybeSingle();if(r.error||!r.data){status('detailStatus','Dieses Wunschprofil ist nicht mehr verfügbar.');return}document.title=r.data.display_name+' – öffentliche Amazon-Wunschlisten | Toolya';document.querySelector('meta[name="description"]').content='Entdecke die öffentlichen Amazon-Wunschlisten von '+r.data.display_name+'.';document.querySelector('link[rel="canonical"]').href=new URL('?profile='+id,location.href).href;$('profileDetail').replaceChildren(card(r.data,true));status('detailStatus','')}
function renumberLists(){const fields=$('listFields');[...fields.children].forEach((fs,index)=>{fs.querySelector('legend').textContent='Wunschliste '+(index+1);const input=fs.querySelector('[name=url]');if(index===0)input.id='amazonUrl';else input.removeAttribute('id')});$('addList').disabled=fields.children.length>=5}
function listField(value={}){const fields=$('listFields');if(fields.children.length>=5)return;const index=fields.children.length,fs=document.createElement('fieldset');fs.append(text('legend','Wunschliste '+(index+1)));for(const [name,label,type,max]of[['name','Name der Wunschliste *','text',100],['url','Amazon-Wunschlisten-Link *','url',2048],['occasion','Anlass (freiwillig)','text',80]]){const l=text('label',label),i=document.createElement('input');i.type=type;i.name=name;i.required=name!=='occasion';i.maxLength=max;i.value=value[name]||'';if(name==='url'&&index===0)i.id='amazonUrl';if(name==='occasion'){i.placeholder='Geburtstag, Hochzeit, Baby …';}l.append(i);fs.append(l)}const remove=text('button','Diese Liste entfernen','secondary');remove.type='button';remove.onclick=()=>{if(fields.children.length===1){status('profileStatus','Bitte mindestens eine Wunschliste eintragen.');return}const neighbor=fs.nextElementSibling||fs.previousElementSibling;fs.remove();renumberLists();neighbor.querySelector('[name=name]').focus()};fs.append(remove);fields.append(fs);renumberLists();return fs}
function payload(){if(!$('profileForm').reportValidity())return null;
 for(const [id,message] of [['displayName','Bitte gib deinen Anzeigenamen ein.'],['country','Bitte gib dein Land ein.']]){
  const field=$(id);
  if(!field.value.trim()){
   field.focus();
   throw new Error(message);
  }
 }
 const lists=[...$('listFields').children].map(fs=>({name:fs.querySelector('[name=name]').value.trim(),url:amazonListUrl(fs.querySelector('[name=url]').value),occasion:fs.querySelector('[name=occasion]').value.trim()}));if(lists.some(l=>!l.url||!l.name))throw new Error('Bitte gültige Amazon-Wunschlisten-Links und Listennamen eingeben.');return {display_name:$('displayName').value.trim(),country:$('country').value.trim(),city:$('city').value.trim(),bio:$('bio').value.trim(),interests:splitInterests($('interests').value),lists}}
async function loadProfile(){const g=++authGeneration;const r=await db.auth.getUser();if(g!==authGeneration)return;user=!r.error&&!r.data?.user?.is_anonymous?r.data?.user:null;$('auth').hidden=!!user;$('profileForm').hidden=!user;$('logoutPublic').hidden=!user;own=null;$('listFields').replaceChildren();if(!user){listField();status('profileStatus','');return}const result=await db.from('wishlist_public_profiles').select('*').eq('user_id',user.id).maybeSingle();if(g!==authGeneration)return;if(result.error){status('profileStatus','Dein Profil konnte nicht geladen werden. Bitte lade die Seite erneut.');$('profileForm').hidden=true;return}own=result.data;for(const [id,prop]of[['displayName','display_name'],['country','country'],['city','city'],['bio','bio']])$(id).value=own?.[prop]||'';$('interests').value=own?.interests?.join(', ')||'';for(const l of own?.lists||[{}])listField(l);$('deleteProfile').hidden=!own;status('profileStatus',own?'Dein gespeichertes Profil ist öffentlich sichtbar.':'Dein Profil wird beim Speichern öffentlich sichtbar.')}
$('profileForm').onsubmit=async e=>{e.preventDefault();if(!user)return;const b=$('saveProfile');b.disabled=true;try{const p=payload();if(!p)return;const writer=user.id;const r=await guardedWishlistWrite(db,writer,()=>db.from('wishlist_public_profiles').upsert({user_id:writer,...p},{onConflict:'user_id'}).select('user_id').single());if(r.error)throw r.error;own=p;$('deleteProfile').hidden=false;status('profileStatus','Gespeichert. Dein Wunschprofil ist jetzt öffentlich sichtbar.');await filters();await search();await detail()}catch(e){status('profileStatus',e.message||'Speichern fehlgeschlagen.')}finally{b.disabled=false}};
$('deleteProfile').onclick=async()=>{if(!user||!confirm('Dein öffentliches Wunschprofil mit allen verlinkten Listen löschen? Die Original-Listen bei Amazon bleiben erhalten.'))return;const b=$('deleteProfile');b.disabled=true;try{const writer=user.id;const r=await guardedWishlistWrite(db,writer,()=>db.from('wishlist_public_profiles').delete().eq('user_id',writer).select('user_id'));if(r.error||r.data?.length!==1)throw new Error('Das Profil konnte nicht gelöscht werden.');await loadProfile();status('profileStatus','Dein öffentliches Profil wurde gelöscht.');$('profileDetail').replaceChildren();await filters();await search();await detail()}catch(e){status('profileStatus',e.message)}finally{b.disabled=false}};
async function authenticate(signup){$('login').disabled=$('signup').disabled=true;try{const email=$('email').value.trim(),password=$('password').value;if(!email||!password)throw new Error('Bitte E-Mail und Passwort eingeben.');const r=signup?await db.auth.signUp({email,password,options:{emailRedirectTo:new URL('./public.html#profile',location.href).href}}):await db.auth.signInWithPassword({email,password});if(r.error)throw r.error;await loadProfile();if(signup&&!r.data.session)status('profileStatus','Bitte bestätige deine E-Mail-Adresse, bevor du dein Profil erstellst.')}catch(e){status('profileStatus',e.message)}finally{$('password').value='';$('login').disabled=$('signup').disabled=false}}
$('login').onclick=()=>authenticate(false);$('signup').onclick=()=>authenticate(true);$('logoutPublic').onclick=async()=>{const r=await db.auth.signOut();if(r.error)status('profileStatus','Abmelden fehlgeschlagen.');else await loadProfile()};$('addList').onclick=()=>listField()?.querySelector('[name=name]').focus();$('previewProfile').onclick=()=>{try{const p=payload();if(!p)return;$('previewContent').replaceChildren(card(p,true,true));$('previewDialog').showModal()}catch(e){status('profileStatus',e.message)}};$('closePreview').onclick=()=>$('previewDialog').close();
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
for(const id of['countryFilter','occasionFilter','interestFilter'])$(id).onchange=()=>{page=0;search()};$('resetFilters').onclick=()=>{$('search').value='';for(const id of['countryFilter','occasionFilter','interestFilter'])$(id).value='';page=0;search()};$('prevPage').onclick=()=>{page=Math.max(0,page-1);search()};$('nextPage').onclick=()=>{page++;search()};
try{const r=await fetch('./public-products.json');if(r.ok)catalog=await r.json()}catch{}
renderFavorites();db.auth.onAuthStateChange(event=>{if(['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event))setTimeout(loadProfile,0)});window.addEventListener('storage',e=>{if(e.key===key){favorites=readFavorites();renderFavorites()}});await Promise.all([loadProfile(),filters(),search(),detail()]);
