import {readMoving,createProject,createRoom,assignBox,updateStatus,finishProject,priorityList,statuses} from './moving-state.mjs';
const labels={planned:'Geplant',packed:'Gepackt',loaded:'Verladen',arrived:'Angekommen',unpacked:'Ausgepackt'};
const importance={normal:'Normal',important:'Wichtig',first_day:'Erster Tag'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const el=document.getElementById('toolya-moving-planner');
let saving=false,activeTab='boxes',error='';
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
  catch(e){el.innerHTML='<div class="mv-error" role="alert">'+esc(e.message)+'</div>';return;}
  const p=m.projects.find(x=>x.status==='active');
  let h='<div class="mv-head"><div><h2>🚚 Mein Umzug</h2><p>Plane Räume, Kisten und die ersten Tage am neuen Wohnort.</p></div></div>';
  if(error)h+='<p class="mv-error" role="alert">'+esc(error)+'</p>';
  if(!p){
    h+='<div class="mv-card"><p>Du kannst dein bestehendes Inventar weiterhin wie gewohnt verwenden.</p><button data-act="project" class="mv-primary">+ Neuen Umzug planen</button></div>';
    const done=m.projects.filter(x=>x.status==='completed').length;
    if(done)h+='<p class="mv-muted">'+done+' abgeschlossene Umzüge im Verlauf</p>';
    el.innerHTML=h;return;
  }
  const assigned=m.assignments.filter(x=>x.projectId===p.id),rooms=m.rooms.filter(x=>x.projectId===p.id&&!x.archived);
  const liveStatus=a=>window.movingTransportStatuses?.[a.id]?.status||a.status;
  const arrived=assigned.filter(x=>['arrived','unpacked'].includes(liveStatus(x))).length;
  const unpacked=assigned.filter(x=>liveStatus(x)==='unpacked').length;
  h+='<div class="mv-project"><strong>'+esc(p.name)+'</strong><span>'+esc(p.moveDate||'Ohne Umzugsdatum')+'</span></div>';
  h+='<div class="mv-stats"><div><strong>'+assigned.length+'</strong><small>Kisten</small></div><div><strong>'+arrived+'</strong><small>Angekommen</small></div><div><strong>'+unpacked+'</strong><small>Ausgepackt</small></div></div>';
  h+='<div class="mv-progress" aria-label="'+arrived+' von '+assigned.length+' Kisten angekommen"><span style="width:'+(assigned.length?Math.round(arrived/assigned.length*100):0)+'%"></span></div>';
  h+='<div class="mv-tabs" role="group" aria-label="Umzugsansicht"><button data-tab="boxes" '+(activeTab==='boxes'?'aria-current="true"':'')+'>Kisten</button><button data-tab="rooms" '+(activeTab==='rooms'?'aria-current="true"':'')+'>Räume</button><button data-tab="first" '+(activeTab==='first'?'aria-current="true"':'')+'>Erste 72 Std.</button></div>';
  if(activeTab==='rooms'){
    h+='<button class="mv-secondary" data-act="room">+ Zielraum hinzufügen</button>';
    h+='<div class="mv-list">'+(rooms.length?rooms.map(r=>{const a=assigned.filter(x=>x.targetRoomId===r.id);return '<div class="mv-item"><strong>'+esc(r.name)+'</strong><small>'+esc(r.floor||'')+' · '+a.length+' Kisten</small></div>';}).join(''):'<p class="mv-muted">Noch keine Zielräume vorhanden.</p>')+'</div>';
  }else if(activeTab==='first'){
    const ordered=priorityList(data,p.id).filter(a=>liveStatus(a)!=='unpacked');
    h+='<p class="mv-muted">Diese Reihenfolge ergibt sich aus der eingestellten Priorität. Du kannst sie bei jeder Kiste ändern.</p>';
    h+='<div class="mv-list">'+(ordered.length?ordered.map(a=>{const b=data.boxes.find(x=>x.id===a.boxId);return '<div class="mv-item"><strong>'+esc(b?.name||'Kiste')+'</strong><small>'+esc(importance[a.priority])+' · '+esc(labels[liveStatus(a)])+'</small></div>';}).join(''):'<p class="mv-muted">Noch keine offenen Kisten.</p>')+'</div>';
  }else{
    const available=data.boxes.filter(b=>!assigned.some(a=>a.boxId===b.id));
    if(window.movingTransportActive)h+='<p class="mv-muted">🚛 Der Transportstatus wird serverseitig im Bereich „Transport & Helfer“ verwaltet.</p>';
    h+='<button class="mv-primary" data-act="assign" '+(!available.length?'disabled':'')+'>+ Vorhandene Kiste zuordnen</button>';
    h+='<div class="mv-list">'+(assigned.length?assigned.map(a=>{
      const b=data.boxes.find(x=>x.id===a.boxId),r=rooms.find(x=>x.id===a.targetRoomId);
      const i=statuses.indexOf(liveStatus(a));
      return '<div class="mv-item"><div><strong>'+esc(b?.name||'Kiste #'+a.boxId)+'</strong><small>'+esc(r?.name||'Noch kein Zielraum')+' · '+esc(importance[a.priority])+'</small></div><div class="mv-actions"><select data-room="'+esc(a.id)+'" aria-label="Zielraum" '+(saving?'disabled':'')+'><option value="">Ohne Zielraum</option>'+rooms.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===a.targetRoomId?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select><select data-priority="'+esc(a.id)+'" aria-label="Priorität" '+(saving?'disabled':'')+'>'+Object.entries(importance).map(([v,l])=>'<option value="'+v+'" '+(a.priority===v?'selected':'')+'>'+l+'</option>').join('')+'</select><div class="mv-status"><button data-step="'+esc(a.id)+'" data-delta="-1" '+(i===0||saving||window.movingTransportActive?'disabled':'')+' aria-label="Vorheriger Status">‹</button><span>'+esc(labels[a.status])+'</span><button data-step="'+esc(a.id)+'" data-delta="1" '+(i===4||saving||window.movingTransportActive?'disabled':'')+' aria-label="Nächster Status">›</button></div></div></div>';
    }).join(''):'<p class="mv-muted">Noch keine Kisten zugeordnet.</p>')+'</div>';
  }
  h+='<div class="mv-footer"><button class="mv-secondary" data-act="finish" '+(saving?'disabled':'')+'>Umzug abschließen</button><span class="mv-muted">'+(saving?'Speichern …':'Alle Änderungen werden in Toolya Cloud gespeichert')+'</span></div>';
  el.innerHTML=h;
}
el?.addEventListener('click',async ev=>{
  const b=ev.target.closest('button');if(!b||saving)return;
  if(b.dataset.tab){activeTab=b.dataset.tab;render();return;}
  const a=b.dataset.act;
  if(a==='project'){
    const name=promptText('Wie soll dein Umzug heißen?','Mein Umzug');if(!name)return;
    const date=promptText('Umzugsdatum (JJJJ-MM-TT, optional)','')??'';
    if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date)){error='Bitte Datum im Format JJJJ-MM-TT eingeben';render();return;}
    await commit(s=>createProject(s,name,date));return;
  }
  const data=snapshot(),m=readMoving(data),p=m.projects.find(x=>x.status==='active');if(!p)return;
  if(a==='room'){
    const name=promptText('Name des Zielraums');if(!name)return;
    const floor=promptText('Etage (optional)','')??'';
    await commit(s=>createRoom(s,p.id,name,floor));return;
  }
  if(a==='assign'){
    const available=data.boxes.filter(x=>!m.assignments.some(a=>a.projectId===p.id&&a.boxId===x.id));
    if(!available.length)return;
    const value=promptText('Kistennummer oder exakten Kistennamen eingeben:\n'+available.slice(0,18).map(x=>x.id+' – '+x.name).join('\n'),String(available[0].id));
    if(value===null)return;
    const box=available.find(x=>String(x.id)===value.trim())||available.find(x=>x.name.toLowerCase()===value.trim().toLowerCase());
    if(!box){error='Keine passende Kiste gefunden';render();return;}
    const rooms=m.rooms.filter(x=>x.projectId===p.id&&!x.archived);
    const room=rooms.length?rooms[0].id:null;
    await commit(s=>assignBox(s,p.id,box.id,room));return;
  }
  if(a==='finish'){
    const pending=m.assignments.filter(x=>x.projectId===p.id&&x.status!=='unpacked').length;
    if(!confirm('Umzug abschließen? '+pending+' Kisten sind noch nicht ausgepackt. Das Inventar bleibt erhalten.'))return;
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
document.addEventListener('toolya:moving-ready',render);
document.addEventListener('toolya:moving-saved',render);
document.addEventListener('toolya:moving-transport',render);
render();
