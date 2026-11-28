import {loadQrGenerator} from '../../shared/toolya/qr-generator.mjs';
import {createBatchScanner} from './moving-batch-scan.mjs';
const endpoint='https://yheogmeaosuigyaxkwth.supabase.co/functions/v1/moving-helper';
const apikey='sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv';
const root=document.getElementById('toolya-moving-transport');
const steps=['planned','packed','loaded','arrived','unpacked'];
const language=()=>window.__toolyaUILocale==='en'?'en':'de';
const text=(de,en)=>language()==='en'?en:de;
const labels={de:{planned:'Geplant',packed:'Gepackt',loaded:'Verladen',arrived:'Angekommen',unpacked:'Ausgepackt'},en:{planned:'Planned',packed:'Packed',loaded:'Loaded',arrived:'Arrived',unpacked:'Unpacked'}};
const errorMessages={"signIn":["Bitte erneut anmelden","Please sign in again"],"unavailable":["Transportdienst nicht erreichbar","Transport service unavailable"],"missingLabel":["Bitte eine Helferbezeichnung eingeben","Enter a label for the helper"],"action":["Transportaktion fehlgeschlagen","Transport action failed"],"issue":["Vorfall konnte nicht gespeichert werden","Could not save the issue"]};
class TransportError extends Error {}
const transportError=(failure,fallback)=>failure instanceof TransportError?failure.message:fallback;
const priorities={normal:['Normal','Normal'],important:['Wichtig','Important'],first_day:['Erster Tag','First day']};
const priorityLabel=key=>Object.hasOwn(priorities,key)?text(...priorities[key]):key;
const formatDate=value=>new Date(value).toLocaleString(text('de-DE','en-GB'));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let projectId='',data=null,busy=false,error='',share='',token='',qrLink='',initialised=false,undo=null,generation=0;
const current=()=>window.getData?.();
const project=()=>current()?.moving?.projects?.find(p=>p.status==='active');
async function api(action,more={}){
  const activeGeneration=generation;
  const activeProject=projectId;
  const headers={'Content-Type':'application/json','apikey':apikey};
  const {data:{session},error}=await window.supabaseClient.auth.getSession();
  if(error||!session?.access_token||activeGeneration!==generation||!activeProject||project()?.id!==activeProject){
   throw new TransportError('signIn');
  }
  headers.Authorization='Bearer '+session.access_token;
  const res=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({action,projectId:activeProject,...more}),cache:'no-store',referrerPolicy:'no-referrer'});
  if(!res.ok)throw new TransportError(res.status===401?'signIn':'unavailable');
  const result=await res.json();
  if(activeGeneration!==generation||project()?.id!==activeProject)throw new TransportError('signIn');
  return result;
}
const scanDialog=document.getElementById('movingBatchScan');
const scanCopy={
 allTrips:()=>text('Alle Fahrten','All trips'),
 ready:()=>text('Bereit zum Scannen.','Ready to scan.'),
 count:count=>text(`Erfasst: ${count}`,`Recorded: ${count}`),
 unknown:()=>text('Diese Kiste gehört nicht zum aktuellen Transport.','This box does not belong to the current move.'),
 duplicate:()=>text('Diese Kiste wurde in dieser Runde bereits erfasst.','This box was already recorded in this session.'),
 already:label=>text(`${label} hat diesen Status bereits.`,`${label} already has this status.`),
 invalid:label=>text(`${label} kann diesen Status noch nicht erhalten.`,`${label} cannot move to this status yet.`),
 saved:label=>text(`Status gespeichert: ${label}`,`Status saved: ${label}`),
 failed:()=>text('Speicherung nicht bestätigt. Prüfe den aktuellen Status.','Save was not confirmed. Check the current status.'),
 noCamera:()=>text('Kamera nicht verfügbar. Gib die Kisten-ID ein.','Camera unavailable. Enter the box ID.')
};
const scanner=scanDialog?createBatchScanner(scanDialog,scanCopy,recordScannedBox):null;
async function transitionOwner(item,status,remember=true){
 const previous=item.status;
 const activeProject=project()?.id;
 const response=await api('owner-transition',{assignmentId:item.assignmentId,expectedVersion:item.version,status,requestId:crypto.randomUUID()});
 if(!activeProject||project()?.id!==activeProject||response.assignmentId!==item.assignmentId||
    response.status!==status||!Number.isSafeInteger(response.version)||response.version!==item.version+1){
  throw new TransportError('action');
 }
 item.status=response.status;
 item.version=response.version;
 undo=remember?{assignmentId:item.assignmentId,previous,version:item.version}:null;
}
async function recordScannedBox(id,status,trip){
 if(!window.movingCloudReady||busy||!project()||!data)return {status:'unknown'};
 const snap=current();
 if(snap.boxes.some(box=>box.id===id&&box.keepWithMe===true))return {status:'unknown'};
 const assignment=snap.moving.assignments.find(item=>item.projectId===project().id&&item.boxId===id);
 const box=data.boxes.find(item=>item.assignmentId===assignment?.id);
 if(!box||(trip&&assignment.trip!==trip))return {status:'unknown'};
 if(box.status===status)return {status:'already',label:box.label};
 if(steps.indexOf(status)!==steps.indexOf(box.status)+1)return {status:'invalid',label:box.label};
 busy=true;
 try{
  await transitionOwner(box,status);
  setTransport();
  return {status:'saved',label:box.label};
 }catch(error){
  undo=null;
  try{if(project()&&window.movingCloudReady){data=await api('state');setTransport();}}catch{}
  throw error;
 }finally{busy=false;render();}
}
function setTransport(){
  const enabled=Boolean(data?.boxes?.length||data?.grants?.length);
  window.movingTransportActive=enabled;
  window.movingTransportMissing=new Set((data?.incidents??[]).filter(issue=>issue.kind==='missing'&&!issue.resolved).map(issue=>issue.assignmentId));
  window.movingTransportStatuses=Object.fromEntries((data?.boxes||[]).map(b=>[b.assignmentId,b]));
  document.dispatchEvent(new Event('toolya:moving-transport'));
}
const transportFormFields=['mv-incident-assignment','mv-incident-kind','mv-incident-note','mv-helper-name',
  'mv-helper-hours','mv-helper-target','mv-qr-assignment'];
