import {resolveLocale} from '../../../shared/toolya/i18n/locale.mjs';

const endpoint='https://yheogmeaosuigyaxkwth.supabase.co/functions/v1/moving-helper';
const apikey='sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv';
const hash=new URLSearchParams(location.hash.replace(/^#/,''));
const token=hash.get('t')||'';
let selected=hash.get('a')||'',data=null,busy=false,error='',notice='',media=null,scanner=false,openingCamera=false;
const app=document.getElementById('helper-app');
const numbers={de:new Intl.NumberFormat('de-DE'),en:new Intl.NumberFormat('en-GB')};
const states=['planned','packed','loaded','arrived','unpacked'];
const names={
 de:{planned:'Geplant',packed:'Gepackt',loaded:'Verladen',arrived:'Angekommen',unpacked:'Ausgepackt'},
 en:{planned:'Planned',packed:'Packed',loaded:'Loaded',arrived:'Arrived',unpacked:'Unpacked'}
};
const priorities={
 first_day:['Erster Tag','First day'],important:['Wichtig','Important'],normal:['Normal','Normal']
};
const localeKey='toolya-locale-v1';
let savedLocale;
try{savedLocale=localStorage.getItem(localeKey);}catch{}
let locale=resolveLocale({explicit:new URLSearchParams(location.search).get('lang'),saved:savedLocale});
const text=(de,en)=>locale==='en'?en:de;
const languageButtons=[...document.querySelectorAll('[data-helper-locale]')];

function renderLanguage(){
 document.documentElement.lang=locale;
 document.title=text('Toolya · Umzugshelfer','Toolya · Moving helper');
 document.getElementById('helper-heading').textContent=text('Umzugshelfer','Moving helper');
 document.getElementById('helper-intro').textContent=text('Gemeinsam Kisten sicher ans Ziel bringen.','Help get moving boxes to the right place.');
 document.getElementById('helper-privacy').textContent=text(
  'Nur Kistennamen und Zielräume sind sichtbar. Private Inventarinhalte bleiben geschützt.',
  'You can see box names and destination rooms. Private inventory details stay protected.'
 );
 document.querySelector('.helper-languages').setAttribute('aria-label',text('Sprache','Language'));
 for(const button of languageButtons)button.setAttribute('aria-pressed',String(button.dataset.helperLocale===locale));
}
for(const button of languageButtons){
 button.addEventListener('click',()=>{
  locale=button.dataset.helperLocale;
  try{localStorage.setItem(localeKey,locale);}catch{}
  const url=new URL(location.href);
  url.searchParams.set('lang',locale);
  history.replaceState(history.state,'',url);
  renderLanguage();
  render();
 });
}
renderLanguage();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function call(action,more={}){
 const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','apikey':apikey},body:JSON.stringify({action,token,...more}),cache:'no-store',referrerPolicy:'no-referrer'});
 const body=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(body.error||'Dienst vorübergehend nicht erreichbar');
 return body;
}
async function refresh(){
 if(!token){data=null;render();return;}
 busy=true;error='';render();
 try{data=await call('view');if(selected&&!data.boxes.some(b=>b.assignmentId===selected))selected='';}
 catch{data=null;error=['Die Verbindung konnte nicht hergestellt werden.','Could not connect to Toolya.'];}
 finally{busy=false;render();}
}
function render(){
 if(!token){
  app.innerHTML=`<h2>${text('Kein Helferlink vorhanden','No helper link')}</h2><p>${text(
   'Bitte den persönlichen Link von der umziehenden Person öffnen. Ohne gültige Freigabe werden keine Kistendaten angezeigt.',
   'Open the personal link shared by the person moving. You need a valid link to see any boxes.'
  )}</p>`;
  return;
 }
 let html=`<h2>${text('Transportstatus','Transport status')}</h2>`;
 if(error)html+=`<p role="alert" class="error">${esc(text(...error))}</p>`;
 if(notice)html+=`<p role="status" class="notice">${esc(text(...notice))}</p>`;
 if(!data){
  const message=busy?text('Helferansicht wird geladen …','Loading the helper view…'):text(
   'Der Helferlink ist ungültig, abgelaufen oder konnte nicht geprüft werden.',
   'The helper link is invalid, has expired, or could not be verified.'
  );
  app.innerHTML=html+`<p>${message}</p><button type="button" data-act="refresh" ${busy?'disabled':''}>${text('Erneut laden','Try again')}</button>`;
  return;
 }
 const access=text(
  'Zugriff für '+data.helperLabel+'. Du siehst ausschließlich Kistennamen, Zielräume und Transportstände.',
  'Access for '+data.helperLabel+'. You can only see box names, destination rooms and transport status.'
 );
 const format=numbers[locale].format;
 const arrived=data.boxes.filter(box=>['arrived','unpacked'].includes(box.status)).length;
 const unpacked=data.boxes.filter(box=>box.status==='unpacked').length;
 const disabled=busy?'disabled':'';
 html+=`<p class="muted">${esc(data.projectName)} · ${esc(access)}</p>
  <div class="stats">
   <span><strong>${format(data.boxes.length)}</strong> ${data.boxes.length===1?text('Kiste','box'):text('Kisten','boxes')}</span>
   <span><strong>${format(arrived)}</strong> ${text('angekommen','arrived')}</span>
   <span><strong>${format(unpacked)}</strong> ${text('ausgepackt','unpacked')}</span>
  </div>
  <div class="toolbar">
   <button data-act="refresh" class="secondary" ${disabled}>${text('↻ Aktualisieren','↻ Refresh')}</button>
   <button data-act="scan" ${disabled}>${text('QR-Code scannen','Scan QR code')}</button>
  </div>`;
 const camera=document.getElementById('mv-camera');
 const cameraLabel=text('Kamera zum QR-Code scannen','Camera for scanning QR codes');
 if(scanner)html+=`<div class="scan"><video id="mv-camera" autoplay muted playsinline aria-label="${cameraLabel}"></video><button class="secondary" data-act="stop">${text('Scanner schließen','Close scanner')}</button></div>`;
 const options=data.boxes.map(box=>`<option value="${esc(box.assignmentId)}" ${selected===box.assignmentId?'selected':''}>${esc(box.label)} – ${esc(box.room||text('ohne Zielraum','no destination room'))}</option>`).join('');
 html+=`<label>${text('Kiste auswählen','Choose a box')}<select id="mv-select"><option value="">${text('Alle Kisten','All boxes')}</option>${options}</select></label>`;
 const visibleBoxes=selected?data.boxes.filter(box=>box.assignmentId===selected):data.boxes;
 const cards=visibleBoxes.map(box=>{
  const index=states.indexOf(box.status);
  const incidents=(data.incidents||[]).filter(incident=>incident.assignmentId===box.assignmentId&&!incident.resolved);
  const priority=Object.hasOwn(priorities,box.priority)?text(...priorities[box.priority]):box.priority;
  const issueText=incidents.map(incident=>incident.kind==='missing'?text('Fehlend','Missing'):text('Beschädigt','Damaged')).join(', ');
  return `<article class="box ${selected===box.assignmentId?'active':''}">
   <div class="box-top"><div><strong>${esc(box.label)}</strong><small>${text('Zielraum','Destination room')}: ${esc(box.room||text('Nicht zugewiesen','Unassigned'))} · ${text('Priorität','Priority')}: ${esc(priority)}</small></div><small>Version ${format(Number(box.version))}</small></div>
   <div class="status">
    <button data-id="${esc(box.assignmentId)}" data-status="${esc(states[index-1]||'')}" ${index<=0||busy?'disabled':''} aria-label="${text('Vorheriger Status','Previous status')}">‹</button>
    <span>${esc(Object.hasOwn(names[locale],box.status)?names[locale][box.status]:text('Unbekannt','Unknown'))}</span>
    <button data-id="${esc(box.assignmentId)}" data-status="${esc(states[index+1]||'')}" ${index<0||index>=states.length-1||busy?'disabled':''} aria-label="${text('Nächster Status','Next status')}">›</button>
   </div>
   ${incidentText(issueText)}
   <div class="incident-actions">
    <button type="button" class="secondary" data-report="${esc(box.assignmentId)}" data-kind="missing" ${disabled}>${text('Fehlend melden','Report missing')}</button>
    <button type="button" class="secondary" data-report="${esc(box.assignmentId)}" data-kind="damaged" ${disabled}>${text('Schaden melden','Report damage')}</button>
   </div>
  </article>`;
 }).join('');
 app.innerHTML=html+`<div class="box-list">${cards||`<p class="muted">${text('Keine Kisten für diese Auswahl.','No boxes match this selection.')}</p>`}</div>`;
 if(scanner&&camera){
  camera.setAttribute('aria-label',cameraLabel);
  document.getElementById('mv-camera').replaceWith(camera);
 }
 if(scanner)void startCamera();
}
function incidentText(issues){
 return issues?`<p class="error" role="status">${text('Gemeldet','Reported')}: ${esc(issues)}</p>`:'';
}
async function change(id,status){
 const row=data?.boxes?.find(x=>x.assignmentId===id);
 if(!row||busy||!states.includes(status))return;
 busy=true;error='';notice='';render();
 try{
  const out=await call('transition',{assignmentId:id,expectedVersion:row.version,status,requestId:crypto.randomUUID()});
  const updated=data.boxes.find(x=>x.assignmentId===id);if(updated){updated.status=out.status;updated.version=out.version;}
  notice=['Status gespeichert','Status saved'];
 }catch{error=['Status konnte nicht gespeichert werden. Bitte aktualisieren.','Could not save the status. Please refresh.'];try{data=await call('view');}catch{}}
 finally{busy=false;render();}
}
async function reportIncident(id,kind){
 if(busy||!data?.boxes?.some(x=>x.assignmentId===id)||!['missing','damaged'].includes(kind))return;
 const note=window.prompt(kind==='missing'?text('Optional: Wo wurde zuletzt nach der Kiste gesucht?','Optional: Where did you last look for the box?'):text('Optional: Schaden kurz beschreiben','Optional: Briefly describe the damage'),'');
 if(note===null)return;
 if(note.trim().length>300){error=['Bitte maximal 300 Zeichen eingeben.','Please enter no more than 300 characters.'];render();return;}
 busy=true;error='';notice='';render();
 try{
   await call('report-incident',{assignmentId:id,kind,note:note.trim(),requestId:crypto.randomUUID()});
   data=await call('view');notice=['Vorfall gemeldet. Der Besitzer kann ihn bearbeiten.','Report sent. The owner can review it.'];
 }catch{error=['Vorfall konnte nicht gemeldet werden.','Could not send the report.'];}
 finally{busy=false;render();}
}
function stopCamera(){
 if(media){for(const track of media.getTracks())track.stop();media=null;}
 scanner=false;
}
async function startCamera(){
 if(!scanner||media||openingCamera)return;
 const video=document.getElementById('mv-camera');if(!video)return;
 if(!('BarcodeDetector' in window)||!navigator.mediaDevices?.getUserMedia){error=['QR-Scanner in diesem Browser nicht unterstützt. Bitte die Kiste aus der Liste auswählen.','This browser does not support QR scanning. Choose the box from the list.'];scanner=false;render();return;}
 openingCamera=true;
 try{
  const detector=new BarcodeDetector({formats:['qr_code']});
  const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
  if(!scanner||document.getElementById('mv-camera')!==video){
   for(const track of stream.getTracks())track.stop();
   return;
  }
  media=stream;
  video.srcObject=stream;
  await video.play();
  const scan=async()=>{if(!scanner||media!==stream)return;try{
   const found=await detector.detect(video);
   for(const v of found){const code=new URL(v.rawValue,location.href);if(code.origin!==location.origin||!code.pathname.endsWith('/tools/moving/helper/index.html'))continue;const h=new URLSearchParams(code.hash.slice(1));const a=h.get('a');if(h.get('t')===token&&data?.boxes.some(x=>x.assignmentId===a)){selected=a;notice=['Kiste erkannt','Box detected'];stopCamera();render();return;}}
  }catch{}if(scanner)requestAnimationFrame(scan);};
  requestAnimationFrame(scan);
 }catch{
  if(document.getElementById('mv-camera')===video){
   stopCamera();
   error=['Kamera nicht verfügbar. Bitte eine Kiste auswählen.','Camera unavailable. Choose a box from the list.'];
   render();
  }
 }finally{
  openingCamera=false;
  if(scanner&&!media&&document.getElementById('mv-camera')!==video)void startCamera();
 }
}
app?.addEventListener('change',e=>{if(e.target.id==='mv-select'){selected=e.target.value;notice='';render();}});
app?.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.act==='refresh'){notice='';await refresh();return;}
 if(b.dataset.act==='stop'){stopCamera();render();return;}
 if(b.dataset.act==='scan'){scanner=true;error='';render();return;}
 if(b.dataset.report){await reportIncident(b.dataset.report,b.dataset.kind);return;}
 if(b.dataset.id)await change(b.dataset.id,b.dataset.status);
});
window.addEventListener('pagehide',stopCamera);
void refresh();
