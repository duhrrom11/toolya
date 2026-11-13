const db=window.supabase.createClient('https://avapuibsidubuzxjtyld.supabase.co','sb_publishable_95Vz26YwSFFWukFbqTBjMw_pv10kOFC');
const $=id=>document.getElementById(id);
const labels={open:'⬜ Offen',in_progress:'🔄 In Arbeit',done:'✅ Erledigt'};
const priorities={1:'🔴 Hoch',2:'🟡 Mittel',3:'🟢 Niedrig'};
let user=null,tasks=[],occasions=[],gifts=[],editing=null,weekOffset=0;
const dayMs=86400000;
function today(){const d=new Date();return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())}
function days(date){const [y,m,d]=date.split('-').map(Number);return Math.round((Date.UTC(y,m-1,d)-today())/dayMs)}
function option(el,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;el.append(o)}
function choices(){for(const id of ['occasion','gift'])$(id).replaceChildren();option($('occasion'),'','Ohne Anlass');option($('gift'),'','Ohne Geschenk');
 for(const o of occasions)option($('occasion'),o.id,o.title);
 for(const g of gifts)if(!$('occasion').value||g.occasion_id===$('occasion').value)option($('gift'),g.id,g.title)}
function refreshGifts(){const selected=$('gift').value;const el=$('gift');el.replaceChildren();option(el,'','Ohne Geschenk');for(const g of gifts)if(!$('occasion').value||g.occasion_id===$('occasion').value)option(el,g.id,g.title);if([...el.options].some(x=>x.value===selected))el.value=selected}
function reset(){editing=null;$('form').reset();$('formTitle').textContent='➕ Aufgabe hinzufügen';$('save').textContent='Aufgabe speichern';$('cancel').hidden=true;choices()}
function render(){renderWeek();renderChecklistProgress();renderYearBalance();
 const reminders=$('reminders');reminders.replaceChildren();
 const due=tasks.filter(t=>!t.archived_at&&t.status!=='done'&&t.due_date&&days(t.due_date)<=t.reminder_days).sort((a,b)=>days(a.due_date)-days(b.due_date)||a.priority-b.priority);
 if(!due.length){const p=document.createElement('p');p.className='empty';p.textContent='Keine fälligen Erinnerungen.';reminders.append(p)}
 for(const t of due.slice(0,15)){const p=document.createElement('p');p.className='warn';p.textContent=(days(t.due_date)<0?'⚠️ '+(-days(t.due_date))+' Tage überfällig':days(t.due_date)===0?'🔔 Heute fällig':'🔔 In '+days(t.due_date)+' Tagen')+' · '+t.title;reminders.append(p)}
 const root=$('tasks');root.replaceChildren();const filter=$('filter').value;
 const visible=tasks.filter(t=>!t.archived_at&&(filter==='all'||(filter==='done'?t.status==='done':t.status!=='done'))).sort((a,b)=>Number(a.status==='done')-Number(b.status==='done')||((a.due_date?days(a.due_date):99999)-(b.due_date?days(b.due_date):99999))||a.priority-b.priority);
 if(!visible.length){const p=document.createElement('p');p.className='empty';p.textContent='Keine Aufgaben in dieser Ansicht.';root.append(p)}
 for(const t of visible){
  const item=document.createElement('article'),h=document.createElement('h3');item.className='item';h.textContent=t.title;
  const occasion=occasions.find(o=>o.id===t.occasion_id),gift=gifts.find(g=>g.id===t.gift_plan_id);
  const meta=document.createElement('p');meta.textContent=[labels[t.status],priorities[t.priority],t.due_date?'Fällig: '+new Date(t.due_date+'T12:00:00').toLocaleDateString('de-DE'):'Ohne Fälligkeit',occasion?.title,gift?.title].filter(Boolean).join(' · ');
  const controls=document.createElement('div');controls.className='controls';
  const edit=document.createElement('button');edit.type='button';edit.textContent='Bearbeiten';edit.addEventListener('click',()=>{editing=t.id;$('title').value=t.title;$('occasion').value=t.occasion_id||'';refreshGifts();$('gift').value=t.gift_plan_id||'';$('due').value=t.due_date||'';$('reminder').value=t.reminder_days;$('priority').value=t.priority;$('taskStatus').value=t.status;$('notes').value=t.notes||'';$('formTitle').textContent='✏️ Aufgabe bearbeiten';$('save').textContent='Änderungen speichern';$('cancel').hidden=false;$('form').scrollIntoView({behavior:'smooth',block:'start'})});
  const toggle=document.createElement('button');toggle.type='button';toggle.textContent=t.status==='done'?'Wieder öffnen':'✓ Erledigt';toggle.addEventListener('click',async()=>{toggle.disabled=true;const next=t.status==='done'?'open':'done';const {error}=await db.from('wishlist_gift_tasks').update({status:next,updated_at:new Date().toISOString()}).eq('id',t.id).eq('user_id',user.id);toggle.disabled=false;if(error){$('status').textContent='Statuswechsel fehlgeschlagen.';return}t.status=next;render();$('status').textContent='Aufgabe aktualisiert.'});
  const remove=document.createElement('button');remove.type='button';remove.textContent='Löschen';remove.addEventListener('click',async()=>{if(!confirm('Aufgabe wirklich löschen?'))return;remove.disabled=true;const {error}=await db.from('wishlist_gift_tasks').delete().eq('id',t.id).eq('user_id',user.id);if(error){remove.disabled=false;$('status').textContent='Löschen fehlgeschlagen.';return}tasks=tasks.filter(x=>x.id!==t.id);if(editing===t.id)reset();render();$('status').textContent='Aufgabe gelöscht.'});
  controls.append(edit,toggle,remove);item.append(h,meta,controls);root.append(item);
 }
}
$('occasion').addEventListener('change',refreshGifts);
$('filter').addEventListener('change',render);
$('cancel').addEventListener('click',reset);
$('form').addEventListener('submit',async event=>{event.preventDefault();if(!user)return;
 const title=$('title').value.trim();if(!title){$('status').textContent='Bitte Aufgabe eingeben.';return}
 const giftId=$('gift').value||null,linked=gifts.find(g=>g.id===giftId);
 const payload={title,occasion_id:$('occasion').value||linked?.occasion_id||null,gift_plan_id:giftId,due_date:$('due').value||null,reminder_days:Number($('reminder').value),priority:Number($('priority').value),status:$('taskStatus').value,notes:$('notes').value.trim()||null,updated_at:new Date().toISOString()};
 $('save').disabled=true;try{const fields='id,title,occasion_id,gift_plan_id,due_date,reminder_days,priority,status,notes,checklist_key,checklist_year,archived_at,created_at';const r=editing?await db.from('wishlist_gift_tasks').update(payload).eq('id',editing).eq('user_id',user.id).select(fields).single():await db.from('wishlist_gift_tasks').insert({...payload,user_id:user.id}).select(fields).single();if(r.error)throw r.error;tasks=tasks.filter(x=>x.id!==r.data.id);tasks.push(r.data);reset();render();$('status').textContent='Aufgabe gespeichert.'}catch{$('status').textContent='Aufgabe konnte nicht gespeichert werden.'}finally{$('save').disabled=false}
});
async function main(){
 const {data,error}=await db.auth.getUser();user=data?.user;if(error||!user){$('login').hidden=false;$('status').textContent='Bitte anmelden.';return}
 const [t,o,g]=await Promise.all([db.from('wishlist_gift_tasks').select('id,title,occasion_id,gift_plan_id,due_date,reminder_days,priority,status,notes,checklist_key,checklist_year,archived_at,created_at').eq('user_id',user.id).limit(1000),db.from('wishlist_occasions').select('id,title,occasion_date,repeats_yearly').eq('user_id',user.id).limit(1000),db.from('wishlist_gift_plans').select('id,title,occasion_id').eq('user_id',user.id).limit(1000)]);
 if(t.error||o.error||g.error)throw t.error||o.error||g.error;tasks=t.data||[];occasions=o.data||[];gifts=g.data||[];choices();for(const occasion of occasions)option($('checklistOccasion'),occasion.id,occasion.title);renderRolloverSelection();$('content').hidden=false;render();$('status').textContent='Deine Geschenk-To-dos sind aktuell.';
}

