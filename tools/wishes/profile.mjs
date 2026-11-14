import {db} from './toolya-client.mjs';
const $=id=>document.getElementById(id);
const handle=new URLSearchParams(location.search).get('handle');
async function load(){
 if(!handle||!/^[a-z0-9_]{3,30}$/.test(handle)){$('status').textContent='Ungültiger Profil-Link.';return}
 const {data:profile,error}=await db.from('wishlist_profiles').select('user_id,handle,display_name,bio,avatar_url').eq('handle',handle).maybeSingle();
 if(error)throw error;
 if(!profile){$('status').textContent='Dieses Profil wurde nicht gefunden.';return}
 $('name').textContent=profile.display_name;$('handle').textContent='@'+profile.handle;$('bio').textContent=profile.bio||'';
 if(profile.avatar_url){try{const u=new URL(profile.avatar_url);if(u.protocol==='https:'){const image=document.createElement('img');image.src=u.href;image.alt='';image.referrerPolicy='no-referrer';$('avatar').replaceChildren(image)}}catch{}}
 const url=new URL('./index.html',location.href);url.searchParams.set('profile',profile.handle);$('wishes').href=url.href;
 const {data:lists,error:listsError}=await db.from('wishlist_lists').select('id,title,description,icon,color,cover_url').eq('user_id',profile.user_id).eq('visibility','public').eq('archived',false).order('created_at',{ascending:false}).limit(48);
 if(listsError)throw listsError;
 const stats=await Promise.all([
  db.from('wishlist_follows').select('follower_id',{count:'exact',head:true}).eq('followed_id',profile.user_id),
  db.from('wishlist_follows').select('followed_id',{count:'exact',head:true}).eq('follower_id',profile.user_id)
 ]);
 $('statFollowers').textContent=stats[0].error?'–':String(stats[0].count??0);
 $('statFollowing').textContent=stats[1].error?'–':String(stats[1].count??0);
 $('statCollections').textContent=(lists||[]).length===48?'48+':String((lists||[]).length);
 const grid=$('grid');grid.replaceChildren();
 for(const list of lists||[]){
  const card=document.createElement('article');card.className='card';
  const cover=document.createElement('div');cover.className='cover';cover.textContent=list.icon||'🎁';
  if(list.cover_url){try{const u=new URL(list.cover_url);if(u.protocol==='https:'){const img=document.createElement('img');img.src=u.href;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';cover.replaceChildren(img)}}catch{}}
  if(/^#[0-9a-f]{6}$/i.test(list.color||''))cover.style.borderTop='5px solid '+list.color;
  const body=document.createElement('div');body.className='body';
  const title=document.createElement('h3');title.textContent=list.title;body.append(title);
  if(list.description){const desc=document.createElement('p');desc.textContent=list.description;body.append(desc)}
  const link=document.createElement('a');link.href=new URL('./collection.html?id='+encodeURIComponent(list.id),location.href).href;link.textContent='Sammlung entdecken ↗';body.append(link);
  card.append(cover,body);grid.append(card);
 }
 $('count').textContent=(lists||[]).length+' öffentliche Sammlungen'+((lists||[]).length===48?' · maximal 48 angezeigt':'');
 if(!lists?.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='Dieses Profil hat noch keine öffentlichen Sammlungen.';grid.append(empty)}
 $('share').addEventListener('click',async()=>{try{if(navigator.share)await navigator.share({title:profile.display_name,url:location.href});else if(navigator.clipboard&&isSecureContext){await navigator.clipboard.writeText(location.href);$('status').hidden=false;$('status').textContent='Profil-Link kopiert.'}else{$('status').hidden=false;$('status').textContent='Profil-Link: '+location.href}}catch(e){if(e?.name!=='AbortError'){$('status').hidden=false;$('status').textContent='Teilen nicht möglich.'}}});
 document.title=profile.display_name+' · Helferlein Wishes';$('profile').hidden=false;$('status').hidden=true;
}
load().catch(()=>{$('status').hidden=false;$('status').textContent='Profil konnte nicht geladen werden. Bitte später erneut versuchen.'});
