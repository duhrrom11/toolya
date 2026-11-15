import {appendProductMetadata} from './product-card.mjs';
import {LIST_TEMPLATES,WISH_CATEGORIES,filterListWishes} from './list-features.mjs';
import {fetchAllPages,currentDashboardLoad,fetchDashboardBase,fetchDashboardMembership,membershipForSelectedList,moveFailureState} from './bulk-helpers.mjs';
// Multi-list dashboard. Requires LISTS-SCHEMA-PROPOSAL.sql to be reviewed and applied separately.
export function mountListsDashboard(db, getUser) {
 const $=id=>document.getElementById(id);
 const root=$('listsDashboard');
 let cloudWishExtras=new Map();
 let lists=[],wishes=[],selected=null,loadedOwner=null,loadGeneration=0,itemsGeneration=0,assignedIds=new Set(),favoriteIds=new Set(),listCounts=new Map(),assignedTotal=0,wishCategories={},wishMarkers={},detailWishId=null,bulkIds=new Set(),allAssignedIds=new Set(),bulkBusy=false,pendingBulk=null,visibleLimit=100,bulkStopRequested=false,bulkRunId=0,lastBulkResult=null,bulkHistory=[],membershipByList=new Map(),membershipReady=false;
 let detailCategoryBaseline='';let listEditBaseline=null;let listEditGeneration=null;
 const markerKey=id=>'helferlein-wish-markers:'+id;
 function readMarkers(id){try{const value=JSON.parse(localStorage.getItem(markerKey(id))||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).filter(([k,v])=>typeof k==='string'&&['star','later'].includes(v))):{}}catch{return {}}}
 function restoreWishCardControl(wishId,selector){
  const card=[...$('listWishCards').children].find(node=>node.dataset.wishId===wishId);
  const target=card?.querySelector(selector);
  if(target&&!target.disabled){target.focus({preventScroll:true});return}
  const fallback=$('listWishSearch');
  if(!fallback.disabled){fallback.focus({preventScroll:true});return}
  const heading=$('activeListHeading');heading.tabIndex=-1;heading.focus({preventScroll:true});
 }
 function setMarker(wishId,marker){if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner||!wishes.some(w=>w.id===wishId))return;const uid=owner();try{const raw=localStorage.getItem(markerKey(uid)),stored=raw===null?{}:JSON.parse(raw);if(!stored||typeof stored!=='object'||Array.isArray(stored)||Object.values(stored).some(v=>!['star','later'].includes(v)))throw Error('Ungültige Markierungsdaten');const next={...stored};if(next[wishId]===marker)delete next[wishId];else next[wishId]=marker;localStorage.setItem(markerKey(uid),JSON.stringify(next));wishMarkers=next;const wasCardControl=$('listWishCards').contains(document.activeElement);renderWishCards();if(wasCardControl)restoreWishCardControl(wishId,'[data-wish-marker="'+marker+'"]');if(detailWishId===wishId)syncDetailMarkers();msg('Markierung in diesem Browser gespeichert.')}catch{msg('Markierung konnte nicht gespeichert werden.')}}
 function syncDetailMarkers(){for(const [id,marker,off,on] of [['wishDetailStar','star','☆ Favorit','★ Favorit']]){const b=$(id),active=wishMarkers[detailWishId]===marker;b.setAttribute('aria-pressed',String(active));b.textContent=active?on:off}}
 const categoryKey=id=>'helferlein-wish-categories:'+id;
 function readCategories(id){try{const value=JSON.parse(localStorage.getItem(categoryKey(id))||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).filter(([k,v])=>typeof k==='string'&&WISH_CATEGORIES.some(c=>c.id===v))):{}}catch{return {}}}
 function saveCategory(){if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner)return;const uid=owner(),wishId=detailWishId;if(!wishId||!wishes.some(w=>w.id===wishId))return;const category=$('wishDetailCategory').value;if(category&&!WISH_CATEGORIES.some(c=>c.id===category))return;try{const raw=localStorage.getItem(categoryKey(uid)),stored=raw===null?{}:JSON.parse(raw);if(!stored||typeof stored!=='object'||Array.isArray(stored)||Object.values(stored).some(v=>!WISH_CATEGORIES.some(c=>c.id===v)))throw Error('Ungültige Kategoriedaten');if((stored[wishId]||'')!==detailCategoryBaseline){msg('Kategorie wurde in einem anderen Tab geändert. Bitte Wunschdetails erneut öffnen und Änderung prüfen.');return;}const next={...stored};if(category)next[wishId]=category;else delete next[wishId];localStorage.setItem(categoryKey(uid),JSON.stringify(next));wishCategories=next;$('wishDetailDialog').close();renderWishCards();focusWishCard(wishId);msg('Kategorie in diesem Browser gespeichert.')}catch{msg('Kategorie konnte in diesem Browser nicht gespeichert werden.')}}
 function focusWishCard(wishId){
  const card=[...$('listWishCards').children].find(el=>el.dataset.wishId===wishId);
  if(!card)return;
  card.tabIndex=-1;card.focus({preventScroll:true});card.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'center'});
 }
 function jumpToWishInList(wishId,listId){
  if(getUser()?.id!==loadedOwner||!membershipReady||listCopyBusy||bulkBusy||activeWishMutations.size||!lists.some(l=>l.id===listId&&!l.archived&&membershipByList.get(l.id)?.has(wishId)))return;
  const wish=wishes.find(w=>w.id===wishId);if(!wish)return;
  $('wishDetailDialog').close();openList(listId);
  $('listWishSearch').value='';
  $('listWishAssignment').value='assigned';$('listWishPriority').value='all';$('listWishCategory').value='all';$('listWishMarker').value='all';$('listWishSort').value='newest';selectedOnlyView=false;
  const index=visibleWishes().findIndex(w=>w.id===wishId);
  if(index<0){msg('Wunsch konnte in dieser Liste nicht gefunden werden.');return}
  visibleLimit=Math.max(visibleLimit,index+1);renderWishCards();focusWishCard(wishId);
 }
 function openWishDetail(wish){if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner||!wishes.some(w=>w.id===wish.id))return;detailWishId=wish.id;
  const membership=$('wishDetailLists');membership.replaceChildren();
  const matching=membershipReady?lists.filter(l=>!l.archived&&membershipByList.get(l.id)?.has(wish.id)):[];
  if(matching.length){const heading=document.createElement('strong');heading.textContent='In diesen Listen:';membership.append(heading);
   for(const list of matching){const go=button(list.icon+' '+list.title,async()=>jumpToWishInList(wish.id,list.id));membership.append(go)}
  }else{const hint=document.createElement('span');hint.textContent=membershipReady?'Noch keiner Liste zugeordnet':'Listenzuordnungen werden geladen';membership.append(hint)}
  $('wishDetailJump').disabled=listCopyBusy||bulkBusy||activeWishMutations.size>0||!matching.length;
  $('wishDetailHeading').textContent=wish.wishlist_products?.title||'Wunsch';$('wishDetailPriority').textContent='Priorität: '+(['','Sehr wichtig','Normal','Irgendwann'][wish.priority]||'Nicht angegeben');$('wishDetailNote').textContent=wish.note||'Keine Notiz vorhanden.';$('wishDetailDate').textContent=wish.created_at?'Hinzugefügt: '+new Date(wish.created_at).toLocaleDateString('de-DE'):'';detailCategoryBaseline=wishCategories[wish.id]||'';$('wishDetailCategory').value=detailCategoryBaseline;syncDetailMarkers();$('wishDetailDialog').showModal()}
 function renderRecent(){} // Legacy dashboard call: no recently opened tracking.
 function renderProgress(){const count=wishes.length,percentage=count?Math.min(100,Math.round(100*assignedTotal/count)):0;$('assignedTotal').textContent=String(assignedTotal);$('favoritesTotal').textContent=String(lists.filter(l=>favoriteIds.has(l.id)).length);$('homeProgress').setAttribute('aria-valuenow',String(percentage));$('homeProgressFill').style.width=percentage+'%';$('homeProgressNote').textContent=count?assignedTotal+' von '+count+' geladenen Wünschen sind mindestens einer Liste zugeordnet ('+percentage+' %).':'Füge deinen ersten Wunsch hinzu, um deine Wunschwelt aufzubauen.';}
 const favoriteKey=id=>'helferlein-wishlist-favorites:'+id;
 function readFavorites(id){try{const raw=JSON.parse(localStorage.getItem(favoriteKey(id))||'[]');return new Set(Array.isArray(raw)?raw.filter(x=>typeof x==='string'):[])}catch{return new Set()}}
 function writeFavorites(id,listId){try{const raw=localStorage.getItem(favoriteKey(id));const parsed=raw===null?[]:JSON.parse(raw);if(!Array.isArray(parsed)||!parsed.every(x=>typeof x==='string'))throw Error('Ungültige Favoritendaten');const next=new Set(parsed);if(next.has(listId))next.delete(listId);else next.add(listId);localStorage.setItem(favoriteKey(id),JSON.stringify([...next]));return next}catch{msg('Favoriten konnten nicht gespeichert werden. Vorhandene Browserdaten wurden nicht überschrieben.');return null}}
 function focusListRegion(id){const node=$(id);node.tabIndex=-1;node.focus({preventScroll:true});node.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'})}
 function openList(id){if(activeWishMutations.size||listCopyBusy||listMutationBusy){msg('Bitte die laufende Wunsch- oder Listenänderung zuerst abschließen.');return}if(getUser()?.id!==loadedOwner||!membershipReady){msg('Bitte zuerst die Listen vollständig laden.');return}if(bulkBusy){msg('Die Sammelaktion läuft noch. Bitte zuerst stoppen oder abschließen.');return}if(!lists.some(l=>l.id===id&&!l.archived)){msg('Bitte eine aktive Liste auswählen.');return}bulkIds.clear();selectedOnlyView=false;lastBulkResult=null;$('bulkResultPanel').hidden=true;selected=id;visibleLimit=100;for(const [field,value] of [['listWishSearch',''],['listWishPriority','all'],['listWishCategory','all'],['listWishMarker','all'],['listWishAssignment','assigned'],['listWishSort','newest']])$(field).value=value;syncBulkMoveTargets();render();focusListRegion('activeListHeading')}
 function renderFavorites(){const target=$('homeFavoritesContent');target.replaceChildren();const favorites=lists.filter(l=>favoriteIds.has(l.id)&&!l.archived);if(!favorites.length){const p=document.createElement('p');p.textContent='Markiere deine Lieblingslisten mit ★, um sie hier schnell zu öffnen. Favoriten werden nur in diesem Browser gespeichert.';target.append(p);return}for(const list of favorites){const generation=loadGeneration,b=button(list.icon+' '+list.title,async()=>{if(!b.isConnected||generation!==loadGeneration||getUser()?.id!==loadedOwner||!membershipReady||listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!lists.some(l=>l.id===list.id&&!l.archived)||!favoriteIds.has(list.id))return;openList(list.id)});target.append(b)}}
 const editorSelect=$('wishListSelect');
 function syncEditor(){const previous=editorSelect.value;editorSelect.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='Ohne Liste speichern';editorSelect.append(empty);for(const list of lists.filter(x=>!x.archived)){const option=document.createElement('option');option.value=list.id;option.textContent=list.icon+' '+list.title;editorSelect.append(option)}editorSelect.value=lists.some(x=>x.id===previous&&!x.archived)?previous:(lists.find(x=>x.title==='Meine Wünsche'&&!x.archived)?.id||'');editorSelect.disabled=!lists.some(x=>!x.archived);}
 async function assignWish(wishId,listId,uid){if(!listId)return;if(getUser()?.id!==uid)throw Error('Sitzung hat sich geändert; Listenzuordnung nicht gestartet.');const {error}=await db.from('wishlist_list_items').insert({list_id:listId,wish_id:wishId,user_id:uid});if(getUser()?.id!==uid)throw Error('Sitzung hat sich während der Listenzuordnung geändert. Bitte Zuordnung im ursprünglichen Konto prüfen.');if(error&&error.code!=='23505')throw error;}
 function reset(){listEditBaseline=null;listEditGeneration=null;selectedOnlyView=false;setWishView(false);++loadGeneration;listEditReturnFocus=null;$('editListForm').hidden=true;$('editListId').value='';$('listTitle').value='';$('listDescription').value='';$('listTemplate').value='custom';$('listsSearch').value='';$('listsView').value='active';$('listsSort').value='favorites';$('editListTitle').value='';$('editListDescription').value='';$('editListCoverUrl').value='';for(const id of ['editListIcon','editListColor','editListVisibility'])$(id).selectedIndex=0;for(const id of ['listIcon','listColor','listVisibility'])$(id).selectedIndex=0;for(const id of ['listTitle','listDescription','listVisibility','editListTitle','editListDescription','editListVisibility','editListCoverUrl']){$(id).removeAttribute('aria-invalid');$(id).removeAttribute('aria-describedby')}$('listsStatus').textContent='';$('editListFeedback').textContent='';$('listsTotal').textContent='0';$('wishesTotal').textContent='0';loadedOwner=null;cloudWishExtras=new Map();lists=[];wishes=[];selected=null;favoriteIds=new Set();listCounts=new Map();assignedTotal=0;wishCategories={};wishMarkers={};detailWishId=null;detailCategoryBaseline='';if($('wishDetailDialog').open)$('wishDetailDialog').close();assignedIds=new Set();membershipByList=new Map();membershipReady=false;bulkIds.clear();allAssignedIds=new Set();bulkBusy=false;pendingBulk=null;lastBulkResult=null;bulkHistory=[];$('bulkResultPanel').hidden=true;$('bulkProgressPanel').hidden=true;$('bulkStop').disabled=true;$('bulkStatus').textContent='';$('bulkProgressText').textContent='';$('bulkProgressDetails').textContent='';$('bulkProgressBar').value=0;renderBulkHistory();bulkStopRequested=true;++bulkRunId;visibleLimit=100;$('bulkConfirmDialog').close();++itemsGeneration;root.hidden=true;$('listsContent').replaceChildren();$('listWishCards').replaceChildren();$('listWishCount').textContent='';$('homeFavoritesContent').replaceChildren();$('homeRecentContent').replaceChildren();renderProgress();syncEditor();}

 function invalidateMembershipState(){
  membershipReady=false;membershipByList=new Map();assignedIds=new Set();allAssignedIds=new Set();listCounts=new Map();assignedTotal=0;bulkIds.clear();pendingBulk=null;lastBulkResult=null;detailWishId=null;$('wishDetailDialog').close();
  $('bulkResultPanel').hidden=true;$('bulkConfirmDialog').close();$('bulkStatus').textContent='';$('bulkProgressText').textContent='';$('bulkProgressDetails').textContent='';$('bulkProgressBar').value=0;$('listWishCards').replaceChildren();$('listWishCount').textContent='';updateBulkToolbar([]);renderProgress();
 }
 const msg=t=>{$('listsStatus').textContent=t;if(!$('editListForm').hidden)$('editListFeedback').textContent=t};
 const invalidField=(field,message)=>{
  field.setAttribute('aria-invalid','true');
  const statusId=field.closest('#editListForm')?'editListFeedback':'listsStatus';
  field.setAttribute('aria-describedby',statusId);
  const disclosure=field.closest('details');
  if(disclosure){disclosure.dataset.mobileOpen='true';disclosure.open=true;}
  msg(message);field.focus();
 };
 for(const fieldId of ['listTitle','listDescription','listVisibility','editListTitle','editListDescription','editListVisibility','editListCoverUrl']){
  const field=$(fieldId);
  for(const type of ['input','change'])field.addEventListener(type,()=>{
   field.removeAttribute('aria-invalid');field.removeAttribute('aria-describedby');
  });
 }
 const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=async()=>{if(b.disabled)return;b.disabled=true;try{await fn()}catch(e){msg(e.message||'Aktion fehlgeschlagen')}finally{if(b.isConnected)b.disabled=false}};return b};
 const owner=()=>{const u=getUser();if(!u)throw Error('Bitte anmelden');return u.id};
 async function load({afterBulk=false}={}){
  if(!getUser()){reset();return}
  if(loadedOwner&&loadedOwner!==getUser()?.id)reset();
  if(listMutationBusy&&!afterBulk){msg('Eine Listenänderung läuft. Bitte den Abschluss abwarten.');return}
   if(listCopyBusy&&!afterBulk){msg('Eine Listen-Kopie wird gerade erstellt. Bitte den Abschluss abwarten.');return}
   if(bulkBusy&&!afterBulk){msg('Sammelaktion läuft. Bitte stoppen oder abschließen, bevor du Listen aktualisierst.');return}
  if(activeWishMutations.size&&!afterBulk){msg('Eine Wunschänderung läuft. Bitte anschließend aktualisieren.');return}
  const generation=++loadGeneration;cloudWishExtras=new Map();
  if($('wishDetailDialog').open)$('wishDetailDialog').close();detailWishId=null;detailCategoryBaseline='';
  invalidateMembershipState();$('wishLoadMore').hidden=true;root.hidden=false;$('listsContent').replaceChildren();$('listWishCards').replaceChildren();$('listWishCount').textContent='';setItemsFeedback('loading','Wunschlisten werden geladen …');msg('Listen werden geladen …');
  const id=owner();
  let lr,wr;
  try{({lists:lr,wishes:wr}=await fetchDashboardBase(db,id));
  }catch(e){if(!currentDashboardLoad({requestedUserId:id,currentUserId:getUser()?.id,requestedGeneration:generation,currentGeneration:loadGeneration}))return;setItemsFeedback('error','Listen oder Wünsche konnten nicht geladen werden. Bitte erneut versuchen.');throw e}
  if(!currentDashboardLoad({requestedUserId:id,currentUserId:getUser()?.id,requestedGeneration:generation,currentGeneration:loadGeneration}))return;
  if(lr.error){invalidateMembershipState();setItemsFeedback('error','Listen konnten nicht geladen werden. Das erforderliche Listen-Schema ist möglicherweise noch nicht aktiviert.');allAssignedIds=new Set();bulkIds.clear();renderUnassigned();listCounts=new Map();assignedTotal=0;renderProgress();$('listsTotal').textContent='0';$('wishesTotal').textContent='0';lists=[];wishes=[];syncEditor();$('listsContent').replaceChildren();msg('Listenverwaltung vorbereitet. Das Datenbankschema wurde noch nicht freigeschaltet.');return}
  if(wr.error){invalidateMembershipState();setItemsFeedback('error','Wünsche konnten nicht geladen werden. Bitte erneut versuchen.');throw wr.error}
  let allWishes;
  try{
   const additional=wr.data?.length===1000?await fetchAllPages((from,to)=>db.from('wishlist_wishes').select('id,note,priority,created_at,wishlist_products(title,asin,marketplace,image_url,price,description,scraped_at)').eq('user_id',id).order('created_at',{ascending:false}).order('id',{ascending:false}).range(from+1000,to+1000),{isCurrent:()=>getUser()?.id===id&&generation===loadGeneration}):[];
   if(additional===null)return;
   allWishes=[...(wr.data||[]),...additional];
  }catch(e){if(!currentDashboardLoad({requestedUserId:id,currentUserId:getUser()?.id,requestedGeneration:generation,currentGeneration:loadGeneration}))return;setItemsFeedback('error','Weitere Wünsche konnten nicht geladen werden. Bitte erneut versuchen.');throw e}

  if(loadedOwner!==id){selected=null;bulkIds.clear();bulkHistory=[];renderBulkHistory();lastBulkResult=null;$('bulkResultPanel').hidden=true;visibleLimit=100;favoriteIds=readFavorites(id);wishCategories=readCategories(id);wishMarkers=readMarkers(id)}loadedOwner=id;lists=lr.data||[];wishes=allWishes;favoriteIds=new Set([...favoriteIds].filter(x=>lists.some(l=>l.id===x)));syncEditor();if(!lists.some(x=>x.id===selected&&!x.archived)){selected=lists.find(x=>!x.archived)?.id||null;lastBulkResult=null;$('bulkResultPanel').hidden=true;}
  let membershipRows;
  try{membershipRows=await fetchDashboardMembership(db,id,{isCurrent:()=>getUser()?.id===id&&generation===loadGeneration})}
  catch(e){if(!currentDashboardLoad({requestedUserId:id,currentUserId:getUser()?.id,requestedGeneration:generation,currentGeneration:loadGeneration}))return;invalidateMembershipState();setItemsFeedback('error','Listenzuordnungen konnten nicht vollständig geladen werden. Bitte erneut versuchen.');throw e}
  if(membershipRows===null||!currentDashboardLoad({requestedUserId:id,currentUserId:getUser()?.id,requestedGeneration:generation,currentGeneration:loadGeneration}))return;
  membershipByList=new Map();const validWishIds=new Set(wishes.map(w=>w.id)),validListIds=new Set(lists.map(l=>l.id));for(const item of membershipRows){if(!validListIds.has(item.list_id)||!validWishIds.has(item.wish_id))continue;if(!membershipByList.has(item.list_id))membershipByList.set(item.list_id,new Set());membershipByList.get(item.list_id).add(item.wish_id)}membershipReady=true;listCounts=new Map();const unique=new Set();for(const [listId,ids] of membershipByList){listCounts.set(listId,ids.size);for(const wishId of ids)unique.add(wishId)}assignedTotal=unique.size;allAssignedIds=unique;renderUnassigned();renderProgress();renderRecent();setItemsFeedback('ready','');msg(lists.length+' Listen · '+wishes.length+' geladene Wünsche');$('listsTotal').textContent=String(lists.length);$('wishesTotal').textContent=String(wishes.length);render();
  void loadPrivateWishExtras(id,generation);
 }
 function render(){
  syncBulkMoveTargets();syncListQuickSwitch();
  const grid=$('listsContent');grid.replaceChildren();renderFavorites();renderRecent();renderProgress();
  const term=$('listsSearch').value.trim().toLocaleLowerCase('de'),view=$('listsView').value,sort=$('listsSort').value;
  const visible=lists.filter(l=>(view==='all'||(view==='active'&&!l.archived)||(view==='archived'&&l.archived)||(view==='favorites'&&favoriteIds.has(l.id)))&&(!term||(l.title+' '+l.description).toLocaleLowerCase('de').includes(term))).sort((a,b)=>sort==='name'?a.title.localeCompare(b.title,'de'):sort==='newest'?b.created_at.localeCompare(a.created_at):sort==='most'?(listCounts.get(b.id)||0)-(listCounts.get(a.id)||0):sort==='least'?(listCounts.get(a.id)||0)-(listCounts.get(b.id)||0):(Number(favoriteIds.has(b.id))-Number(favoriteIds.has(a.id)))||b.created_at.localeCompare(a.created_at));
  $('listsViewCount').textContent=visible.length+' von '+lists.length+' Listen angezeigt.';$('listsResetFilters').hidden=!term&&view==='all'&&sort==='favorites';
  if(lists.length&&!visible.length){const p=document.createElement('p');p.textContent='Keine Listen für diese Auswahl. Ändere die Filter.';grid.append(p);grid.append(button('Listenfilter zurücksetzen',async()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner)return;$('listsSearch').value='';$('listsView').value='active';$('listsSort').value='favorites';render();$('listsSearch').focus({preventScroll:true})}))}
  if(!lists.length){const p=document.createElement('p');p.textContent='Noch keine Listen. Erstelle deine erste Wunschliste.';grid.append(p)}
  for(const list of visible){
   const cardGeneration=loadGeneration;
   const card=document.createElement('article');card.className='list-card'+(selected===list.id?' is-selected':'');card.dataset.listId=list.id;card.style.borderTop='6px solid '+list.color;
   const cover=document.createElement('div');cover.className='list-card-cover';cover.style.background='linear-gradient(120deg,'+list.color+'33,'+list.color+'77)';cover.textContent=list.icon;card.append(cover);
   const heading=document.createElement('h3');heading.textContent=list.title;card.append(heading);
   const desc=document.createElement('p');desc.textContent=list.description||'Deine persönliche Wunschsammlung';card.append(desc);
   const meta=document.createElement('p');meta.className='list-card-meta';meta.textContent=(list.visibility==='public'?'🌍 Öffentlich teilbar':'Privat')+(list.archived?' · Archiviert':'');card.append(meta);
   const count=listCounts.get(list.id)||0;card.setAttribute('aria-label',list.title+', '+count+' Wünsche'+(list.archived?', archiviert':''));const countLabel=document.createElement('p');countLabel.className='list-card-count';countLabel.textContent=count+' Wünsche in dieser Liste';card.append(countLabel);
   const progress=document.createElement('div');progress.className='list-card-progress';progress.setAttribute('role','progressbar');progress.setAttribute('aria-label','Wünsche in dieser Liste, Anteil an geladenen Wünschen');progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax','100');const percent=wishes.length?Math.min(100,Math.round(count/wishes.length*100)):0;progress.setAttribute('aria-valuenow',String(percent));const fill=document.createElement('span');fill.style.width=percent+'%';progress.append(fill);card.append(progress);
   const fav=button(favoriteIds.has(list.id)?'★ Favorit':'☆ Merken',async()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!fav.isConnected||!membershipReady||cardGeneration!==loadGeneration||getUser()?.id!==loadedOwner||!lists.some(l=>l.id===list.id))return;const uid=owner(),nextFavorites=writeFavorites(uid,list.id);if(!nextFavorites)return;favoriteIds=nextFavorites;render();const refreshed=[...grid.children].find(node=>node.dataset.listId===list.id);const next=refreshed?.querySelector('.favorite-toggle')||$('listsView');next.focus({preventScroll:true})});fav.className='favorite-toggle';fav.setAttribute('aria-pressed',String(favoriteIds.has(list.id)));fav.setAttribute('aria-label',(favoriteIds.has(list.id)?'Favorit entfernen: ':'Als Favorit markieren: ')+list.title);card.append(fav);
   const actions=document.createElement('div');actions.className='list-card-actions';card.append(actions);
   actions.append(button(list.archived?'Archiviert – reaktivieren':'Öffnen',async()=>{if(!card.isConnected||cardGeneration!==loadGeneration||getUser()?.id!==loadedOwner||!membershipReady||listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!lists.some(l=>l.id===list.id&&!l.archived))return msg('Bitte die aktuelle Listenkarte verwenden.');if(list.archived)return msg('Bitte die Liste zuerst reaktivieren.');openList(list.id)}));
   if(list.visibility==='public'&&!list.archived){
    const openPublic=button('🌍 Öffentliche Seite',()=>{
     if(!card.isConnected||cardGeneration!==loadGeneration||getUser()?.id!==loadedOwner)return;
     window.open(new URL('./collection.html?id='+encodeURIComponent(list.id),location.href).href,'_blank','noopener,noreferrer');
    });actions.append(openPublic);
    const copyPublic=button('🔗 Link kopieren',async()=>{
     if(!card.isConnected||cardGeneration!==loadGeneration||getUser()?.id!==loadedOwner)return;
     const url=new URL('./collection.html?id='+encodeURIComponent(list.id),location.href).href;
     try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url);msg('Öffentlicher Sammlungslink kopiert.')}else if(navigator.share){await navigator.share({title:list.title,url})}else msg('Link: '+url)}catch(error){if(error?.name!=='AbortError')msg('Link konnte nicht kopiert werden.')}
    });copyPublic.className='collection-share-action';actions.append(copyPublic);
   }
   // Sharing exports a static text snapshot only; it never makes a private list public.
   const shareCollection=button('↗ Sammlung teilen',async()=>{
    if(!card.isConnected||cardGeneration!==loadGeneration||getUser()?.id!==loadedOwner||!membershipReady||listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size)return msg('Bitte zuerst die aktuelle Sammlung vollständig laden.');
    const assigned=membershipByList.get(list.id)||new Set();
    const entries=wishes.filter(w=>assigned.has(w.id));
    if(!entries.length)return msg('Füge zuerst Wünsche zu dieser Sammlung hinzu.');
    const promptText='Eine Textkopie dieser Sammlung mit Produkttiteln und Amazon-Produktlinks wird zum Teilen vorbereitet. Auch bei privaten Listen können Empfänger die kopierten Informationen lesen. Fortfahren?';
    if(!window.confirm(promptText))return;
    const lines=[list.icon+' '+list.title,list.description||'', '',...entries.map((wish,index)=>{
     const asin=wish.wishlist_products?.asin;
     const title=wish.wishlist_products?.title||'Wunsch';
     return (index+1)+'. '+title+(asin?'\nhttps://www.amazon.de/dp/'+encodeURIComponent(asin):'');
    }), '', 'Geteilt als Textkopie aus Toolya Wishes. Preise und Verfügbarkeit nicht geprüft.'];
    const snapshot=lines.join('\n');
    try{
     if(navigator.share)await navigator.share({title:list.title,text:snapshot});
     else if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(snapshot);msg('Sammlung als Text kopiert. Du kannst sie jetzt teilen.')}
     else msg('Automatisches Teilen nicht verfügbar. Nutze einen Browser mit sicherer Zwischenablage.');
    }catch(error){if(error?.name!=='AbortError')msg('Sammlung konnte nicht geteilt werden.')}
   });
   shareCollection.className='collection-share-action';actions.append(shareCollection);
   if(!list.archived&&count>0)actions.append(button('Zugeordnete Wünsche',async()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!card.isConnected||!membershipReady||getUser()?.id!==loadedOwner||cardGeneration!==loadGeneration)return;openList(list.id);if(selected!==list.id)return;$('listWishAssignment').value='assigned';selectedOnlyView=false;renderWishCards()}));
   actions.append(button('Gestalten',async()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!card.isConnected||!membershipReady||cardGeneration!==loadGeneration)return msg('Bitte zuerst laufende Änderungen abschließen und die aktuelle Listenkarte verwenden.');if(list.archived)return msg('Archivierte Liste zuerst reaktivieren.');if(getUser()?.id!==loadedOwner)return;openEditor(list)}));
   actions.append(button(list.archived?'Reaktivieren':'Archivieren',async()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner||cardGeneration!==loadGeneration)return msg('Bitte die aktuelle Listenkarte verwenden und laufende Änderungen abschließen.');const beforeConfirm=loadGeneration;if(!list.archived&&!window.confirm('Liste „'+list.title+'“ archivieren? Die Wünsche bleiben erhalten.'))return;if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||beforeConfirm!==loadGeneration||getUser()?.id!==loadedOwner||!lists.some(l=>l.id===list.id&&l.archived===list.archived))return;const uid=owner(),generation=loadGeneration;listMutationBusy=true;try{if(getUser()?.id===uid&&membershipReady)renderWishCards();const res=await db.from('wishlist_lists').update({archived:!list.archived}).eq('id',list.id).eq('user_id',uid).eq('archived',list.archived).select('id');if(getUser()?.id!==uid||loadedOwner!==uid)return;if(res.error)throw res.error;if(!res.data?.length){msg('Archivstatus wurde zwischenzeitlich geändert oder Liste entfernt. Bitte neu laden.');return;}try{await load({afterBulk:true})}catch(e){if(getUser()?.id===uid&&loadedOwner===uid)msg('Archivstatus gespeichert, aber Aktualisierung fehlgeschlagen. Bitte neu laden.')}}catch(e){if(getUser()?.id===uid&&loadedOwner===uid)msg('Archivstatus konnte nicht geändert werden: '+(e.message||'Unbekannter Fehler'))}finally{listMutationBusy=false;if(getUser()?.id===uid&&loadedOwner===uid&&membershipReady)renderWishCards()}}));
