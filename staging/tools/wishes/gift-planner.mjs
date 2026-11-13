const db=window.supabase.createClient('https://avapuibsidubuzxjtyld.supabase.co','sb_publishable_95Vz26YwSFFWukFbqTBjMw_pv10kOFC');
const $=id=>document.getElementById(id);
const euro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(n)||0);
const statuses={idea:'💡 Idee',planned:'📝 Geplant',purchased:'🛍️ Gekauft',wrapped:'🎀 Verpackt',gifted:'🎁 Verschenkt'};
let user=null,occasions=[],gifts=[],editing=null,collections=[],suggestions=[],selectedProduct=null,coordination=new Map(),giftEditOrigin=null;
const feedback=(id,message)=>{$(id).textContent=message;$('status').textContent=message};
const invalid=(id,message,feedbackId)=>{const field=$(id);field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby',feedbackId);feedback(feedbackId,message);field.focus()};
for(const id of ['budgetAmount','budgetOccasion','occasion','title','planned','actual'])for(const type of ['input','change'])$(id).addEventListener(type,()=>{$(id).removeAttribute('aria-invalid');$(id).removeAttribute('aria-describedby')});
const byId=id=>occasions.find(x=>x.id===id);
const number=id=>{const v=Number($(id).value);return Number.isFinite(v)&&v>=0?v:null};
function option(select,value,label){const el=document.createElement('option');el.value=value;el.textContent=label;select.append(el)}
function choices(){
 for(const id of ['occasion','budgetOccasion','filterOccasion'])$(id).replaceChildren();
 option($('filterOccasion'),'all','Alle Anlässe');
 for(const o of occasions){for(const id of ['occasion','budgetOccasion','filterOccasion'])option($(id),o.id,o.title+(o.person_name?' · '+o.person_name:''))}
 $('budgetAmount').value=String(byId($('budgetOccasion').value)?.budget_amount||0);
}
function reset(){selectedProduct=null;showProductSource();editing=null;$('form').reset();$('planned').value='0';$('formTitle').textContent='➕ Geschenk hinzufügen';$('save').textContent='Geschenk speichern';$('cancel').hidden=true}
function render(){
 renderRecommendations();
 const totalBudget=occasions.reduce((s,o)=>s+Number(o.budget_amount||0),0);
 const planned=gifts.reduce((s,g)=>s+Number(g.planned_amount||0),0);
 const spent=gifts.reduce((s,g)=>s+Number(g.actual_amount||0),0);
 $('metricBudget').textContent=euro(totalBudget);$('metricPlanned').textContent=euro(planned);$('metricSpent').textContent=euro(spent);$('metricDone').textContent=gifts.filter(g=>g.status==='gifted').length+'/'+gifts.length;
 const current=byId($('budgetOccasion').value);
 const budget=Number(current?.budget_amount||0),used=gifts.filter(g=>g.occasion_id===current?.id).reduce((s,g)=>s+Number(g.actual_amount||0),0);
 $('budgetInfo').textContent=current?'Ausgegeben: '+euro(used)+' von '+euro(budget)+(budget>0?' · '+(used>budget?'Budget überschritten um '+euro(used-budget):'Verbleibend: '+euro(budget-used)):' · Noch kein Budget gesetzt.'):'Lege zuerst einen Anlass an.';
 $('budgetProgress').value=budget>0?Math.min(100,used/budget*100):0;
 const warnings=$('budgetWarnings');warnings.replaceChildren();for(const o of occasions){const budget=Number(o.budget_amount||0);const spentOn=gifts.filter(g=>g.occasion_id===o.id).reduce((n,g)=>n+Number(g.actual_amount||0),0);const plannedOn=gifts.filter(g=>g.occasion_id===o.id).reduce((n,g)=>n+Number(g.planned_amount||0),0);if(budget>0&&(spentOn>budget||plannedOn>budget)){const w=document.createElement('p');w.className='warning';w.textContent='⚠️ '+o.title+': '+(spentOn>budget?'Ausgaben '+euro(spentOn):'Planung '+euro(plannedOn))+' über Budget '+euro(budget);warnings.append(w)}}
 const root=$('gifts');root.replaceChildren();
 const rows=gifts.filter(g=>($('filterOccasion').value==='all'||g.occasion_id===$('filterOccasion').value)&&($('filterStatus').value==='all'||g.status===$('filterStatus').value)).sort((a,b)=>b.created_at.localeCompare(a.created_at));
 if(!rows.length){const p=document.createElement('p');p.className='empty';p.textContent='Noch keine passenden Geschenke. Lege links deine erste Geschenkidee an.';root.append(p)}
 for(const g of rows){
  const card=document.createElement('article');card.className='gift',main=document.createElement('div'),badge=document.createElement('span');badge.className='tag';badge.textContent=statuses[g.status]||g.status;
  const h=document.createElement('h3');h.textContent=g.title;
  const p=document.createElement('p');p.textContent=(byId(g.occasion_id)?.title||'Anlass')+(g.recipient_name?' · Für '+g.recipient_name:'');
  const money=document.createElement('p');money.textContent='Geplant: '+euro(g.planned_amount)+' · Ausgegeben: '+(g.actual_amount===null?'–':euro(g.actual_amount));
  main.append(badge,h,p,money);if(g.source_wish_id){const reservation=document.createElement('p');reservation.className='tag';reservation.textContent=coordination.get(g.id)==='reserved_by_you'?'🎀 Von dir reserviert':'🔒 Keine eigene aktive Reservierung';main.append(reservation)}if(g.source_product_id){const link=document.createElement('a');link.href='https://www.amazon.de/dp/'+encodeURIComponent((g.product_asin||'').trim());link.textContent='📦 Produktquelle';if(g.product_asin)main.append(link);else{const tag=document.createElement('p');tag.textContent='📦 Produkt verknüpft';main.append(tag)}}if(g.source_list_id&&collections.some(c=>c.id===g.source_list_id)){const a=document.createElement('a');a.href='./collection.html?id='+encodeURIComponent(g.source_list_id);a.textContent='🌈 Verknüpfte Wunschwelt ↗';main.append(a)}
  if(g.notes){const notes=document.createElement('p');notes.textContent=g.notes;main.append(notes)}
  const controls=document.createElement('div');controls.className='controls';
  const edit=document.createElement('button');edit.type='button';edit.textContent='✏️ Bearbeiten';edit.addEventListener('click',()=>{giftEditOrigin=edit;$('giftFormFeedback').textContent='';editing=g.id;$('occasion').value=g.occasion_id;$('title').value=g.title;$('recipient').value=g.recipient_name||'';$('planned').value=String(g.planned_amount);$('actual').value=g.actual_amount===null?'':String(g.actual_amount);$('giftStatus').value=g.status;$('notes').value=g.notes||'';$('sourceList').value=g.source_list_id||'';selectedProduct=g.source_product_id?{product_id:g.source_product_id,wish_id:g.source_wish_id||null,title:g.title}:null;showProductSource();$('formTitle').textContent='✏️ Geschenk bearbeiten';$('save').textContent='Änderungen speichern';$('cancel').hidden=false;$('form').scrollIntoView({behavior:'smooth',block:'start'});$('title').focus()});
  const remove=document.createElement('button');remove.type='button';remove.textContent='🗑️ Löschen';remove.addEventListener('click',async()=>{if(!confirm('Dieses Geschenk dauerhaft löschen?'))return;remove.disabled=true;const {error}=await db.from('wishlist_gift_plans').delete().eq('id',g.id).eq('user_id',user.id);if(error){$('status').textContent='Löschen fehlgeschlagen.';remove.disabled=false}else{gifts=gifts.filter(x=>x.id!==g.id);if(editing===g.id)reset();render();$('status').textContent='Geschenk gelöscht.'}});
  const progress=document.createElement('select');progress.setAttribute('aria-label','Geschenkstatus ändern: '+g.title);progress.style.cssText='min-height:44px;border-radius:10px;padding:9px;border:1px solid #a99ac3;background:transparent;color:inherit;font:inherit';
 for(const [value,label] of Object.entries(statuses))option(progress,value,label);progress.value=g.status;
 progress.addEventListener('change',async()=>{const next=progress.value;progress.disabled=true;const owned=coordination.get(g.id)==='reserved_by_you';let release=false;
 if(next==='gifted'&&owned)release=confirm('Geschenk als verschenkt markieren und DEINE Reservierung gleichzeitig freigeben?\nOK = verschenkt und Reservierung freigeben.\nAbbrechen = nur Status ändern.');
 const {error}=await db.rpc('wishlist_update_gift_progress',{p_plan_id:g.id,p_status:next,p_release_reservation:release});
 progress.disabled=false;if(error){progress.value=g.status;$('status').textContent='Statuswechsel fehlgeschlagen.';return}
 g.status=next;if(release)coordination.set(g.id,'not_reserved_by_you');render();$('status').textContent=release?'Geschenkstatus gespeichert und eigene Reservierung freigegeben.':'Geschenkstatus gespeichert.';
 });
 controls.prepend(progress);
 controls.append(edit,remove);card.append(main,controls);root.append(card);
 }
}
async function load(){
 const {data,error}=await db.auth.getUser();user=data?.user;
 if(error||!user){$('login').hidden=false;$('status').textContent='Bitte anmelden.';return}
 const [o,g,publicLists,bookmarks]=await Promise.all([db.from('wishlist_occasions').select('id,title,person_name,budget_amount').eq('user_id',user.id).order('occasion_date').limit(1000),db.from('wishlist_gift_plans').select('id,occasion_id,title,recipient_name,planned_amount,actual_amount,status,notes,source_list_id,source_wish_id,source_product_id,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(1000),db.from('wishlist_lists').select('id,title,description,user_id').eq('visibility','public').eq('archived',false).order('created_at',{ascending:false}).limit(100),db.from('wishlist_collection_bookmarks').select('list_id').eq('user_id',user.id).limit(200)]);
 if(o.error||g.error)throw o.error||g.error;if(publicLists.error||bookmarks.error)throw publicLists.error||bookmarks.error;
 occasions=o.data||[];gifts=g.data||[];const saved=new Set((bookmarks.data||[]).map(x=>x.list_id));collections=(publicLists.data||[]).filter(x=>x.user_id===user.id||saved.has(x.id));const select=$('sourceList');for(const c of collections)option(select,c.id,c.title);suggestions=collections.slice();$('content').hidden=false;choices();await loadCoordination();render();$('status').textContent=occasions.length?'Deine Geschenkplanung ist aktuell.':'Lege zuerst einen Anlass in der Anlasszentrale an.';await importReservedWish();
}
$('budgetOccasion').addEventListener('change',()=>{$('budgetAmount').value=String(byId($('budgetOccasion').value)?.budget_amount||0);render()});
$('filterOccasion').addEventListener('change',render);$('filterStatus').addEventListener('change',render);
$('saveBudget').addEventListener('click',async()=>{const id=$('budgetOccasion').value,amount=number('budgetAmount');if(!id||amount===null||amount>9999999999){invalid(!id?'budgetOccasion':'budgetAmount','Bitte einen Anlass und gültiges Budget wählen.','budgetSaveFeedback');return}
 $('saveBudget').disabled=true;const {error}=await db.from('wishlist_occasions').update({budget_amount:amount,updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',user.id);$('saveBudget').disabled=false;
 if(error){feedback('budgetSaveFeedback','Budget konnte nicht gespeichert werden.');return}
 const o=byId(id);if(o)o.budget_amount=amount;render();feedback('budgetSaveFeedback','Anlassbudget gespeichert.');
});
$('form').addEventListener('submit',async event=>{event.preventDefault();const occasionId=$('occasion').value,title=$('title').value.trim(),planned=number('planned'),actual=$('actual').value===''?null:number('actual');
 if(!user||!byId(occasionId)||!title||planned===null||planned>9999999999||(actual!==null&&(actual<0||actual>9999999999))){const invalidId=!byId(occasionId)?'occasion':!title?'title':(planned===null||planned>9999999999)?'planned':'actual';invalid(invalidId,'Bitte alle Beträge und Pflichtfelder prüfen.','giftFormFeedback');return}
 const payload={occasion_id:occasionId,title,recipient_name:$('recipient').value.trim()||null,planned_amount:planned,actual_amount:actual,status:$('giftStatus').value,source_list_id:$('sourceList').value||null,source_wish_id:selectedProduct?.wish_id||null,source_product_id:selectedProduct?.product_id||null,notes:$('notes').value.trim()||null,updated_at:new Date().toISOString()};
 $('save').disabled=true;
 try{const fields='id,occasion_id,title,recipient_name,planned_amount,actual_amount,status,notes,source_list_id,source_wish_id,source_product_id,created_at';const r=editing?await db.from('wishlist_gift_plans').update(payload).eq('id',editing).eq('user_id',user.id).select(fields).single():await db.from('wishlist_gift_plans').insert({...payload,user_id:user.id}).select(fields).single();
 if(r.error)throw r.error;gifts=gifts.filter(x=>x.id!==r.data.id);gifts.push(r.data);if(r.data.source_wish_id)await loadCoordination();reset();render();feedback('giftFormFeedback','Geschenk gespeichert.');$('giftFormFeedback').focus({preventScroll:true});
 }catch{feedback('giftFormFeedback','Geschenk konnte nicht gespeichert werden.')}finally{$('save').disabled=false}
});
$('cancel').addEventListener('click',()=>{const origin=giftEditOrigin;reset();$('giftFormFeedback').textContent='';giftEditOrigin=null;feedback('giftFormFeedback','Bearbeitung abgebrochen.');if(origin?.isConnected)origin.focus({preventScroll:true});else $('giftFormFeedback').focus({preventScroll:true})});

const keywords=s=>String(s||'').toLocaleLowerCase('de-DE').split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>3&&!['geschenk','geschenke','wunschliste','wunschwelt','meine','deine','einen','einem'].includes(w));
function renderRecommendations(){
 const root=$('recommendations');root.replaceChildren();
 const selected=byId($('occasion').value)||occasions[0];const target=new Set(keywords([selected?.title,selected?.person_name,...gifts.filter(g=>g.occasion_id===selected?.id).map(g=>g.title)].join(' ')));
 const ranked=suggestions.map(c=>({c,score:keywords(c.title+' '+(c.description||'')).filter(w=>target.has(w)).length})).sort((a,b)=>b.score-a.score||a.c.title.localeCompare(b.c.title,'de')).slice(0,6);
 if(!ranked.length){const p=document.createElement('p');p.className='empty';p.textContent='Merke dir öffentliche Wunschwelten, um hier kostenlose Geschenkideen zu erhalten.';root.append(p);return}
 for(const {c,score} of ranked){const card=document.createElement('article');card.className='recommendation',h=document.createElement('h3');h.textContent=c.title;const p=document.createElement('p');p.textContent=score?'Passt zu Stichwörtern deiner Planung.':'In deiner Merkliste oder deinen öffentlichen Sammlungen.';const a=document.createElement('a');a.href='./collection.html?id='+encodeURIComponent(c.id);a.textContent='Wunschwelt ansehen ↗';const button=document.createElement('button');button.type='button';button.textContent='Als Geschenkidee übernehmen';button.addEventListener('click',()=>{if(!occasions.length){$('status').textContent='Bitte zuerst einen Anlass anlegen.';return}$('occasion').value=selected?.id||occasions[0].id;$('title').value=c.title;$('sourceList').value=c.id;$('giftStatus').value='idea';$('form').scrollIntoView({behavior:'smooth',block:'start'});$('title').focus();$('status').textContent='Vorschlag übernommen – zum Speichern bitte Geschenk prüfen.'});card.append(h,p,a,button);root.append(card)}
}
$('occasion').addEventListener('change',renderRecommendations);



async function loadCoordination(){
 const {data,error}=await db.rpc('wishlist_my_gift_coordination',{p_limit:500});
 if(error){$('status').textContent='Reservierungsabgleich nicht verfügbar.';return}
 coordination=new Map((data||[]).map(row=>[row.plan_id,row.reservation_state]));
}
async function importReservedWish(){
 const raw=new URLSearchParams(location.search).get('reserved_wish');
 if(!raw||!/^[0-9]{1,18}$/.test(raw))return;
 const {data,error}=await db.rpc('wishlist_my_reservation_for_plan',{p_wish_id:raw});
 if(error||!data?.length||!occasions.length){$('status').textContent='Reservierter Wunsch konnte nicht übernommen werden. Bitte prüfe Anmeldung, Öffentlichkeit und Anlässe.';return}
 const item=data[0];
 selectedProduct={wish_id:item.wish_id,product_id:item.product_id,title:item.product_title};showProductSource();
 $('title').value=item.product_title.slice(0,150);$('giftStatus').value='idea';
 if(item.collection_id&&collections.some(c=>c.id===item.collection_id))$('sourceList').value=item.collection_id;
 $('form').scrollIntoView({behavior:'smooth',block:'start'});
 history.replaceState(null,'',location.pathname);
 $('status').textContent='Reservierten Wunsch als Geschenkentwurf übernommen. Bitte Anlass auswählen und speichern.';
}
function showProductSource(){
 $('productSourceLabel').textContent=selectedProduct?'📦 Verknüpftes Produkt: '+selectedProduct.title:'Keine Produktverknüpfung ausgewählt.';
 $('clearProduct').hidden=!selectedProduct;
}
$('clearProduct').addEventListener('click',()=>{selectedProduct=null;showProductSource()});
async function searchProducts(){
 const q=$('productQuery').value.trim(),root=$('productResults');root.replaceChildren();
 if(q.length<2){$('productSearchStatus').textContent='Bitte mindestens zwei Zeichen eingeben.';return}
 $('searchProducts').disabled=true;$('productSearchStatus').textContent='Suche läuft …';
 try{
  const safe=q.replace(/[,%()]/g,' ').trim();if(safe.length<2)throw Error('Bitte einen Suchbegriff verwenden.');
  const {data:products,error}=await db.from('wishlist_products').select('id,title,asin').ilike('title','%'+safe+'%').order('created_at',{ascending:false}).limit(40);
  if(error)throw error;
  const ids=(products||[]).map(p=>p.id);
  let wishes=[];
  if(ids.length){const result=await db.from('wishlist_wishes').select('id,product_id,priority').eq('visibility','public').in('product_id',ids).order('created_at',{ascending:false}).limit(200);if(result.error)throw result.error;wishes=result.data||[]}
  const wishByProduct=new Map();for(const w of wishes)if(!wishByProduct.has(String(w.product_id)))wishByProduct.set(String(w.product_id),w);
  $('productSearchStatus').textContent=(products||[]).length+' Produkte gefunden · '+wishByProduct.size+' mit öffentlichen Wünschen. Die Suche zeigt höchstens 40 Produkte.';
  if(!products?.length){const p=document.createElement('p');p.className='empty';p.textContent='Keine passenden Produkte gefunden.';root.append(p)}
  for(const product of products||[]){
   const wish=wishByProduct.get(String(product.id));
   const card=document.createElement('article');card.className='product-result';
   const h=document.createElement('h3');h.textContent=product.title;
   const info=document.createElement('p');info.textContent=wish?'🌟 Öffentlicher Wunsch vorhanden':'📦 Produkt aus dem Katalog';
   const button=document.createElement('button');button.type='button';button.textContent='Als Geschenk übernehmen';
   button.addEventListener('click',()=>{
    if(!occasions.length){$('status').textContent='Bitte zuerst einen Anlass anlegen.';return}
    selectedProduct={product_id:product.id,wish_id:wish?.id||null,title:product.title};showProductSource();
    $('title').value=product.title.slice(0,150);$('giftStatus').value='idea';$('form').scrollIntoView({behavior:'smooth',block:'start'});$('title').focus();
    $('status').textContent='Produkt als Entwurf übernommen. Bitte Geschenk prüfen und speichern.';
   });
   card.append(h,info);
   if(product.asin&&/^[A-Z0-9]{10}$/i.test(product.asin)){const a=document.createElement('a');a.href='https://www.amazon.de/dp/'+encodeURIComponent(product.asin);a.target='_blank';a.rel='noopener noreferrer';a.textContent='Produkt bei Amazon ansehen ↗';card.append(a)}
   card.append(button);root.append(card);
  }
 }catch{$('productSearchStatus').textContent='Suche fehlgeschlagen. Bitte erneut versuchen.'}
 finally{$('searchProducts').disabled=false}
}
$('searchProducts').addEventListener('click',searchProducts);
$('productQuery').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();searchProducts()}});
load().catch(()=>{$('status').textContent='Geschenkplanung konnte nicht geladen werden. Bitte später erneut versuchen.'});
