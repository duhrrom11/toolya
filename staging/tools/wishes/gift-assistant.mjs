const db=window.supabase.createClient('https://avapuibsidubuzxjtyld.supabase.co','sb_publishable_95Vz26YwSFFWukFbqTBjMw_pv10kOFC');
const $=id=>document.getElementById(id);
const euro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(n)||0);
const day=86400000;let weekOffset=0,calendarEvents=[],weeklyTasks=[],occasionNames=new Map();
function el(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e}
function nextDate(o,now){const [y,m,d]=o.occasion_date.split('-').map(Number);let date=Date.UTC(y,m-1,d);if(!o.repeats_yearly)return date>=now?date:null;let year=new Date(now).getUTCFullYear();for(let i=0;i<3;i++,year++){const last=new Date(Date.UTC(year,m,0)).getUTCDate();date=Date.UTC(year,m-1,Math.min(d,last));if(date>=now)return date}return null}
function median(values){const a=[...values].sort((x,y)=>x-y);return a.length?(a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2):null}
function addCard(root,title,lines){const box=el('article','','card');box.append(el('h3',title));for(const line of lines)box.append(el('p',line));root.append(box);return box}
async function allRows(table,columns,userId,order){let rows=[];for(let start=0;start<20000;start+=500){let q=db.from(table).select(columns).eq('user_id',userId).order(order,{ascending:true}).range(start,start+499);const {data,error}=await q;if(error)throw error;rows.push(...(data||[]));if((data||[]).length<500)return rows}throw new Error('Zu viele Datensätze für eine vollständige Auswertung')}
let taskBusy=false,taskUserId=null,taskEvents=[];
async function changeTask(task,field,newValue,button){
 if(taskBusy)return;
 const oldValue=task[field];if(oldValue===newValue)return;
 const action=field==='status'?'als erledigt markieren':'auf '+newValue+' verschieben';
 if(!window.confirm('Aufgabe „'+task.title+'“ wirklich '+action+'?'))return;
 taskBusy=true;button.disabled=true;$('taskActionStatus').textContent='Änderung wird gespeichert …';
 try{
  let query=db.from('wishlist_gift_tasks').update({[field]:newValue,updated_at:new Date().toISOString()}).eq('id',task.id).eq('user_id',taskUserId);
  query=oldValue===null?query.is(field,null):query.eq(field,oldValue);
  const {data,error}=await query.select('id,'+field);
  if(error)throw error;
  if(!data||data.length!==1)throw new Error('Aufgabe wurde zwischenzeitlich verändert. Bitte Seite neu laden.');
  task[field]=data[0][field];
  $('taskActionStatus').textContent='Änderung gespeichert: '+task.title+'.';
  await loadTaskEvents();renderWeeklyTasks();renderDaily();renderWeek();
 }catch(e){$('taskActionStatus').textContent='Speichern fehlgeschlagen: '+(e.message||'Unbekannter Fehler')}
 finally{taskBusy=false;button.disabled=false}
}
function utcDate(value){if(!value)return null;const [y,m,d]=value.split('-').map(Number);return Date.UTC(y,m-1,d)}
function taskRank(task,today){
 const due=utcDate(task.due_date),days=due===null?null:Math.round((due-today)/day);
 const priority=Number(task.priority)||2;
 const urgency=days===null?4:days<0?0:days<=1?1:days<=3?2:days<=7?3:5;
 return{days,urgency,priority,score:urgency*10+priority};
}
function renderTaskEvents(){
 const summary=$('activitySummary'),trend=$('activityTrend'),list=$('activityList');summary.replaceChildren();trend.replaceChildren();list.replaceChildren();
 const completed=taskEvents.filter(e=>e.event_type==='completed'),rescheduled=taskEvents.filter(e=>e.event_type==='due_date_changed'),reopened=taskEvents.filter(e=>e.event_type==='reopened');
 for(const [label,count] of [['Erledigungen protokolliert',completed.length],['Terminverschiebungen',rescheduled.length],['Wieder geöffnet',reopened.length]]){const card=el('div','','review-kpi');card.append(el('strong',String(count)),el('span',label));summary.append(card)}
 const now=new Date(),today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()),start=today-((now.getDay()+6)%7)*day;
 for(let w=5;w>=0;w--){const weekStart=start-w*7*day,weekEnd=weekStart+7*day,count=completed.filter(e=>{const at=Date.parse(e.occurred_at);return at>=weekStart&&at<weekEnd}).length;
 const card=el('article','','card');card.append(el('h3',new Date(weekStart).toLocaleDateString('de-DE',{timeZone:'UTC'})+' – '+new Date(weekEnd-day).toLocaleDateString('de-DE',{timeZone:'UTC'})),el('p',count+' tatsächlich protokollierte Erledigungen'));trend.append(card)}
 if(!taskEvents.length){list.append(el('p','Noch keine protokollierten Aufgabenänderungen seit Aktivierung.'));return}
 for(const e of taskEvents.slice(0,35)){const card=el('article','','card'),label=e.event_type==='completed'?'✓ Erledigt':e.event_type==='reopened'?'↩ Wieder geöffnet':e.event_type==='due_date_changed'?'📅 Fälligkeit verschoben':'🔄 Status geändert';
 card.append(el('h3',label+' · '+e.task_title),el('p',new Date(e.occurred_at).toLocaleString('de-DE')));
 if(e.event_type==='due_date_changed')card.append(el('p',(e.old_due_date||'Ohne Datum')+' → '+(e.new_due_date||'Ohne Datum')));
 else card.append(el('p',(e.old_status||'—')+' → '+(e.new_status||'—')));
 list.append(card)}
}
async function loadTaskEvents(){taskEvents=await allRows('wishlist_gift_task_events','id,task_id,task_title,event_type,old_status,new_status,old_due_date,new_due_date,occurred_at',taskUserId,'id');taskEvents.reverse();renderTaskEvents()}
function renderDaily(){
 const now=new Date(),today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()),todayTasks=weeklyTasks.filter(t=>!t.archived_at&&utcDate(t.due_date)===today),done=todayTasks.filter(t=>t.status==='done').length;
 const active=weeklyTasks.filter(t=>!t.archived_at&&t.status!=='done'&&t.due_date&&utcDate(t.due_date)<=today).map(t=>({task:t,...taskRank(t,today)})).sort((a,b)=>a.score-b.score||a.days-b.days);
 const summary=$('dailySummary');summary.replaceChildren();
 for(const [label,value] of [['Heute fällig',todayTasks.length],['Heute fällige erledigt',done],['Offen/überfällig',active.length]]){const card=el('div','','review-kpi');card.append(el('strong',String(value)),el('span',label));summary.append(card)}
 $('dailyProgress').max=todayTasks.length||1;$('dailyProgress').value=done;$('dailyProgressText').textContent=done+' von '+todayTasks.length+' heute fälligen Aufgaben erledigt ('+(todayTasks.length?Math.round(100*done/todayTasks.length):0)+' %). Der Wert beschreibt den aktuellen Status, nicht den Zeitpunkt der Erledigung.';
 const focus=$('dailyFocus');focus.replaceChildren();
 if(!active.length)focus.append(el('p','Keine offenen Aufgaben mit Fälligkeit bis heute.'));
 for(const x of active.slice(0,8)){const t=x.task,box=el('article','','card '+(x.days<0?'priority-critical':'priority-high'));box.append(el('h3',t.title),el('p',x.days<0?'Seit '+Math.abs(x.days)+' Tagen überfällig':'Heute fällig'),el('p','Begründung: '+(x.days<0?'Fälligkeit überschritten':'Heute zu erledigen')+'; Priorität '+({1:'hoch',2:'mittel',3:'niedrig'}[x.priority]||'mittel')+'.','hint'));
 const actions=el('div','','task-actions'),finish=el('button','✓ Erledigen'),tomorrow=el('button','Auf morgen verschieben');finish.type=tomorrow.type='button';finish.addEventListener('click',()=>changeTask(t,'status','done',finish));tomorrow.addEventListener('click',()=>changeTask(t,'due_date',new Date(today+day).toISOString().slice(0,10),tomorrow));actions.append(finish,tomorrow);box.append(actions);focus.append(box)}
 const doneRoot=$('dailyDone');doneRoot.replaceChildren();
 const finished=weeklyTasks.filter(t=>!t.archived_at&&t.status==='done').sort((a,b)=>String(b.due_date||'').localeCompare(String(a.due_date||'')));
 if(!finished.length)doneRoot.append(el('p','Noch keine erledigten Aufgaben.'));
 for(const t of finished.slice(0,12)){const box=el('article','','card');box.append(el('h3','✓ '+t.title),el('p','Fälligkeitsdatum: '+(t.due_date||'nicht erfasst')+' · Anlass: '+(occasionNames.get(t.occasion_id)||'ohne Zuordnung')));doneRoot.append(box)}
 const trend=$('dailyTrend');trend.replaceChildren();
 for(let offset=3;offset>=0;offset--){const end=today-((new Date(today).getUTCDay()+6)%7)*day-offset*7*day+6*day,start=end-6*day,week=weeklyTasks.filter(t=>!t.archived_at&&t.due_date&&utcDate(t.due_date)>=start&&utcDate(t.due_date)<=end),count=week.filter(t=>t.status==='done').length;
 const card=el('article','','card');card.append(el('h3',new Date(start).toLocaleDateString('de-DE',{timeZone:'UTC'})+' – '+new Date(end).toLocaleDateString('de-DE',{timeZone:'UTC'})),el('p',count+' von '+week.length+' Aufgaben aktuell erledigt'));const bar=document.createElement('progress');bar.max=week.length||1;bar.value=count;bar.style.width='100%';card.append(bar);trend.append(card)}
 trend.append(el('p','Hinweis: Die Wochenwerte beruhen auf dem aktuellen Aufgabenstatus und dem Fälligkeitsdatum. Ohne historische Statusänderungs-Snapshots lässt sich nicht rekonstruieren, wann eine Aufgabe tatsächlich erledigt wurde.','hint'));
}
function renderWeeklyTasks(){
 const now=new Date(),today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()),start=today-((now.getDay()+6)%7)*day,end=start+6*day;
 const active=weeklyTasks.filter(t=>t.status!=='done'&&!t.archived_at);
 const ordered=active.map(t=>({task:t,...taskRank(t,today)})).filter(x=>x.days!==null&&x.days<=Math.round((end-today)/day)).sort((a,b)=>a.score-b.score||(a.days??999)-(b.days??999)||String(a.task.title).localeCompare(String(b.task.title)));
 const top=ordered.slice(0,5),rest=ordered.slice(5);
 const summary=$('weeklySummary');summary.replaceChildren();
 const weekTasks=weeklyTasks.filter(t=>!t.archived_at&&t.due_date&&utcDate(t.due_date)>=start&&utcDate(t.due_date)<=end);const completed=weekTasks.filter(t=>t.status==='done').length;const progress=$('weeklyProgress');progress.max=weekTasks.length||1;progress.value=completed;$('weeklyProgressText').textContent=completed+' von '+weekTasks.length+' für diese Kalenderwoche fälligen Aufgaben erledigt ('+(weekTasks.length?Math.round(completed/weekTasks.length*100):0)+' %). Überfällige Aufgaben werden gesondert priorisiert.';
 const metrics=[['Überfällig',ordered.filter(x=>x.days<0).length],['Bis Sonntag fällig',ordered.filter(x=>x.days>=0).length],['Hohe Priorität',ordered.filter(x=>x.priority===1).length],['Empfohlen zuerst',top.length]];
 for(const [label,value] of metrics){const card=el('div','','review-kpi');card.append(el('strong',String(value)),el('span',label));summary.append(card)}
 const render=(root,entries)=>{root.replaceChildren();if(!entries.length){root.append(el('p','Keine offenen Aufgaben in dieser Gruppe.'));return}
 for(const x of entries){const t=x.task,box=el('article','','card '+(x.days<0?'priority-critical':x.days<=1?'priority-high':'priority-normal')),label=x.days<0?'Seit '+Math.abs(x.days)+' Tagen überfällig':x.days===0?'Heute fällig':x.days===1?'Morgen fällig':'In '+x.days+' Tagen fällig';
 box.append(el('h3',t.title),el('p','⏰ '+label+' · '+(t.due_date||'ohne Datum')),el('p','Priorität: '+({1:'hoch',2:'mittel',3:'niedrig'}[x.priority]||'mittel')+' · Status: '+(t.status==='in_progress'?'in Arbeit':'offen')));
 if(t.occasion_id&&occasionNames.has(t.occasion_id))box.append(el('p','🎁 '+occasionNames.get(t.occasion_id)));
 box.append(el('p','Empfehlung: '+(x.days<0?'Zuerst nachholen, da die Fälligkeit überschritten ist.':x.days<=1?'Zeitnah bearbeiten, da die Fälligkeit unmittelbar bevorsteht.':'In dieser Woche einplanen.')+(x.priority===1?' Zusätzlich als hohe Priorität markiert.':''),'hint'));
 const actions=el('div','','task-actions');const done=el('button','✓ Erledigt markieren');done.type='button';done.addEventListener('click',()=>changeTask(t,'status','done',done));actions.append(done);
 const labelDate=el('label','Neues Fälligkeitsdatum'),dateInput=document.createElement('input');dateInput.type='date';dateInput.value=t.due_date||'';dateInput.min='1900-01-01';dateInput.max='2200-12-31';labelDate.append(dateInput);actions.append(labelDate);
 const move=el('button','Datum bestätigt verschieben');move.type='button';move.addEventListener('click',()=>{if(!dateInput.value||!/^\\d{4}-\\d{2}-\\d{2}$/.test(dateInput.value)){ $('taskActionStatus').textContent='Bitte gültiges Datum auswählen.';return}changeTask(t,'due_date',dateInput.value,move)});actions.append(move);box.append(actions);
 const link=el('a','Aufgabenverwaltung öffnen');link.href='./gift-tasks.html';box.append(link);root.append(box)}};
 render($('weeklyPriority'),top);render($('weeklyRemaining'),rest);
}
function dateLabel(ms){return new Date(ms).toLocaleDateString('de-DE',{timeZone:'UTC',day:'2-digit',month:'2-digit'})}
function renderWeek(){
 const now=new Date(),today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()),dow=(new Date(today).getUTCDay()+6)%7,start=today-dow*day+weekOffset*7*day,end=start+6*day;
 $('weekLabel').textContent=dateLabel(start)+' – '+dateLabel(end)+' · '+new Date(start).getUTCFullYear();
 const root=$('planningWeek');root.replaceChildren();
 for(let i=0;i<7;i++){const current=start+i*day,box=el('article','','week-day');box.append(el('strong',['Mo','Di','Mi','Do','Fr','Sa','So'][i]+' '+dateLabel(current)));
 for(const e of calendarEvents.filter(e=>e.date===current))box.append(el('span',e.label,'week-event'));root.append(box)}
}
$('weekPrev').addEventListener('click',()=>{weekOffset--;renderWeek()});
$('weekNext').addEventListener('click',()=>{weekOffset++;renderWeek()});
$('weekToday').addEventListener('click',()=>{weekOffset=0;renderWeek()});
async function main(){
 const {data,error}=await db.auth.getUser(),user=data?.user;if(error||!user){$('login').hidden=false;$('status').textContent='Bitte anmelden.';return}
 const [closings,occasions,tasks]=await Promise.all([
 allRows('wishlist_gift_year_closings','closing_year,gift_count,gifted_count,actual_total,budget_total,gifts_snapshot,budgets_snapshot,tasks_snapshot,task_count,task_done_count',user.id,'closing_year'),
 allRows('wishlist_occasions','id,title,occasion_date,repeats_yearly,reminder_days,budget_amount',user.id,'occasion_date'),
 allRows('wishlist_gift_tasks','id,title,occasion_id,due_date,status,priority,archived_at,checklist_year',user.id,'created_at')
 ]);
 taskUserId=user.id;await loadTaskEvents();weeklyTasks=tasks;occasionNames=new Map(occasions.map(o=>[o.id,o.title]));renderWeeklyTasks();renderDaily();
 const nowDate=new Date(),today=Date.UTC(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate());
 $('evidence').textContent=closings.length+' gespeicherte historische Jahresabschlüsse. Die Empfehlungen verwenden ausschließlich deren unveränderliche Geschenk-, Budget- und Aufgaben-Snapshots. Aktuelle Anlässe liefern nur Namen und zukünftige Termine.';
 const root=$('occasionCards'),upcoming=occasions.map(o=>({...o,next:nextDate(o,today)})).filter(o=>o.next!==null).sort((a,b)=>a.next-b.next).slice(0,40);
 if(!upcoming.length)root.append(el('p','Noch keine kommenden Anlässe erfasst.'));
 for(const o of upcoming){
 const days=Math.round((o.next-today)/day),history=[];
 for(const c of closings){const gifts=Array.isArray(c.gifts_snapshot)?c.gifts_snapshot.filter(g=>g.occasion_id===o.id):[],budgets=Array.isArray(c.budgets_snapshot)?c.budgets_snapshot:[],budget=budgets.find(b=>b.occasion_id===o.id);
 if(!gifts.length&&!budget)continue;history.push({year:c.closing_year,gifts,budget:budget?.budget_amount??null,spent:gifts.reduce((n,g)=>n+Number(g.actual_amount||0),0),tasks:Array.isArray(c.tasks_snapshot)?c.tasks_snapshot.filter(t=>t.occasion_id===o.id):null})}
 const lines=['📅 '+new Date(o.next).toLocaleDateString('de-DE',{timeZone:'UTC'})+' · noch '+days+' Tage'];
 const budgetValues=history.map(h=>h.budget).filter(v=>v!==null).map(Number),spentValues=history.filter(h=>h.gifts.length).map(h=>h.spent);
 const suggestion=median(budgetValues.length?budgetValues:spentValues);
 if(suggestion!==null){lines.push('💶 Unverbindlicher Budgetrichtwert: '+euro(suggestion)+' (Median aus '+(budgetValues.length?'gespeicherten Anlassbudgets':'historisch erfassten Geschenkausgaben')+' in '+(budgetValues.length?budgetValues.length:spentValues.length)+' Abschlussjahr(en)).');lines.push('Aktuelles Budget: '+euro(o.budget_amount)+' – Änderungen nur über die Anlassverwaltung.')}
 else lines.push('💶 Noch kein belastbarer historischer Budgetrichtwert für diesen Anlass.');
 const historicalTasks=history.flatMap(h=>h.tasks||[]),hasShipping=historicalTasks.some(t=>/versand|liefer|bestell|shipping/i.test(t.title||''));
 const lead=hasShipping?28:21;const startDate=o.next-lead*day;calendarEvents.push({date:o.next,label:'🎁 '+o.title+' · Anlass'},{date:startDate,label:'📝 '+o.title+' · Planungsstart'});lines.push('✅ Checklistenempfehlung: '+(hasShipping?'Versand-Checkliste (ca. 28 Tage Vorlauf)':'Standard-Checkliste (ca. 21 Tage Vorlauf)')+'. Begründung: '+(hasShipping?'In historischen Aufgaben gab es Versand- oder Bestellschritte.':'Keine historischen Versandaufgaben belegt; Standardvorlauf als allgemeine Planungsregel.'));
 if(days<=lead)lines.push('⏰ Frühzeitiger Hinweis: Der empfohlene Planungsbeginn ist erreicht'+(days<7?' – Anlass in weniger als sieben Tagen.':'.'));
 else lines.push('🗓️ Empfohlener Planungsbeginn in etwa '+(days-lead)+' Tagen.');
 const incomplete=history.filter(h=>h.gifts.length&&h.gifts.some(g=>g.status!=='gifted')).length;
 if(incomplete)lines.push('📌 Historische Beobachtung: In '+incomplete+' Abschlussjahr(en) waren Geschenke dieses Anlasses noch nicht als verschenkt markiert.');
 if(history.length)lines.push('Datengrundlage: '+history.map(h=>h.year).join(', ')+'.');else lines.push('Keine Anlasshistorie: Checklisten-Vorlauf ist eine allgemeine Empfehlung, keine historische Erkenntnis.');
 const card=addCard(root,o.title,lines);
 const label=el('label','Checkliste auswählen'),select=document.createElement('select');for(const [value,name] of [['standard','Standard (21 Tage)'],['shipping','Versand (28 Tage)'],['last_minute','Kurzfristig (5 Tage)']]){const option=document.createElement('option');option.value=value;option.textContent=name;select.append(option)}select.value=hasShipping?'shipping':'standard';label.append(select);card.append(label);
 const confirmLabel=el('label','','confirm'),check=document.createElement('input');check.type='checkbox';confirmLabel.append(check,el('span','Ich bestätige die Erstellung dieser Checkliste für '+new Date(o.next).getUTCFullYear()+'. Bereits vorhandene Aufgaben bleiben erhalten.'));card.append(confirmLabel);
 const button=el('button','Ausgewählte Checkliste übernehmen'),feedback=el('p','','feedback');card.append(button,feedback);
 button.addEventListener('click',async()=>{if(!check.checked){feedback.textContent='Bitte zuerst die Übernahme ausdrücklich bestätigen.';return}if(!window.confirm('Checkliste für „'+o.title+'“ im Jahr '+new Date(o.next).getUTCFullYear()+' jetzt erstellen?'))return;button.disabled=true;feedback.textContent='Übernahme läuft …';const {data,error}=await db.rpc('wishlist_create_occasion_checklist_year',{p_occasion_id:o.id,p_template:select.value,p_year:new Date(o.next).getUTCFullYear()});button.disabled=false;if(error){feedback.textContent='Übernahme fehlgeschlagen. Bitte Anmeldung und Anlass prüfen.';return}feedback.textContent='Übernahme abgeschlossen: '+Number(data||0)+' neue Aufgaben erstellt. Vorhandene Aufgaben wurden nicht verändert.';check.checked=false});
 }
 const tips=$('globalTips');
 if(!closings.length)addCard(tips,'Mit dem ersten Jahresabschluss starten',['Historische Budgetvorschläge werden erst möglich, wenn ein Jahresabschluss gespeichert wurde. Bis dahin bleiben allgemeine Checklistenregeln verfügbar.']);
 else{
 const yearsWithTasks=closings.filter(c=>c.task_count!==null),unfinished=yearsWithTasks.filter(c=>c.task_count>0&&c.task_done_count<c.task_count);
 if(unfinished.length)addCard(tips,'Checklisten frühzeitig starten',['In '+unfinished.length+' von '+yearsWithTasks.length+' Abschlüssen mit Aufgabenhistorie waren Checklisten nicht vollständig erledigt. Empfehlung: Aufgaben rechtzeitig vor dem Anlass erstellen.']);
 const budgeted=closings.filter(c=>Array.isArray(c.budgets_snapshot)&&c.budgets_snapshot.length);
 if(!budgeted.length)addCard(tips,'Historische Budgets aufbauen',['In den gespeicherten Abschlüssen fehlen ausdrücklich erfasste Anlassbudgets. Budgetrichtwerte können dann nur auf tatsächlich erfassten Geschenkausgaben beruhen.']);
 else addCard(tips,'Budgethistorie nutzen',['In '+budgeted.length+' abgeschlossenen Jahren wurden Anlassbudgets gespeichert. Diese Daten ermöglichen nachvollziehbare Richtwerte für wiederkehrende Anlässe.']);
 }
 renderWeek();$('content').hidden=false;$('status').textContent='Private Planungsvorschläge geladen. Keine Daten wurden geändert.';
}
main().catch(()=>{$('status').textContent='Die privaten Planungsvorschläge konnten nicht vollständig geladen werden. Bitte später erneut versuchen.'});
