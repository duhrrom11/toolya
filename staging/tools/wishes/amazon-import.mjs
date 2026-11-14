// Preview snapshots are server-owned. Commit sends only the snapshot ID and user choices.
export function mountAmazonImport({db,getUser,dashboard,refreshFeed}){
 const $=id=>document.getElementById(id);let generation=0;
 function mount(anchor,kind){
 const panel=document.createElement('section');panel.className='amazon-import';
 const heading=document.createElement('h3');heading.textContent=kind==='list'?'Amazon-Wunschliste übernehmen':'Amazon-Produkt übernehmen';
 const label=document.createElement('label');label.textContent=kind==='list'?'Öffentlichen Amazon.de-Wunschlistenlink eingeben':'Amazon.de-Produktlink eingeben';
 const input=document.createElement('input');input.type='url';input.maxLength=2048;input.placeholder=kind==='list'?'https://www.amazon.de/hz/wishlist/ls/…':'https://www.amazon.de/dp/…';label.append(input);
 const preview=document.createElement('button');preview.type='button';preview.textContent='Amazon-Link auslesen';
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const results=document.createElement('div');
 const nameLabel=document.createElement('label');nameLabel.textContent='Name der neuen Liste';const name=document.createElement('input');name.maxLength=80;nameLabel.append(name);nameLabel.hidden=kind!=='list';
 const visibilityLabel=document.createElement('label');visibilityLabel.textContent='Sichtbarkeit neuer Wünsche';const visibility=document.createElement('select');for(const [v,t] of [['private','Nur für mich'],['public','Öffentlich']]){const o=document.createElement('option');o.value=v;o.textContent=t;visibility.append(o)}visibilityLabel.append(visibility);
 const commit=document.createElement('button');commit.type='button';commit.textContent=kind==='list'?'Neue Liste mit diesen Produkten anlegen':'Produkt als Wunsch speichern';commit.hidden=true;
 panel.append(heading,label,preview,status,results,nameLabel,visibilityLabel,commit);anchor.after(panel);
 let snapshot=null,busy=false,version=0;
 function reset(){version++;snapshot=null;results.replaceChildren();commit.hidden=true;status.textContent='';}
 input.addEventListener('input',reset);
 function lock(value){busy=value;input.disabled=value;preview.disabled=value;commit.disabled=value;name.disabled=value;visibility.disabled=value;}
 preview.onclick=async()=>{
 if(busy)return;reset();const uid=getUser()?.id;if(!uid){status.textContent='Bitte zuerst anmelden.';return}const rev=version,gen=generation;lock(true);status.textContent='Amazon wird ausgelesen …';
 try{const {data,error}=await db.functions.invoke('amazon-scrape',{body:{url:input.value.trim()}});if(gen!==generation||rev!==version||uid!==getUser()?.id)return;
 if(error||data?.error){let message=data?.error;try{message=message||(await error.context.json()).error}catch{}throw Error(message||'Amazon-Abruf fehlgeschlagen. Bitte später erneut versuchen.');}
 if(data.kind!==kind)throw Error(kind==='list'?'Bitte hier einen Wunschlistenlink eingeben.':'Bitte hier einen einzelnen Produktlink eingeben.');
 for(const p of data.products){const card=document.createElement('article');card.className='amazon-preview-card';if(p.imageUrl){const img=document.createElement('img');img.src=p.imageUrl;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';img.width=100;img.height=100;img.style.objectFit='contain';card.append(img)}const title=document.createElement('strong');title.textContent=p.title;const info=document.createElement('p');info.textContent=[p.price===null?'Preis nicht verfügbar':new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(p.price),'ASIN: '+p.asin,!p.imageUrl?'Bild nicht verfügbar':''].filter(Boolean).join(' · ');const link=document.createElement('a');link.href=p.productUrl;link.textContent='Bei Amazon ansehen (Partnerlink)';link.target='_blank';link.rel='noopener noreferrer sponsored';card.append(title,info,link);if(p.description){const desc=document.createElement('p');desc.textContent=p.description;card.append(desc)}results.append(card)}
 name.value=data.title;status.textContent=data.complete?`${data.products.length} Produkte erkannt. Bitte prüfen und speichern. Preisangaben sind eine Momentaufnahme. Bereits vorhandene Wünsche bleiben erhalten.`:(data.warnings||[]).join(' ');
 if(data.complete&&data.previewId){snapshot={id:data.previewId,uid,gen};commit.hidden=false;}
 }catch(e){if(gen===generation&&rev===version)status.textContent=e.message}finally{lock(false)}
 };
 commit.onclick=async()=>{if(busy||!snapshot)return;const s=snapshot;if(s.uid!==getUser()?.id||s.gen!==generation){reset();return}if(kind==='list'&&!name.value.trim()){status.textContent='Bitte einen Listennamen eingeben.';return}lock(true);status.textContent='Wünsche werden gespeichert …';
 try{const {data,error}=await db.rpc('toolya_amazon_import',{p_preview_id:s.id,p_list_title:kind==='list'?name.value.trim():null,p_visibility:visibility.value,p_target_list:kind==='product'?dashboard.selectedList():null});if(error)throw error;if(s.uid!==getUser()?.id||s.gen!==generation)return;snapshot=null;commit.hidden=true;status.textContent=`Gespeichert: ${data.inserted} neue Wünsche, ${data.existing} bereits vorhanden.`;try{await dashboard.refresh();await refreshFeed()}catch{status.textContent+=' Bitte Seite neu laden, um die gespeicherten Wünsche anzuzeigen.';}
 }catch(e){if(s.uid===getUser()?.id&&s.gen===generation)status.textContent='Speicherstatus unklar. Du kannst mit demselben Knopf sicher erneut prüfen; die Liste wird nicht doppelt angelegt. '+e.message;}finally{lock(false)}};
 return reset;
 }
 const listAnchor=$('createList');const resets=[mount(listAnchor,'list'),mount($('url').closest('label'),'product')];
 db.auth.onAuthStateChange(()=>{generation++;for(const reset of resets)reset()});
}
