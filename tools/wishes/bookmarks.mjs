import {currentUser,likeCounts,myReactions,reactionButtons} from './collection-social.mjs';
import {db} from './toolya-client.mjs';
const $=id=>document.getElementById(id);
let all=[],viewer=null,reactions={likes:new Set(),bookmarks:new Set()},counts=new Map();
const normalize=x=>String(x||'').toLocaleLowerCase('de-DE');
function render(){
 const q=normalize($('search').value),sort=$('sort').value;
 const rows=all.filter(item=>reactions.bookmarks.has(item.id)&&normalize(item.title+' '+(item.description||'')).includes(q));
 if(sort==='popular')rows.sort((a,b)=>(counts.get(b.id)||0)-(counts.get(a.id)||0));
 else if(sort==='az')rows.sort((a,b)=>a.title.localeCompare(b.title,'de'));
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
  const a=document.createElement('a');a.className='primary';a.href=new URL('./collection.html?id='+encodeURIComponent(item.id),location.href).href;a.textContent='Sammlung öffnen ↗';body.append(a);
  body.append(reactionButtons({db,listId:item.id,user:viewer,likes:reactions.likes,bookmarks:reactions.bookmarks,counts,notify:msg=>{$('actionStatus').textContent=msg;render()}}));
  card.append(cover,body);grid.append(card);
 }
 $('status').textContent=rows.length+' gemerkte öffentliche Sammlungen.';
 if(!rows.length){const p=document.createElement('p');p.className='empty';p.textContent='Noch keine passenden gespeicherten Sammlungen. Entdecke öffentliche Wunschwelten und tippe auf „Merken“.';grid.append(p)}
}
async function load(){
 viewer=await currentUser(db);
 if(!viewer){$('loginHint').hidden=false;$('status').textContent='Anmeldung erforderlich.';return}
 const {data:bookmarks,error}=await db.from('wishlist_collection_bookmarks').select('list_id').eq('user_id',viewer.id).order('created_at',{ascending:false}).limit(200);
 if(error)throw error;
 const ids=(bookmarks||[]).map(b=>b.list_id);
 if(!ids.length){render();return}
 const [listsResult,countsResult]=await Promise.all([
  db.from('wishlist_lists').select('id,title,description,icon,cover_url,created_at').in('id',ids).eq('visibility','public').eq('archived',false),
  likeCounts(db,ids)
 ]);
 if(listsResult.error)throw listsResult.error;
 all=listsResult.data||[];counts=countsResult;
 reactions=await myReactions(db,viewer,all.map(l=>l.id));
 render();
}
$('search').addEventListener('input',render);$('sort').addEventListener('change',render);
$('topics').hidden=true;
load().catch(()=>{$('status').textContent='Merkliste konnte nicht geladen werden. Bitte später erneut versuchen.'});