function render(){
  if(!root)return;
  const p=project();
  if(!window.movingCloudReady||!p){root.hidden=true;window.movingTransportActive=false;return;}
  root.hidden=false;
  let h='<header><h2>🚛 '+esc(text('Transport & Helfer','Transport & helpers'))+'</h2><p>'+esc(text("Serverseitige Transportstände und zeitlich begrenzte Helferlinks. Helfer sehen keine Inventarinhalte.","Track box progress and share time-limited links with helpers. Helpers cannot see what's inside your boxes."))+'</p></header>';
  if(error)h+='<p role="alert" class="mv-error">'+esc(text(...errorMessages[error]))+'</p>';
  if(!data){root.innerHTML=h+'<button type="button" data-act="load" '+(busy?'disabled':'')+'>'+esc(text("Transportmodus laden","Load transport mode"))+'</button>';return;}
  const snap=current();
  const personalIds=new Set(snap.boxes.filter(box=>box.keepWithMe===true).map(box=>box.id));
  const personalAssignments=new Set(snap.moving.assignments.filter(item=>item.projectId===p.id&&personalIds.has(item.boxId)).map(item=>item.id));
  const boxes=data.boxes.filter(item=>!personalAssignments.has(item.assignmentId));
  if(personalAssignments.size){
   h+='<details class="mv-card"><summary>'+esc(text('Bleibt bei mir','Keep with me'))+'</summary><ul>'+
    snap.boxes.filter(box=>personalIds.has(box.id)&&snap.moving.assignments.some(item=>item.projectId===p.id&&item.boxId===box.id))
     .map(box=>'<li>'+esc(box.name)+'</li>').join('')+'</ul></details>';
  }
  h+='<div class="mv-r2-toolbar"><button type="button" data-act="sync" '+(busy?'disabled':'')+'>'+esc(text("Kisten & Räume abgleichen","Sync boxes and rooms"))+'</button><span class="mv-muted">'+new Intl.NumberFormat(text('de-DE','en-GB')).format(boxes.length)+esc(boxes.length===1?text(' Kiste im Transportmodus',' box in transport mode'):text(' Kisten im Transportmodus',' boxes in transport mode'))+'</span></div>';
  if(boxes.length&&scanner)h+='<button type="button" data-act="batch-scan" '+(busy?'disabled':'')+'>'+esc(text('Mehrere Kisten scannen','Scan several boxes'))+'</button>';
  if(undo)h+='<button type="button" data-act="undo" '+(busy?'disabled':'')+'>'+esc(text('Letzte Statusänderung rückgängig machen','Undo last status change'))+'</button>';
  const outstanding=boxes.filter(box=>!['arrived','unpacked'].includes(box.status));
  if(boxes.length){
   const handled=boxes.length-outstanding.length;
   const missing=window.movingTransportMissing;
   h+=`<details class="mv-card"><summary>${text('Was fehlt noch?','What is still outstanding?')} · ${handled}/${boxes.length}</summary>${outstanding.map(box=>`<p>${esc(box.label)} · ${esc(box.room||'')} · ${esc(labels[language()][box.status])}${missing?.has(box.assignmentId)?' · '+text('Fehlend gemeldet','Reported missing'):''}</p>`).join('')||`<p>${text('Alle Kisten sind angekommen.','All boxes have arrived.')}</p>`}</details>`;
  }
  h+='<h3>'+esc(text("Transportstatus","Transport status"))+'</h3>';
  h+='<div class="mv-r2-list">'+(boxes.length?boxes.map(b=>{
    const n=steps.indexOf(b.status);
    return '<div class="mv-r2-box"><div><strong>'+esc(b.label)+'</strong><small>'+esc(b.room||text("Kein Zielraum","No destination room"))+' · '+esc(priorityLabel(b.priority))+' · Version '+b.version+'</small></div><div class="mv-status"><button data-status="'+esc(b.assignmentId)+'" data-next="'+esc(steps[n-1]||'')+'" '+(n===0||busy?'disabled':'')+' aria-label="'+esc(text("Einen Schritt zurück","Previous status"))+'">‹</button><span>'+esc(labels[language()][b.status])+'</span><button data-status="'+esc(b.assignmentId)+'" data-next="'+esc(steps[n+1]||'')+'" '+(n===4||busy?'disabled':'')+' aria-label="'+esc(text("Einen Schritt weiter","Next status"))+'">›</button></div></div>';
  }).join(''):'<p class="mv-muted">'+esc(text("Noch keine Kisten. Weise im Umzugsplaner Kisten zu und gleiche sie hier ab.","No boxes yet. Assign boxes in the moving planner, then sync them here."))+'</p>')+'</div>';
  h+='<section class="mv-r2-incidents"><h3>'+esc(text("Fehlende oder beschädigte Kisten","Missing or damaged boxes"))+'</h3><p class="mv-muted">'+esc(text("Vorfälle werden getrennt vom Transportstatus dokumentiert. Nur der Kontoinhaber kann sie abschließen.","Reports are tracked separately from transport status. Only the account owner can close them."))+'</p>';
  h+='<div class="mv-r2-list">'+((data.incidents||[]).length?(data.incidents||[]).map(i=>{
    const box=boxes.find(b=>b.assignmentId===i.assignmentId);
    return '<div class="mv-r2-box"><div><strong>'+esc(i.kind==='missing'?text("🔎 Kiste fehlt","🔎 Box missing"):text("⚠️ Kiste beschädigt","⚠️ Box damaged"))+' · '+esc(box?.label||text("Kiste","Box"))+'</strong><small>'+esc(i.note||text("Keine Beschreibung","No description"))+' · '+esc(i.reportedAt?formatDate(i.reportedAt):'')+(i.resolved?text(" · Erledigt"," · Resolved"):text(" · Offen"," · Open"))+'</small></div>'+(i.resolved?'':'<button type="button" data-resolve="'+esc(i.id)+'" '+(busy?'disabled':'')+'>'+esc(text("Als erledigt markieren","Mark as resolved"))+'</button>')+'</div>';
  }).join(''):'<p class="mv-muted">'+esc(text("Keine Vorfälle gemeldet.","No issues reported."))+'</p>')+'</div>';
  h+='<form id="mv-owner-incident" class="mv-r2-create"><label>'+esc(text("Kiste","Box"))+'<select id="mv-incident-assignment" required>'+boxes.map(b=>'<option value="'+esc(b.assignmentId)+'">'+esc(b.label)+'</option>').join('')+'</select></label><label>'+esc(text("Vorfall","Issue"))+'<select id="mv-incident-kind"><option value="missing">'+esc(text("Kiste fehlt","Box missing"))+'</option><option value="damaged">'+esc(text("Beschädigt","Damaged"))+'</option></select></label><label>'+esc(text("Notiz (optional)","Note (optional)"))+'<input id="mv-incident-note" maxlength="300" placeholder="'+esc(text("Kurze Beschreibung","Short description"))+'"></label><button type="submit" '+(busy||!boxes.length?'disabled':'')+'>'+esc(text("Vorfall melden","Report an issue"))+'</button></form></section>';
  const shareable=new Set(boxes.map(box=>box.assignmentId));
  const assignments=snap.moving.assignments.filter(item=>item.projectId===p.id&&shareable.has(item.id));
  const rooms=snap.moving.rooms.filter(room=>room.projectId===p.id&&assignments.some(item=>item.targetRoomId===room.id));
  const targetOptions='<option value="">'+esc(text('Alle Transportkisten','All transport boxes'))+'</option>'+
   rooms.map(room=>'<option value="room:'+esc(room.id)+'">'+esc(text('Raum: ','Room: ')+room.name)+'</option>').join('')+
   boxes.map(box=>'<option value="box:'+esc(box.assignmentId)+'">'+esc(text('Kiste: ','Box: ')+box.label)+'</option>').join('');
  h+='<div class="mv-r2-grants"><h3>'+esc(text("Helferzugang","Helper access"))+'</h3><p class="mv-muted">'+esc(text("Erstelle einen Link, der nach 1–72 Stunden abläuft und jederzeit widerrufen werden kann. Wer den Link besitzt, darf den Transportstatus ändern.","Create a link that expires after 1–72 hours. You can revoke it at any time. Anyone with the link can update transport status."))+'</p><div class="mv-r2-create"><label>'+esc(text("Bezeichnung","Label"))+'<input id="mv-helper-name" maxlength="80" placeholder="'+esc(text("z. B. Transportteam","e.g. Moving team"))+'" autocomplete="off"></label><label>'+esc(text("Gültigkeit","Expires after"))+'<select id="mv-helper-hours"><option value="2">'+esc(text("2 Stunden","2 hours"))+'</option><option value="8">'+esc(text("8 Stunden","8 hours"))+'</option><option value="24">'+esc(text("24 Stunden","24 hours"))+'</option><option value="72">'+esc(text("72 Stunden","72 hours"))+'</option></select></label><label>'+esc(text('Zugriff auf','Access to'))+'<select id="mv-helper-target">'+targetOptions+'</select></label><button type="button" data-act="create" '+(busy?'disabled':'')+'>'+esc(text("Helferlink erstellen","Create helper link"))+'</button></div>';
  if(share)h+='<div class="mv-r2-share"><label>'+esc(text("Einmalig angezeigter Helferlink","Helper link shown once"))+'<input readonly id="mv-helper-link" value="'+esc(share)+'"></label><button type="button" data-act="copy">'+esc(text("Link kopieren","Copy link"))+'</button><button type="button" data-act="show-qr">'+esc(text("Link als QR-Code","Show link as QR code"))+'</button><div id="mv-share-qr"></div><p class="mv-muted">'+esc(text("Diesen Link nur an vertrauenswürdige Helfer senden. Nach Neuladen nicht wiederherstellbar.","Share this link only with trusted helpers. You cannot retrieve it after reloading."))+'</p></div>';
  if(qrLink)h+='<div class="mv-r2-qr"><strong>'+esc(text("Kisten-QR-Code","Box QR code"))+'</strong><div id="mv-box-qr"></div><button type="button" data-act="close-qr">'+esc(text("Schließen","Close"))+'</button></div>';
  h+='<div class="mv-r2-list">'+(data.grants.length?data.grants.map(g=>'<div class="mv-r2-box"><div><strong>'+esc(g.helper_label)+'</strong><small>'+esc(text("Bis ","Until "))+esc(formatDate(g.expires_at))+(g.revoked_at?text(" · Widerrufen"," · Revoked"):'')+'</small></div><button type="button" data-revoke="'+esc(g.id)+'" '+(g.revoked_at||busy?'disabled':'')+'>'+esc(text("Widerrufen","Revoke"))+'</button></div>').join(''):'<p class="mv-muted">'+esc(text("Noch kein Helferzugang angelegt.","No helper access has been created yet."))+'</p>')+'</div></div>';
  if(token&&boxes.length){h+='<div class="mv-r2-qr-tools"><h3>'+esc(text("QR-Codes je Kiste","QR codes for individual boxes"))+'</h3><p class="mv-muted">'+esc(text("Die QR-Codes enthalten den aktuellen Helferlink. Nur während seiner Gültigkeit verwenden.","These codes contain the current helper link. Use them while the link is valid."))+'</p><select id="mv-qr-assignment" aria-label="'+esc(text('Kiste','Box'))+'">'+boxes.map(b=>'<option value="'+esc(b.assignmentId)+'">'+esc(b.label)+'</option>').join('')+'</select><button type="button" data-act="box-qr">'+esc(text("Kisten-QR erzeugen","Create box QR code"))+'</button></div>';}
  const drafts=root.dataset.project===p.id ? transportFormFields.map(id=>[id,document.getElementById(id)?.value]) : [];
  const focusedId=document.activeElement?.id;
  root.dataset.project=p.id;
  root.innerHTML=h;
  for(const [id,value] of drafts){
    const field=document.getElementById(id);
    if(!field||value===undefined)continue;
    if(field.tagName!=='SELECT'||[...field.options].some(option=>option.value===value))field.value=value;
    if(id===focusedId)field.focus();
  }
  if(qrLink)void drawQr('mv-box-qr',qrLink);
}
async function drawQr(id,url){
  const target=document.getElementById(id);if(!target)return;
  const QR=await loadQrGenerator();
  if(!QR){target.textContent=text("QR-Bibliothek nicht verfügbar. Bitte den Link kopieren.","QR codes are unavailable. Copy the link instead.");return;}
  target.replaceChildren();new QR(target,{text:url,width:192,height:192,correctLevel:QR.CorrectLevel?.M});
}
async function load(){const p=project();if(!p)return;projectId=p.id;busy=true;error='';render();try{data=await api('state');setTransport();}catch(e){error=transportError(e,'unavailable');}finally{busy=false;render();}}
root?.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b||busy)return;
 if(b.dataset.act==='batch-scan'){
  const p=project();
  if(p){
   const trips=current().moving.assignments.filter(assignment=>assignment.projectId===p.id)
    .map(assignment=>assignment.trip).filter(Boolean);
   scanner?.open([...new Set(trips)]);
  }
  return;
 }
 if(b.dataset.act==='copy'){const v=document.getElementById('mv-helper-link')?.value;if(v){try{await navigator.clipboard.writeText(v);}catch{document.getElementById('mv-helper-link').select();}}return;}
 if(b.dataset.act==='show-qr'){await drawQr('mv-share-qr',share);return;}
 if(b.dataset.act==='close-qr'){qrLink='';render();return;}
 if(b.dataset.act==='box-qr'){const id=document.getElementById('mv-qr-assignment')?.value;if(id&&token){const u=new URL('./helper/index.html',location.href);u.searchParams.set('lang',language());u.hash=new URLSearchParams({t:token,a:id}).toString();qrLink=u.href;render();}return;}
 const p=project();if(!p)return;projectId=p.id;
 const act=b.dataset.act;
 const inputLabel=document.getElementById('mv-helper-name')?.value.trim();
 const inputHours=Number(document.getElementById('mv-helper-hours')?.value);
 const inputTarget=document.getElementById('mv-helper-target')?.value||'';
 if(!act&&!b.dataset.status&&!b.dataset.revoke&&!b.dataset.resolve)return;
 if(act==='load'){await load();return;}
 busy=true;error='';render();
 try{
  if(act==='sync'){await api('sync');data=await api('state');}
  else if(act==='create'){
    const label=inputLabel,hours=inputHours;
    if(!label)throw new TransportError('missingLabel');
    const x=await api('create',{label,hours,target:inputTarget});token=x.token;const u=new URL('./helper/index.html',location.href);u.searchParams.set('lang',language());u.hash=new URLSearchParams({t:token}).toString();share=u.href;data=await api('state');
  }else if(b.dataset.resolve){await api('resolve-incident',{incidentId:b.dataset.resolve});data=await api('state');}
  else if(b.dataset.revoke){await api('revoke',{grantId:b.dataset.revoke});data=await api('state');share='';token='';qrLink='';}
  else if(act==='undo'){
    const last=undo;
    undo=null;
    const item=last&&data?.boxes?.find(box=>box.assignmentId===last.assignmentId&&box.version===last.version);
    if(!item)throw new TransportError('action');
    await transitionOwner(item,last.previous,false);
  }else if(b.dataset.status){
    const item=data?.boxes?.find(x=>x.assignmentId===b.dataset.status);
    if(!item)return;
    await transitionOwner(item,b.dataset.next);
  }
  setTransport();
 }catch(ex){
  error=transportError(ex,'action');
  if(act==='undo'||b.dataset.status){
   undo=null;
   try{if(project()&&window.movingCloudReady){data=await api('state');setTransport();}}catch{}
  }
 }finally{busy=false;render();}
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
   data=await api('state');setTransport();
 }catch(ex){error=transportError(ex,'issue');}
 finally{busy=false;render();}
});
document.addEventListener('toolya:moving-ready',()=>{
 if(!project()){
  generation++;
  scanner?.invalidate();
  undo=null;data=null;initialised=false;
  projectId='';share='';token='';qrLink='';error='';
  setTransport();
  if(root){root.hidden=true;root.replaceChildren();}
  return;
 }
 if(!initialised){initialised=true;void load();}else render();
});
document.addEventListener('toolya:moving-saved',()=>{render();});
document.addEventListener('toolya:locale-change',()=>{
  scanner?.render();
  if(!root||root.hidden)return;
  const shareQr=document.getElementById('mv-share-qr');
  render();
  if(shareQr?.childNodes.length)document.getElementById('mv-share-qr')?.replaceChildren(...shareQr.childNodes);
});
