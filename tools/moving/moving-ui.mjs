import {readMoving,createProject,createRoom,assignBox,updateStatus,finishProject,priorityList,statuses} from './moving-state.mjs';
const text=(de,en)=>window.__toolyaUILocale==='en'?en:de;
const labels={
 planned:['Geplant','Planned'],packed:['Gepackt','Packed'],loaded:['Verladen','Loaded'],
 arrived:['Angekommen','Arrived'],unpacked:['Ausgepackt','Unpacked']
};
const importance={normal:['Normal','Normal'],important:['Wichtig','Important'],first_day:['Erster Tag','First day']};
const errors=new Map([
 ['Cloud-Speicherung nicht bestätigt. Bitte neu laden.','Cloud save could not be confirmed. Please reload.'],
 ['Speichern fehlgeschlagen','Could not save changes'],
 ['Bitte zuerst den bisherigen Umzug abschließen','Finish your current move first'],
 ['Doppelte oder ungültige Projekt-ID','Duplicate or invalid project ID'],
 ['Kistenzuordnung fehlt','Box assignment missing'],
 ['Mehrfachzuordnung erkannt','Duplicate box assignment'],
 ['Nur ein aktiver Umzug erlaubt','Only one active move is allowed'],
 ['Projekt ist abgeschlossen','This move is already finished'],
 ['Projekt nicht aktiv','This move is inactive'],
 ['Projektname fehlt','Enter a name for the move'],
 ['Raumname fehlt','Enter a room name'],
 ['Statuswechsel nicht erlaubt','That status change is unavailable'],
 ['Unbekannte oder beschädigte Umzugsdaten','Unrecognized or damaged moving data'],
 ['Ungültige Kistenzuordnung','Invalid box assignment'],
 ['Ungültiger Zielraum','Invalid destination room'],
 ['Ungültiges Inventar','Invalid inventory'],
 ['Ungültiges Projekt','Invalid move'],
 ['Bitte Datum im Format JJJJ-MM-TT eingeben','Enter the date as YYYY-MM-DD'],
 ['Keine passende Kiste gefunden','No matching box found']
]);
const displayError=message=>text(message,errors.get(message)??message);
const displayLabel=(catalog,key)=>Object.hasOwn(catalog,key)?text(...catalog[key]):'';
const numberFormats={de:new Intl.NumberFormat('de-DE'),en:new Intl.NumberFormat('en-GB')};
const number=value=>numberFormats[text('de','en')].format(value);
function displayDate(value){
 if(!value)return text('Ohne Umzugsdatum','No moving date');
 const date=new Date(value+'T00:00:00Z');
 if(!Number.isFinite(date.valueOf())||date.toISOString().slice(0,10)!==value)return value;
 return new Intl.DateTimeFormat(text('de-DE','en-GB'),{dateStyle:'medium',timeZone:'UTC'}).format(date);
}
const boxCount=count=>number(count)+' '+(count===1?text('Kiste','box'):text('Kisten','boxes'));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const el=document.getElementById('toolya-moving-planner');
let saving=false,activeTab='rooms',error='',navigationPhase='preparation';
const snapshot=()=>window.getData();
const promptText=(q,def='')=>window.prompt(q,def);
async function commit(edit){
  if(saving)return;
  saving=true;error='';render();
  try{
    const next=edit(snapshot());
    if(!await window.saveData(next))throw Error('Cloud-Speicherung nicht bestätigt. Bitte neu laden.');
  }catch(e){error=e.message||'Speichern fehlgeschlagen';}
  finally{saving=false;render();}
}
function render(){
 if(!el||typeof window.getData!=='function')return;
 if(!window.movingCloudReady){el.hidden=true;return;}
 el.hidden=false;
 let data,m;
 try{data=snapshot();m=readMoving(data);}
 catch(e){el.innerHTML=`<div class="mv-error" role="alert">${esc(displayError(e.message))}</div>`;return;}
 const project=m.projects.find(x=>x.status==='active');
 let html=`<div class="mv-head"><div><h2>🚚 ${text('Mein Umzug','My move')}</h2><p>${text(
  'Plane Räume, Kisten und die ersten Tage am neuen Wohnort.',
  'Plan the rooms, boxes and first few days in your new home.'
 )}</p></div></div>`;
 if(error)html+=`<p class="mv-error" role="alert">${esc(displayError(error))}</p>`;
 if(!project){
  html+=`<div class="mv-card"><p>${text(
   'Du kannst dein bestehendes Inventar weiterhin wie gewohnt verwenden.',
   'You can continue using your existing inventory.'
  )}</p><button data-act="project" class="mv-primary">+ ${text('Neuen Umzug planen','Plan a new move')}</button></div>`;
  const count=m.projects.filter(x=>x.status==='completed').length;
  if(count)html+=`<p class="mv-muted">${number(count)} ${count===1?text('abgeschlossener Umzug','completed move'):text('abgeschlossene Umzüge','completed moves')}</p>`;
  el.innerHTML=html;
  return;
 }
 const assigned=m.assignments.filter(x=>x.projectId===project.id);
 const rooms=m.rooms.filter(x=>x.projectId===project.id&&!x.archived);
 const liveStatus=assignment=>window.movingTransportStatuses?.[assignment.id]?.status||assignment.status;
 const outstanding=assigned.filter(x=>!['arrived','unpacked'].includes(liveStatus(x)));
 const arrived=assigned.length-outstanding.length;
 const unpacked=assigned.filter(x=>liveStatus(x)==='unpacked').length;
 const progress=text(
  `${number(arrived)} von ${boxCount(assigned.length)} angekommen`,
  `${number(arrived)} of ${boxCount(assigned.length)} arrived`
 );
 html+=`<div class="mv-project"><strong>${esc(project.name)}</strong><span>${esc(displayDate(project.moveDate))}</span></div>
  <div class="mv-stats">
   <div><strong>${number(assigned.length)}</strong><small>${text('Kisten','Boxes')}</small></div>
   <div><strong>${number(arrived)}</strong><small>${text('Angekommen','Arrived')}</small></div>
   <div><strong>${number(unpacked)}</strong><small>${text('Ausgepackt','Unpacked')}</small></div>
  </div>
  <div class="mv-progress" aria-label="${progress}"><span style="width:${assigned.length?Math.round(arrived/assigned.length*100):0}%"></span></div>
  ${navigationPhase!=='preparation'&&assigned.length?`<details class="mv-card" data-arrival-details>
   <summary>${progress} · ${text('Was fehlt noch?', 'What is still outstanding?')}</summary>
   <div class="mv-list">${outstanding.map(assignment=>{
    const box=data.boxes.find(item=>item.id===assignment.boxId);
    const room=rooms.find(item=>item.id===assignment.targetRoomId);
    return `<div class="mv-item"><strong>${esc(box?.name||String(assignment.boxId))}</strong><small>${esc(room?.name||text('Ohne Zielraum','No destination room'))} · ${displayLabel(labels,liveStatus(assignment))}</small></div>`;
   }).join('')||`<p>${text('Alle Kisten sind angekommen.','All boxes have arrived.')}</p>`}</div>
  </details>`:''}
  <div class="mv-tabs" role="group" aria-label="${text('Umzugsansicht','Moving plan')}">
   <button data-tab="rooms" ${activeTab==='rooms'?'aria-current="true"':''}>1. ${text('Zielräume','Destination rooms')}</button>
   <button data-tab="boxes" ${activeTab==='boxes'?'aria-current="true"':''}>2. ${text('Kisten zuordnen','Assign boxes')}</button>
   <button data-tab="first" ${activeTab==='first'?'aria-current="true"':''}>3. ${text('Erste 72 Std.','First 72 hours')}</button>
  </div>`;
 if(activeTab==='rooms'){
  const roomRows=rooms.map(room=>{
   const count=assigned.filter(x=>x.targetRoomId===room.id).length;
   return `<div class="mv-item"><strong>${esc(room.name)}</strong><small>${esc(room.floor||'')} · ${boxCount(count)}</small></div>`;
  }).join('');
  html+=`<button class="mv-secondary" data-act="room">+ ${text('Zielraum hinzufügen','Add destination room')}</button>
   <div class="mv-list">${roomRows||`<p class="mv-muted">${text('Noch keine Zielräume vorhanden.','No destination rooms yet.')}</p>`}</div>`;
 }else if(activeTab==='first'){
  const ordered=priorityList(data,project.id);
  const groups=[...rooms, {id:null,name:text('Ohne Zielraum','No destination room')}];
  const rows=groups.map(room=>{
   const inRoom=ordered.filter(assignment=>rooms.some(entry=>entry.id===assignment.targetRoomId)
    ? assignment.targetRoomId===room.id : room.id===null);
   if(!inRoom.length)return '';
   const pending=inRoom.filter(assignment=>liveStatus(assignment)!=='unpacked');
   return `<div class="mv-card"><h3>${esc(room.name)}</h3><p>${text(
    `${number(inRoom.length-pending.length)} von ${boxCount(inRoom.length)} ausgepackt`,
    `${number(inRoom.length-pending.length)} of ${boxCount(inRoom.length)} unpacked`
   )}</p><div class="mv-list">${pending.map(assignment=>{
    const box=data.boxes.find(item=>item.id===assignment.boxId);
    return `<div class="mv-item"><strong>${esc(box?.name||String(assignment.boxId))}</strong><small>${displayLabel(importance,assignment.priority)} · ${displayLabel(labels,liveStatus(assignment))}</small></div>`;
   }).join('')}</div></div>`;
  }).join('');
  html+=`<div class="mv-list">${rows||`<p class="mv-muted">${text('Noch keine Kisten zugeordnet.','No boxes assigned yet.')}</p>`}</div>`;
 }else{
  const available=data.boxes.some(box=>!assigned.some(assignment=>assignment.boxId===box.id));
  if(window.movingTransportActive)html+=`<p class="mv-muted">🚛 ${text(
   'Der Transportstatus wird serverseitig im Bereich „Transport & Helfer“ verwaltet.',
   'Manage transport status in Transport & helpers.'
  )}</p>`;
  const rows=assigned.map(assignment=>{
   const box=data.boxes.find(x=>x.id===assignment.boxId);
   const room=rooms.find(x=>x.id===assignment.targetRoomId);
   const index=statuses.indexOf(liveStatus(assignment));
   const disableStatus=saving||window.movingTransportActive;
   const id=esc(assignment.id);
   const roomOptions=rooms.map(x=>`<option value="${esc(x.id)}" ${x.id===assignment.targetRoomId?'selected':''}>${esc(x.name)}</option>`).join('');
   const priorityOptions=Object.entries(importance).map(([value,label])=>`<option value="${value}" ${assignment.priority===value?'selected':''}>${text(...label)}</option>`).join('');
   return `<div class="mv-item">
    <div><strong>${esc(box?.name||text('Kiste #','Box #')+assignment.boxId)}</strong><small>${esc(room?.name||text('Noch kein Zielraum','No destination room yet'))} · ${displayLabel(importance,assignment.priority)}</small></div>
    <div class="mv-actions">
     <select data-room="${id}" aria-label="${text('Zielraum','Destination room')}" ${saving?'disabled':''}><option value="">${text('Ohne Zielraum','No destination room')}</option>${roomOptions}</select>
     <select data-priority="${id}" aria-label="${text('Priorität','Priority')}" ${saving?'disabled':''}>${priorityOptions}</select>
     <div class="mv-status">
      <button data-step="${id}" data-delta="-1" ${index<=0||disableStatus?'disabled':''} aria-label="${text('Vorheriger Status','Previous status')}">‹</button>
      <span>${displayLabel(labels,liveStatus(assignment))}</span>
      <button data-step="${id}" data-delta="1" ${index<0||index===statuses.length-1||disableStatus?'disabled':''} aria-label="${text('Nächster Status','Next status')}">›</button>
     </div>
    </div>
   </div>`;
  }).join('');
  html+=`<button class="mv-primary" data-act="assign" ${!available?'disabled':''}>+ ${text('Vorhandene Kiste zuordnen','Assign an existing box')}</button>
   <div class="mv-list">${rows||`<p class="mv-muted">${text('Noch keine Kisten zugeordnet.','No boxes assigned yet.')}</p>`}</div>`;
 }
 html+=`<div class="mv-footer">
  ${navigationPhase==='arrival'?`<button class="mv-secondary" data-act="finish" ${saving?'disabled':''}>${text('Umzug abschließen','Finish move')}</button>`:''}
  <span class="mv-muted">${saving?text('Speichern …','Saving…'):text('Alle Änderungen werden in Toolya Cloud gespeichert','All changes are saved to Toolya Cloud')}</span>
 </div>`;
 const arrivalWasOpen=el.querySelector('[data-arrival-details]')?.open;
 el.innerHTML=html;
 const arrivalDetails=el.querySelector('[data-arrival-details]');
 if(arrivalDetails&&arrivalWasOpen)arrivalDetails.open=true;
}
el?.addEventListener('click',async ev=>{
  const b=ev.target.closest('button');if(!b||saving)return;
  if(b.dataset.tab){activeTab=b.dataset.tab;render();return;}
  const a=b.dataset.act;
  if(a==='project'){
    const name=promptText(text('Wie soll dein Umzug heißen?','What would you like to name your move?'),text('Mein Umzug','My move'));if(!name)return;
    const date=promptText(text('Umzugsdatum (JJJJ-MM-TT, optional)','Moving date (YYYY-MM-DD, optional)'))??'';
    if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date)){error='Bitte Datum im Format JJJJ-MM-TT eingeben';render();return;}
    await commit(s=>createProject(s,name,date));return;
  }
  const data=snapshot(),m=readMoving(data),p=m.projects.find(x=>x.status==='active');if(!p)return;
  if(a==='room'){
    const name=promptText(text('Name des Zielraums','Destination room name'));if(!name)return;
    const floor=promptText(text('Etage (optional)','Floor (optional)'))??'';
    await commit(s=>createRoom(s,p.id,name,floor));return;
  }
  if(a==='assign'){
    const available=data.boxes.filter(x=>!m.assignments.some(a=>a.projectId===p.id&&a.boxId===x.id));
    if(!available.length)return;
    const value=promptText(text('Kistennummer oder exakten Kistennamen eingeben:','Enter the box number or exact box name:')+'\n'+available.slice(0,18).map(x=>x.id+' – '+x.name).join('\n'),String(available[0].id));
    if(value===null)return;
    const box=available.find(x=>String(x.id)===value.trim())||available.find(x=>x.name.toLowerCase()===value.trim().toLowerCase());
    if(!box){error='Keine passende Kiste gefunden';render();return;}
    const rooms=m.rooms.filter(x=>x.projectId===p.id&&!x.archived);
    const room=rooms.length?rooms[0].id:null;
    await commit(s=>assignBox(s,p.id,box.id,room));return;
  }
  if(a==='finish'){
    const pending=m.assignments.filter(x=>x.projectId===p.id&&(window.movingTransportStatuses?.[x.id]?.status||x.status)!=='unpacked').length;
    const confirmation=text(
     `Umzug abschließen? Noch nicht ausgepackt: ${boxCount(pending)}. Das Inventar bleibt erhalten.`,
     `Finish the move? Still to unpack: ${boxCount(pending)}. Your inventory will be kept.`
    );
    if(!confirm(confirmation))return;
    await commit(s=>finishProject(s,p.id));return;
  }
  if(b.dataset.step){
    if(window.movingTransportActive)return;
    const id=b.dataset.step,as=m.assignments.find(x=>x.id===id);if(!as)return;
    const next=statuses[statuses.indexOf(as.status)+Number(b.dataset.delta)];
    if(next)await commit(s=>updateStatus(s,id,next));
  }
});
el?.addEventListener('change',async ev=>{
  const t=ev.target;if(saving)return;
  if(t.dataset.room){const id=t.dataset.room,value=t.value||null;await commit(s=>{const m=s.moving,a=m.assignments.find(x=>x.id===id);if(a){a.targetRoomId=value;a.updatedAt=new Date().toISOString();}return s;});}
  else if(t.dataset.priority){const id=t.dataset.priority,value=t.value;await commit(s=>{const a=s.moving.assignments.find(x=>x.id===id);if(a){a.priority=value;a.updatedAt=new Date().toISOString();}return s;});}
});
document.addEventListener('toolya:locale-change',render);
document.addEventListener('toolya:moving-ready',render);
document.addEventListener('toolya:moving-saved',render);
document.addEventListener('toolya:moving-transport',render);
document.addEventListener('toolya:moving-navigation',event=>{
  const next=event.detail?.phase;
  if(event.detail?.mode!=='moving'||!['preparation','transport','arrival'].includes(next)||next===navigationPhase)return;
  navigationPhase=next;
  activeTab=next==='arrival'?'first':'rooms';
  render();
});
render();
