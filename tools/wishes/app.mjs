import {buddy,notify} from '../../shared/toolya/platform.mjs';
import {wishSaveOutcome} from './wish-save-outcome.mjs';
import {appendProductMetadata} from './product-card.mjs?v=20261114-mascot1';
import {mountAmazonImport} from './amazon-import.mjs?v=20261114-mascot1';
import {mountListsDashboard} from './lists-dashboard.mjs?v=20261114-mascot1';
import {parseAmazonUrl,affiliateUrl,sharedAmazonProductUrl} from './amazon-links.mjs';
import {validateWishFields,validateHandle,validatePriority,profilePageUrl,isUniqueViolation,requestedProfileHandle,validateProfileFields,feedPage,validateCredentials,shouldRestoreSharedProductUrl,isFeedRequestStale,isWishLocallyHidden,profileDisplayLabel,wishlistErrorMessage,copyShareLink,priorityLabel} from './wishlist-utils.mjs';
import {db} from './toolya-client.mjs';
const $=id=>document.getElementById(id);let user=null,profile=null,offset=0;let feedBusy=false;let feedRefreshPending=false;let feedRevision=0;let editingWishId=null;let editingWishBaseline=null;let editingWishExtrasBaseline=null;let editingWishFeedRevision=null;let authGeneration=0;let profileLoadGeneration=0;let wishEditorRevision=0;let wishSaveRunGeneration=0;const dashboard=mountListsDashboard(db,()=>user);const hiddenWishIds=new Set();let lastHiddenWishId=null;let renderedWishCount=0;const updateHiddenWishes=()=>{const count=hiddenWishIds.size;$('hiddenWishInfo').hidden=!count;$('restoreHiddenWishes').hidden=!count;$('undoHiddenWish').hidden=!count||lastHiddenWishId===null;$('hiddenWishInfo').textContent=count===1?'1 Wunsch für diese Sitzung ausgeblendet.':count+' Wünsche für diese Sitzung ausgeblendet.'};

const report=(m)=>{$('status').textContent=m};
const refreshFeed=async()=>{offset=0;renderedWishCount=0;$('feedCount').textContent='Wünsche werden geladen …';feedRevision++;$('more').disabled=true;await feed()};
mountAmazonImport({db,getUser:()=>user,dashboard,refreshFeed});
const requireUser=()=>{if(!user)throw Error('Bitte zuerst anmelden');return user.id};

