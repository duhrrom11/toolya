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
const $=id=>document.getElementById(id);
let sessionUser=null,profile=null,publications=[],products=[],profiles=[];
const status=(id,value)=>$(id).textContent=value;
function safeAmazonListUrl(value){
 try{const u=new URL(value);const host=u.hostname.toLowerCase();if(u.protocol!=='https:'||u.username||u.password||u.port||!/^(www\.)?amazon\.de$/.test(host))return null;
 if(!/^\/(?:hz\/wishlist\/ls|gp\/registry\/wishlist|registry\/wishlist)\/[A-Z0-9]+\/?$/i.test(u.pathname))return null;
 u.hash='';u.search='';return u.href;
 }catch{return null}
}
const text=(tag,value)=>{const el=document.createElement(tag);el.textContent=value??'';return el};
const listIdPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const listUrl=id=>new URL('./public.html?list='+encodeURIComponent(id)+'#selectedList',location.href).href;
async function renderSelectedList(){
 const id=new URL(location.href).searchParams.get('list');
 document.body.classList.toggle('viewing-list',Boolean(id));
 const section=$('selectedList'),container=$('selectedListCard');
 if(!id){section.hidden=true;return}
 section.hidden=false;container.replaceChildren();
 if(!listIdPattern.test(id)){status('selectedListStatus','Dieser Wunschlisten-Link ist ungültig.');return}
 status('selectedListStatus','Wunschliste wird geladen …');
 const {data:list,error}=await db.from('wishlist_amazon_publications')
  .select('id,user_id,amazon_url,title,scrape_status').eq('id',id).eq('scrape_status','success').maybeSingle();
 if(error||!list){status('selectedListStatus','Diese Wunschliste ist nicht mehr öffentlich verfügbar.');return}
 const [owner,preview]=await Promise.all([
  db.from('wishlist_profiles').select('user_id,first_name,last_name,country').eq('user_id',list.user_id).maybeSingle(),
  db.from('wishlist_amazon_publication_products').select('publication_id,title,description,product_url,image_url,asin,price').eq('publication_id',id).order('created_at',{ascending:false}).limit(500)
 ]);
 if(owner.error||preview.error){status('selectedListStatus','Die Wunschliste konnte nicht vollständig geladen werden.');return}
 const previousProfiles=profiles,previousProducts=products;
 try{
  profiles=[owner.data].filter(Boolean);
  products=preview.data||[];
  container.append(favoriteButton({...list,first_name:owner.data?.first_name,last_name:owner.data?.last_name}),detailCard(list));
 }finally{profiles=previousProfiles;products=previousProducts}
 status('selectedListStatus','');
}

const favKey='toolya-public-wishlist-favorites-v1';
function loadFavorites(){try{const d=JSON.parse(localStorage.getItem(favKey)||'[]');return Array.isArray(d)?d.filter(x=>x&&listIdPattern.test(x.id)&&typeof x.title==='string'&&typeof x.name==='string').slice(0,100):[]}catch{return []}}
let favorites=loadFavorites();
const personName=list=>[list.first_name,list.last_name].filter(Boolean).join(' ')||[profiles.find(p=>p.user_id===list.user_id)?.first_name,profiles.find(p=>p.user_id===list.user_id)?.last_name].filter(Boolean).join(' ')||'Unbekanntes Profil';
function renderFavorites(){
 const wrap=$('favoriteItems');wrap.replaceChildren();
 if(!favorites.length){const p=text('p','Noch keine Favoriten – markiere eine Wunschliste mit ☆.');wrap.append(p);return}
 for(const item of favorites){const a=text('a',item.title);a.href=listUrl(item.id);a.title='von '+item.name;a.className='favorite-tile';wrap.append(a)}
}
function toggleFavorite(list){
 const active=favorites.some(item=>item.id===list.id);
 favorites=active?favorites.filter(item=>item.id!==list.id):[...favorites,{id:list.id,title:list.title||'Amazon-Wunschliste',name:personName(list)}];
 try{localStorage.setItem(favKey,JSON.stringify(favorites))}catch{}
 renderFavorites();
 document.querySelectorAll('[data-favorite-id]').forEach(b=>{if(b.dataset.favoriteId!==list.id)return;b.textContent=active?'☆':'★';b.classList.toggle('active',!active);b.setAttribute('aria-pressed',String(!active));b.setAttribute('aria-label',active?'Als Favorit speichern':'Favorit entfernen')});
}
function favoriteButton(list){
 const active=favorites.some(item=>item.id===list.id);
 const b=text('button',active?'★':'☆');b.type='button';b.className='wishlist-favorite'+(active?' active':'');
 b.dataset.favoriteId=list.id;b.setAttribute('aria-pressed',String(active));
 b.setAttribute('aria-label',active?'Favorit entfernen':'Als Favorit speichern');
 b.onclick=()=>toggleFavorite(list);return b;
}
function summaryCard(list){
 const root=document.createElement('article');root.className='card wishlist-summary';root.id='list-'+list.id;
 const content=document.createElement('div');content.className='wishlist-summary-content';
 const heading=text('h3',list.title||'Amazon-Wunschliste'),by=text('p','von '+personName(list));
 by.className='wishlist-by';
 const link=text('a','Vollständige Liste bei Toolya öffnen →');link.href=listUrl(list.id);link.className='wishlist-open';
 content.append(heading,by,link);root.append(content,favoriteButton(list));return root;
}
async function functionError(error){
 const response=error?.context,code=response?.status;
 if(code===546||code===504)return new Error('Der Amazon-Scraper hat sein Rechenzeitlimit erreicht. Die bisherige Liste bleibt erhalten.');
 if(code===429)return new Error('Zu viele Aktualisierungen. Bitte später erneut versuchen.');
 if(code===409)return new Error('Die Wunschliste wird bereits aktualisiert. Bitte später erneut versuchen.');
 try{const data=await response?.json?.();if(typeof data?.error==='string')return new Error(data.error)}catch{}
 return new Error(code?'Aktualisierung fehlgeschlagen (HTTP '+code+').':error?.message||'Aktualisierung fehlgeschlagen.');
}

function safeImageUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(/(^|\.)images-amazon\.com$/.test(u.hostname)||/(^|\.)ssl-images-amazon\.com$/.test(u.hostname)||/(^|\.)media-amazon\.com$/.test(u.hostname))?u.href:null}catch{return null}}
function detailCard(list){
 const person=profiles.find(p=>p.user_id===list.user_id);
 const name=[person?.first_name,person?.last_name].filter(Boolean).join(' ')||'Unbekanntes Profil';
 const root=document.createElement('article');root.className='card detail-card';root.id='list-'+list.id;
 root.append(text('h3',list.title||'Amazon-Wunschliste'),text('p','von '+name+(person?.country?' · '+person.country:'')));
 const a=text('a','Original-Wunschliste bei Amazon öffnen');a.href=list.amazon_url;a.target='_blank';a.rel='noopener noreferrer nofollow';root.append(a);
 if(sessionUser?.id===list.user_id){
  const actions=document.createElement('div');actions.className='owner-actions';
  const message=text('span','');message.className='owner-message';message.setAttribute('role','status');
  const update=text('button','↻ Liste aktualisieren');update.type='button';
  update.onclick=async()=>{
   update.disabled=true;remove.disabled=true;message.textContent='Amazon-Wunschliste wird erneut eingelesen …';
   try{
    const {data,error}=await db.functions.invoke('amazon-wishlist-scrape',{body:{publication_id:list.id}});
    if(error)throw await functionError(error);
    if(data?.status!=='success')throw new Error('Amazon konnte die Liste derzeit nicht vollständig einlesen. Vorhandene Produkte bleiben erhalten.');
    message.textContent='Liste aktualisiert. Im Amazon-Abruf erkannt: '+(data?.price_count??0)+' Preise und '+(data?.description_count??0)+' Beschreibungen. Weitere Angaben konnten bei diesem Abruf nicht sicher ausgelesen werden.';
    await refresh(false);
    if(new URL(location.href).searchParams.get('list')===list.id)await renderSelectedList();
   }catch(e){message.textContent=e.message||'Aktualisierung fehlgeschlagen. Bestehende Produkte bleiben erhalten.'}
   finally{update.disabled=false;remove.disabled=false}
  };
  const remove=text('button','Liste löschen');remove.type='button';remove.className='danger';
  remove.onclick=async()=>{
   if(!window.confirm('Diese veröffentlichte Wunschliste und ihre Produktvorschauen dauerhaft löschen?'))return;
   update.disabled=true;remove.disabled=true;message.textContent='Liste wird gelöscht …';
   try{
    const {data,error}=await db.from('wishlist_amazon_publications').delete().eq('id',list.id).eq('user_id',sessionUser.id).select('id');
    if(error)throw error;
    if(data?.length!==1)throw new Error('Liste nicht gefunden oder keine Berechtigung.');
    await refresh(true);
   }catch(e){message.textContent=e.message||'Löschen fehlgeschlagen.'}
   finally{update.disabled=false;remove.disabled=false}
  };
  actions.append(update,remove,message);root.append(actions);
 }
 const items=products.filter(p=>p.publication_id===list.id);
 if(items.length){const ul=document.createElement('ul');for(const p of items){const li=document.createElement('li');li.className='product-preview';const image=safeImageUrl(p.image_url);if(image){const img=document.createElement('img');img.src=image;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';li.append(img)}const details=document.createElement('span');details.append(text('strong',p.title||'Amazon-Produkt'));if(p.description)details.append(text('span',' – '+p.description));li.append(details);if(p.price!==null&&p.price!==undefined&&Number.isFinite(Number(p.price))){const price=text('span',' · '+new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(p.price)));price.className='product-price';details.append(price)}if(p.product_url&&safeProductUrl(p.product_url)){const link=text('a',' Produkt ansehen');link.href=p.product_url;link.rel='noopener noreferrer';link.target='_blank';li.append(link)}ul.append(li)}root.append(ul);root.append(text('p','Produktvorschau – vollständige Liste bei Amazon öffnen.'))}
 else root.append(text('p',['pending','processing'].includes(list.scrape_status)?'Produktdaten werden geprüft …':'Produktdaten nicht verfügbar – Amazon-Link verwenden.'));
 return root;
}
function safeProductUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&/^(www\.)?amazon\.de$/.test(u.hostname.toLowerCase())}catch{return false}}
let page=0,searchGeneration=0;const PAGE_SIZE=24;
async function refresh(reset=true){
 if(reset)page=0;
 const generation=++searchGeneration;
 const term=$('search').value.trim();
 if(term.length>150){searchGeneration++;status('searchStatus','Bitte höchstens 150 Zeichen eingeben.');return}
 status('searchStatus','Suche läuft …');
 const r=await db.rpc('search_public_amazon_wishlists',{search_term:term,page_limit:PAGE_SIZE,page_offset:page*PAGE_SIZE});
 if(generation!==searchGeneration)return;
 if(r.error){status('searchStatus','Suche derzeit nicht verfügbar: '+r.error.message);return}
 const rows=r.data||[];
 publications=rows.map(({first_name,last_name,country,...list})=>list);
 profiles=rows.map(x=>({user_id:x.user_id,first_name:x.first_name,last_name:x.last_name,country:x.country}));
 // Übersicht ohne Produktvorschauen: vollständige Produkte nur in der Detailansicht laden.
 const results=$('results');results.replaceChildren();for(const list of publications)results.append(summaryCard(list));
 status('searchStatus',(rows.length?page*PAGE_SIZE+1:0)+'–'+(page*PAGE_SIZE+rows.length)+' Treffer'+(rows.length===PAGE_SIZE?' (weitere möglich)':'')+'.');
 $('prevPage').disabled=page===0;$('nextPage').disabled=rows.length<PAGE_SIZE;
 await renderTicker();
}
async function renderTicker(){
 const r=await db.rpc('search_public_amazon_wishlists',{search_term:'',page_limit:10,page_offset:0});
 if(r.error)return;
 const track=$('tickerTrack');track.replaceChildren();const newest=r.data||[];
 if(!newest.length){const empty=text('span','Noch keine Wunschlisten veröffentlicht.');empty.className='ticker-empty';track.append(empty);return}
 // Duplicate groups create a continuous loop; the second copy is only visual.
 for(let n=0;n<2;n++){
  const group=document.createElement('div');group.className='ticker-group';
  if(n===1){group.setAttribute('aria-hidden','true');group.inert=true}
  for(const list of newest){
   const name=[list.first_name,list.last_name].filter(Boolean).join(' ')||'Toolya-Mitglied';
   const a=document.createElement('a');a.href=listUrl(list.id);
   a.setAttribute('aria-label','Wunschliste '+(list.title||'Amazon-Wunschliste')+' von '+name+' auf Toolya ansehen');
   const avatar=text('span','♡');avatar.className='ticker-avatar';avatar.setAttribute('aria-hidden','true');
   const label=text('span',name+' · '+(list.title||'Amazon-Wunschliste'));label.className='ticker-label';
   const arrow=text('span','↗');arrow.className='ticker-arrow';arrow.setAttribute('aria-hidden','true');
   a.append(avatar,label,arrow);group.append(a);
  }
  track.append(group);
 }
}
async function loadProfile(){
 const {data,error}=await db.auth.getUser();const user=!error&&!data?.user?.is_anonymous?data?.user:null;sessionUser=user;
 $('profileForm').hidden=!user;$('auth').hidden=!!user;$('logoutPublic').hidden=!user;status('profileStatus',user?'Angemeldet als '+user.email:'Bitte zuerst anmelden.');
 if(!user){profile=null;await refresh();return}
 const r=await db.from('wishlist_profiles').select('user_id,handle,display_name,first_name,last_name,country').eq('user_id',user.id).maybeSingle();
 if(r.error){status('profileStatus',r.error.message);return}
 profile=r.data;await refresh();$('firstName').value=profile?.first_name||'';$('lastName').value=profile?.last_name||'';$('country').value=profile?.country||'';
}
function credentials(){const email=$('email').value.trim(),password=$('password').value;if(!email||!password)throw new Error('Bitte E-Mail und Passwort eingeben.');return {email,password};}
async function authenticate(mode){
 const login=$('login'),signup=$('signup');login.disabled=true;signup.disabled=true;
 try{
  const values=credentials();
  const r=mode==='signup'
   ?await db.auth.signUp({...values,options:{emailRedirectTo:new URL('./index.html',location.href).href}})
   :await db.auth.signInWithPassword(values);
  if(r.error)throw r.error;
  status('profileStatus',mode==='signup'&&!r.data.session?'Registrierung gestartet. Bitte bestätige deine E-Mail-Adresse.':'Erfolgreich angemeldet.');
  await loadProfile();
 }catch(error){status('profileStatus',error.message||'Anmeldung fehlgeschlagen.')}
 finally{$('password').value='';login.disabled=false;signup.disabled=false}
}
$('login').onclick=()=>authenticate('signin');
$('signup').onclick=()=>authenticate('signup');
$('logoutPublic').onclick=async()=>{const r=await db.auth.signOut();if(r.error)status('profileStatus',r.error.message);else await loadProfile()};
$('profileForm').onsubmit=async event=>{
 event.preventDefault();if(!sessionUser)return;
 const first_name=$('firstName').value.trim(),last_name=$('lastName').value.trim(),country=$('country').value.trim()||null;
 if(!first_name||!last_name){status('profileStatus','Vorname und Nachname sind Pflicht.');return}
 if((first_name+' '+last_name).length>80){status('profileStatus','Vorname und Nachname dürfen zusammen höchstens 79 Zeichen haben.');return}
 const writerId=sessionUser.id;
 const payload={user_id:writerId,first_name,last_name,country,display_name:first_name+' '+last_name,handle:profile?.handle||'amazon_'+crypto.randomUUID().slice(0,12)};
 let r;
 try{r=await guardedWishlistWrite(db,writerId,()=>db.from('wishlist_profiles').upsert(payload,{onConflict:'user_id'}));}
 catch(error){status('profileStatus',error.message);return}
 if(r.error){status('profileStatus',r.error.message);return}
 profile={...profile,...payload};status('profileStatus','Profil gespeichert.');await refresh();
};
$('publishForm').onsubmit=async event=>{
 event.preventDefault();if(!sessionUser){status('publishStatus','Bitte zuerst anmelden und dein Profil erstellen.');location.hash='#profile';return}
 if(!profile?.first_name?.trim()||!profile?.last_name?.trim()){status('publishStatus','Bitte zuerst Vorname und Nachname im Profil speichern.');location.hash='#profile';return}
 const url=safeAmazonListUrl($('amazonUrl').value);if(!url){status('publishStatus','Bitte einen gültigen öffentlichen Amazon-Wunschlisten-Link verwenden.');return}
 $('publishButton').disabled=true;
 try{
 status('publishStatus','Öffentliche Amazon-Wunschliste wird vollständig geprüft und eingelesen …');
 const {data: scrapeResult,error}=await db.functions.invoke('amazon-wishlist-scrape',{body:{action:'create',amazon_url:url}});
 if(error)throw error;
 if(scrapeResult?.status!=='success')throw new Error(scrapeResult?.error||'Amazon-Wunschliste nicht öffentlich erreichbar oder nicht vollständig lesbar. Es wurde nichts veröffentlicht.');
 status('publishStatus','Wunschliste erfolgreich eingelesen und veröffentlicht – '+scrapeResult.product_count+' Produkte.');
 await refresh();
 }catch(error){status('publishStatus','Veröffentlichung fehlgeschlagen: '+error.message)}finally{$('publishButton').disabled=false}
};
let debounce;$('search').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(()=>refresh(true),250)});
$('prevPage').onclick=()=>{if(page>0){page--;refresh(false)}};
$('nextPage').onclick=()=>{page++;refresh(false)};
window.addEventListener('storage',event=>{if(event.key===favKey){favorites=loadFavorites();renderFavorites()}});
db.auth.onAuthStateChange(()=>setTimeout(loadProfile,0));
renderFavorites();
await loadProfile();await renderSelectedList();