const templates=[
 {label:'🛒 Bestellen',title:'Geschenk bestellen',offset:14,reminder:3,priority:1},
 {label:'📦 Abholen',title:'Geschenk abholen',offset:5,reminder:1,priority:2},
 {label:'🎀 Verpacken',title:'Geschenk verpacken',offset:2,reminder:1,priority:2},
 {label:'✉️ Karte',title:'Grußkarte schreiben',offset:3,reminder:1,priority:2},
 {label:'🚚 Versand',title:'Geschenk verschicken',offset:10,reminder:3,priority:1},
 {label:'🎉 Überreichen',title:'Geschenk überreichen',offset:0,reminder:0,priority:2}
];
function localDate(utc){const d=new Date(utc);return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0')}
function occasionUTC(o){
 if(!o?.occasion_date)return null;
 const [y,m,d]=o.occasion_date.split('-').map(Number),now=today();
 const occurrence=year=>Date.UTC(year,m-1,m===2&&d===29&&new Date(Date.UTC(year,1,29)).getUTCMonth()!==1?28:d);
 if(!o.repeats_yearly)return occurrence(y);
 const year=new Date(now).getUTCFullYear();let date=occurrence(year);if(date<now)date=occurrence(year+1);return date;
}
function suggestDate(offset=0){
 const gift=gifts.find(g=>g.id===$('gift').value),occasion=occasions.find(o=>o.id===($('occasion').value||gift?.occasion_id));
 const date=occasionUTC(occasion);
 if(date===null){$('dueHint').textContent='Bitte zuerst einen Anlass mit Datum auswählen.';return false}
 const suggestion=localDate(date-offset*dayMs);
 $('due').value=suggestion;
 $('dueHint').textContent='Vorschlag: '+new Date(suggestion+'T12:00:00').toLocaleDateString('de-DE')+' ('+offset+' Tage vor '+occasion.title+'). Du kannst das Datum ändern.';
 return true;
}
for(const template of templates){
 const button=document.createElement('button');button.type='button';button.textContent=template.label;
 button.addEventListener('click',()=>{$('title').value=template.title;$('reminder').value=String(template.reminder);$('priority').value=String(template.priority);$('taskStatus').value='open';suggestDate(template.offset);$('templateHint').textContent='Vorlage '+template.label+' übernommen. Prüfe die Angaben und speichere die Aufgabe selbst.';$('title').focus()});
 $('templates').append(button);
}
$('suggestDue').addEventListener('click',()=>suggestDate(0));
function weekStart(){
 const d=new Date(today()),weekday=(d.getUTCDay()+6)%7;
 return today()-weekday*dayMs+weekOffset*7*dayMs;
}
function renderWeek(){
 const root=$('weekGrid');root.replaceChildren();const start=weekStart();
 $('weekLabel').textContent=new Date(start).toLocaleDateString('de-DE',{day:'2-digit',month:'short'})+' – '+new Date(start+6*dayMs).toLocaleDateString('de-DE',{day:'2-digit',month:'short',year:'numeric'});
 const daysShort=['Mo','Di','Mi','Do','Fr','Sa','So'];
 for(let i=0;i<7;i++){
  const utc=start+i*dayMs,iso=localDate(utc),card=document.createElement('article');card.className='week-day'+(utc===today()?' today':'');
  const heading=document.createElement('strong');heading.textContent=daysShort[i]+' '+new Date(utc).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'});card.append(heading);
  const matching=tasks.filter(t=>!t.archived_at&&t.status!=='done'&&t.due_date===iso).sort((a,b)=>a.priority-b.priority);
  if(!matching.length){const p=document.createElement('p');p.textContent='–';card.append(p)}
  for(const task of matching){const chip=document.createElement('span');chip.className='task-chip';chip.textContent=(task.priority===1?'🔴 ':'')+task.title;card.append(chip)}
  root.append(card);
 }
 const overdue=tasks.filter(t=>!t.archived_at&&t.status!=='done'&&t.due_date&&days(t.due_date)<0);
 if(overdue.length){const p=document.createElement('p');p.className='warn';p.textContent='⚠️ '+overdue.length+' überfällige Aufgaben – Details unter Erinnerungen.';root.append(p)}
}
$('weekPrev').addEventListener('click',()=>{weekOffset--;renderWeek()});
$('weekNext').addEventListener('click',()=>{weekOffset++;renderWeek()});
$('weekToday').addEventListener('click',()=>{weekOffset=0;renderWeek()});


function renderChecklistProgress(){
 const root=$('checklistProgress');root.replaceChildren();const grouped=new Map();
 for(const task of tasks){if(!task.checklist_key||!task.occasion_id)continue;const year=task.checklist_year===null||task.checklist_year===undefined?'legacy':String(task.checklist_year),key=task.occasion_id+'|'+year;
 const bucket=grouped.get(key)||{occasionId:task.occasion_id,year,total:0,done:0,archived:0};bucket.total++;if(task.status==='done')bucket.done++;if(task.archived_at)bucket.archived++;grouped.set(key,bucket)}
 if(!grouped.size){const p=document.createElement('p');p.className='empty';p.textContent='Noch keine Aufgabenpakete erstellt.';root.append(p);return}
 for(const group of [...grouped.values()].sort((a,b)=>b.year.localeCompare(a.year))){const occasion=occasions.find(o=>o.id===group.occasionId);if(!occasion)continue;
 const row=document.createElement('div');row.className='checklist-row';const heading=document.createElement('strong');heading.textContent=occasion.title+' · '+(group.year==='legacy'?'Bisherige Checkliste (ohne Jahr)':group.year)+(group.archived===group.total?' · 📦 Archiviert':group.archived?' · teilweise archiviert':'');
 const meter=document.createElement('progress');meter.className='checklist-meter';meter.max=group.total;meter.value=group.done;meter.setAttribute('aria-label','Checklistenfortschritt '+occasion.title+' '+group.year);
 const summary=document.createElement('p');summary.textContent=group.done+' von '+group.total+' erledigt · '+Math.round(group.done/group.total*100)+' %';row.append(heading,meter,summary);root.append(row)}
}
function setupYears(){
 const now=new Date().getFullYear(),select=$('checklistYear');
 for(let y=now-3;y<=now+5;y++)option(select,String(y),String(y));
 select.value=String(now);
}
setupYears();
async function refreshTasks(){
 const {data,error}=await db.from('wishlist_gift_tasks').select('id,title,occasion_id,gift_plan_id,due_date,reminder_days,priority,status,notes,checklist_key,checklist_year,archived_at,created_at').eq('user_id',user.id).limit(1000);
 if(error)throw error;tasks=data||[];render();renderRolloverSelection();
}
for(const [id,archive] of [['archiveYear',true],['restoreYear',false]])$(id).addEventListener('click',async()=>{
 const occasionId=$('checklistOccasion').value,year=Number($('checklistYear').value);
 if(!occasionId){$('checklistStatus').textContent='Bitte zuerst einen Anlass wählen.';return}
 if(!confirm((archive?'Alle Checklistenaufgaben dieses Jahres archivieren?':'Archivierung dieses Jahres aufheben?')+' Die Aufgaben bleiben gespeichert.'))return;
 $(id).disabled=true;
 try{const {data,error}=await db.rpc('wishlist_archive_occasion_checklist_year',{p_occasion_id:occasionId,p_year:year,p_archive:archive});if(error)throw error;await refreshTasks();$('checklistStatus').textContent=data+' Aufgaben '+(archive?'archiviert.':'wiederhergestellt.')}
 catch{$('checklistStatus').textContent='Jahresarchiv konnte nicht geändert werden.'}finally{$(id).disabled=false}
});
for(const button of document.querySelectorAll('[data-checklist]'))button.addEventListener('click',async()=>{
 const occasionId=$('checklistOccasion').value;if(!occasionId){$('checklistStatus').textContent='Bitte zuerst einen Anlass auswählen.';return}
 const template=button.dataset.checklist;if(!['standard','last_minute','shipping'].includes(template))return;
 if(!confirm('Aufgabenpaket für den gewählten Anlass erstellen? Vorhandene Aufgaben desselben Pakets bleiben erhalten.'))return;
 button.disabled=true;
 try{const {data,error}=await db.rpc('wishlist_create_occasion_checklist_year',{p_occasion_id:occasionId,p_template:template,p_year:Number($('checklistYear').value)});if(error)throw error;
  await refreshTasks();$('checklistStatus').textContent=data+' neue Aufgaben angelegt. '+(data===0?'Das Paket ist bereits vorhanden.':'Die Aufgaben können einzeln bearbeitet werden.');
 }catch{$('checklistStatus').textContent='Aufgabenpaket konnte nicht erstellt werden.'}finally{button.disabled=false}
});

function renderYearBalance(){
 const balance=$('yearBalance');balance.replaceChildren();const grouped=new Map();
 for(const t of tasks){if(!t.checklist_key||!t.occasion_id)continue;const key=t.occasion_id+'|'+(t.checklist_year??'legacy'),b=grouped.get(key)||{occasionId:t.occasion_id,year:t.checklist_year,total:0,done:0,archived:0,overdue:0};
 b.total++;if(t.status==='done')b.done++;if(t.archived_at)b.archived++;if(!t.archived_at&&t.status!=='done'&&t.due_date&&days(t.due_date)<0)b.overdue++;grouped.set(key,b)}
 for(const b of [...grouped.values()].sort((a,b)=>String(b.year??'').localeCompare(String(a.year??'')))){
 const occasion=occasions.find(o=>o.id===b.occasionId);if(!occasion)continue;
 const box=document.createElement('div');box.className='year-summary';
 const heading=document.createElement('strong');heading.textContent=occasion.title+' · '+(b.year??'Altbestand');
 const info=document.createElement('p');info.textContent='Erledigt: '+b.done+'/'+b.total+' · Offen: '+(b.total-b.done)+' · Überfällig: '+b.overdue+' · Archiviert: '+b.archived;
 box.append(heading,info);balance.append(box)}
 if(!grouped.size){const p=document.createElement('p');p.className='empty';p.textContent='Noch keine Jahresbilanzen vorhanden.';balance.append(p)}
}
function renderRolloverSelection(){
 const root=$('rolloverSelection');root.replaceChildren();const id=$('checklistOccasion').value,year=Number($('checklistYear').value)-1;
 const occasion=occasions.find(o=>o.id===id);
 if(!occasion?.repeats_yearly){const p=document.createElement('p');p.textContent='Bitte einen jährlich wiederkehrenden Anlass wählen.';root.append(p);return}
 const candidates=tasks.filter(t=>t.occasion_id===id&&t.checklist_year===year&&t.checklist_key);
 if(!candidates.length){const p=document.createElement('p');p.textContent='Keine Checklistenaufgaben aus '+year+' vorhanden.';root.append(p);return}
 for(const t of candidates){const label=document.createElement('label'),checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.value=t.id;checkbox.checked=true;const text=document.createElement('span');text.textContent=t.title+' · '+(t.due_date||'ohne Fälligkeit')+' · '+(t.status==='done'?'erledigt':'offen');label.append(checkbox,text);root.append(label)}
}
$('checklistOccasion').addEventListener('change',renderRolloverSelection);
$('checklistYear').addEventListener('change',renderRolloverSelection);
$('rolloverCreate').addEventListener('click',async()=>{
 const occasionId=$('checklistOccasion').value,year=Number($('checklistYear').value),ids=[...$('rolloverSelection').querySelectorAll('input:checked')].map(el=>el.value);
 if(!occasionId||!ids.length){$('rolloverStatus').textContent='Bitte Anlass und mindestens eine Aufgabe auswählen.';return}
 if(ids.length>100){$('rolloverStatus').textContent='Maximal 100 Aufgaben gleichzeitig.';return}
 if(!confirm(ids.length+' ausgewählte Aufgaben aus '+(year-1)+' nach '+year+' übernehmen? Bestehende Aufgaben bleiben unverändert.'))return;
 $('rolloverCreate').disabled=true;
 try{const {data,error}=await db.rpc('wishlist_rollover_gift_tasks',{p_occasion_id:occasionId,p_from_year:year-1,p_to_year:year,p_task_ids:ids});if(error)throw error;await refreshTasks();$('rolloverStatus').textContent=data+' Aufgaben übernommen. Bestehende Aufgaben wurden nicht überschrieben.'}
 catch{$('rolloverStatus').textContent='Übernahme fehlgeschlagen. Bitte Auswahl und Jahr prüfen.'}finally{$('rolloverCreate').disabled=false}
});
main().catch(()=>{$('status').textContent='Aufgaben konnten nicht geladen werden.'});
