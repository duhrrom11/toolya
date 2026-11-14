import {currentUser,likeCounts,myReactions,reactionButtons} from './collection-social.mjs';
import {db} from './toolya-client.mjs';
const $=id=>document.getElementById(id);
const tabs=[...document.querySelectorAll('[data-tab]')];
let tab='following',viewer=null,all=[],following=new Set(),reactions={likes:new Set(),bookmarks:new Set()},counts=new Map(),profiles=new Map();
const normalize=s=>String(s||'').toLocaleLowerCase('de-DE');
const words=s=>normalize(s).split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>3);
function relevance(item,interests){
 const tags=new Set(words(item.title+' '+(item.description||'')));
 let score=0;for(const word of tags)score+=interests.get(word)||0;
 return score;
}
function render(){
 tabs.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tab===tab)));
 let rows=all.filter(item=>tab==='following'?following.has(item.user_id):tab==='saved'?reactions.bookmarks.has(item.id):!viewer||item.user_id!==viewer.id);
 const interests=new Map();
 for(const item of all){if(reactions.bookmarks.has(item.id)||reactions.likes.has(item.id)){for(const word of new Set(words(item.title+' '+(item.description||''))))interests.set(word,(interests.get(word)||0)+1)}}
 if(tab==='recommended')rows.sort((a,b)=>relevance(b,interests)-relevance(a,interests)||(counts.get(b.id)||0)-(counts.get(a.id)||0)||b.created_at.localeCompare(a.created_at));
 else rows.sort((a,b)=>b.created_at.localeCompare(a.created_at));
 const grid=$('grid');grid.replaceChildren();
 for(const item of rows){
  const card=document.createElement('article');card.className='card';
  const cover=document.createElement('div');cover.className='cover';cover.textContent=item.icon||'🎁';
  if(item.cover_url){try{const u=new URL(item.cover_url);if(u.protocol==='https:'){const img=document.createElement('img');img.src=u.href;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';cover.replaceChildren(img)}}catch{}}
  const body=document.createElement('div');body.className='card-body';
  const badge=document.createElement('span');badge.className='badge';badge.textContent='❤️ '+(counts.get(item.id)||0)+' Likes';
  const title=document.createElement('h2');title.textContent=item.title;body.append(badge,title);
  if(item.description){const p=document.createElement('p');p.textContent=item.description;body.append(p)}
  const owner=profiles.get(item.user_id);
  if(owner){const link=document.createElement('a');link.href=new URL('./profile.html?handle='+encodeURIComponent(owner.handle),location.href).href;link.textContent='👤 '+owner.display_name;body.append(link)}
  const link=document.createElement('a');link.className='primary';link.href=new URL('./collection.html?id='+encodeURIComponent(item.id),location.href).href;link.textContent='Wunschwelt öffnen ↗';body.append(link);
  body.append(reactionButtons({db,listId:item.id,user:viewer,likes:reactions.likes,bookmarks:reactions.bookmarks,counts,notify:msg=>{$('actionStatus').textContent=msg;if(msg==='Gespeichert.'||msg==='Auswahl entfernt.')render()}}));
  card.append(cover,body);grid.append(card);
 }
 $('status').textContent=rows.length+' Wunschwelten · Auswahl aus maximal 100 zuletzt veröffentlichten Sammlungen.';
 $('feedHint').textContent=tab==='following'?'Neue öffentliche Sammlungen der Profile, denen du folgst.':tab==='saved'?'Deine privat gespeicherten Sammlungen, sofern weiterhin öffentlich.':'Empfehlungen nach Themen deiner Likes und Merkliste; ohne bisherige Interessen nach Likes und Aktualität.';
 if(!rows.length){const p=document.createElement('p');p.className='empty';p.textContent=!viewer?'Melde dich an, um deinen persönlichen Feed zu sehen. Empfehlungen kannst du bereits ohne Anmeldung entdecken.':tab==='following'?'Noch keine neuen öffentlichen Sammlungen gefolgter Profile. Folge Personen in der Community.':tab==='saved'?'Noch keine gemerkten Sammlungen. Öffne Entdecken und tippe auf „Merken“.':'Aktuell keine öffentlichen Sammlungen verfügbar.';grid.append(p)}
}
async function load(){
 viewer=await currentUser(db);if(!viewer)tab='recommended';
 const {data:lists,error}=await db.from('wishlist_lists').select('id,user_id,title,description,icon,cover_url,created_at').eq('visibility','public').eq('archived',false).order('created_at',{ascending:false}).limit(100);
 if(error)throw error;
 all=lists||[];const owners=[...new Set(all.map(l=>l.user_id))],ids=all.map(l=>l.id);
 const jobs=[likeCounts(db,ids),myReactions(db,viewer,ids)];
 if(owners.length)jobs.push(db.from('wishlist_profiles').select('user_id,handle,display_name').in('user_id',owners));
 if(viewer)jobs.push(db.from('wishlist_follows').select('followed_id').eq('follower_id',viewer.id).limit(1000));
 const results=await Promise.all(jobs);counts=results[0];reactions=results[1];
 if(owners.length){const p=results[2];if(p.error)throw p.error;profiles=new Map((p.data||[]).map(x=>[x.user_id,x]))}
 if(viewer){const f=results[owners.length?3:2];if(f.error)throw f.error;following=new Set((f.data||[]).map(x=>x.followed_id))}
 render();
}
tabs.forEach(button=>button.addEventListener('click',()=>{tab=button.dataset.tab;render()}));
load().catch(()=>{$('status').textContent='Feed konnte nicht geladen werden. Bitte später erneut versuchen.'});