const localWishExtrasKey=owner=>'helferlein-wish-extras:'+owner;
function readWishExtras(owner,id){
 if(!owner||!id)return {};
 try{const all=JSON.parse(localStorage.getItem(localWishExtrasKey(owner))||'{}');return all&&typeof all==='object'?all[id]||{}:{}}catch{return {}}
}
function readValidatedWishExtras(){
 const imageUrl=$('wishImageUrl').value.trim();
 if(imageUrl){try{const parsed=new URL(imageUrl);if(parsed.protocol!=='https:')throw Error();}catch{throw Error('Produktbild muss eine gültige HTTPS-Adresse sein.');}}
 const rawPrice=$('wishTargetPrice').value;
 const price=rawPrice===''?null:Number(rawPrice);
 if(price!==null&&(!Number.isFinite(price)||price<0||price>999999))throw Error('Ungültiger Wunschpreis.');
 const quantity=Number($('wishQuantity').value);
 if(!Number.isInteger(quantity)||quantity<1||quantity>999)throw Error('Die Menge muss zwischen 1 und 999 liegen.');
 const status=$('wishStatus').value;
 if(!['open','planned','fulfilled'].includes(status))throw Error('Ungültiger Wunschstatus.');
 return {imageUrl,price,quantity,status};
}
function saveWishExtras(owner,id,extras){
 if(!owner||!id)return;
 const {imageUrl,price,quantity,status}=extras;
 let all;try{const raw=localStorage.getItem(localWishExtrasKey(owner));all=raw===null?{}:JSON.parse(raw);if(!all||typeof all!=='object'||Array.isArray(all))return false}catch{return false}
 all[id]={imageUrl,price,quantity,status};
 try{localStorage.setItem(localWishExtrasKey(owner),JSON.stringify(all));return true}catch{return false}
}
function fillWishExtras(owner,id){
 for(const fieldId of ['wishImageUrl','wishTargetPrice','wishQuantity','wishStatus'])delete $(fieldId).dataset.cloudEdited;
 const data=readWishExtras(owner,id);
 $('wishImageUrl').value=data.imageUrl||'';
 $('wishTargetPrice').value=data.price??'';
 $('wishQuantity').value=data.quantity||1;
 $('wishStatus').value=data.status||'open';
 updateWishExtrasPreview();
}
function updateWishExtrasPreview(){
 const url=$('wishImageUrl').value.trim();
 const img=$('wishPreviewImage');
 let valid=false;try{valid=new URL(url).protocol==='https:'}catch{}
 img.hidden=!valid;
 if(valid)img.src=url;else img.removeAttribute('src');
 const parts=[];
 if($('wishTargetPrice').value!=='')parts.push('Wunschpreis: '+$('wishTargetPrice').value+' €');
 parts.push('Menge: '+($('wishQuantity').value||1));
 const statuses={open:'Offen',planned:'Geplant',fulfilled:'Erfüllt'};
 parts.push(statuses[$('wishStatus').value]||'Offen');
 $('wishPreviewMeta').textContent=parts.join(' · ');
}
for(const id of ['wishImageUrl','wishTargetPrice','wishQuantity','wishStatus'])$(id).addEventListener('input',()=>{$(id).dataset.cloudEdited='true';updateWishExtrasPreview()});
function appendWishExtras(card,wish,cloudExtras){
 if(wish.user_id!==user?.id)return;
 const local=readWishExtras(user.id,wish.id);
 const data=Object.keys(local).length?local:cloudExtras;
 if(!data||!Object.keys(data).length)return;
 if(data.imageUrl){const img=document.createElement('img');img.className='wish-product-image';img.alt='Zusätzlich gespeichertes Produktbild';img.loading='lazy';img.referrerPolicy='no-referrer';img.src=data.imageUrl;card.append(img)}
 const wrap=document.createElement('div');wrap.className='wish-product-extras';
 const labels=[];
 if(data.price!==null&&data.price!==undefined)labels.push('🎯 '+new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(data.price));
 if(data.quantity>1)labels.push('× '+data.quantity);
 if(data.status==='planned')labels.push('📌 Geplant');
 if(data.status==='fulfilled')labels.push('✓ Erfüllt');
 for(const label of labels){const badge=document.createElement('span');badge.textContent=label;wrap.append(badge)}
 if(wrap.childElementCount)card.append(wrap);
}

