import {db} from './toolya-client.mjs';
import {wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';
const $=id=>document.getElementById(id);
let user=null,rows=[],cursor=null,loading=false;
const planByWish=new Map();
const locale=()=>globalThis.__toolyaWishesLocale==='en'?'en':'de';
const fmt=value=>{const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat(locale()==='en'?'en-GB':'de-DE',{dateStyle:'medium'}).format(date):''};
const liveCopy=new WeakMap();
function bindCopy(node,paint){liveCopy.set(node,paint);paint();return node}
document.addEventListener('toolya:wishes-locale-change',()=>{for(const node of $('list').querySelectorAll('[data-reservation-copy]'))liveCopy.get(node)?.()});
function card(row){
 const article=document.createElement('article');article.className='card';
 const tag=document.createElement('span');tag.className='tag';tag.setAttribute('data-wish-owned-copy','');tag.textContent=row.is_public?'🎁 Von dir reserviert':'🔒 Nicht mehr öffentlich';
 const title=document.createElement('h3');title.textContent=row.product_title||'Wunsch';if(row.product_title)title.setAttribute('data-user-content','');
 const details=document.createElement('p');details.setAttribute('data-reservation-copy','');details.setAttribute('data-user-content','');bindCopy(details,()=>{details.textContent=(locale()==='en'?'Reserved on ':'Reserviert am ')+fmt(row.created_at)+(row.collection_title?' · '+row.collection_title:'')});
 const plan=planByWish.get(String(row.wish_id));if(plan){const progress=document.createElement('p');progress.className='tag';const labels={idea:'💡 Idee',planned:'📝 Geplant',purchased:'🛍️ Gekauft',wrapped:'🎀 Verpackt',gifted:'🎁 Verschenkt'};progress.setAttribute('data-reservation-copy','');progress.setAttribute('data-user-content','');bindCopy(progress,()=>{progress.textContent=wishesText('Deine Geschenkplanung: ',locale())+wishesText(labels[plan.status]||plan.status,locale())});article.append(progress)}
 const controls=document.createElement('div');controls.className='controls';
 if(row.is_public&&row.product_id){
  const transfer=document.createElement('button');transfer.className='primary';transfer.type='button';transfer.textContent='🎁 In Geschenkplanung';
  transfer.textContent=plan?'🎁 Geschenkplanung öffnen':'🎁 In Geschenkplanung';transfer.addEventListener('click',()=>{location.href=plan?'./planner.html':'./planner.html?reserved_wish='+encodeURIComponent(row.wish_id)});
  controls.append(transfer);
  if(row.collection_id){const a=document.createElement('a');a.href='./collection.html?id='+encodeURIComponent(row.collection_id);a.setAttribute('data-wish-owned-copy','');a.textContent='Wunschwelt ansehen ↗';a.style.alignSelf='center';controls.append(a)}
 }
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Reservierung aufheben';
 cancel.addEventListener('click',async()=>{if(!confirm('Reservierung wirklich aufheben? Der Wunsch wird wieder frei.'))return;cancel.disabled=true;
  const {data,error}=await db.rpc('wishlist_cancel_wish_reservation',{p_wish_id:row.wish_id});
  if(error){$('status').textContent='Reservierung konnte nicht aufgehoben werden.';cancel.disabled=false;return}
  if(!data){$('status').textContent='Die Reservierung war bereits aufgehoben.'}else{$('status').textContent='Reservierung aufgehoben.'}
  rows=rows.filter(x=>String(x.wish_id)!==String(row.wish_id));render();
 });
 controls.append(cancel);article.append(tag,title,details,controls);return article;
}
function render(){
 const root=$('list');root.replaceChildren();
 if(!rows.length){const p=document.createElement('p');p.className='empty';p.setAttribute('data-wish-owned-copy','');p.textContent='Du hast aktuell keine Geschenkreservierungen. Entdecke öffentliche Wunschwelten und reserviere einen Wunsch.';root.append(p)}
 else for(const row of rows)root.append(card(row));
}
async function page(reset=false){
 if(loading)return;loading=true;$('more').disabled=true;
 try{
  const args={p_limit:21,p_before:reset?null:cursor?.created_at||null,p_before_wish_id:reset?null:cursor?.wish_id||null};
  const {data,error}=await db.rpc('wishlist_my_gift_reservations',args);if(error)throw error;
  const batch=data||[],visible=batch.slice(0,20);
  if(reset)rows=[];rows.push(...visible);
  if(visible.length)cursor={created_at:visible.at(-1).created_at,wish_id:visible.at(-1).wish_id};
  $('more').hidden=batch.length<=20;
  render();$('status').textContent=rows.length+' eigene Reservierungen geladen.';
 }catch{$('status').textContent='Reservierungen konnten nicht geladen werden. Bitte erneut versuchen.'}
 finally{loading=false;$('more').disabled=false}
}
$('more').addEventListener('click',()=>page());
async function main(){
 const {data,error}=await db.auth.getUser();user=data?.user;
 if(error||!user){$('login').hidden=false;$('status').textContent='Bitte anmelden.';return}
 const {data:plans,error:planError}=await db.from('wishlist_gift_plans').select('source_wish_id,status,created_at').eq('user_id',user.id).not('source_wish_id','is',null).order('created_at',{ascending:false}).limit(1000);if(!planError)for(const p of plans||[])if(!planByWish.has(String(p.source_wish_id)))planByWish.set(String(p.source_wish_id),p);
 $('content').hidden=false;await page(true);
}
main().catch(()=>{$('status').textContent='Reservierungen konnten nicht geladen werden.'});
