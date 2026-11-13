import {currentUser,likeCounts,myReactions,reactionButtons} from './collection-social.mjs';
import {affiliateUrl} from './amazon-links.mjs';
const db=window.supabase.createClient('https://avapuibsidubuzxjtyld.supabase.co','sb_publishable_95Vz26YwSFFWukFbqTBjMw_pv10kOFC');
const $=id=>document.getElementById(id);
const id=new URLSearchParams(location.search).get('id');
const validId=typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
const notice=$('notice');
async function main(){
 if(!validId){notice.textContent='Ungültiger Sammlungslink.';return}
 const {data:list,error}=await db.from('wishlist_lists').select('id,title,description,icon,color,cover_url,visibility,archived,user_id').eq('id',id).eq('visibility','public').eq('archived',false).maybeSingle();
 if(error)throw error;
 if(!list){notice.textContent='Diese Sammlung ist nicht öffentlich verfügbar oder wurde archiviert.';return}
 const {data:items,error:itemsError}=await db.from('wishlist_list_items').select('wish_id').eq('list_id',id).order('created_at',{ascending:false}).limit(100);
 if(itemsError)throw itemsError;
 const ids=[...new Set((items||[]).map(item=>item.wish_id))];
 let wishes=[];
 if(ids.length){
  const {data,error:wishesError}=await db.from('wishlist_wishes').select('id,note,priority,visibility,wishlist_products(asin,title)').in('id',ids);
  if(wishesError)throw wishesError;
  const lookup=new Map((data||[]).map(wish=>[String(wish.id),wish]));
  wishes=ids.map(wishId=>lookup.get(String(wishId))).filter(wish=>wish?.visibility==='public');
 }
 $('title').textContent=list.title;$('description').textContent=list.description||'Eine Sammlung voller Geschenkideen.';
 $('icon').textContent=list.icon||'🎁';
 if(list.cover_url){try{const cover=new URL(list.cover_url);if(cover.protocol==='https:'){const image=document.createElement('img');image.src=cover.href;image.alt='Titelbild der Sammlung';image.loading='lazy';image.style.cssText='width:min(38vw,240px);height:180px;object-fit:cover;border-radius:16px';document.querySelector('.hero').prepend(image)}}catch{}}if(/^#[0-9a-f]{6}$/i.test(list.color||''))document.querySelector('.hero').style.borderTop='7px solid '+list.color;
 $('count').textContent=wishes.length+' Wünsche'+(ids.length===100?' · maximal 100 geladen':'');
 const viewer=await currentUser(db);
 let reservations=new Map();
 if(viewer&&viewer.id!==list.user_id&&wishes.length){const {data:states,error:statesError}=await db.rpc('wishlist_reservation_status',{p_wish_ids:wishes.map(w=>w.id)});if(!statesError)reservations=new Map((states||[]).map(x=>[String(x.wish_id),x.reservation_state]));}
 const grid=$('grid');
 for(const wish of wishes){
  const card=document.createElement('article');card.className='card';
  const cover=document.createElement('div');cover.className='cover';cover.textContent=list.icon||'🎁';cover.setAttribute('aria-hidden','true');
  const body=document.createElement('div');body.className='card-body';
  const title=document.createElement('h2');title.textContent=wish.wishlist_products?.title||'Wunsch';
  body.append(title);
  if(wish.note){const note=document.createElement('p');note.textContent=wish.note;body.append(note)}
  const asin=wish.wishlist_products?.asin;
  if(typeof asin==='string'&&/^[A-Z0-9]{10}$/.test(asin)){
   const link=document.createElement('a');link.href=affiliateUrl({asin,marketplace:'amazon.de'},{'amazon.de':'duhrrom-21'});link.target='_blank';link.rel='noopener noreferrer sponsored';link.textContent='Bei Amazon ansehen ↗';body.append(link);
  }
  if(viewer&&viewer.id!==list.user_id){
   const state=document.createElement('p');state.style.fontWeight='750';
   const button=document.createElement('button');button.type='button';button.style.cssText='min-height:44px;border:0;border-radius:11px;background:#6049ad;color:white;padding:11px 15px;font:inherit;font-weight:800;cursor:pointer';
   let current=reservations.get(String(wish.id))||'unknown';
   function show(){state.textContent=current==='reserved_by_you'?'🎁 Von dir reserviert':current==='already_reserved'?'🔒 Bereits reserviert':current==='available'?'✨ Noch frei':'Status nicht verfügbar';button.textContent=current==='reserved_by_you'?'Reservierung aufheben':'Geschenk reservieren';button.hidden=current==='already_reserved'||current==='unknown'}
   show();
   button.addEventListener('click',async()=>{button.disabled=true;const cancel=current==='reserved_by_you';const {data,error}=await db.rpc(cancel?'wishlist_cancel_wish_reservation':'wishlist_reserve_wish',{p_wish_id:wish.id});if(error){state.textContent='Aktion fehlgeschlagen. Bitte erneut versuchen.'}else{current=cancel?'available':data;show()}button.disabled=false});
   body.append(state,button);
  }else if(viewer?.id===list.user_id){const privacy=document.createElement('p');privacy.textContent='🎀 Reservierungen werden dir als Wunscheigentümer nicht angezeigt.';body.append(privacy)}
  else{const hint=document.createElement('p');hint.textContent='Zum Reservieren bitte anmelden.';body.append(hint)}
  card.append(cover,body);grid.append(card);
 }
 if(!wishes.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='Diese Sammlung enthält noch keine sichtbaren Wünsche.';grid.append(empty)}
 const [counts,reactions]=await Promise.all([likeCounts(db,[id]),myReactions(db,viewer,[id])]);
 $('reactions').append(reactionButtons({db,listId:id,user:viewer,likes:reactions.likes,bookmarks:reactions.bookmarks,counts,notify:message=>{$('reactionStatus').textContent=message}}));
 $('collection').hidden=false;notice.hidden=true;document.title=list.title+' · Helferlein Wishes';
 $('share').addEventListener('click',async()=>{
  const data={title:list.title,text:'Entdecke diese öffentliche Wunschsammlung:',url:location.href};
  try{if(navigator.share)await navigator.share(data);else if(navigator.clipboard&&isSecureContext){await navigator.clipboard.writeText(location.href);notice.hidden=false;notice.textContent='Link kopiert.'}else{notice.hidden=false;notice.textContent='Sammlungslink: '+location.href}}catch(e){if(e?.name!=='AbortError'){notice.hidden=false;notice.textContent='Teilen nicht möglich.'}}
 });
}
main().catch(()=>{notice.hidden=false;notice.textContent='Sammlung konnte nicht geladen werden. Bitte später erneut versuchen.'});