function resetWishEditor() {$('updateWishExtrasCloud').hidden=true;$('saveWishExtrasCloud').hidden=true;$('wishExtrasCloudFeedback').textContent='';for(const fieldId of ['url','productTitle','wishNote']){$(fieldId).removeAttribute('aria-invalid');$(fieldId).removeAttribute('aria-describedby')}wishEditorRevision++;editingWishId=null;editingWishBaseline=null;editingWishExtrasBaseline=null;editingWishFeedRevision=null;$('editHint').hidden=true;$('url').disabled=false;$('url').value='';$('productTitle').value='';$('productTitle').disabled=false;$('wishNote').value='';$('priority').value='2';$('wishVisibility').value='public';$('saveWish').textContent='Wunsch speichern';$('wishSaveFeedback').textContent='';$('wishVisibility').dispatchEvent(new Event('change'));fillWishExtras(null,null)}
const invalidWishField=(field,message)=>{
 field.setAttribute('aria-invalid','true');
 field.setAttribute('aria-describedby','wishSaveFeedback');
 field.focus();
 throw Error(message);
};
for(const fieldId of ['url','productTitle','wishNote']){
 const field=$(fieldId);
 for(const type of ['input','change'])field.addEventListener(type,()=>{
  field.removeAttribute('aria-invalid');field.removeAttribute('aria-describedby');
 });
}
$('cancelEdit').onclick=()=>{resetWishEditor();$('saveWish').focus({preventScroll:true});$('saveWish').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'nearest'});report('Wunschbearbeitung abgebrochen.');};
for(const id of ['url','productTitle','wishNote','priority','wishVisibility','wishImageUrl','wishTargetPrice','wishQuantity','wishStatus'])for(const type of ['input','change'])$(id).addEventListener(type,()=>{wishEditorRevision++});
const run=fn=>async function(){const button=this instanceof HTMLButtonElement?this:null;if(button?.disabled)return;const isWishSave=button?.id==='saveWish',startedOwner=user?.id,startedRevision=wishEditorRevision,startedWish=editingWishId,saveRunGeneration=isWishSave?++wishSaveRunGeneration:null;if(button)button.disabled=true;if(isWishSave)$('wishSaveFeedback').textContent='';try{await fn()}catch(e){if(!isWishSave||(user?.id===startedOwner&&editingWishId===startedWish&&wishEditorRevision===startedRevision)){const message=wishlistErrorMessage(e);report(message);notify(isWishSave?'form-error':'error',message);if(isWishSave)$('wishSaveFeedback').textContent=message}}finally{if(button?.isConnected&&(!isWishSave||(user?.id===startedOwner&&saveRunGeneration===wishSaveRunGeneration)))button.disabled=false}};
let wishExtrasCloudOperation=0;
$('saveWishExtrasCloud').onclick=run(async()=>{
 const ownerId=requireUser(),wishId=editingWishId,revision=wishEditorRevision,operation=++wishExtrasCloudOperation;
 if(!wishId||!editingWishBaseline||editingWishBaseline.id!==wishId)throw Error('Bitte zuerst einen vorhandenen eigenen Wunsch zur Bearbeitung öffnen.');
 const feedback=$('wishExtrasCloudFeedback');
 let extras;try{extras=readValidatedWishExtras()}catch(error){feedback.textContent=wishlistErrorMessage(error);return}
 feedback.textContent='Private Cloud-Speicherung läuft …';
 const payload={wish_id:wishId,user_id:ownerId,image_url:extras.imageUrl||null,target_price:extras.price,quantity:extras.quantity,wish_status:extras.status};
 // INSERT only: the primary key prevents overwriting any existing cloud record.
 let result;try{result=await db.from('wishlist_wish_extras').insert(payload).select('wish_id').single()}catch(error){if(user?.id===ownerId&&editingWishId===wishId&&wishEditorRevision===revision&&operation===wishExtrasCloudOperation)feedback.textContent='Cloud-Speicherung wegen Netzwerkfehler fehlgeschlagen. Ob die Anfrage den Server erreicht hat, ist unklar; bitte Cloud-Stand prüfen, bevor du erneut speicherst. '+wishlistErrorMessage(error);return}
 if(user?.id!==ownerId||editingWishId!==wishId||wishEditorRevision!==revision||operation!==wishExtrasCloudOperation)return;
 if(result.error){
  if(result.error.code==='23505'){feedback.textContent='Für diesen Wunsch existieren bereits Cloud-Daten. Sie wurden nicht überschrieben. Bitte zuerst den Cloud-Stand prüfen.';return}
  feedback.textContent='Cloud-Speicherung fehlgeschlagen. Lokale Zusatzdaten bleiben unverändert. '+wishlistErrorMessage(result.error);return;
 }
 feedback.textContent='Zusatzdaten privat in der Cloud gespeichert. Andere Geräte können sie beim Öffnen dieses Wunsches laden.';
 report(feedback.textContent);
});
$('updateWishExtrasCloud').onclick=run(async()=>{
 const ownerId=requireUser(),wishId=editingWishId,revision=wishEditorRevision,operation=++wishExtrasCloudOperation;
 if(!wishId||editingWishBaseline?.id!==wishId)throw Error('Bitte einen eigenen Wunsch zur Bearbeitung öffnen.');
 const feedback=$('wishExtrasCloudFeedback');
 let extras;try{extras=readValidatedWishExtras()}catch(error){feedback.textContent=wishlistErrorMessage(error);return}
 feedback.textContent='Aktueller Cloud-Stand wird geprüft …';
 let current;try{current=await db.from('wishlist_wish_extras').select('image_url,target_price,quantity,wish_status,version').eq('user_id',ownerId).eq('wish_id',wishId).maybeSingle()}catch(error){if(user?.id===ownerId&&editingWishId===wishId&&wishEditorRevision===revision&&operation===wishExtrasCloudOperation)feedback.textContent='Cloud-Stand wegen Netzwerkfehler nicht lesbar. Keine Aktualisierung gestartet. '+wishlistErrorMessage(error);return}
 if(user?.id!==ownerId||editingWishId!==wishId||wishEditorRevision!==revision||operation!==wishExtrasCloudOperation)return;
 if(current.error){feedback.textContent='Cloud-Daten konnten nicht geprüft werden. Es wurde nichts geändert. '+wishlistErrorMessage(current.error);return}
 if(!current.data){feedback.textContent='Noch keine Cloud-Daten vorhanden. Bitte zuerst die separate Aktion zum erstmaligen Cloud-Speichern verwenden.';return}
 const old=current.data;
 const details='Cloud-Stand: Bild '+(old.image_url||'–')+', Preis '+(old.target_price??'–')+' €, Menge '+old.quantity+', Status '+old.wish_status+'.';
 if(!await buddy.confirm({title:'Cloud-Daten überschreiben?',message:details+'\nDiese Cloud-Daten jetzt durch die Eingaben im Editor ersetzen?',confirmLabel:'Ersetzen',danger:true})){feedback.textContent='Cloud-Aktualisierung abgebrochen. Keine Daten geändert.';return}
 if(user?.id!==ownerId||editingWishId!==wishId||wishEditorRevision!==revision||operation!==wishExtrasCloudOperation)return;
 feedback.textContent='Cloud-Daten werden mit Versionsprüfung aktualisiert …';
 const payload={image_url:extras.imageUrl||null,target_price:extras.price,quantity:extras.quantity,wish_status:extras.status};
 let changed;try{changed=await db.from('wishlist_wish_extras').update(payload).eq('user_id',ownerId).eq('wish_id',wishId).eq('version',old.version).select('wish_id,version')}catch(error){if(user?.id===ownerId&&editingWishId===wishId&&wishEditorRevision===revision&&operation===wishExtrasCloudOperation)feedback.textContent='Cloud-Aktualisierung durch Netzwerkfehler unterbrochen. Ob sie gespeichert wurde, ist unklar; bitte den Cloud-Stand erneut prüfen. '+wishlistErrorMessage(error);return}
 if(user?.id!==ownerId||editingWishId!==wishId||wishEditorRevision!==revision||operation!==wishExtrasCloudOperation)return;
 if(changed.error){feedback.textContent='Cloud-Aktualisierung fehlgeschlagen. Lokale Daten unverändert. '+wishlistErrorMessage(changed.error);return}
 if(changed.data?.length!==1){feedback.textContent='Konflikt: Cloud-Daten wurden inzwischen geändert oder entfernt. Nichts überschrieben; bitte erneut prüfen.';return}
 feedback.textContent='Private Cloud-Zusatzdaten nach Bestätigung aktualisiert.';
 report(feedback.textContent);
});
$('restoreHiddenWishes').onclick=run(async()=>{hiddenWishIds.clear();lastHiddenWishId=null;updateHiddenWishes();await refreshFeed();report('Ausgeblendete Wünsche werden wieder angezeigt.')});

