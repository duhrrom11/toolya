import {currentUser,likeCounts,myReactions,reactionButtons} from './collection-social.mjs';
import {db} from './toolya-client.mjs';
const $=id=>document.getElementById(id);
const topics=[['all','✨ Alle'],['gaming','🎮 Gaming'],['home','🏡 Wohnen'],['creative','🎨 Kreativ'],['beauty','🌸 Wellness'],['outdoor','🏕️ Outdoor'],['kids','🧸 Familie']];
const terms={gaming:['gaming','technik','gamer','konsole','nintendo'],home:['wohnen','küche','cozy','deko','einzug'],creative:['kreativ','kunst','bücher','buch','zeichnen','diy'],beauty:['beauty','wellness','pflege','kosmetik'],outdoor:['sport','outdoor','camping','wandern'],kids:['familie','kinder','baby','spielzeug']};
let all=[],selected='all',viewer=null,reactions={likes:new Set(),bookmarks:new Set()},counts=new Map(),onlySaved=false;
const normalize=value=>String(value||'').toLocaleLowerCase('de-DE');
function renderTopics(){
 const root=$('topics');root.replaceChildren();
 for(const [id,label] of topics){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',String(id===selected));b.addEventListener('click',()=>{selected=id;renderTopics();render()});root.append(b)}
}
function render(){
 const query=normalize($('search').value.trim()),sort=$('sort').value;
 const rows=all.filter(item=>{
  const text=normalize(item.title+' '+(item.description||'')+' '+(item.owner?.display_name||'')+' '+(item.owner?.handle||''));
  return (!onlySaved||reactions.bookmarks.has(item.id))&&(!query||text.includes(query))&&(selected==='all'||terms[selected]?.some(term=>text.includes(term)));
 });
 if(sort==='popular')rows.sort((a,b)=>(counts.get(b.id)||0)-(counts.get(a.id)||0)||b.created_at.localeCompare(a.created_at));
 else if(sort==='az')rows.sort((a,b)=>a.title.localeCompare(b.title,'de'));
 else rows.sort((a,b)=>b.created_at.localeCompare(a.created_at));
 const grid=$('grid');grid.replaceChildren();
 for(const item of rows){
  const card=document.createElement('article');card.className='card';
  const cover=document.createElement('div');cover.className='cover';cover.textContent=item.icon||'🎁';
  if(item.cover_url){try{const url=new URL(item.cover_url);if(url.protocol==='https:'){const img=document.createElement('img');img.src=url.href;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';cover.replaceChildren(img)}}catch{}}
  const body=document.createElement('div');body.className='card-body';
  const badge=document.createElement('span');badge.className='badge';badge.textContent='❤️ '+(counts.get(item.id)||0)+' Likes · 👥 '+item.followers+' Profil-Follower';
  const title=document.createElement('h2');title.textContent=item.title;
  body.append(badge,title);
  if(item.description){const p=document.createElement('p');p.textContent=item.description;body.append(p)}
  if(item.owner){const owner=document.createElement('a');owner.href=new URL('./profile.html?handle='+encodeURIComponent(item.owner.handle),location.href).href;owner.textContent='👤 '+item.owner.display_name;body.append(owner)}
  const link=document.createElement('a');link.className='primary';link.href=new URL('./collection.html?id='+encodeURIComponent(item.id),location.href).href;link.textContent='Sammlung ansehen ↗';body.append(link);
  body.append(reactionButtons({db,listId:item.id,user:viewer,likes:reactions.likes,bookmarks:reactions.bookmarks,counts,notify:message=>{ $('actionStatus').textContent=message; if(message==='Gespeichert.'||message==='Auswahl entfernt.')render() }}));card.append(cover,body);grid.append(card);
 }
 $('status').textContent=rows.length+' öffentliche Sammlungen gefunden · aus maximal 60 zuletzt erstellten Sammlungen.';
 if(!rows.length){const p=document.createElement('p');p.className='empty';p.textContent='Keine passenden Sammlungen gefunden. Probiere einen anderen Suchbegriff.';grid.append(p)}
}
async function load(){
 const {data:lists,error}=await db.from('wishlist_lists').select('id,user_id,title,description,icon,cover_url,created_at').eq('visibility','public').eq('archived',false).order('created_at',{ascending:false}).limit(60);
 if(error)throw error;
 const owners=[...new Set((lists||[]).map(item=>item.user_id))];
 let profiles=[],follows=[];
 if(owners.length){
  const [p,f]=await Promise.all([
   db.from('wishlist_profiles').select('user_id,handle,display_name').in('user_id',owners),
   db.from('wishlist_follows').select('followed_id').in('followed_id',owners).limit(10000)
  ]);
  if(p.error)throw p.error;
  if(f.error)throw f.error;
  profiles=p.data||[];follows=f.data||[];
 }
 viewer=await currentUser(db);const ids=(lists||[]).map(l=>l.id);[counts,reactions]=await Promise.all([likeCounts(db,ids),myReactions(db,viewer,ids)]);
 const byOwner=new Map(profiles.map(p=>[p.user_id,p]));
 const counts=new Map();
 for(const f of follows)counts.set(f.followed_id,(counts.get(f.followed_id)||0)+1);
 all=(lists||[]).map(item=>({...item,owner:byOwner.get(item.user_id),followers:counts.get(item.user_id)||0}));
 render();
}
$('savedOnly').addEventListener('change',event=>{onlySaved=event.target.checked;render()});$('search').addEventListener('input',render);$('sort').addEventListener('change',render);renderTopics();
load().catch(()=>{$('status').textContent='Sammlungen konnten nicht geladen werden. Bitte später erneut versuchen.'});
