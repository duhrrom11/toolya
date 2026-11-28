import {validateCapture,unitPrice,speechFields,occasionTotal,queueReceipts,removeInbox,scanReceiptBatch} from './budget-capture.mjs';
import {parseCents,decimalCents} from './budget-domain.mjs';
export function mountCapture(root,api){
 const en=()=>window.__toolyaUILocale==='en',t=(a,b)=>en()?b:a,locale=()=>en()?'en':'de';
 const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!=null)n.textContent=txt;return n;};
 const details=el('details'),summary=el('summary','Belegerfassung erweitern'),body=el('div'),status=el('p');summary.dataset.toolEn='Advanced receipt capture';details.className='border rounded-xl p-3 space-y-3';body.className='space-y-3';status.setAttribute('role','status');details.append(summary,body,status);root.append(details);
 let busy=false;
 const field=(id)=>document.getElementById(id);
 const money=c=>new Intl.NumberFormat(en()?'en-GB':'de-DE',{style:'currency',currency:'EUR'}).format(c/100);
 function render(){
 body.replaceChildren();if(!details.open)return;
 try{
 const ctx=api.context(),state=validateCapture(api.capture());
 const section=(a,b)=>{const s=el('section');s.className='border rounded-lg p-2 space-y-2';s.append(el('h4',t(a,b)));body.append(s);return s;};
 const input=(label,type='text')=>{const n=el('input');n.type=type;n.setAttribute('aria-label',label);n.placeholder=label;n.className='border rounded p-2 w-full';return n;};
 const button=(a,b,fn)=>{const n=el('button',t(a,b));n.type='button';n.className='border rounded p-2';n.addEventListener('click',fn);return n;};
 const run=async fn=>{if(busy||!api.sameContext(ctx))return;busy=true;try{await fn();status.textContent=t('Gespeichert.','Saved.');render();}catch{status.textContent=t('Nicht gespeichert. Eingaben oder Cloud prüfen.','Not saved. Check input or cloud.');}finally{busy=false;}};
 const save=fn=>run(()=>api.saveCapture(ctx,fn));
 const templates=section('Buchungsvorlagen','Transaction templates');
 templates.append(button('Aktuelle Eingaben als Vorlage speichern','Save current fields as template',()=>save(s=>({...s,templates:[...s.templates,{id:crypto.randomUUID(),title:field('receiptTitle').value,store:field('receiptStore').value,category:field('receiptCategory').value,cents:parseCents(field('receiptPrice').value,'en')}]}))));
 for(const r of state.templates){const row=el('div',r.title+' · '+money(r.cents)+' ');row.append(button('Übernehmen','Apply',()=>{if(!api.sameContext(ctx))return;field('receiptTitle').value=r.title;field('receiptStore').value=r.store;field('receiptCategory').value=r.category;field('receiptPrice').value=decimalCents(r.cents);}),button('Löschen','Delete',()=>save(s=>({...s,templates:s.templates.filter(x=>x.id!==r.id)}))));templates.append(row);}
 const voice=section('Spracheingabe','Voice input'),transcript=input(t('Titel und Betrag, z. B. Einkauf 12,50','Title and amount, e.g. Groceries 12.50'));
 voice.append(transcript,button('Text übernehmen','Apply text',()=>{try{if(!api.sameContext(ctx))return;const r=speechFields(transcript.value,locale());field('receiptTitle').value=r.title;if(r.cents!=null)field('receiptPrice').value=decimalCents(r.cents);}catch{status.textContent=t('Text prüfen.','Check text.');}}));
 voice.append(button('Mikrofon starten','Start microphone',()=>{const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Speech){status.textContent=t('Browser unterstützt keine Spracheingabe. Text eingeben.','Browser does not support speech recognition. Enter text.');return;}try{const rec=new Speech();rec.lang=en()?'en-GB':'de-DE';rec.onresult=e=>{if(api.sameContext(ctx))transcript.value=e.results[0][0].transcript;};rec.onerror=()=>{status.textContent=t('Spracheingabe fehlgeschlagen.','Speech recognition failed.');};rec.start();}catch{status.textContent=t('Mikrofon nicht verfügbar.','Microphone unavailable.');}}));
 const inbox=section('Beleg-Eingang und Stapel','Receipt inbox and batch'),files=input(t('Belegbilder','Receipt images'),'file');files.multiple=true;files.accept='image/jpeg,image/png,image/gif,image/webp';inbox.append(files,button('Bilder in Eingang speichern','Save images to inbox',()=>run(async()=>{const selected=Array.from(files.files||[]);if(!selected.length||selected.reduce((a,f)=>a+f.size,0)>4*1024*1024)throw Error('files');const rows=await Promise.all(selected.map(f=>new Promise((resolve,reject)=>{if(!['image/jpeg','image/png','image/gif','image/webp'].includes(f.type)||!f.size)return reject(Error('file'));const reader=new FileReader();reader.onerror=reject;reader.onload=()=>resolve({id:crypto.randomUUID(),name:f.name,photo:reader.result});reader.readAsDataURL(f);})));if(!api.sameContext(ctx))throw Error('session');await api.saveCapture(ctx,s=>queueReceipts(s,rows));})));
 const batchOutput=el('div');
 inbox.append(button('Stapel mit OCR prüfen','Review batch with OCR',async()=>{
 if(busy||!api.sameContext(ctx)||!state.inbox.length)return;busy=true;let worker;
 try{
 const language=field('receiptOcrLanguage').value;
 const {loadOcrLibrary}=await import('../../shared/toolya/receipt-ocr.mjs');
 const library=await loadOcrLibrary();if(!api.sameContext(ctx))return;
 worker=await library.createWorker(language);
 const results=await scanReceiptBatch(state.inbox,language,async photo=>(await worker.recognize(photo)).data.text,()=>api.sameContext(ctx));
 batchOutput.replaceChildren();
 for(const r of results){const row=el('div'),label=state.inbox.find(x=>x.id===r.id)?.name||'';row.append(el('strong',label),el('pre',r.error?t('OCR fehlgeschlagen','OCR failed'):r.text));row.className='border rounded p-2 whitespace-pre-wrap break-words';batchOutput.append(row);}
 status.textContent=t('Ergebnisse prüfen und Belege einzeln öffnen.','Review results and open receipts individually.');
 }catch{status.textContent=t('Stapelprüfung abgebrochen.','Batch review interrupted.');}finally{if(worker)try{await worker.terminate();}catch{}busy=false;}
 }),batchOutput);
 for(const r of state.inbox){const row=el('div',r.name+' ');row.append(button('Im Belegformular öffnen','Open in receipt form',async()=>{if(!api.sameContext(ctx))return;try{const blob=await (await fetch(r.photo)).blob();if(!api.sameContext(ctx))return;const dt=new DataTransfer();dt.items.add(new File([blob],r.name,{type:blob.type}));const target=field('receiptPhotoInput');target.files=dt.files;target.dispatchEvent(new Event('change'));target.scrollIntoView({block:'center'});}catch{status.textContent=t('Bild konnte nicht geöffnet werden.','Could not open image.');}}),button('Aus Eingang entfernen','Remove from inbox',()=>save(s=>removeInbox(s,r.id))));inbox.append(row);}
 const unit=section('Grundpreis','Unit price'),price=input(t('Preis','Price')),qty=input(t('Menge','Quantity')),units=el('select'),result=el('p');for(const u of ['g','kg','ml','l','pc']){const o=el('option',u==='pc'?t('Stück','piece'):u);o.value=u;units.append(o);}units.setAttribute('aria-label',t('Einheit','Unit'));unit.append(price,qty,units,button('Berechnen','Calculate',()=>{try{const r=unitPrice(parseCents(price.value,locale()),qty.value,units.value,locale());result.textContent=money(r.cents)+' / '+(r.unit==='pc'?t('Stück','piece'):r.unit);}catch{result.textContent=t('Preis und Menge prüfen.','Check price and quantity.');}}),result);
 const occasions=section('Anlassbezogene Ausgaben','Occasion expenses'),name=input(t('Anlass','Occasion'));occasions.append(name,button('Anlass erstellen','Create occasion',()=>save(s=>({...s,occasions:[...s.occasions,{id:crypto.randomUUID(),title:name.value,bookingIds:[]}]}))));
 for(const o of state.occasions){const row=el('div',o.title+' · '+money(occasionTotal(api.entries(),o))),picker=el('select');picker.setAttribute('aria-label',t('Buchung','Transaction'));for(const r of api.entries().filter(r=>r.entryType!=='einnahme'&&r.category!=='Einnahme'&&r.transferId==null)){const opt=el('option',r.date+' · '+r.title);opt.value=String(r.id);picker.append(opt);}row.append(picker,button('Zuordnen','Assign',()=>save(s=>({...s,occasions:s.occasions.map(x=>x.id===o.id?{...x,bookingIds:[...x.bookingIds,Number(picker.value)]}:x)}))),button('Zuordnung lösen','Unassign',()=>save(s=>({...s,occasions:s.occasions.map(x=>x.id===o.id?{...x,bookingIds:x.bookingIds.filter(k=>k!==Number(picker.value))}:x)}))),button('Anlass löschen','Delete occasion',()=>save(s=>({...s,occasions:s.occasions.filter(x=>x.id!==o.id)}))));occasions.append(row);}
 }catch{status.textContent=t('Cloud nicht bereit.','Cloud not ready.');}
 }
 details.addEventListener('toggle',render);document.addEventListener('toolya:locale-change',render);return {render};
}
