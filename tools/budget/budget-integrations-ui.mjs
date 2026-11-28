import {meterEstimates,carCandidates,carReview,applyCarReview} from './budget-integrations.mjs';
export function mountIntegrations(root,api){
 const en=()=>window.__toolyaUILocale==='en',t=(a,b)=>en()?b:a;
 const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!=null)n.textContent=txt;return n;};
 const money=c=>new Intl.NumberFormat(en()?'en-GB':'de-DE',{style:'currency',currency:'EUR'}).format(c/100);
 const details=el('details'),summary=el('summary','Verbindungen zu Toolya-Werkzeugen'),body=el('div'),status=el('p');summary.dataset.toolEn='Connections to Toolya tools';details.className='border rounded-xl p-3 space-y-3';body.className='space-y-3';status.setAttribute('role','status');details.append(summary,body,status);root.append(details);
 let busy=false;
 function render(){
 body.replaceChildren();if(!details.open)return;
 try{
 const ctx=api.context();
 const button=(a,b,fn)=>{const n=el('button',t(a,b));n.type='button';n.className='border rounded p-2';n.addEventListener('click',fn);return n;};
 const run=async fn=>{if(busy||!api.sameContext(ctx))return;busy=true;try{await fn();}catch{status.textContent=t('Verbindung oder Datenstand prüfen.','Check connection or data version.');}finally{busy=false;}};
 const meter=el('section'),meterOut=el('div'),rate=el('select');rate.setAttribute('aria-label',t('Stromtarif','Electricity rate'));for(const [v,a,b] of [['HT','Hochtarif','High rate'],['NT','Niedertarif','Low rate']]){const n=el('option',t(a,b));n.value=v;rate.append(n);}
 meter.append(el('h4',t('Zählerstände','Meter readings')),el('p',t('Nur Schätzung des Verbrauchspreises, ohne Grundgebühr. Keine Buchung.','Consumption cost estimate only, excluding fixed fees. No transaction.')),rate,button('Eigene Zählerstände laden','Load my meter readings',()=>run(async()=>{
 const snapshot=await api.readSource(ctx,'zaehlerstaende-erfassen');if(!api.sameContext(ctx))return;meterOut.replaceChildren();
 const rows=meterEstimates(snapshot,rate.value);if(!rows.length)meterOut.append(el('p',t('Keine geeigneten Ablesungen und Tarife.','No eligible readings and tariffs.')));
 for(const r of rows)meterOut.append(el('p',r.name+' · '+r.from+' – '+r.to+' · '+r.consumption.toLocaleString(en()?'en-GB':'de-DE')+' × '+r.factor+' × '+r.rate+' EUR = '+money(r.cents)));
 })),meterOut);
 const car=el('section'),carOut=el('div');
 const load=()=>run(async()=>{
 const snapshot=await api.readSource(ctx,'autokosten-reifenwechsel');if(!api.sameContext(ctx))return;
 const rows=carReview(api.entries(),carCandidates(snapshot));carOut.replaceChildren();
 if(!rows.length)carOut.append(el('p',t('Keine geeigneten Kosten.','No eligible expenses.')));
 for(const item of rows){const row=el('div'),c=item.candidate;row.className='border rounded p-2';
 const labels={new:t('Neu','New'),same:t('Übernommen','Imported'),changed:t('Abweichung','Difference'),missing:t('Quelle fehlt','Source missing')};
 row.append(el('p',labels[item.kind]+' · '+(c?c.title+' · '+c.date+' · '+money(c.cents):String(item.bookingId))));
 if(item.kind!=='same')row.append(button(item.kind==='missing'?'Quelle trennen':'Bestätigen',item.kind==='missing'?'Detach source':'Confirm',()=>run(async()=>{
 if(!confirm(item.kind==='missing'?t('Quelle trennen? Buchung bleibt erhalten.','Detach source? Transaction is retained.'):t('Diese Kosten übernehmen?','Apply these expenses?')))return;
 const fresh=carReview(api.entries(),carCandidates(await api.readSource(ctx,'autokosten-reifenwechsel'))).find(x=>(x.candidate?.sourceKey||x.sourceKey)===(c?.sourceKey||item.sourceKey));
 if(!api.sameContext(ctx)||JSON.stringify(fresh)!==JSON.stringify(item))throw Error('stale');
 await api.apply(ctx,entries=>{let id=Date.now();while(entries.some(r=>r.id===id))id++;return {entries:applyCarReview(entries,fresh,true,id),changed:1};});
 status.textContent=t('Gespeichert. Erneut laden für weitere Änderungen.','Saved. Reload for more changes.');render();
 })));
 carOut.append(row);}
 });
 car.append(el('h4',t('Autokosten','Car expenses')),el('p',t('Nur nach Bestätigung übernehmen. Fehlende Quellen löschen keine Buchungen.','Import only after confirmation. Missing sources never delete transactions.')),button('Eigene Autokosten prüfen','Review my car expenses',load),carOut);body.append(meter,car);
 }catch{status.textContent=t('Cloud nicht bereit.','Cloud not ready.');}
 }
 details.addEventListener('toggle',render);document.addEventListener('toolya:locale-change',render);return {render};
}
