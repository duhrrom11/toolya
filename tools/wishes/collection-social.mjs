/** Collection reactions: public likes, private bookmarks. */
export async function currentUser(db){const {data,error}=await db.auth.getUser();if(error)return null;return data?.user||null}
export async function likeCounts(db,ids){
 if(!ids.length)return new Map();
 const {data,error}=await db.rpc('wishlist_collection_like_counts',{p_list_ids:ids});
 if(error)throw error;
 return new Map((data||[]).map(row=>[row.list_id,Number(row.like_count)]));
}
export async function myReactions(db,user,ids){
 if(!user||!ids.length)return {likes:new Set(),bookmarks:new Set()};
 const [l,b]=await Promise.all([
  db.from('wishlist_collection_likes').select('list_id').eq('user_id',user.id).in('list_id',ids),
  db.from('wishlist_collection_bookmarks').select('list_id').eq('user_id',user.id).in('list_id',ids)
 ]);
 if(l.error)throw l.error;if(b.error)throw b.error;
 return {likes:new Set((l.data||[]).map(x=>x.list_id)),bookmarks:new Set((b.data||[]).map(x=>x.list_id))};
}
export function reactionButtons({db,listId,user,likes,bookmarks,counts,notify}){
 const wrap=document.createElement('div');wrap.className='collection-reactions';
 const like=document.createElement('button'),save=document.createElement('button');
 like.type='button';save.type='button';like.className='reaction-button';save.className='reaction-button';
 function update(){
  const liked=likes.has(listId),saved=bookmarks.has(listId);
  like.textContent=(liked?'❤️':'🤍')+' '+(counts.get(listId)||0)+' Likes';
  save.textContent=saved?'🔖 Gemerkt':'🔖 Merken';
  like.setAttribute('aria-pressed',String(liked));save.setAttribute('aria-pressed',String(saved));
  like.setAttribute('aria-label',liked?'Like entfernen':'Sammlung liken');
  save.setAttribute('aria-label',saved?'Aus Merkliste entfernen':'Sammlung merken');
 }
 async function toggle(table,active,button){
  if(!user){notify('Zum Liken und Merken bitte anmelden.');return}
  if(like.disabled||save.disabled)return;
  like.disabled=true;save.disabled=true;
  try{
   const removing=active.has(listId);
   const q=db.from(table);
   const {error}=removing?await q.delete().eq('list_id',listId).eq('user_id',user.id):await q.insert({list_id:listId,user_id:user.id});
   if(error)throw error;
   if(removing)active.delete(listId);else active.add(listId);
   if(table==='wishlist_collection_likes')counts.set(listId,Math.max(0,(counts.get(listId)||0)+(removing?-1:1)));
   update();notify(removing?'Auswahl entfernt.':'Gespeichert.');
  }catch(e){notify('Aktion fehlgeschlagen. Bitte erneut versuchen.')}
  finally{like.disabled=false;save.disabled=false}
 }
 like.addEventListener('click',()=>toggle('wishlist_collection_likes',likes,like));
 save.addEventListener('click',()=>toggle('wishlist_collection_bookmarks',bookmarks,save));
 update();wrap.append(like,save);return wrap;
}
