const db=window.supabase.createClient('https://avapuibsidubuzxjtyld.supabase.co','sb_publishable_95Vz26YwSFFWukFbqTBjMw_pv10kOFC');
const $=id=>document.getElementById(id);
const date=value=>{const d=new Date(value);return Number.isNaN(d.valueOf())?'':new Intl.DateTimeFormat('de-DE',{dateStyle:'medium'}).format(d)};
const empty=(root,message)=>{const p=document.createElement('p');p.className='empty';p.textContent=message;root.append(p)};
const link=(label,url)=>{const a=document.createElement('a');a.href=url;a.textContent=label;return a};
const profileLink=handle=>new URL('./profile.html?handle='+encodeURIComponent(handle),location.href).href;
const collectionLink=id=>new URL('./collection.html?id='+encodeURIComponent(id),location.href).href;
const safeStore={get(key){try{return localStorage.getItem(key)}catch{return null}},set(key,value){try{localStorage.setItem(key,value);return true}catch{return false}}};
function card(root,tag,title,description,when,href,label){
 const box=document.createElement('article');box.className='card';
 const badge=document.createElement('span');badge.className='tag';badge.textContent=tag;
 const h=document.createElement('h3');h.textContent=title;box.append(badge,h);
 if(description){const p=document.createElement('p');p.textContent=description;box.append(p)}
 if(when){const time=document.createElement('time');time.dateTime=when;time.textContent=date(when);box.append(time)}
 if(href)box.append(link(label||'Ansehen ↗',href));root.append(box);
}
async function load(){
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user){$('signedOut').hidden=false;$('status').textContent='Anmeldung erforderlich.';return}
 const key='helferlein-social-seen:'+user.id;
 const lastSeen=safeStore.get(key);const since=lastSeen&&Number.isFinite(Date.parse(lastSeen))?Date.parse(lastSeen):Date.now()-7*86400000;
 const [outgoing,incoming,own]=await Promise.all([
  db.from('wishlist_follows').select('followed_id,created_at').eq('follower_id',user.id).order('created_at',{ascending:false}).limit(200),
  db.from('wishlist_follows').select('follower_id,created_at').eq('followed_id',user.id).order('created_at',{ascending:false}).limit(200),
  db.from('wishlist_lists').select('id,title,visibility,archived,created_at').eq('user_id',user.id).limit(200)
 ]);
 for(const r of [outgoing,incoming,own])if(r.error)throw r.error;
 const followed=[...new Set((outgoing.data||[]).map(f=>f.followed_id))];
 const ownPublic=(own.data||[]).filter(l=>l.visibility==='public'&&!l.archived);
 const ownIds=ownPublic.map(l=>l.id);
 const [publicLists,likes,profilesResult]=await Promise.all([
  followed.length?db.from('wishlist_lists').select('id,user_id,title,description,created_at').in('user_id',followed).eq('visibility','public').eq('archived',false).order('created_at',{ascending:false}).limit(100):Promise.resolve({data:[],error:null}),
  ownIds.length?db.from('wishlist_collection_likes').select('list_id,user_id,created_at').in('list_id',ownIds).order('created_at',{ascending:false}).limit(200):Promise.resolve({data:[],error:null}),
  [...new Set([...followed,...(incoming.data||[]).map(f=>f.follower_id)])].length?db.from('wishlist_profiles').select('user_id,handle,display_name').in('user_id',[...new Set([...followed,...(incoming.data||[]).map(f=>f.follower_id)])]):Promise.resolve({data:[],error:null})
 ]);
 for(const r of [publicLists,likes,profilesResult])if(r.error)throw r.error;
 const profiles=new Map((profilesResult.data||[]).map(p=>[p.user_id,p]));
 const ownNames=new Map(ownPublic.map(l=>[l.id,l.title]));
 const followedEvents=(publicLists.data||[]).filter(l=>Date.parse(l.created_at)>since);
 const followerEvents=(incoming.data||[]).filter(f=>Date.parse(f.created_at)>since);
 const likeEvents=(likes.data||[]).filter(l=>Date.parse(l.created_at)>since&&l.user_id!==user.id);
 $('followersCount').textContent=(incoming.data||[]).length===200?'200+':String((incoming.data||[]).length);
 $('likesCount').textContent=(likes.data||[]).length===200?'200+':String((likes.data||[]).length);
 $('newCount').textContent=String(followedEvents.length+followerEvents.length+likeEvents.length);
 const followingRoot=$('followingCards'),followerRoot=$('followerCards'),likesRoot=$('likeCards');
 for(const item of (publicLists.data||[]).slice(0,12)){const p=profiles.get(item.user_id);card(followingRoot,Date.parse(item.created_at)>since?'✨ Neu':'🌈 Sammlung',item.title,p?'Von '+p.display_name:'Öffentliche Wunschwelt',item.created_at,collectionLink(item.id),'Sammlung ansehen ↗')}
 if(!followingRoot.children.length)empty(followingRoot,'Noch keine öffentlichen Wunschwelten gefolgter Profile. Entdecke neue Personen in der Community.');
 for(const f of (incoming.data||[]).slice(0,12)){const p=profiles.get(f.follower_id);card(followerRoot,Date.parse(f.created_at)>since?'👥 Neu':'👤 Follower',p?.display_name||'Community-Mitglied',p?'@'+p.handle:'Ein Profil folgt dir',f.created_at,p?profileLink(p.handle):null,'Profil ansehen ↗')}
 if(!followerRoot.children.length)empty(followerRoot,'Noch keine Follower.');
 const grouped=new Map();
 for(const like of likes.data||[]){if(like.user_id===user.id)continue;const g=grouped.get(like.list_id)||{count:0,latest:like.created_at};g.count++;grouped.set(like.list_id,g)}
 for(const [id,g] of [...grouped].sort((a,b)=>b[1].latest.localeCompare(a[1].latest)).slice(0,12))card(likesRoot,'❤️ Likes',ownNames.get(id)||'Deine Wunschwelt',g.count+' Likes in der geladenen Aktivitätsauswahl',g.latest,collectionLink(id),'Sammlung öffnen ↗');
 if(!likesRoot.children.length)empty(likesRoot,'Noch keine Likes auf deinen öffentlichen Wunschwelten.');
 $('markRead').addEventListener('click',()=>{if(safeStore.set(key,new Date().toISOString())){$('newCount').textContent='0';$('status').textContent='Auf diesem Gerät als gesehen markiert.'}else $('status').textContent='Lokales Speichern ist in diesem Browser nicht verfügbar.'});
 $('dashboard').hidden=false;$('status').textContent='Dein Social-Überblick ist aktuell.';
}
load().catch(()=>{$('status').textContent='Dashboard konnte nicht geladen werden. Bitte später erneut versuchen.'});
