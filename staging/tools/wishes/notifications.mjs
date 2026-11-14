const db=window.supabase.createClient('https://yheogmeaosuigyaxkwth.supabase.co','sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv');
const $=id=>document.getElementById(id);
const PAGE=20;let user=null,cursor=null,loading=false,events=[],hasMore=false;
const url=(path,query)=>new URL(path+query,location.href).href;
const date=value=>new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
function message(text){$('status').textContent=text}
function render(){
 const root=$('events');root.replaceChildren();
 const unread=events.filter(e=>!e.read_at).length;
 $('unreadCount').textContent=unread?'· '+unread+' ungelesen (geladen)':'';
 $('markPage').disabled=!unread;
 if(!events.length){const p=document.createElement('p');p.className='empty';p.textContent='Noch keine Aktivitäten für deine Einstellungen vorhanden.';root.append(p)}
 for(const item of events){
  const card=document.createElement('article');card.className='notification'+(item.read_at?'':' unread');
  const main=document.createElement('div');
  const badge=document.createElement('span');badge.className='badge';badge.textContent=item.read_at?'✓ Gelesen':'● Neu';
  const h=document.createElement('h3');
  h.textContent=item.event_type==='collection'?'🌈 Neue Wunschwelt: '+item.title:item.event_type==='follow'?'👥 Jemand folgt dir':'❤️ Like auf: '+item.title;
  const p=document.createElement('p');p.textContent=item.event_type==='collection'?'Ein gefolgtes Profil hat eine öffentliche Sammlung veröffentlicht.':item.event_type==='follow'?'Dein Profil hat einen neuen Follower.':'Deine öffentliche Sammlung wurde gelikt.';
  const time=document.createElement('time');time.dateTime=item.created_at;time.textContent=date(item.created_at);
  main.append(badge,h,p,time);
  if(item.event_type!=='follow'&&item.list_id){const a=document.createElement('a');a.href=url('./collection.html','?id='+encodeURIComponent(item.list_id));a.textContent='Sammlung öffnen ↗';main.append(a)}
  const button=document.createElement('button');button.type='button';button.textContent=item.read_at?'Gelesen':'Als gelesen markieren';button.disabled=Boolean(item.read_at);
  button.addEventListener('click',async()=>{button.disabled=true;const {error}=await db.from('wishlist_notification_reads').upsert({user_id:user.id,event_key:item.event_key,read_at:new Date().toISOString()},{onConflict:'user_id,event_key',ignoreDuplicates:true});if(error){button.disabled=false;message('Gelesen-Status konnte nicht gespeichert werden.')}else{item.read_at=new Date().toISOString();render();message('Gelesen-Status gespeichert.')}});
  card.append(main,button);root.append(card);
 }
 $('more').hidden=!hasMore;
}
async function loadPage(reset=false){
 if(loading)return;loading=true;$('more').disabled=true;
 try{
  const params={p_limit:PAGE+1,p_before:reset?null:cursor?.created_at||null,p_before_key:reset?null:cursor?.event_key||null};
  const {data,error}=await db.rpc('wishlist_notification_feed',params);if(error)throw error;
  const rows=data||[];hasMore=rows.length>PAGE;const page=rows.slice(0,PAGE);
  if(reset)events=[];
  const seen=new Set(events.map(x=>x.event_key));
  for(const row of page)if(!seen.has(row.event_key)){events.push(row);seen.add(row.event_key)}
  if(page.length)cursor=page[page.length-1];else if(reset)cursor=null;
  render();message('Benachrichtigungen aktualisiert.');
 }catch{message('Benachrichtigungen konnten nicht geladen werden. Bitte erneut versuchen.')}
 finally{loading=false;$('more').disabled=false}
}
async function load(){
 const {data,error}=await db.auth.getUser();user=data?.user;
 if(error||!user){$('login').hidden=false;message('Bitte anmelden.');return}
 $('content').hidden=false;
 const {data:prefs,error:prefError}=await db.from('wishlist_notification_preferences').select('new_collections,new_followers,collection_likes').eq('user_id',user.id).maybeSingle();
 if(prefError){$('settingsStatus').textContent='Einstellungen konnten nicht geladen werden.'}
 else if(prefs){$('prefCollections').checked=prefs.new_collections;$('prefFollowers').checked=prefs.new_followers;$('prefLikes').checked=prefs.collection_likes}
 await loadPage(true);
}
$('more').addEventListener('click',()=>loadPage());
$('markPage').addEventListener('click',async()=>{
 const pending=events.filter(e=>!e.read_at);if(!pending.length)return;
 $('markPage').disabled=true;
 const now=new Date().toISOString();
 const {error}=await db.from('wishlist_notification_reads').upsert(pending.map(e=>({user_id:user.id,event_key:e.event_key,read_at:now})),{onConflict:'user_id,event_key',ignoreDuplicates:true});
 if(error){message('Nicht alle Hinweise konnten als gelesen gespeichert werden.');render();return}
 pending.forEach(e=>e.read_at=now);render();message('Geladene Hinweise als gelesen gespeichert.');
});
$('savePrefs').addEventListener('click',async()=>{
 const button=$('savePrefs');button.disabled=true;
 const {error}=await db.from('wishlist_notification_preferences').upsert({user_id:user.id,new_collections:$('prefCollections').checked,new_followers:$('prefFollowers').checked,collection_likes:$('prefLikes').checked,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 $('settingsStatus').textContent=error?'Einstellungen konnten nicht gespeichert werden.':'Einstellungen dauerhaft gespeichert.';
 button.disabled=false;
 if(!error){cursor=null;await loadPage(true)}
});
load().catch(()=>message('Benachrichtigungszentrale konnte nicht gestartet werden.'));