actions.append(button('Duplizieren',async()=>{
    if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner||cardGeneration!==loadGeneration)return msg('Bitte die aktuelle Listenkarte verwenden und laufende Änderungen abschließen.');
    const uid=owner(),generation=loadGeneration,originalIds=[...(membershipByList.get(list.id)||new Set())];
    if(!window.confirm('Liste „'+list.title+'“ mit '+originalIds.length+' Zuordnungen duplizieren? Die Wünsche selbst werden nicht kopiert.'))return;
    if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==uid||loadedOwner!==uid||generation!==loadGeneration||!lists.some(l=>l.id===list.id&&l.archived===list.archived)||originalIds.length!==(membershipByList.get(list.id)?.size||0)||originalIds.some(id=>!membershipByList.get(list.id)?.has(id)))return;
    listCopyBusy=true;
    const current=()=>getUser()?.id===uid&&loadedOwner===uid&&generation===loadGeneration;
    let copied=0,created=false;
    const reportInterruptedCopy=async()=>{if(getUser()?.id!==uid||loadedOwner!==uid)return;try{await load({afterBulk:true})}catch{}if(getUser()?.id===uid&&loadedOwner===uid)msg('Listen-Kopie angelegt, aber nur '+copied+' von '+originalIds.length+' Zuordnungen übernommen. Bitte Kopie prüfen.');};
    try{
     if(getUser()?.id===uid&&membershipReady){detailWishId=null;$('wishDetailDialog').close();renderWishCards();msg('Listen-Kopie wird vorbereitet: '+originalIds.length+' Zuordnungen. Bitte warten.')}
     const {data:copy,error}=await db.from('wishlist_lists').insert({user_id:uid,title:(list.title+' Kopie').slice(0,80),description:list.description,icon:list.icon,color:list.color,visibility:'private'}).select('id').single();
     if(error)throw error;
     created=true;
     if(!current()){await reportInterruptedCopy();return;}
     for(let i=0;i<originalIds.length;i+=100){
      if(!current()){await reportInterruptedCopy();return;}
      const batch=originalIds.slice(i,i+100).map(wish_id=>({list_id:copy.id,wish_id,user_id:uid}));
      const {error:copyError}=await db.from('wishlist_list_items').insert(batch);
      if(copyError)throw copyError;
      copied+=batch.length;
      if(current())msg('Listen-Kopie: '+copied+' von '+originalIds.length+' Zuordnungen übernommen …');
     }
     if(!current()){await reportInterruptedCopy();return;}
     try{await load({afterBulk:true})}catch(e){if(getUser()?.id===uid&&loadedOwner===uid)msg('Liste mit '+copied+' Zuordnungen dupliziert, aber Aktualisierung fehlgeschlagen. Bitte neu laden.');return}
     if(getUser()?.id===uid&&loadedOwner===uid)msg('Liste mit '+copied+' Zuordnungen dupliziert.');
    }catch(e){
     if(getUser()?.id!==uid||loadedOwner!==uid)return;
     if(current())try{await load({afterBulk:true})}catch{}
     if(getUser()?.id===uid&&loadedOwner===uid)msg(created?'Kopie angelegt, aber nur '+copied+' von '+originalIds.length+' Zuordnungen übernommen: '+(e.message||'Fehler')+'. Bitte Kopie prüfen.':'Liste konnte nicht dupliziert werden: '+(e.message||'Fehler'));
    }finally{listCopyBusy=false;if(getUser()?.id===uid&&loadedOwner===uid&&membershipReady)renderWishCards()}
   }));
   actions.append(button('Löschen',async()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner||cardGeneration!==loadGeneration)return msg('Bitte die aktuelle Listenkarte verwenden und laufende Änderungen abschließen.');const beforeConfirm=loadGeneration;if(!confirm('Liste „'+list.title+'“ löschen? Die Wünsche selbst bleiben erhalten.'))return;if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||beforeConfirm!==loadGeneration||getUser()?.id!==loadedOwner||!lists.some(l=>l.id===list.id&&l.archived===list.archived))return;const uid=owner(),generation=loadGeneration;listMutationBusy=true;try{if(getUser()?.id===uid&&membershipReady)renderWishCards();const {error,data}=await db.from('wishlist_lists').delete().eq('id',list.id).eq('user_id',uid).select('id');if(getUser()?.id!==uid||loadedOwner!==uid)return;if(error)throw error;if(!data?.length){msg('Liste wurde möglicherweise bereits in einem anderen Tab gelöscht. Bitte Listen neu laden.');try{await load({afterBulk:true})}catch{}return;}try{await load({afterBulk:true})}catch(e){if(getUser()?.id===uid&&loadedOwner===uid)msg('Liste gelöscht, aber Aktualisierung fehlgeschlagen. Bitte neu laden.')}}catch(e){if(getUser()?.id===uid&&loadedOwner===uid)msg('Liste konnte nicht gelöscht werden: '+(e.message||'Unbekannter Fehler'))}finally{listMutationBusy=false;if(getUser()?.id===uid&&loadedOwner===uid&&membershipReady)renderWishCards()}}));
   grid.append(card);
  }
  try{showItems()}catch(e){setItemsFeedback('error','Listenzuordnungen konnten nicht angezeigt werden.');msg(e.message||'Anzeigefehler')}
 }
 function renderUnassigned(){const n=Math.max(0,wishes.length-allAssignedIds.size);$('unassignedCount').textContent=String(n);$('showUnassigned').disabled=!n||listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size>0||!membershipReady||getUser()?.id!==loadedOwner}
 let selectedOnlyView=false,activeWishMutations=new Set(),listCopyBusy=false,listMutationBusy=false;
 function visibleWishes(){const globallyUnassigned=$('listWishAssignment').value==='global-unassigned';return filterListWishes((globallyUnassigned?wishes.filter(w=>!allAssignedIds.has(w.id)):wishes),{search:$('listWishSearch').value,priority:$('listWishPriority').value,assignment:globallyUnassigned?'all':$('listWishAssignment').value,assignedIds,sort:$('listWishSort').value,category:$('listWishCategory').value,categories:wishCategories,marker:$('listWishMarker').value,markers:wishMarkers})}
 function syncBulkMoveTargets(){}
 function updateBulkToolbar(){syncListQuickSwitch()}
 function renderBulkHistory(){}
 function showBulkResult(){}
 // Bulk operations removed; individual wish assignment and movement remain.
  async function moveWishToList(wishId,sourceListId,targetListId,control){
  if(listMutationBusy||listCopyBusy||bulkBusy||!membershipReady||!getUser()||getUser()?.id!==loadedOwner||sourceListId===targetListId||activeWishMutations.size)return;
  const uid=owner(),generation=loadGeneration;
  const source=lists.find(l=>l.id===sourceListId&&!l.archived);
  const target=lists.find(l=>l.id===targetListId&&!l.archived);
  if(!source||!target||selected!==sourceListId||!assignedIds.has(wishId))return msg('Bitte einen zugeordneten Wunsch aus einer aktiven Liste auswählen.');
  if(!window.confirm('Wunsch von „'+source.title+'“ nach „'+target.title+'“ verschieben? Der Wunsch bleibt bestehen; die Änderung erfolgt in zwei Schritten.'))return;if(listMutationBusy||listCopyBusy||bulkBusy||!membershipReady||activeWishMutations.size||selected!==sourceListId||getUser()?.id!==uid||loadedOwner!==uid||generation!==loadGeneration||!assignedIds.has(wishId)||!lists.some(l=>l.id===sourceListId&&!l.archived)||!lists.some(l=>l.id===targetListId&&!l.archived)||!wishes.some(w=>w.id===wishId))return;
  const current=()=>getUser()?.id===uid&&loadedOwner===uid&&generation===loadGeneration&&selected===sourceListId;
  let writeStarted=false;
  const hadFocus=document.activeElement===control;activeWishMutations.add(uid+':'+wishId);control.disabled=true;
  try{
   const targetMembership=await db.from('wishlist_list_items').select('wish_id').eq('list_id',targetListId).eq('wish_id',wishId).eq('user_id',uid).limit(1);
   if(targetMembership.error)throw targetMembership.error;
   if(!current())return;
   const alreadyThere=!!targetMembership.data?.length;
   if(!alreadyThere){
    writeStarted=true;
    const {error}=await db.from('wishlist_list_items').insert({list_id:targetListId,wish_id:wishId,user_id:uid});
    if(error&&error.code!=='23505')throw error;
   }
   if(!current()){if(getUser()?.id===uid&&loadedOwner===uid&&selected===sourceListId&&generation===loadGeneration)msg('Zielzuordnung nach Kontextwechsel nicht eindeutig bestätigt. Bitte beide Listen neu laden und prüfen.');return}
   const confirmedTarget=await db.from('wishlist_list_items').select('wish_id').eq('list_id',targetListId).eq('wish_id',wishId).eq('user_id',uid).limit(1);
   if(!current())return;
   if(confirmedTarget.error)throw confirmedTarget.error;
   if(!confirmedTarget.data?.length){const warning='Zielzuordnung wurde während des Verschiebens entfernt. Diese Aktion hat die Ursprungszuordnung nicht gelöscht; andere Tabs können sie verändert haben. Bitte beide Listen prüfen.';const refresh=load({afterBulk:true}),refreshGeneration=loadGeneration;try{await refresh}catch{}if(getUser()?.id===uid&&loadedOwner===uid&&selected===sourceListId&&refreshGeneration===loadGeneration)msg(warning);return}
   writeStarted=true;
   const {error,data:removedSource}=await db.from('wishlist_list_items').delete().eq('list_id',sourceListId).eq('wish_id',wishId).eq('user_id',uid).select('wish_id');
   if(!current())return;
   if(!error&&!removedSource?.length){const warning='Die Ursprungszuordnung wurde bereits in einem anderen Tab entfernt. Bitte beide Listen neu laden und prüfen.';const refresh=load({afterBulk:true}),refreshGeneration=loadGeneration;try{await refresh}catch{}if(getUser()?.id===uid&&loadedOwner===uid&&selected===sourceListId&&refreshGeneration===loadGeneration)msg(warning);return}
   if(error){const warning=(alreadyThere?'Wunsch war bereits in der Zielliste, konnte aber nicht aus der Ursprungsliste entfernt werden: ':'Wunsch wurde zur Zielliste hinzugefügt, konnte aber nicht aus der Ursprungsliste entfernt werden: ')+error.message+'. Bitte beide Listen prüfen.';if(current()){const refresh=load({afterBulk:true}),refreshGeneration=loadGeneration;try{await refresh}catch{}if(getUser()?.id===uid&&loadedOwner===uid&&selected===sourceListId&&refreshGeneration===loadGeneration)msg(warning)}return}
   const finalTarget=await db.from('wishlist_list_items').select('wish_id').eq('list_id',targetListId).eq('wish_id',wishId).eq('user_id',uid).limit(1);
   if(!current())return;
   if(finalTarget.error||!finalTarget.data?.length){const warning='Ursprungszuordnung entfernt, aber Zielzuordnung konnte anschließend nicht bestätigt werden. Bitte beide Listen prüfen.';const refresh=load({afterBulk:true}),refreshGeneration=loadGeneration;try{await refresh}catch{}if(getUser()?.id===uid&&loadedOwner===uid&&selected===sourceListId&&refreshGeneration===loadGeneration)msg(warning);return}
   const refresh=load({afterBulk:true}),refreshGeneration=loadGeneration;
   try{await refresh}catch(e){if(getUser()?.id===uid&&loadedOwner===uid&&selected===sourceListId&&refreshGeneration===loadGeneration)msg('Wunsch verschoben, aber Listen konnten nicht neu geladen werden: '+(e.message||'Ladefehler')+'. Bitte aktualisieren.');return}
   if(getUser()?.id===uid&&loadedOwner===uid&&selected===sourceListId&&refreshGeneration===loadGeneration&&membershipReady)msg('Wunsch nach „'+target.title+'“ verschoben. Die Ausgangsliste bleibt geöffnet.')
  }catch(e){if(current()){const failure=moveFailureState({writeStarted,contextValid:current()});const warning='Verschieben fehlgeschlagen'+(failure.uncertain?' nach gestarteter Schreiboperation; Zuordnungsstand unklar':'')+': '+(e.message||'Unbekannter Fehler')+'. Bitte beide Listen prüfen.';if(writeStarted){const refresh=load({afterBulk:true}),refreshGeneration=loadGeneration;try{await refresh}catch{}if(getUser()?.id===uid&&loadedOwner===uid&&selected===sourceListId&&refreshGeneration===loadGeneration)msg(warning)}else if(current())msg(warning)}}
  finally{activeWishMutations.delete(uid+':'+wishId);if(getUser()?.id===uid&&loadedOwner===uid&&selected===sourceListId&&membershipReady&&!bulkBusy){const restoreFocus=hadFocus&&(!document.activeElement||document.activeElement===document.body);if(control.isConnected)control.disabled=false;renderWishCards();if(restoreFocus){const card=[...$('listWishCards').children].find(el=>el.dataset.wishId===String(wishId));const destination=card?.querySelector('.wish-move-actions select');(destination||$('listWishSearch')).focus({preventScroll:true})}}}
 }
 let compactWishView=false;
 function setWishView(compact){compactWishView=compact;$('wishViewCards').setAttribute('aria-pressed',String(!compact));$('wishViewCompact').setAttribute('aria-pressed',String(compact));$('listWishCards').classList.toggle('is-compact',compact)}
 async function loadPrivateWishExtras(ownerId,generation){
  const ids=wishes.map(w=>w.id);
  if(!ids.length)return;
  const own=new Map();
  // Keep the request owner-scoped and below PostgREST's typical 1000-row limit.
  try{
   for(let start=0;start<ids.length;start+=500){
    if(generation!==loadGeneration||getUser()?.id!==ownerId||loadedOwner!==ownerId)return;
    const batch=ids.slice(start,start+500);
    const result=await db.from('wishlist_wish_extras').select('wish_id,image_url,target_price,quantity,wish_status').eq('user_id',ownerId).in('wish_id',batch);
    if(generation!==loadGeneration||getUser()?.id!==ownerId||loadedOwner!==ownerId)return;
    if(result.error)return; // Existing device-local values remain available.
    for(const item of result.data||[])if(batch.some(id=>String(id)===String(item.wish_id)))own.set(String(item.wish_id),{imageUrl:item.image_url||'',price:item.target_price,quantity:item.quantity,status:item.wish_status});
   }
   if(generation!==loadGeneration||getUser()?.id!==ownerId||loadedOwner!==ownerId)return;
   cloudWishExtras=own;
   if(membershipReady)renderWishCards();
  }catch{/* Cloud is optional; keep the existing local rendering. */}
 }
 function renderWishCards(){
  updateActiveListContext();
  const cards=$('listWishCards');cards.replaceChildren();
  const list=lists.find(l=>l.id===selected&&!l.archived);
  const filtersLocked=!list||!membershipReady||getUser()?.id!==loadedOwner||listCopyBusy||listMutationBusy||bulkBusy||activeWishMutations.size>0;
  for(const id of ['listWishSearch','listWishPriority','listWishCategory','listWishMarker','listWishAssignment','listWishSort'])$(id).disabled=filtersLocked;
  for(const id of ['listsSearch','listsView','listsSort'])$(id).disabled=listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size>0||!membershipReady||getUser()?.id!==loadedOwner;
  $('listsResetFilters').disabled=listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size>0||!membershipReady||getUser()?.id!==loadedOwner;
  if(!list||!membershipReady||getUser()?.id!==loadedOwner){$('wishLoadMore').hidden=true;renderUnassigned();for(const id of ['wishShowAssigned','wishLoadMore','listItemsNewWish'])$(id).disabled=true;updateBulkToolbar([]);return}
  $('wishShowAssigned').disabled=listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size>0||!membershipReady;
  $('wishShowAssigned').setAttribute('aria-pressed',String($('listWishAssignment').value==='assigned'));
  $('listWishCount').textContent=Math.min(results.length,visibleLimit)+' von '+results.length+' passenden Wünschen sichtbar ('+wishes.length+' geladen).';$('wishLoadMore').hidden=results.length<=visibleLimit;$('wishLoadMore').disabled=listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size>0||results.length<=visibleLimit;
  if(!results.length){const empty=document.createElement('p');empty.textContent=$('listWishAssignment').value==='global-unassigned'&&allAssignedIds.size===wishes.length?'Alle Wünsche sind bereits mindestens einer Liste zugeordnet.':'Keine passenden Wünsche gefunden. Passe deine Filter an oder füge einen Wunsch hinzu.';cards.append(empty);
   const resetFilters=button('Filter zurücksetzen',async()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner||!lists.some(l=>l.id===selected&&!l.archived))return;selectedOnlyView=false;$('listWishSearch').value='';$('listWishPriority').value='all';$('listWishCategory').value='all';$('listWishMarker').value='all';$('listWishAssignment').value='all';$('listWishSort').value='newest';visibleLimit=100;renderWishCards();$('listWishSearch').focus({preventScroll:true})});resetFilters.setAttribute('aria-label','Wunschfilter zurücksetzen');cards.append(resetFilters)}
  const membershipCounts=new Map();for(const ids of membershipByList.values())for(const id of ids)membershipCounts.set(id,(membershipCounts.get(id)||0)+1);
  for(const wish of results.slice(0,visibleLimit)){
   const cardGeneration=loadGeneration;
   const card=document.createElement('article');card.className='list-wish-card';card.dataset.wishId=wish.id;
   const title=document.createElement('h4');title.textContent=wish.wishlist_products?.title||'Wunsch';
   const priority=document.createElement('p');priority.className='wish-priority';priority.textContent=['','Sehr wichtig','Normal','Irgendwann'][wish.priority]||'Priorität '+wish.priority;
   card.append(title,priority);appendProductMetadata(card,wish.wishlist_products);
   // Optional device-local product details, scoped to the signed-in owner.
   try{
    const owner=getUser()?.id;
    if(owner&&owner===loadedOwner){
     const local=JSON.parse(localStorage.getItem('helferlein-wish-extras:'+owner)||'{}')?.[wish.id];
     const extras=local&&typeof local==='object'&&Object.keys(local).length?local:cloudWishExtras.get(String(wish.id));
     if(extras&&typeof extras==='object'){
      if(!wish.wishlist_products?.image_url&&typeof extras.imageUrl==='string'&&extras.imageUrl.startsWith('https://')){
       const image=document.createElement('img');image.className='wish-product-image';image.src=extras.imageUrl;image.alt='Produktbild';image.loading='lazy';image.referrerPolicy='no-referrer';card.append(image);
      }
      const tags=document.createElement('div');tags.className='wish-product-extras';
      const values=[];
      if(extras.price!==null&&extras.price!==undefined&&extras.price!==''&&Number.isFinite(Number(extras.price))&&Number(extras.price)>=0)values.push('🎯 '+new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(extras.price)));
      if(Number.isInteger(extras.quantity)&&extras.quantity>1)values.push('× '+extras.quantity);
      if(extras.status==='planned')values.push('📌 Geplant');
      if(extras.status==='fulfilled')values.push('✓ Erfüllt');
      for(const value of values){const badge=document.createElement('span');badge.textContent=value;tags.append(badge)}
      if(tags.childElementCount)card.append(tags);
     }
    }
   }catch(_){}
   const membershipCount=membershipCounts.get(wish.id)||0;const membershipInfo=document.createElement('small');membershipInfo.className='wish-membership-count';membershipInfo.textContent=membershipCount+' '+(membershipCount===1?'Liste':'Listen');card.append(membershipInfo);const category=WISH_CATEGORIES.find(c=>c.id===wishCategories[wish.id]);if(category){const chip=document.createElement('span');chip.className='wish-category-chip';chip.textContent=category.label;card.append(chip)}
   const markers=document.createElement('div');markers.className='wish-marker-actions';for(const [marker,off,on] of [['star','☆ Merken','★ Favorit']]){const active=wishMarkers[wish.id]===marker;const control=button(active?on:off,async()=>{if(listMutationBusy||listCopyBusy||activeWishMutations.size||!control.isConnected||cardGeneration!==loadGeneration||getUser()?.id!==loadedOwner||selected!==list.id)return msg('Bitte die aktuelle Wunschkarte verwenden.');setMarker(wish.id,marker)});control.disabled=listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size>0;control.dataset.wishMarker=marker;control.setAttribute('aria-pressed',String(active));control.setAttribute('aria-label',(active?'Markierung entfernen: ':'Wunsch markieren: ')+(wish.wishlist_products?.title||'Wunsch'));markers.append(control)}card.append(markers);
   if(wish.note){const note=document.createElement('p');note.className='wish-card-note';note.textContent=wish.note;card.append(note);
    if(wish.note.length>180){note.classList.add('is-collapsed');const toggle=button('Notiz vollständig anzeigen',async()=>{if(!toggle.isConnected||cardGeneration!==loadGeneration||getUser()?.id!==loadedOwner||selected!==list.id||!membershipReady)return;const collapsed=note.classList.toggle('is-collapsed');toggle.textContent=collapsed?'Notiz vollständig anzeigen':'Notiz einklappen';toggle.setAttribute('aria-label',(collapsed?'Notiz anzeigen: ':'Notiz einklappen: ')+(wish.wishlist_products?.title||'Wunsch'));toggle.setAttribute('aria-expanded',String(!collapsed))});toggle.className='wish-note-toggle';toggle.setAttribute('aria-label','Notiz anzeigen: '+(wish.wishlist_products?.title||'Wunsch'));toggle.setAttribute('aria-expanded','false');card.append(toggle)}
   }
   const row=document.createElement('label');const check=document.createElement('input');check.type='checkbox';check.setAttribute('aria-label','In dieser Liste: '+(wish.wishlist_products?.title||'Wunsch'));check.checked=assignedIds.has(wish.id);check.disabled=listMutationBusy||listCopyBusy||activeWishMutations.size>0||!(membershipReady&&!bulkBusy)||list.archived;
   const caption=document.createElement('span');caption.textContent='In dieser Liste';
   check.onchange=async()=>{if(listMutationBusy||listCopyBusy||!check.isConnected||cardGeneration!==loadGeneration||getUser()?.id!==loadedOwner||selected!==list.id||!wishes.some(w=>w.id===wish.id)||!(membershipReady&&!bulkBusy)||list.archived||activeWishMutations.size){check.checked=assignedIds.has(wish.id);return}const hadFocus=document.activeElement===check;activeWishMutations.add(owner()+':'+wish.id);check.disabled=true;const uid=owner(),generation=loadGeneration,wanted=check.checked;try{
    const query=wanted?db.from('wishlist_list_items').insert({list_id:list.id,wish_id:wish.id,user_id:uid}):db.from('wishlist_list_items').delete().eq('list_id',list.id).eq('wish_id',wish.id).eq('user_id',uid);
    const {error}=await query;if(error)throw error;if(getUser()?.id!==uid||loadedOwner!==uid||selected!==list.id||generation!==loadGeneration)return;
    if(wanted){assignedIds.add(wish.id);membershipByList.get(list.id)?.add(wish.id)}else{assignedIds.delete(wish.id);membershipByList.get(list.id)?.delete(wish.id)}
    try{await load({afterBulk:true})}catch(e){if(getUser()?.id===uid&&loadedOwner===uid&&selected===list.id)msg('Wunschzuordnung gespeichert, aber Listen konnten nicht neu geladen werden. Bitte aktualisieren.');return}if(getUser()?.id===uid&&loadedOwner===uid&&selected===list.id)msg('Wunschzuordnung gespeichert');
   }catch(e){if(getUser()?.id===uid&&loadedOwner===uid&&selected===list.id&&generation===loadGeneration){check.checked=assignedIds.has(wish.id);msg(e.message||'Zuordnung fehlgeschlagen')}}finally{activeWishMutations.delete(uid+':'+wish.id);if(getUser()?.id===uid&&loadedOwner===uid&&selected===list.id&&membershipReady&&!bulkBusy){const restoreFocus=hadFocus&&(!document.activeElement||document.activeElement===document.body);renderWishCards();if(restoreFocus){const replacement=[...$('listWishCards').querySelectorAll('input[type="checkbox"]')].find(el=>el.dataset.wishAssignmentId===String(wish.id));(replacement||$('listWishSearch')).focus({preventScroll:true})}}else if(check.isConnected&&getUser()?.id===uid&&loadedOwner===uid&&selected===list.id&&generation===loadGeneration)check.disabled=false}};
   check.dataset.wishAssignmentId=String(wish.id);row.append(check,caption);card.append(row);
   if(assignedIds.has(wish.id)&&!list.archived){
    const destinations=lists.filter(l=>!l.archived&&l.id!==list.id);
    if(destinations.length){
     const moveRow=document.createElement('div');moveRow.className='wish-move-actions';
     const destination=document.createElement('select');destination.setAttribute('aria-label','Zielliste für '+(wish.wishlist_products?.title||'Wunsch'));
     const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Zielliste wählen';destination.append(placeholder);
     for(const target of destinations){const option=document.createElement('option');option.value=target.id;option.textContent=target.icon+' '+target.title;destination.append(option)}
     const move=button('Verschieben',async()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!move.isConnected||!destination.isConnected||cardGeneration!==loadGeneration||getUser()?.id!==loadedOwner||selected!==list.id)return msg('Bitte die aktuelle Wunschkarte verwenden.');if(!destination.value)return msg('Bitte zuerst eine Zielliste wählen.');await moveWishToList(wish.id,list.id,destination.value,move)});move.setAttribute('aria-label','Wunsch verschieben: '+(wish.wishlist_products?.title||'Wunsch'));destination.disabled=listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size>0;
     move.disabled=!membershipReady||listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size>0;moveRow.append(destination,move);card.append(moveRow);
    }
   }
   const toolsRow=document.createElement('div');toolsRow.className='wish-card-tools';
   
    const quickDetail=button('Details · Notiz & Kategorie',async()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!quickDetail.isConnected||cardGeneration!==loadGeneration||getUser()?.id!==loadedOwner||selected!==list.id||!membershipReady)return msg('Bitte die aktuelle Wunschkarte verwenden.');openWishDetail(wish)});quickDetail.disabled=listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size>0;quickDetail.setAttribute('aria-label','Details und persönliche Kategorie für '+(wish.wishlist_products?.title||'Wunsch')+' öffnen');toolsRow.append(quickDetail);
   const copyTitle=button('Titel kopieren',async()=>{if(!copyTitle.isConnected||cardGeneration!==loadGeneration||getUser()?.id!==loadedOwner||selected!==list.id||!membershipReady)return;const title=wish.wishlist_products?.title||'Wunsch';if(!navigator.clipboard?.writeText){msg('Kopieren ist in diesem Browser nicht verfügbar.');return}try{await navigator.clipboard.writeText(title);msg('Wunschtitel kopiert.')}catch{msg('Kopieren nicht erlaubt. Bitte den Titel manuell markieren.')}});toolsRow.append(copyTitle);
   card.append(toolsRow);cards.append(card);
  }
 }
 function setItemsFeedback(state,message){const panel=$('listItemsFeedback');panel.hidden=state==='ready';$('listItemsFeedbackText').textContent=message;$('listItemsRetry').hidden=state!=='error';$('listItemsRetry').disabled=state==='loading'}
 async function syncListQuickSwitch(){
  const select=$('listQuickSwitch'),previous=selected;
  select.replaceChildren();
  const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Liste wählen';select.append(placeholder);
  for(const list of [...lists].filter(l=>!l.archived).sort((a,b)=>Number(favoriteIds.has(b.id))-Number(favoriteIds.has(a.id))||a.title.localeCompare(b.title,'de'))){const option=document.createElement('option');option.value=list.id;option.textContent=(favoriteIds.has(list.id)?'★ ':'')+list.icon+' '+list.title+' · '+(listCounts.get(list.id)||0)+' Wünsche'+(list.archived?' (archiviert)':'');select.append(option)}
  select.value=lists.some(l=>l.id===previous&&!l.archived)?previous:'';
  select.disabled=listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size>0||!membershipReady||getUser()?.id!==loadedOwner||!lists.some(l=>!l.archived);
 }
 function updateActiveListContext(){
  const list=lists.find(l=>l.id===selected&&!l.archived);
  $('activeListHeading').textContent=list?list.icon+' '+list.title:'Wünsche dieser Liste';
  $('activeListSummary').textContent=list?(listCounts.get(list.id)||0)+' zugeordnet · '+(list.archived?'Archiviert – nur ansehen':'Aktive Liste'):'Wähle eine Liste aus.';$('listItemsNewWish').disabled=listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size>0||!list||list.archived||!membershipReady||getUser()?.id!==loadedOwner;
  const quick={quickAllWishes:$('listWishAssignment').value==='all'&&$('listWishMarker').value==='all',quickAssignedWishes:$('listWishAssignment').value==='assigned',quickUnassignedWishes:$('listWishAssignment').value==='global-unassigned',quickFavoriteWishes:$('listWishMarker').value==='star'};
  for(const [id,pressed] of Object.entries(quick))$(id).setAttribute('aria-pressed',String(pressed));
 }
 function setQuickWishFilter(mode){
  if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner||!lists.some(l=>l.id===selected&&!l.archived))return;
  $('listWishSearch').value='';$('listWishPriority').value='all';$('listWishCategory').value='all';selectedOnlyView=false;
  if(mode==='all'){$('listWishAssignment').value='all';$('listWishMarker').value='all'}
  if(mode==='assigned'){$('listWishAssignment').value='assigned';$('listWishMarker').value='all'}
  if(mode==='unassigned'){$('listWishAssignment').value='global-unassigned';$('listWishMarker').value='all'}
  if(mode==='favorite'){$('listWishAssignment').value='all';$('listWishMarker').value='star'}
  visibleLimit=100;renderWishCards();
 }
 function showItems(){
  updateActiveListContext();
  const list=lists.find(x=>x.id===selected&&!x.archived);const generation=++itemsGeneration;
  if(!list){$('listWishCards').replaceChildren();$('listWishCount').textContent='Wähle eine aktive Liste aus.';$('wishLoadMore').hidden=true;updateBulkToolbar([]);if(membershipReady)setItemsFeedback('ready','');return}
  if(!membershipReady){assignedIds=new Set();$('wishLoadMore').hidden=true;$('listWishCards').replaceChildren();$('listWishCount').textContent='';updateBulkToolbar([]);setItemsFeedback('loading','Zuordnungen werden geladen …');return}
  assignedIds=membershipForSelectedList({membershipReady,membershipByList,listId:list.id});syncBulkMoveTargets();
  if(generation!==itemsGeneration)return;
  setItemsFeedback('ready','');renderWishCards();
 }
 async function retryItemsLoad(){if(bulkBusy)return;const id=getUser()?.id;try{await load()}catch(e){if(getUser()?.id!==id)return;msg(e.message||'Ladefehler')}}
 $('listItemsRetry').onclick=retryItemsLoad;

 $('listItemsNewWish').onclick=()=>{const list=lists.find(l=>l.id===selected&&!l.archived);if(!list||!membershipReady||listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||getUser()?.id!==loadedOwner)return;
  $('wishListSelect').value=list.id;$('editor').scrollIntoView({behavior:'smooth',block:'start'});$('url').focus()};
 $('listQuickSwitch').onchange=()=>{const id=$('listQuickSwitch').value;if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner||!lists.some(l=>l.id===id&&!l.archived)){syncListQuickSwitch();return}openList(id)};
 $('listItemsBack').onclick=()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner)return;focusListRegion('listsContent')};
 $('quickAllWishes').onclick=()=>setQuickWishFilter('all');
 $('quickAssignedWishes').onclick=()=>setQuickWishFilter('assigned');
 $('quickUnassignedWishes').onclick=()=>setQuickWishFilter('unassigned');
 $('quickFavoriteWishes').onclick=()=>setQuickWishFilter('favorite');
 $('wishViewCards').onclick=()=>{if(!listMutationBusy&&!listCopyBusy&&!bulkBusy&&!activeWishMutations.size&&membershipReady&&getUser()?.id===loadedOwner)setWishView(false)};
 $('wishShowAssigned').onclick=()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner)return;setQuickWishFilter('assigned');$('listWishCards').scrollIntoView({behavior:'smooth',block:'start'})};
 $('wishClearFilters').onclick=()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner||!lists.some(l=>l.id===selected&&!l.archived))return;selectedOnlyView=false;for(const [id,value] of [['listWishSearch',''],['listWishPriority','all'],['listWishCategory','all'],['listWishMarker','all'],['listWishAssignment','assigned'],['listWishSort','newest']])$(id).value=value;visibleLimit=100;renderWishCards()};
 $('wishLoadMore').onclick=()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner||!lists.some(l=>l.id===selected&&!l.archived))return;visibleLimit+=100;renderWishCards();if($('wishLoadMore').hidden){const count=$('listWishCount');count.tabIndex=-1;count.focus({preventScroll:true})}};
 $('wishDetailJump').onclick=()=>{const id=detailWishId;if(!id||!membershipReady||listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||getUser()?.id!==loadedOwner||!wishes.some(w=>w.id===id))return;const list=lists.find(l=>!l.archived&&membershipByList.get(l.id)?.has(id));if(list)jumpToWishInList(id,list.id);else msg('Der Wunsch ist keiner aktiven Liste zugeordnet.')};
 $('listsResetFilters').onclick=()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner)return;$('listsSearch').value='';$('listsView').value='all';$('listsSort').value='favorites';render();$('listsSearch').focus({preventScroll:true})};
 const globalOption=document.createElement('option');globalOption.value='global-unassigned';globalOption.textContent='In keiner Liste';$('listWishAssignment').append(globalOption);
 $('showUnassigned').onclick=()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner)return;selectedOnlyView=false;$('listWishAssignment').value='global-unassigned';$('listWishSearch').value='';$('listWishPriority').value='all';$('listWishCategory').value='all';$('listWishMarker').value='all';$('listWishSort').value='newest';bulkIds.clear();renderWishCards();$('listWishCards').scrollIntoView({behavior:'smooth',block:'start'});};
 for(const id of ['listsSearch','listsView','listsSort'])$(id).addEventListener('input',()=>{if(!listMutationBusy&&!listCopyBusy&&!bulkBusy&&!activeWishMutations.size&&membershipReady&&getUser()?.id===loadedOwner)render()});
 $('homeFavorites').onclick=()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner)return;$('listsView').value='favorites';render();focusListRegion('listsContent')};
 $('homeNewWish').onclick=()=>{$('editor').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});$('url').focus()};
 $('homeNewList').onclick=()=>{$('newListPanel').open=true;$('listTitle').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'center'});$('listTitle').focus()};
 for(const category of WISH_CATEGORIES){for(const select of [$('listWishCategory'),$('wishDetailCategory')]){const option=document.createElement('option');option.value=category.id;option.textContent=category.label;select.append(option)}}const noCategory=document.createElement('option');noCategory.value='';noCategory.textContent='Ohne Kategorie';$('wishDetailCategory').prepend(noCategory);
 $('wishDetailStar').onclick=()=>{if(!listMutationBusy&&!listCopyBusy&&!bulkBusy&&!activeWishMutations.size&&detailWishId)setMarker(detailWishId,'star')};
 $('listWishClearFilters').onclick=()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner||!lists.some(l=>l.id===selected&&!l.archived))return;selectedOnlyView=false;for(const [id,value] of [['listWishSearch',''],['listWishPriority','all'],['listWishCategory','all'],['listWishMarker','all'],['listWishAssignment','assigned'],['listWishSort','newest']])$(id).value=value;renderWishCards();$('listWishSearch').focus({preventScroll:true})};
 $('wishDetailSaveCategory').onclick=saveCategory;$('wishDetailClose').onclick=()=>$('wishDetailDialog').close();$('wishDetailDone').onclick=()=>$('wishDetailDialog').close();$('wishDetailDialog').addEventListener('close',()=>{detailWishId=null});
 for(const id of ['listWishSearch','listWishPriority','listWishCategory','listWishMarker','listWishAssignment','listWishSort'])$(id).addEventListener('input',()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner||!lists.some(l=>l.id===selected&&!l.archived))return;selectedOnlyView=false;visibleLimit=100;renderWishCards()});
 $('listTemplate').onchange=()=>{
  const template=LIST_TEMPLATES.find(t=>t.id===$('listTemplate').value)||LIST_TEMPLATES.at(-1);
  $('listTitle').value=template.title;$('listDescription').value=template.description;$('listIcon').value=template.icon;$('listColor').value=template.color;const wasInvalid=$('listTitle').getAttribute('aria-invalid')==='true';$('listTitle').removeAttribute('aria-invalid');$('listTitle').removeAttribute('aria-describedby');const descriptionWasInvalid=$('listDescription').getAttribute('aria-invalid')==='true';$('listDescription').removeAttribute('aria-invalid');$('listDescription').removeAttribute('aria-describedby');if(descriptionWasInvalid&&$('listsStatus').textContent==='Beschreibung darf höchstens 500 Zeichen enthalten.')msg('Vorlage eingesetzt. Beschreibung wurde aktualisiert.');if(wasInvalid&&$('listsStatus').textContent==='Listenname muss 1 bis 80 Zeichen enthalten.')msg('Vorlage eingesetzt. Listennamen prüfen und Liste erstellen.');
 };
 let listEditReturnFocus=null;
 function finishListEditing(){
  const origin=listEditReturnFocus;
  listEditReturnFocus=null;
  const fallback=$('listsContent');
  const destination=origin?.isConnected&&!origin.closest('[hidden]')&&origin.getClientRects().length&&!origin.matches(':disabled')?origin:fallback;
  if(destination===fallback)fallback.tabIndex=-1;
  destination.focus({preventScroll:true});
  destination.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'nearest'});
 }
 function openEditor(list){
  if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner||!lists.some(l=>l.id===list.id&&!l.archived))return;
  listEditReturnFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  listEditBaseline={id:list.id,title:list.title,description:list.description,icon:list.icon,color:list.color,visibility:list.visibility,cover_url:list.cover_url};listEditGeneration=loadGeneration;
  $('editListId').value=list.id;$('editListTitle').value=list.title;$('editListDescription').value=list.description||'';
  $('editListIcon').value=list.icon;$('editListColor').value=list.color;$('editListVisibility').value=list.visibility;$('editListCoverUrl').value=list.cover_url||'';
  for(const fieldId of ['editListTitle','editListDescription','editListVisibility','editListCoverUrl']){$(fieldId).removeAttribute('aria-invalid');$(fieldId).removeAttribute('aria-describedby')}
  $('editListFeedback').textContent='';$('editListForm').hidden=false;$('editListForm').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});$('editListTitle').focus({preventScroll:true});
 }
 $('cancelListEdit').onclick=()=>{if(listMutationBusy)return;$('editListForm').hidden=true;$('editListForm').reset();$('editListId').value='';listEditBaseline=null;listEditGeneration=null;$('editListFeedback').textContent='';finishListEditing();};
 $('editListForm').onsubmit=async event=>{
  event.preventDefault();if(!getUser())return;const id=owner(),generation=loadGeneration,listId=$('editListId').value;
  if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size)return msg('Bitte laufende Wunschänderungen zuerst abschließen.');if(!membershipReady||id!==loadedOwner||!listId||$('editListForm').hidden)return;if(!lists.some(l=>l.id===listId&&!l.archived))return msg('Bitte eine aktive Liste bearbeiten.');
  const title=$('editListTitle').value.trim(),description=$('editListDescription').value.trim();
  if(!title||title.length>80)return invalidField($('editListTitle'),'Bitte einen Listennamen mit 1 bis 80 Zeichen eingeben.');if(description.length>500)return invalidField($('editListDescription'),'Beschreibung darf höchstens 500 Zeichen enthalten.');
  const coverUrl=$('editListCoverUrl').value.trim();if(coverUrl&&(!/^https:\/\//i.test(coverUrl)||coverUrl.length>2048))return invalidField($('editListCoverUrl'),'Titelbild muss eine gültige HTTPS-Adresse sein.');const visibility=$('editListVisibility').value,icon=$('editListIcon').value,color=$('editListColor').value;if(!['private','public'].includes(visibility))return invalidField($('editListVisibility'),'Ungültige Sichtbarkeit.');if(visibility==='public'&&!lists.some(l=>l.id===listId&&l.visibility==='public')&&!window.confirm('Sammlung öffentlich freigeben? Jeder mit dem Link kann Titel, Beschreibung und alle zugeordneten Wünsche einschließlich Notizen sehen.'))return;const save=$('saveListChanges'),cancel=$('cancelListEdit'),editFields=[...$('editListForm').querySelectorAll('input,select,textarea')],focusedEditControl=document.activeElement;save.disabled=true;cancel.disabled=true;for(const field of editFields)field.disabled=true;listMutationBusy=true;$('editListFeedback').textContent='Änderungen werden gespeichert …';try{if(getUser()?.id===id&&membershipReady)renderWishCards();
   if(!listEditBaseline||listEditBaseline.id!==listId||listEditGeneration!==loadGeneration)throw Error('Bearbeitungsstand ist nach einem Listen-Reload veraltet. Bitte Liste erneut öffnen.');
   let update=db.from('wishlist_lists').update({title,description,icon,color,visibility,cover_url:coverUrl||null}).eq('id',listId).eq('user_id',id);
   for(const field of ['title','description','icon','color','visibility','cover_url']){const old=listEditBaseline[field];update=old===null||old===undefined?update.is(field,null):update.eq(field,old)}
   const {error,data}=await update.select('id');
   if(getUser()?.id!==id||loadedOwner!==id||generation!==loadGeneration||$('editListId').value!==listId||listEditGeneration!==generation)return;
   if(error)throw error;if(!data?.length)throw Error('Die Liste wurde in einem anderen Tab geändert oder entfernt. Bitte neu laden und Änderungen erneut prüfen.');
   $('editListForm').hidden=true;$('editListForm').reset();$('editListId').value='';const refresh=load({afterBulk:true}),refreshGeneration=loadGeneration;try{await refresh}catch(e){if(getUser()?.id===id&&refreshGeneration===loadGeneration){msg('Listendesign gespeichert, aber Aktualisierung fehlgeschlagen. Bitte neu laden.');finishListEditing()}return}if(getUser()?.id===id&&refreshGeneration===loadGeneration){msg('Listendesign gespeichert.');finishListEditing()}
  }catch(e){if(getUser()?.id===id&&generation===loadGeneration)msg(e.message||'Liste konnte nicht gespeichert werden')}finally{listMutationBusy=false;if(getUser()?.id===id&&generation===loadGeneration){for(const field of editFields)field.disabled=false;save.disabled=false;cancel.disabled=false}if(getUser()?.id===id&&generation===loadGeneration&&!$('editListForm').hidden&&(!document.activeElement||document.activeElement===document.body)){const target=focusedEditControl?.isConnected&&!focusedEditControl.disabled&&$('editListForm').contains(focusedEditControl)?focusedEditControl:save;target.focus({preventScroll:true})}if(getUser()?.id===id&&loadedOwner===id&&membershipReady)renderWishCards();else{const refreshOwner=getUser()?.id;if(refreshOwner&&loadedOwner!==refreshOwner)load().catch(e=>{if(getUser()?.id===refreshOwner)msg(e.message||'Listen konnten nicht geladen werden')})}}
 };
 $('mobileNewWish').onclick=()=>{$('editor').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});$('url').focus()};
 $('mobileMyLists').onclick=()=>focusListRegion('listsContent');
 $('quickNewList').onclick=()=>{$('newListPanel').open=true;$('listTitle').focus();$('listTitle').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'center'})};
 $('quickAddWish').onclick=()=>{$('editor').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});$('url').focus()};
 $('quickOpenSelected').onclick=()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner||!selected||!lists.some(l=>l.id===selected&&!l.archived))return msg('Bitte zuerst eine aktive Liste öffnen.');focusListRegion('activeListHeading')};
 $('createList').onclick=async()=>{if(listMutationBusy||listCopyBusy||bulkBusy||activeWishMutations.size||!membershipReady||getUser()?.id!==loadedOwner)return msg('Bitte die Listen vollständig laden und laufende Änderungen abschließen.');const id=owner(),generation=loadGeneration;const title=$('listTitle').value.trim();if(!title||title.length>80){invalidField($('listTitle'),'Listenname muss 1 bis 80 Zeichen enthalten.');return}const description=$('listDescription').value.trim();if(description.length>500)return invalidField($('listDescription'),'Beschreibung darf höchstens 500 Zeichen enthalten.');const visibility=$('listVisibility').value;if(!['private','public'].includes(visibility))return invalidField($('listVisibility'),'Ungültige Sichtbarkeit.');const submittedTitle=$('listTitle').value,submittedDescription=$('listDescription').value,createHadFocus=document.activeElement===$('createList');const payload={user_id:id,title,description,icon:$('listIcon').value,color:$('listColor').value,visibility};$('createList').disabled=true;listMutationBusy=true;try{if(getUser()?.id===id&&membershipReady)renderWishCards();const {error}=await db.from('wishlist_lists').insert(payload);if(error)throw error;if(getUser()?.id!==id||loadedOwner!==id)return;if($('listTitle').value===submittedTitle)$('listTitle').value='';if($('listDescription').value===submittedDescription)$('listDescription').value='';$('listVisibility').value='private';$('listIcon').selectedIndex=0;$('listColor').selectedIndex=0;const refresh=load({afterBulk:true}),refreshGeneration=loadGeneration;try{await refresh}catch(e){if(getUser()?.id===id&&refreshGeneration===loadGeneration)msg('Liste angelegt, aber Aktualisierung fehlgeschlagen. Bitte neu laden.');return}}catch(e){if(getUser()?.id===id&&generation===loadGeneration)msg(e.message||'Liste konnte nicht angelegt werden')}finally{listMutationBusy=false;if(getUser()?.id===id&&loadedOwner===id){$('createList').disabled=false;if(createHadFocus&&(!document.activeElement||document.activeElement===document.body))$('createList').focus({preventScroll:true})}if(getUser()?.id===id&&loadedOwner===id&&membershipReady)renderWishCards();else{const refreshOwner=getUser()?.id;if(refreshOwner&&loadedOwner!==refreshOwner)load().catch(e=>{if(getUser()?.id===refreshOwner)msg(e.message||'Listen konnten nicht geladen werden')})}}};
 window.addEventListener('storage',event=>{
  const uid=loadedOwner;
  if(!uid||getUser()?.id!==uid||!membershipReady||!event.key)return;
  if(event.key===favoriteKey(uid)){favoriteIds=new Set([...readFavorites(uid)].filter(id=>lists.some(l=>l.id===id)));render();return;}
  if(event.key===categoryKey(uid)){const previousCategory=detailWishId?wishCategories[detailWishId]||'':'';const categoryField=$('wishDetailCategory');const untouched=detailWishId&&categoryField.value===previousCategory;wishCategories=readCategories(uid);if(untouched&&$('wishDetailDialog').open){detailCategoryBaseline=wishCategories[detailWishId]||'';categoryField.value=detailCategoryBaseline;}renderWishCards();return;}
  if(event.key===markerKey(uid)){wishMarkers=readMarkers(uid);renderWishCards();if(detailWishId)syncDetailMarkers();}
 });
 $('refreshLists').onclick=()=>load().catch(e=>msg(e.message));
 return {refresh:()=>load().catch(e=>msg(e.message)),reset,assignWish,selectedList:()=>loadedOwner===getUser()?.id?editorSelect.value:''};
}