$('undoHiddenWish').onclick=run(async()=>{if(lastHiddenWishId===null)return;hiddenWishIds.delete(lastHiddenWishId);lastHiddenWishId=null;updateHiddenWishes();await refreshFeed();report('Letztes Ausblenden rückgängig gemacht.')});
async function auth(){const generation=++authGeneration;let data,error;try{({data,error}=await db.auth.getUser())}catch(e){error=e}if(generation!==authGeneration)return;const authError=error&&error.name!=='AuthSessionMissingError'?error:null;const previousUserId=user?.id;user=authError?null:(data?.user||null);if(previousUserId!==user?.id){hiddenWishIds.clear();lastHiddenWishId=null;updateHiddenWishes();const restoreSharedUrl=shouldRestoreSharedProductUrl($('url').value,importedProductUrl);profile=null;resetWishEditor();++wishSaveRunGeneration;$('saveWish').disabled=false;if(restoreSharedUrl)$('url').value=importedProductUrl;offset=0;feedRevision++;$('feed').replaceChildren();renderedWishCount=0;$('feedCount').textContent='';$('more').disabled=true;$('handle').value='';$('displayName').value='';$('bio').value='';$('profileAvatarUrl').value='';profileLoadGeneration++}$('editor').hidden=!user;$('editorNav').hidden=!user;$('login').hidden=!!user;$('logout').hidden=!user;const authStatus=$('wishlistAuthStatus'),authMenu=$('wishlistAuthMenu');authStatus.textContent=user?'● Angemeldet':'◯ Nicht angemeldet';authMenu.hidden=!!user;if(user)authMenu.open=false;if(!user){$('password').value='';profile=null;$('handle').value='';$('displayName').value='';$('bio').value='';}if(authError){await dashboard.refresh();throw authError}await dashboard.refresh();if(user){const profileGeneration=++profileLoadGeneration;let r;try{r=await db.from('wishlist_profiles').select('handle,display_name,bio,avatar_url').eq('user_id',user.id).maybeSingle()}catch(e){r={error:e}}if(generation!==authGeneration||profileGeneration!==profileLoadGeneration||user?.id!==data.user.id)return;if(r.error){profile=null;throw r.error;}const previousProfile=profile;profile=r.data;if(previousUserId!==user.id||$('handle').value===(previousProfile?.handle||''))$('handle').value=profile?.handle||'';if(previousUserId!==user.id||$('displayName').value===(previousProfile?.display_name||''))$('displayName').value=profile?.display_name||'';if(previousUserId!==user.id||$('bio').value===(previousProfile?.bio||''))$('bio').value=profile?.bio||'';if(previousUserId!==user.id||$('profileAvatarUrl').value===(previousProfile?.avatar_url||''))$('profileAvatarUrl').value=profile?.avatar_url||'';}}
$('signin').onclick=run(async()=>{let r;try{r=await db.auth.signInWithPassword(validateCredentials($('email').value,$('password').value))}finally{$('password').value=''}if(r.error)throw r.error;await auth();await refreshFeed();report('Angemeldet');notify('welcome','Willkommen zurück!')});
$('signup').onclick=run(async()=>{let r;try{r=await db.auth.signUp({...validateCredentials($('email').value,$('password').value),options:{emailRedirectTo:new URL('./index.html',location.href).href}})}finally{$('password').value=''}if(r.error)throw r.error;report('Registrierung gestartet; bitte E-Mail prüfen.');await auth()});
$('logout').onclick=run(async()=>{let r;try{r=await db.auth.signOut()}finally{$('password').value=''}if(r.error)throw r.error;await auth();await refreshFeed()});
$('saveProfile').onclick=run(async()=>{const ownerId=requireUser(),handle=validateHandle($('handle').value),{display_name,bio}=validateProfileFields($('displayName').value,$('bio').value);const avatarUrl=$('profileAvatarUrl').value.trim();if(avatarUrl&&(!/^https:\/\//i.test(avatarUrl)||avatarUrl.length>2048))throw Error('Profilbild benötigt eine gültige HTTPS-Adresse.');const r=await db.from('wishlist_profiles') .upsert({user_id:ownerId,handle,display_name,bio,avatar_url:avatarUrl||null},{onConflict:'user_id'});if(r.error){if(isUniqueViolation(r.error))throw Error('Dieser Benutzername ist bereits vergeben. Bitte einen anderen wählen.');throw r.error;}if(user?.id!==ownerId)throw Error('Sitzung hat sich geändert');await auth();if(user?.id!==ownerId)throw Error('Sitzung hat sich geändert');await refreshFeed();if(user?.id!==ownerId)throw Error('Sitzung hat sich geändert');report('Profil gespeichert');notify('success','Profil gespeichert')});
$('saveWish').onclick=run(async()=>{const ownerId=requireUser();if(!profile)throw Error('Zuerst Profil speichern');const wishId=editingWishId;const editorRevision=wishEditorRevision;const targetList=wishId?null:dashboard.selectedList();const p=wishId?null:parseAmazonUrl($('url').value);if(!wishId&&(!p||p.marketplace!=='amazon.de'))invalidWishField($('url'),'Nur gültige Amazon.de-Produktlinks');let title,note;try{({title,note}=validateWishFields($('productTitle').value,$('wishNote').value))}catch(error){const message=wishlistErrorMessage(error);invalidWishField(message.startsWith('Notiz')?$('wishNote'):$('productTitle'),message)}const priority=validatePriority($('priority').value);const visibility=$('wishVisibility').value;if(!['public','private'].includes(visibility))throw Error('Ungültige Sichtbarkeit');const extras=readValidatedWishExtras();if(wishId){if(editingWishFeedRevision!==feedRevision)throw Error('Der Feed wurde seit dem Öffnen dieses Wunsches aktualisiert. Bitte Änderungen prüfen und den Wunsch aus dem aktuellen Feed erneut öffnen.');if(JSON.stringify(readWishExtras(ownerId,wishId))!==editingWishExtrasBaseline)throw Error('Zusatzdaten wurden in einem anderen Tab geändert. Bitte Wunsch erneut öffnen und Änderungen prüfen.');if(!editingWishBaseline||editingWishBaseline.id!==wishId)throw Error('Bearbeitungsstand ist veraltet. Bitte Wunsch erneut öffnen.');let wishUpdate=db.from('wishlist_wishes').update({note,priority,visibility}).eq('id',wishId).eq('user_id',ownerId);for(const field of ['note','priority','visibility']){const old=editingWishBaseline[field];wishUpdate=old===null?wishUpdate.is(field,null):wishUpdate.eq(field,old)}const changed=await wishUpdate.select('id');if(changed.error)throw changed.error;if(!changed.data?.length)throw Error('Der Wunsch wurde in einem anderen Tab geändert oder entfernt. Bitte Feed aktualisieren und erneut bearbeiten.');if(user?.id!==ownerId)throw Error('Sitzung hat sich geändert');const extrasSaved=saveWishExtras(ownerId,wishId,extras);let completionRevision=editorRevision;if(editingWishId===wishId&&wishEditorRevision===editorRevision){resetWishEditor();completionRevision=wishEditorRevision;}await refreshFeed();if(user?.id!==ownerId)return;await dashboard.refresh();if(user?.id!==ownerId)return;if(wishEditorRevision!==completionRevision||editingWishId!==null&&editingWishId!==wishId)return;const {type,message}=wishSaveOutcome({editing:true,extrasSaved});$('wishSaveFeedback').textContent=message;report(message);notify(type,message);return;}let r=await db.from('wishlist_products').select('id').eq('marketplace',p.marketplace).eq('asin',p.asin).maybeSingle();if(r.error)throw r.error;if(user?.id!==ownerId)throw Error('Sitzung hat sich geändert');let id=r.data?.id;if(!id){r=await db.from('wishlist_products').insert({...p,title}).select('id').single();if(r.error){if(!isUniqueViolation(r.error))throw r.error;const retry=await db.from('wishlist_products').select('id').eq('marketplace',p.marketplace).eq('asin',p.asin).single();if(retry.error)throw retry.error;id=retry.data.id}else id=r.data.id}if(user?.id!==ownerId)throw Error('Sitzung hat sich geändert');r=await db.from('wishlist_wishes').insert({user_id:ownerId,product_id:id,note,priority,visibility}).select('id').single();if(r.error){if(isUniqueViolation(r.error))throw Error('Dieses Produkt steht bereits auf deiner Wunschliste. Bitte den bestehenden Wunsch bearbeiten.');throw r.error;}if(user?.id!==ownerId)throw Error('Sitzung hat sich geändert');const extrasSaved=saveWishExtras(ownerId,r.data.id,extras);let assignmentError=null;if(targetList){try{await dashboard.assignWish(r.data.id,targetList,ownerId)}catch(e){assignmentError=e}}if(user?.id!==ownerId)return;let completionRevision=editorRevision;if(editingWishId===null&&wishEditorRevision===editorRevision){resetWishEditor();completionRevision=wishEditorRevision;}await refreshFeed();if(user?.id!==ownerId)return;await dashboard.refresh();if(user?.id!==ownerId)return;if(wishEditorRevision!==completionRevision||editingWishId!==null)return;const {type,message}=wishSaveOutcome({editing:false,extrasSaved,assignmentError:!!assignmentError});$('wishSaveFeedback').textContent=message;report(message);notify(type,message)});
async function feed(){if(feedBusy){feedRefreshPending=true;return;}feedBusy=true;$('feed').setAttribute('aria-busy','true');const filter=$('feedFilter').value;const sort=$('feedSort').value;const feedUserId=user?.id;const revision=feedRevision;const requestedOffset=offset;const isStale=()=>isFeedRequestStale({offset:requestedOffset,revision,filter,sort,userId:feedUserId,profileId:null},{offset,revision:feedRevision,filter:$('feedFilter').value,sort:$('feedSort').value,userId:user?.id,profileId:null});try{if(!user){offset=0;$('feed').textContent='Bitte anmelden, um deine Wünsche zu sehen.';$('more').disabled=true;return;}const allowed=[user.id];let query=db.from('wishlist_wishes').select('id,user_id,priority,created_at,wishlist_products(asin,marketplace,title,image_url,price,description,scraped_at),wishlist_profiles(display_name,handle),note,visibility');if(sort==='priority')query=query.order('priority',{ascending:true});query=query.order('created_at',{ascending:false}).order('id',{ascending:false}).range(requestedOffset,requestedOffset+20);if(allowed)query=query.in('user_id',allowed);const r=await query;if(isStale()){feedRefreshPending=true;return;}if(r.error)throw r.error;const page=feedPage(r.data);
// Fetch private extras only for wishes owned by the current account. Public cards
// never request or display private metadata from other users.
const ownIds=user&&feedUserId===user.id?page.items.filter(w=>w.user_id===feedUserId).map(w=>w.id):[];
const cloudExtrasByWish=new Map();
if(ownIds.length){
 try{
  const cloud=await db.from('wishlist_wish_extras').select('wish_id,image_url,target_price,quantity,wish_status').eq('user_id',feedUserId).in('wish_id',ownIds);
  if(isStale()){feedRefreshPending=true;return;}
  if(!cloud.error)for(const entry of cloud.data||[]){
   if(!ownIds.some(id=>String(id)===String(entry.wish_id)))continue;
   cloudExtrasByWish.set(String(entry.wish_id),{imageUrl:entry.image_url||'',price:entry.target_price,quantity:entry.quantity,status:entry.wish_status});
  }
 }catch{if(isStale()){feedRefreshPending=true;return;}}
}
const fragment=document.createDocumentFragment();for(const w of page.items){if(isWishLocallyHidden(w,hiddenWishIds,new Set()))continue;const div=document.createElement('div');div.className='item';const strong=document.createElement('strong');strong.textContent=w.wishlist_products.title;const info=document.createElement('p');info.textContent=profileDisplayLabel(w.wishlist_profiles?.display_name,w.wishlist_profiles?.handle)+' · Priorität: '+priorityLabel(w.priority);const a=document.createElement('a');a.href=affiliateUrl(w.wishlist_products,{'amazon.de':'duhrrom-21'});a.textContent='Bei Amazon ansehen (Partnerlink)';a.target='_blank';a.rel='noopener noreferrer sponsored';div.append(strong,info);appendProductMetadata(div,w.wishlist_products);appendWishExtras(div,w,cloudExtrasByWish.get(String(w.id)));if(w.note){const note=document.createElement('p');note.textContent=w.note;div.append(note)}div.append(a);const share=document.createElement('button');share.type='button';share.textContent='Produktlink kopieren';share.onclick=run(async()=>{const url=new URL(window.location.href);url.search='';url.hash='';url.searchParams.set('url','https://www.amazon.de/dp/'+w.wishlist_products.asin);await copyShareLink(url.toString());report('Link zum Hinzufügen kopiert')});div.append(share);const hide=document.createElement('button');hide.type='button';hide.textContent='Für mich ausblenden';hide.setAttribute('aria-label','Wunsch ausblenden: '+w.wishlist_products.title);hide.onclick=()=>{hiddenWishIds.add(w.id);lastHiddenWishId=w.id;const nextFocus=div.nextElementSibling?.querySelector('button,a')||div.previousElementSibling?.querySelector('button,a');div.remove();renderedWishCount=Math.max(0,renderedWishCount-1);if(!renderedWishCount)$('feed').textContent='Alle bisher geladenen Wünsche sind ausgeblendet. Du kannst die Ausblendungen oben zurücksetzen.';updateHiddenWishes();if(nextFocus?.isConnected)nextFocus.focus();else $('undoHiddenWish').focus();$('feedCount').textContent=renderedWishCount+' Wünsche sichtbar · '+hiddenWishIds.size+' Wünsche ausgeblendet'+'.';report('Wunsch für diese Sitzung ausgeblendet. Dies ist keine Meldung an die Moderation.');};div.append(hide);if(user&&w.user_id===user.id){const edit=document.createElement('button');edit.type='button';edit.textContent='Bearbeiten';edit.onclick=()=>{if(user?.id!==w.user_id||revision!==feedRevision){report('Diese Wunschkarte ist veraltet. Bitte Feed aktualisieren und den Wunsch erneut öffnen.');return;}wishEditorRevision++;editingWishId=w.id;$('updateWishExtrasCloud').hidden=false;$('saveWishExtrasCloud').hidden=false;$('wishExtrasCloudFeedback').textContent='';editingWishBaseline={id:w.id,note:w.note,priority:w.priority,visibility:w.visibility};editingWishExtrasBaseline=JSON.stringify(readWishExtras(user.id,w.id));editingWishFeedRevision=feedRevision;$('editHint').hidden=false;for(const fieldId of ['url','productTitle','wishNote']){$(fieldId).removeAttribute('aria-invalid');$(fieldId).removeAttribute('aria-describedby')}$('url').value='https://www.amazon.de/dp/'+w.wishlist_products.asin;$('url').disabled=true;$('productTitle').value=w.wishlist_products.title;$('productTitle').disabled=true;$('wishNote').value=w.note||'';$('priority').value=String(w.priority);$('wishVisibility').value=w.visibility||'public';$('saveWish').textContent='Änderungen speichern';fillWishExtras(user?.id,w.id);
// Read cloud extras only when this device has no saved value; never auto-import or overwrite.
const cloudOwner=user?.id,cloudWishId=w.id,cloudEditorRevision=wishEditorRevision;
if(cloudOwner&&!Object.keys(readWishExtras(cloudOwner,cloudWishId)).length){
 db.from('wishlist_wish_extras').select('image_url,target_price,quantity,wish_status').eq('user_id',cloudOwner).eq('wish_id',cloudWishId).maybeSingle().then(({data,error})=>{
  if(error||!data||user?.id!==cloudOwner||editingWishId!==cloudWishId||wishEditorRevision!==cloudEditorRevision)return;
  const fields=['wishImageUrl','wishTargetPrice','wishQuantity','wishStatus'];
  if(fields.some(id=>$(id).dataset.cloudEdited==='true'))return;
  $('wishImageUrl').value=data.image_url||'';
  $('wishTargetPrice').value=data.target_price??'';
  $('wishQuantity').value=data.quantity??1;
  $('wishStatus').value=data.wish_status||'open';
  updateWishExtrasPreview();
 }).catch(()=>{});
}
$('wishVisibility').dispatchEvent(new Event('change'));$('wishSaveFeedback').textContent='';$('wishEditorHeading').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});$('wishNote').focus({preventScroll:true});report('Notiz, Priorität und Sichtbarkeit bearbeiten')};div.append(edit);const remove=document.createElement('button');remove.type='button';remove.textContent='Wunsch entfernen';remove.setAttribute('aria-label','Wunsch entfernen: '+w.wishlist_products.title);remove.onclick=run(async()=>{if(!confirm('Diesen Wunsch wirklich entfernen?'))return;const ownerId=requireUser();if(w.user_id!==ownerId)throw Error('Dieser Wunsch gehört nicht zu deinem Konto');const deleted=await db.from('wishlist_wishes').delete().eq('id',w.id).eq('user_id',ownerId).select('id');if(deleted.error)throw deleted.error;if(!deleted.data?.length)throw Error('Wunsch konnte nicht entfernt werden.');if(user?.id!==ownerId)return;if(editingWishId===w.id)resetWishEditor();await refreshFeed();if(user?.id!==ownerId)return;await dashboard.refresh();if(user?.id!==ownerId)return;report('Wunsch entfernt')});div.append(remove)}fragment.append(div)}if(isStale()){feedRefreshPending=true;return;}if(!requestedOffset){$('feed').replaceChildren();renderedWishCount=0;}else if(!renderedWishCount&&fragment.childElementCount)$('feed').replaceChildren();renderedWishCount+=fragment.childElementCount;$('feed').append(fragment);offset=requestedOffset+page.items.length;$('feedCount').textContent=renderedWishCount+' Wünsche sichtbar'+(hiddenWishIds.size?' · '+hiddenWishIds.size+' Wünsche ausgeblendet':'')+'.';$('more').disabled=!page.hasMore;if(!offset)$('feed').textContent='Noch keine Wünsche.';else if(!renderedWishCount)$('feed').textContent=hiddenWishIds.size?'Alle bisher geladenen Wünsche sind ausgeblendet. Du kannst die Ausblendungen oben zurücksetzen.':'Keine sichtbaren Wünsche auf dieser Seite.'}catch(e){if(isStale()){feedRefreshPending=true;return;}if(!feedRefreshPending){$('more').disabled=true;$('feedCount').textContent='Laden fehlgeschlagen.';if(!offset)$('feed').textContent='Wünsche konnten nicht geladen werden. Mit „Erneut laden“ kannst du es noch einmal versuchen.';}throw e}finally{feedBusy=false;$('feed').removeAttribute('aria-busy');if(feedRefreshPending){feedRefreshPending=false;await refreshFeed()}}}

$('feedFilter').onchange=run(async()=>{await refreshFeed()});
$('feedSort').onchange=run(async()=>{await refreshFeed()});
$('reloadFeed').onclick=run(async()=>{await refreshFeed()});

const importedProductUrl=sharedAmazonProductUrl(new URLSearchParams(window.location.search).get('url'));if(importedProductUrl)$('url').value=importedProductUrl;
$('more').onclick=async()=>{const button=$('more');if(button.disabled)return;button.disabled=true;try{await feed()}catch(e){report(wishlistErrorMessage(e));button.disabled=true}};let authEventGeneration=0;db.auth.onAuthStateChange(()=>{const eventGeneration=++authEventGeneration;setTimeout(async()=>{if(eventGeneration!==authEventGeneration)return;try{await auth();if(eventGeneration!==authEventGeneration)return;await refreshFeed()}catch(e){if(eventGeneration===authEventGeneration)report(wishlistErrorMessage(e))}},0)});await auth().catch(e=>report(wishlistErrorMessage(e)));await feed().catch(e=>report(wishlistErrorMessage(e)));
