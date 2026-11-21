import {loadQrGenerator} from '../../shared/toolya/qr-generator.mjs';
const endpoint='https://yheogmeaosuigyaxkwth.supabase.co/functions/v1/moving-helper';
const apikey='sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv';
const root=document.getElementById('toolya-moving-transport');
const steps=['planned','packed','loaded','arrived','unpacked'];
const labels={planned:'Geplant',packed:'Gepackt',loaded:'Verladen',arrived:'Angekommen',unpacked:'Ausgepackt'};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let projectId='',data=null,busy=false,error='',share='',token='',qrLink='',initialised=false;
const current=()=>window.getData?.();
const project=()=>current()?.moving?.projects?.find(p=>p.status==='active');
async function api(action,more={},helper=false){
  const headers={'Content-Type':'application/json','apikey':apikey};
  if(!helper){const {data:{session},error}=await window.supabaseClient.auth.getSession();if(error||!session?.access_token)throw Error('Bitte erneut anmelden');headers.Authorization='Bearer '+session.access_token;}
  const res=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({action,projectId,...more}),cache:'no-store',referrerPolicy:'no-referrer'});
  const body=await res.json().catch(()=>({}));
  if(!res.ok)throw Error(body.error||'Transportdienst nicht erreichbar');
  return body;
}
function setTransport(){
  const enabled=Boolean(data?.boxes?.length||data?.grants?.length);
  window.movingTransportActive=enabled;
  window.movingTransportStatuses=Object.fromEntries((data?.boxes||[]).map(b=>[b.assignmentId,b]));
  document.dispatchEvent(new Event('toolya:moving-transport'));
}
function render(){
  if(!root)return;
  const p=project();
  if(!window.movingCloudReady||!p){root.hidden=true;window.movingTransportActive=false;return;}
  root.hidden=false;
  let h='<header><h2>🚛 Transport & Helfer</h2><p>Serverseitige Transportstände und zeitlich begrenzte Helferlinks. Helfer sehen keine Inventarinhalte.</p></header>';
  if(error)h+='<p role="alert" class="mv-error">'+esc(error)+'</p>';
  if(!data){root.innerHTML=h+'<button type="button" data-act="load" '+(busy?'disabled':'')+'>Transportmodus laden</button>';return;}
  h+='<div class="mv-r2-toolbar"><button type="button" data-act="sync" '+(busy?'disabled':'')+'>Kisten & Räume abgleichen</button><span class="mv-muted">'+data.boxes.length+' Kisten im Transportmodus</span></div>';
  h+='<h3>Transportstatus</h3>';
  h+='<div class="mv-r2-list">'+(data.boxes.length?data.boxes.map(b=>{
    const n=steps.indexOf(b.status);
    return '<div class="mv-r2-box"><div><strong>'+esc(b.label)+'</strong><small>'+esc(b.room||'Kein Zielraum')+' · '+esc(b.priority)+' · Version '+b.version+'</small></div><div class="mv-status"><button data-status="'+esc(b.assignmentId)+'" data-next="'+esc(steps[n-1]||'')+'" '+(n===0||busy?'disabled':'')+' aria-label="Einen Schritt zurück">‹</button><span>'+esc(labels[b.status])+'</span><button data-status="'+esc(b.assignmentId)+'" data-next="'+esc(steps[n+1]||'')+'" '+(n===4||busy?'disabled':'')+' aria-label="Einen Schritt weiter">›</button></div></div>';
  }).join(''):'<p class="mv-muted">Noch keine Kisten. Weise im Umzugsplaner Kisten zu und gleiche sie hier ab.</p>')+'</div>';
  h+='<section class="mv-r2-incidents"><h3>Fehlende oder beschädigte Kisten</h3><p class="mv-muted">Vorfälle werden getrennt vom Transportstatus dokumentiert. Nur der Kontoinhaber kann sie abschließen.</p>';
  h+='<div class="mv-r2-list">'+((data.incidents||[]).length?(data.incidents||[]).map(i=>{
    const box=data.boxes.find(b=>b.assignmentId===i.assignmentId);
    return '<div class="mv-r2-box"><div><strong>'+esc(i.kind==='missing'?'🔎 Kiste fehlt':'⚠️ Kiste beschädigt')+' · '+esc(box?.label||'Kiste')+'</strong><small>'+esc(i.note||'Keine Beschreibung')+' · '+esc(i.reportedAt?new Date(i.reportedAt).toLocaleString('de-DE'):'')+(i.resolved?' · Erledigt':' · Offen')+'</small></div>'+(i.resolved?'':'<button type="button" data-resolve="'+esc(i.id)+'" '+(busy?'disabled':'')+'>Als erledigt markieren</button>')+'</div>';
  }).join(''):'<p class="mv-muted">Keine Vorfälle gemeldet.</p>')+'</div>';
  h+='<form id="mv-owner-incident" class="mv-r2-create"><label>Kiste<select id="mv-incident-assignment" required>'+data.boxes.map(b=>'<option value="'+esc(b.assignmentId)+'">'+esc(b.label)+'</option>').join('')+'</select></label><label>Vorfall<select id="mv-incident-kind"><option value="missing">Kiste fehlt</option><option value="damaged">Beschädigt</option></select></label><label>Notiz (optional)<input id="mv-incident-note" maxlength="300" placeholder="Kurze Beschreibung"></label><button type="submit" '+(busy||!data.boxes.length?'disabled':'')+'>Vorfall melden</button></form></section>';
  h+='<div class="mv-r2-grants"><h3>Helferzugang</h3><p class="mv-muted">Erstelle einen Link, der nach 1–72 Stunden abläuft und jederzeit widerrufen werden kann. Wer den Link besitzt, darf den Transportstatus ändern.</p><div class="mv-r2-create"><label>Bezeichnung<input id="mv-helper-name" maxlength="80" placeholder="z. B. Transportteam" autocomplete="off"></label><label>Gültigkeit<select id="mv-helper-hours"><option value="2">2 Stunden</option><option value="8">8 Stunden</option><option value="24">24 Stunden</option><option value="72">72 Stunden</option></select></label><button type="button" data-act="create" '+(busy?'disabled':'')+'>Helferlink erstellen</button></div>';
  if(share)h+='<div class="mv-r2-share"><label>Einmalig angezeigter Helferlink<input readonly id="mv-helper-link" value="'+esc(share)+'"></label><button type="button" data-act="copy">Link kopieren</button><button type="button" data-act="show-qr">Link als QR-Code</button><div id="mv-share-qr"></div><p class="mv-muted">Diesen Link nur an vertrauenswürdige Helfer senden. Nach Neuladen nicht wiederherstellbar.</p></div>';
  if(qrLink)h+='<div class="mv-r2-qr"><strong>Kisten-QR-Code</strong><div id="mv-box-qr"></div><button type="button" data-act="close-qr">Schließen</button></div>';
  h+='<div class="mv-r2-list">'+(data.grants.length?data.grants.map(g=>'<div class="mv-r2-box"><div><strong>'+esc(g.helper_label)+'</strong><small>Bis '+esc(new Date(g.expires_at).toLocaleString('de-DE'))+(g.revoked_at?' · Widerrufen':'')+'</small></div><button type="button" data-revoke="'+esc(g.id)+'" '+(g.revoked_at||busy?'disabled':'')+'>Widerrufen</button></div>').join(''):'<p class="mv-muted">Noch kein Helferzugang angelegt.</p>')+'</div></div>';
  if(token&&data.boxes.length){h+='<div class="mv-r2-qr-tools"><h3>QR-Codes je Kiste</h3><p class="mv-muted">Die QR-Codes enthalten den aktuellen Helferlink. Nur während seiner Gültigkeit verwenden.</p><select id="mv-qr-assignment">'+data.boxes.map(b=>'<option value="'+esc(b.assignmentId)+'">'+esc(b.label)+'</option>').join('')+'</select><button type="button" data-act="box-qr">Kisten-QR erzeugen</button></div>';}
  root.innerHTML=h;
  if(qrLink)void drawQr('mv-box-qr',qrLink);
}
async function drawQr(id,url){
  const target=document.getElementById(id);if(!target)return;
  const QR=await loadQrGenerator();
  if(!QR){target.textContent='QR-Bibliothek nicht verfügbar. Bitte den Link kopieren.';return;}
  target.replaceChildren();new QR(target,{text:url,width:192,height:192,correctLevel:QR.CorrectLevel?.M});
}
async function load(){const p=project();if(!p)return;projectId=p.id;busy=true;error='';render();try{data=await api('state');setTransport();}catch(e){error=e.message;}finally{busy=false;render();}}
root?.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b||busy)return;
 if(b.dataset.act==='copy'){const v=document.getElementById('mv-helper-link')?.value;if(v){try{await navigator.clipboard.writeText(v);}catch{document.getElementById('mv-helper-link').select();}}return;}
 if(b.dataset.act==='show-qr'){await drawQr('mv-share-qr',share);return;}
 if(b.dataset.act==='close-qr'){qrLink='';render();return;}
 if(b.dataset.act==='box-qr'){const id=document.getElementById('mv-qr-assignment')?.value;if(id&&token){const u=new URL('./helper/index.html',location.href);u.hash=new URLSearchParams({t:token,a:id}).toString();qrLink=u.href;render();}return;}
 const p=project();if(!p)return;projectId=p.id;
 const act=b.dataset.act;
 const inputLabel=document.getElementById('mv-helper-name')?.value.trim();
 const inputHours=Number(document.getElementById('mv-helper-hours')?.value);
 if(!act&&!b.dataset.status&&!b.dataset.revoke&&!b.dataset.resolve)return;
 if(act==='load'){await load();return;}
 busy=true;error='';render();
 try{
  if(act==='sync'){data=await api('sync');}
  else if(act==='create'){
    const label=inputLabel,hours=inputHours;
    if(!label)throw Error('Bitte eine Helferbezeichnung eingeben');
    const x=await api('create',{label,hours});token=x.token;const u=new URL('./helper/index.html',location.href);u.hash=new URLSearchParams({t:token}).toString();share=u.href;data=await api('state');
  }else if(b.dataset.resolve){await api('resolve-incident',{incidentId:b.dataset.resolve});data=await api('state');}
  else if(b.dataset.revoke){await api('revoke',{grantId:b.dataset.revoke});data=await api('state');share='';token='';qrLink='';}
  else if(b.dataset.status){const item=data?.boxes?.find(x=>x.assignmentId===b.dataset.status);if(!item)return;await api('owner-transition',{assignmentId:item.assignmentId,expectedVersion:item.version,status:b.dataset.next,requestId:crypto.randomUUID()});data=await api('state');}
  setTransport();
 }catch(ex){error=ex.message||'Transportaktion fehlgeschlagen';}finally{busy=false;render();}
});
root?.addEventListener('submit',async event=>{
 if(event.target.id!=='mv-owner-incident')return;
 event.preventDefault();
 if(busy||!project())return;
 const assignmentId=root.querySelector('#mv-incident-assignment')?.value;
 const kind=root.querySelector('#mv-incident-kind')?.value;
 const note=root.querySelector('#mv-incident-note')?.value.trim()||'';
 if(!assignmentId||!['missing','damaged'].includes(kind)||note.length>300)return;
 projectId=project().id;busy=true;error='';render();
 try{
   await api('owner-report-incident',{assignmentId,kind,note,requestId:crypto.randomUUID()});
   data=await api('state');
 }catch(ex){error=ex.message||'Vorfall konnte nicht gespeichert werden';}
 finally{busy=false;render();}
});
document.addEventListener('toolya:moving-ready',()=>{if(!project()){data=null;root.hidden=true;return;}if(!initialised){initialised=true;void load();}else render();});
document.addEventListener('toolya:moving-saved',()=>{render();});
