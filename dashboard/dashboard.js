import { dashboardText,dashboardDateLocale,dashboardLocale } from '../shared/toolya/i18n/dashboard-copy.mjs';
const tx=value=>dashboardText(value,dashboardLocale());
import { createDashboardCloud } from './modules/cloud-sync.mjs';
import { createUnifiedShopping } from './modules/unified-shopping.mjs';
import { createWateringConnect, todayLocal } from '../shared/toolya/connect-watering.mjs';

const tools = [
  ['wishlist','Amazon-Wunschlisten finden','wishes','wishlist.webp'],['kassenbon','Haushaltsbuch','budget','budget.webp'],
  ['kisten','Umzugskisten','moving','moving.webp'],['pflanzen','Pflanzenpflege','plants','plants.webp'],
  ['wg-kasse','WG-Organisator','housemates','wg-organisator.webp'],['notizen','Digitaler Nachlass','estate','digitaler-nachlass.webp'],
  ['kfz','Autokosten','car','autokosten.webp'],['haustier','Tiergesundheit','pet-health','tiergesundheit.webp'],
  ['parken','Parkplatz-Merker','parking','parkplatz-merker.webp'],['verleih','Verliehene Dinge','loans','verliehene-dinge.webp'],
  ['energie','Zählerstände','meters','zaehlerstaende.webp'],['backform','Backform-Rechner','baking','backform-rechner.webp']
].map(([id,name,route,img]) => ({id,name,url:'../tools/'+route+(route==='wishes'?'/public.html':'/'),img:'../assets/toolya/home/'+img}));
const byId = new Map(tools.map(t=>[t.id,t]));
const keys = {favorites:'hub_favorites',recent:'toolya_recent_tools_v1',tasks:'toolya_dashboard_tasks_v1',reminders:'toolya_dashboard_reminders_v1'};
const $ = id => document.getElementById(id);
const MAX_ITEMS = 150;
let pending = false;
let status = 'loading';
function read(key) {
  try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function show(msg) { $('notice').textContent = tx(msg); $('notice').hidden = false; }
function save(key, items) {
  try { localStorage.setItem(key, JSON.stringify(items)); return true; }
  catch { show(tx('Lokales Speichern nicht möglich. Bitte überprüfe deinen Browser-Speicher.')); return false; }
}
function element(tag,text,cls) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}
function validLocal(key) {
  return read(key).filter(x=>x && typeof x.id === 'string' && x.id.length <= 170 &&
    typeof x.text === 'string' && x.text.length >= 1 && x.text.length <= 160).slice(0,MAX_ITEMS);
}
function activeItems(kind) {
  if (status === 'cloud') return cloud.snapshot(kind);
  if (status === 'local') return validLocal(keys[kind]);
  return []; // Fail closed: unknown auth must not reveal another session's browser records.
}
function listTools(id,items,empty) {
  const host=$(id);host.replaceChildren();
  if(!items.length){host.append(element('p',empty,'empty'));return}
  for(const t of items){
    const a=element('a',undefined,'tool-item');a.href=t.url;
    const img=document.createElement('img');img.src=t.img;img.alt='';img.loading='lazy';img.onerror=()=>img.remove();
    const content=element('span',tx(t.name));content.append(element('small',tx('Tool öffnen')));
    a.append(img,content);a.addEventListener('click',()=>recordRecent(t.id));host.append(a);
  }
}
function recordRecent(id) {
  const items=read(keys.recent).filter(x=>typeof x==='string'&&x!==id&&byId.has(x));
  items.unshift(id);save(keys.recent,items.slice(0,8));
}
function renderTools() {
  const fav=[...new Set(read(keys.favorites))].map(id=>byId.get(id)).filter(Boolean);
  const recent=[...new Set(read(keys.recent))].map(id=>byId.get(id)).filter(Boolean);
  $('fav-count').textContent=fav.length;$('recent-count').textContent=recent.length;
  listTools('favorites',fav,tx('Du hast noch keine Favoriten. Markiere deine Lieblings-Tools auf der Startseite mit einem Stern.'));
  listTools('recent',recent,tx('Noch keine letzten Tools gespeichert. Öffne ein Tool über die Startseite oder hier im Dashboard.'));
}
function newId(){return globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2)}
function refreshFocus(host,id) {
  const field=[...host.querySelectorAll('input[type=checkbox]')].find(input=>input.dataset.entryId===id);
  field?.focus();
}
async function mutation(kind, action, item, completed=false) {
  if(pending || !['local','cloud'].includes(status)) return false;
  pending=true;renderControls();
  const key=keys[kind];
  try {
    if(status==='cloud') {
      if(action==='create') await cloud.create(kind,item);
      else await cloud.change(kind,item.id,completed,action==='delete');
    } else {
      const items=validLocal(key);
      if(action==='create') {
        if(items.length>=MAX_ITEMS)throw Error('Maximal '+MAX_ITEMS+' '+(kind==='tasks'?'Aufgaben':'Erinnerungen')+' möglich. Entferne zuerst einen Eintrag.');
        items.push(item);
      } else if(action==='delete') {
        if(!save(key,items.filter(x=>x.id!==item.id)))return false;
        renderItems();return true;
      } else {
        const target=items.find(x=>x.id===item.id);
        if(!target)throw Error(tx('Eintrag wurde nicht gefunden.'));
        target.done=completed;
      }
      if(!save(key,items))return false;
    }
    renderItems();
    return true;
  } catch(error) {
    show(error?.message || tx('Speichern fehlgeschlagen. Es wurden keine lokalen Daten gelöscht.'));
    if(status==='cloud') await cloud.refresh();
    renderItems();
    return false;
  } finally { pending=false;renderControls(); }
}
function renderControls() {
  const disabled=pending || !['local','cloud'].includes(status);
  for(const item of document.querySelectorAll('#task-form input,#task-form button,#reminder-form input,#reminder-form button,#tasks input,#tasks button,#reminders input,#reminders button')) item.disabled=disabled;
  $('import-local').disabled=disabled || status!=='cloud';
  $('sync-retry').disabled=pending;
}
async function removeWithFocus(kind,item) {
  const host=$(kind==='tasks'?'tasks':'reminders');
  const buttons=[...host.querySelectorAll('button[data-entry-id]')];
  const index=buttons.findIndex(button=>button.dataset.entryId===item.id);
  const restore=host.contains(document.activeElement);
  const ok=await mutation(kind,'delete',item);
  if(ok && restore) {
    const remaining=[...host.querySelectorAll('button[data-entry-id]')];
    (remaining[Math.min(index,remaining.length-1)] || $(kind==='tasks'?'task-text':'reminder-text')).focus();
  }
}
// Toolya Connect provider registry: WG shopping and cleaning tasks retain their own Cloud source.
// Other tools can register additional source adapters through unified-shopping.mjs.
let connectedShopping=null, connectedItems=[], connectedTasks=[], connectedOwner=null;
let connectedBusy=false, connectedLoading=false, connectedGeneration=0, connectedLastRead=0;
function resetUnified(message='Für die gemeinsame Einkaufsliste bitte anmelden.') {
  ++connectedGeneration;
  connectedShopping=null;connectedItems=[];connectedTasks=[];connectedOwner=null;connectedLastRead=0;
  $('shopping-form').hidden=true;$('shopping-print').disabled=true;
  $('shopping-status').textContent=message;
  renderShopping();renderItems();
}
function renderShopping() {
  const host=$('shopping-items');host.replaceChildren();
  const visible=connectedItems.filter(item=>!item.done||$('shopping-show-completed').checked)
    .sort((a,b)=>Number(a.done)-Number(b.done)||a.origin.localeCompare(b.origin,'de')||a.text.localeCompare(b.text,'de'));
  $('shopping-print').disabled=status!=='cloud'||connectedBusy||connectedLoading||!connectedItems.some(x=>!x.done);
  if(!visible.length){host.append(element('li',connectedItems.length?tx('Alle Artikel bestätigt.'):tx('Noch keine Einkaufsartikel vorhanden.'),'empty'));return;}
  for(const item of visible){
    const li=element('li',undefined,'shopping-entry'+(item.done?' done':''));
    const cb=document.createElement('input');
    cb.type='checkbox';cb.checked=!!item.done;cb.disabled=connectedBusy;
    cb.setAttribute('aria-label',item.text+' gekauft');cb.onchange=()=>changeConnected(item,cb.checked);
    const details=element('span');
    details.append(element('span',item.text,'shopping-name'),element('small',item.origin,'shopping-source'));
    const link=element('a',tx('Quelle'));link.href=item.url;
    link.setAttribute('aria-label','In '+item.origin+' öffnen');
    li.append(cb,details,link);
    if(item.source==='dashboard'){
      const remove=element('button',tx('Entfernen'));remove.type='button';remove.disabled=connectedBusy;
      remove.setAttribute('aria-label','Artikel entfernen: '+item.text);
      remove.onclick=()=>removeConnected(item);li.append(remove);
    }
    host.append(li);
  }
}
async function loadUnified(force=false) {
  if(status!=='cloud'||!cloud.userId||connectedBusy||connectedLoading)return;
  const uid=cloud.userId;
  if(!force&&connectedOwner===uid&&Date.now()-connectedLastRead<45000)return;
  const generation=++connectedGeneration;
  connectedLoading=true;
  $('shopping-status').textContent='Einkaufslisten werden synchronisiert …';
  try{
    const client=globalThis.toolyaDashboardAuthClient;
    if(!client)throw Error('Die Cloud-Anmeldung ist nicht verfügbar.');
    const source=connectedShopping||createUnifiedShopping(client);
    const state=await source.load();
    if(generation!==connectedGeneration||status!=='cloud'||cloud.userId!==uid||state.userId!==uid)return;
    connectedShopping=source;connectedOwner=uid;connectedItems=state.shopping;connectedTasks=state.tasks;
    connectedLastRead=Date.now();
    $('shopping-form').hidden=false;
    const open=connectedItems.filter(x=>!x.done).length;
    $('shopping-status').textContent=(state.partial?'Teilweise geladen – bitte die Quellen prüfen. · ':'')+
      open+' offene Artikel aus '+new Set(connectedItems.map(x=>x.origin)).size+' Quellen.';
    renderShopping();renderItems();
  }catch(error){
    if(generation!==connectedGeneration)return;
    connectedShopping=null;connectedOwner=null;connectedItems=[];connectedTasks=[];
    $('shopping-form').hidden=true;
    $('shopping-status').textContent='Einkaufslisten nicht vollständig verfügbar: '+(error?.message||'Bitte später erneut laden.');
    renderShopping();renderItems();
  }finally{connectedLoading=false;renderShopping();}
}
async function changeConnected(item,done) {
  if(status!=='cloud'||!connectedShopping||connectedBusy)return;
  connectedBusy=true;renderShopping();renderItems();
  try{
    const result=await connectedShopping.setDone(item,done);
    if(status!=='cloud'||result.userId!==cloud.userId)return;
    connectedItems=result.shopping;connectedTasks=result.tasks;connectedLastRead=Date.now();
    $('shopping-status').textContent='Änderung in Toolya Cloud bestätigt.';
  }catch(error){
    $('shopping-status').textContent='Änderung nicht bestätigt: '+(error?.message||'Speicherkonflikt.');
    connectedBusy=false;await loadUnified(true);
  }finally{connectedBusy=false;renderShopping();renderItems();}
}
async function removeConnected(item){
  if(!connectedShopping||connectedBusy||item.source!=='dashboard')return;
  connectedBusy=true;renderShopping();
  try{
    const result=await connectedShopping.remove(item);
    if(status!=='cloud'||result.userId!==cloud.userId)return;
    connectedItems=result.shopping;connectedTasks=result.tasks;
    $('shopping-status').textContent='Artikel aus dem Dashboard entfernt.';
  }catch(error){
    $('shopping-status').textContent='Entfernen nicht bestätigt: '+(error?.message||'Bitte neu laden.');
    connectedBusy=false;await loadUnified(true);
  }finally{connectedBusy=false;renderShopping();renderItems();}
}
$('shopping-form').addEventListener('submit',async e=>{
  e.preventDefault();
  if(status!=='cloud'||!connectedShopping||connectedBusy)return;
  const input=$('shopping-title'),title=input.value.trim();
  if(!title)return;
  connectedBusy=true;renderShopping();
  try{
    const result=await connectedShopping.add(title);
    if(status!=='cloud'||result.userId!==cloud.userId)return;
    connectedItems=result.shopping;connectedTasks=result.tasks;input.value='';
    $('shopping-status').textContent='Artikel in Toolya Cloud gespeichert.';
  }catch(error){
    $('shopping-status').textContent='Artikel nicht gespeichert: '+(error?.message||'Bitte erneut versuchen.');
    connectedBusy=false;await loadUnified(true);
  }finally{connectedBusy=false;renderShopping();renderItems();input.focus();}
});
$('shopping-show-completed').addEventListener('change',renderShopping);
$('shopping-print').addEventListener('click',()=>{
  if(status==='cloud'&&!connectedBusy&&connectedItems.some(x=>!x.done))window.print();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&status==='cloud')void loadUnified(true);});
setInterval(()=>{if(!document.hidden&&status==='cloud')void loadUnified();},60000);

function renderItems() {
  const tasks=activeItems('tasks');
  const reminders=activeItems('reminders').filter(x=>typeof x.due==='string'&&!Number.isNaN(Date.parse(x.due))).sort((a,b)=>a.due.localeCompare(b.due));
  const waterTasks=upcomingWateringTasks();
  const extraTasks=status==='cloud'&&connectedOwner===cloud.userId?connectedTasks.filter(t=>!t.done):[];
  $('task-count').textContent=tasks.filter(t=>!t.done).length+waterTasks.length+extraTasks.length;
  $('reminder-count').textContent=reminders.filter(r=>!r.done).length;
  const taskHost=$('tasks');taskHost.replaceChildren();
  if(!tasks.length&&!waterTasks.length&&!extraTasks.length)taskHost.append(element('li',tx('Noch keine Aufgaben angelegt.'),'empty'));
  for(const t of tasks) {
    const li=element('li',undefined,t.done?'done':'');
    const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!t.done;
    cb.setAttribute('aria-label','Aufgabe '+t.text+' erledigt');cb.dataset.entryId=t.id;
    cb.onchange=async()=>{const ok=await mutation('tasks','toggle',t,cb.checked);if(ok)refreshFocus($('tasks'),t.id)};
    const txt=element('span',t.text);
    const del=element('button',tx('Entfernen'));del.type='button';
    del.setAttribute('aria-label','Aufgabe entfernen: '+t.text);del.dataset.entryId=t.id;
    del.onclick=()=>removeWithFocus('tasks',t);
    li.append(cb,txt,del);taskHost.append(li);
  }
  for(const item of waterTasks) {
    const li=element('li',undefined,'water-connect-item'+(item.overdue?' overdue':''));
    const txt=element('span','💧 '+item.name);
    txt.append(element('small',tx('Gießplan · ')+new Date(item.due+'T12:00:00Z').toLocaleDateString(dashboardDateLocale(),{dateStyle:'medium'})+
      (item.overdue?tx(' · überfällig'):''),'date'));
    const button=element('button',tx('Gegossen'));button.type='button';
    button.setAttribute('aria-label',item.name+' heute gegossen');
    button.disabled=wateringBusy;
    button.onclick=()=>completeWatering(item);
    li.append(txt,button);taskHost.append(li);
  }
  for(const item of extraTasks) {
    const li=element('li',undefined,'connect-task');
    const cb=document.createElement('input');cb.type='checkbox';cb.checked=false;cb.disabled=connectedBusy;
    cb.setAttribute('aria-label','WG-Aufgabe '+item.text+' erledigt');cb.onchange=()=>changeConnected(item,cb.checked);
    const span=element('span',item.text);
    span.append(element('small',tx('WG-Putzplan')+(item.assignee?' · '+item.assignee:''),'date'));
    const link=element('a',tx('Zur WG'));link.href=item.url;
    li.append(cb,span,link);taskHost.append(li);
  }
  const remindHost=$('reminders');remindHost.replaceChildren();
  if(!reminders.length)remindHost.append(element('li',tx('Noch keine Erinnerungen angelegt.'),'empty'));
  for(const r of reminders) {
    const overdue=!r.done&&Date.parse(r.due)<=Date.now();
    const li=element('li',undefined,(r.done?'done ':'')+(overdue?'overdue':''));
    const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!r.done;
    cb.setAttribute('aria-label','Erinnerung '+r.text+' erledigt');cb.dataset.entryId=r.id;
    cb.onchange=async()=>{const ok=await mutation('reminders','toggle',r,cb.checked);if(ok)refreshFocus($('reminders'),r.id)};
    const txt=element('span',r.text);
    txt.append(element('small',new Date(r.due).toLocaleString(dashboardDateLocale(),{dateStyle:'medium',timeStyle:'short'})+(overdue?tx(' · Fällig'):''),'date'));
    const del=element('button',tx('Entfernen'));del.type='button';del.dataset.entryId=r.id;
    del.setAttribute('aria-label','Erinnerung entfernen: '+r.text);
    del.onclick=()=>removeWithFocus('reminders',r);
    li.append(cb,txt,del);remindHost.append(li);
  }
  renderControls();
}
// Watering tasks are projections of the authoritative plants snapshot, not duplicate todos.
let watering=null, wateringTasks=[], wateringUserId=null, wateringBusy=false, wateringLoadGeneration=0;
let wateringLastRead=0;
function clearWatering(message='Zum Synchronisieren bitte mit deinem Toolya-Konto anmelden.') {
  wateringLoadGeneration++;
  watering=null;wateringTasks=[];wateringUserId=null;wateringLastRead=0;
  $('watering-connect-status').textContent=message;
  $('watering-connect-form').hidden=true;
  renderItems();
}
async function completeWatering(item) {
  if(wateringBusy||status!=='cloud'||!watering)return;
  wateringBusy=true;++wateringLoadGeneration;renderItems();
  let failed=false;
  try {
    const data=await watering.complete(item.id);
    if(status!=='cloud'||wateringUserId!==data.userId)return;
    wateringTasks=data.tasks;
    $('watering-connect-status').textContent='Gießvorgang im Pflanzen-Tool gespeichert.';
  } catch(error) {
    $('watering-connect-status').textContent='Gießvorgang nicht bestätigt: '+(error?.message||'Bitte Gießplan neu laden.');
    failed=true;
  } finally {wateringBusy=false;if(failed)await loadWatering(true);else renderWatering();}
}
function upcomingWateringTasks() {
  if(status!=='cloud'||!watering||wateringUserId!==cloud.userId)return [];
  const today=todayLocal();
  return wateringTasks.filter(task=>task.due<=today).slice(0,60);
}
function renderWatering() {
  renderItems();
  const select=$('watering-connect-plant'),current=select.value;
  select.replaceChildren();
  for(const item of wateringTasks){
    const option=document.createElement('option');
    option.value=item.id;option.textContent=item.name;
    select.append(option);
  }
  if(wateringTasks.some(x=>x.id===current))select.value=current;
  $('watering-connect-form').hidden=wateringTasks.length===0;
  $('watering-connect-form').querySelector('button').disabled=wateringBusy;
}
async function loadWatering(force=false) {
  if(status!=='cloud'||!cloud.userId)return;
  if(wateringBusy)return;
  const uid=cloud.userId;
  if(!force && uid===wateringUserId && Date.now()-wateringLastRead<45000)return;
  const generation=++wateringLoadGeneration;
  $('watering-connect-status').textContent='Gießplan wird geladen …';
  try{
    // Account settings already owns the live Supabase client used by the dashboard.
    const client=globalThis.toolyaDashboardAuthClient;
    if(!client)throw Error('Toolya-Konto nicht verfügbar.');
    const connector=createWateringConnect(client);
    const snapshot=await connector.read();
    if(generation!==wateringLoadGeneration||status!=='cloud'||cloud.userId!==uid||snapshot.userId!==uid)return;
    watering=connector;wateringUserId=uid;wateringTasks=snapshot.tasks;wateringLastRead=Date.now();
    $('watering-connect-status').textContent=snapshot.exists?
      'Gießaufgaben aus Toolya Cloud · '+wateringTasks.length+' Pflanzen':
      'Noch kein Gießplan vorhanden. Lege zuerst eine Pflanze an.';
    renderWatering();
  }catch(error){
    if(generation!==wateringLoadGeneration)return;
    watering=null;wateringTasks=[];wateringUserId=null;
    $('watering-connect-form').hidden=true;
    renderItems();
    $('watering-connect-status').textContent='Gießplan nicht verfügbar: '+(error?.message||'Bitte später erneut öffnen.');
  }
}
$('watering-connect-form').addEventListener('submit',async event=>{
  event.preventDefault();
  if(wateringBusy||status!=='cloud'||!watering)return;
  const id=$('watering-connect-plant').value, date=$('watering-connect-date').value;
  if(!id||!date)return;
  wateringBusy=true;++wateringLoadGeneration;renderWatering();
  let failed=false;
  try{
    const result=await watering.schedule(id,date);
    if(status!=='cloud'||wateringUserId!==result.userId)return;
    wateringTasks=result.tasks;
    $('watering-connect-status').textContent='Gießaufgabe im Pflanzen-Tool eingeplant.';
  }catch(error){
    $('watering-connect-status').textContent='Planung nicht gespeichert: '+(error?.message||'Bitte erneut laden.');
    failed=true;
  }finally{wateringBusy=false;if(failed)await loadWatering(true);else renderWatering();}
});
$('watering-connect-date').min=todayLocal();
$('watering-connect-date').value=todayLocal();

const cloud=createDashboardCloud(({status:next,message,userId})=>{
  status=next;
  if(next==='cloud'){void loadWatering();void loadUnified();}
  else {resetUnified(next==='local'?'Für die gemeinsame Einkaufsliste bitte anmelden.':'Einkaufslisten bis zur bestätigten Anmeldung gesperrt.');}
  if(next!=='cloud')clearWatering(next==='local'?'Für Gießaufgaben bitte anmelden.':'Gießplan bis zur bestätigten Anmeldung gesperrt.');
  document.documentElement.dataset.dashboardSync=next;
  $('sync-status').textContent=next==='cloud'?'☁ Aufgaben & Erinnerungen synchronisiert':next==='local'?'Nur auf diesem Gerät':next==='loading'?'Cloud wird geladen …':'Cloud nicht erreichbar';
  $('sync-detail').textContent=message||(next==='local'?'Für die geräteübergreifende Speicherung bitte anmelden.':'');
  $('sync-retry').hidden=next!=='error';
  $('import-local').hidden=next!=='cloud'||!(validLocal(keys.tasks).length||validLocal(keys.reminders).length);
  $('import-local').dataset.userId=userId||'';
  renderItems();
});

$('task-form').addEventListener('submit',async e=>{
  e.preventDefault();const input=$('task-text'),text=input.value.trim();if(!text)return;
  if(await mutation('tasks','create',{id:newId(),text,done:false}))input.value='';
  input.focus();
});
$('reminder-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const text=$('reminder-text').value.trim(),due=$('reminder-date').value;
  if(!text||!due||Number.isNaN(Date.parse(due)))return;
  if(await mutation('reminders','create',{id:newId(),text,due:new Date(due).toISOString(),done:false})){
    $('reminder-text').value='';$('reminder-date').value='';
  }
});
$('import-local').addEventListener('click',async()=>{
  if(status!=='cloud'||pending)return;
  const local={tasks:validLocal(keys.tasks),reminders:validLocal(keys.reminders)};
  if(!local.tasks.length&&!local.reminders.length)return;
  const count=local.tasks.length+local.reminders.length;
  if(!confirm(count+' lokale Einträge sicher in dieses angemeldete Toolya-Konto übernehmen?\n\nBereits synchronisierte Einträge werden nicht überschrieben. Alle lokalen Einträge bleiben erhalten.'))return;
  pending=true;renderControls();
  try {
    await cloud.importLocal(local);
    await cloud.refresh(); // guarded by pending in UI, but cloud import has completed
    show('Übernahme abgeschlossen. Lokale Browser-Einträge wurden nicht gelöscht. Wiederholte Übernahmen erzeugen keine Duplikate.');
  } catch(error) {
    show(error?.message||'Übernahme fehlgeschlagen. Browserdaten bleiben erhalten.');
    await cloud.refresh();
  } finally {pending=false;renderControls();}
});
$('sync-retry').addEventListener('click',()=>{void cloud.start();});
window.addEventListener('storage',e=>{
  if(Object.values(keys).includes(e.key)||e.key===null){
    renderTools();
    if(status==='local')renderItems();
    if(status==='cloud')$('import-local').hidden=!(validLocal(keys.tasks).length||validLocal(keys.reminders).length);
  }
});
document.addEventListener('toolya:dashboard-locale-change',()=>{renderTools();renderItems();renderShopping();});
window.addEventListener('pageshow', event => {
  if (event.persisted) renderTools();
});
renderTools();renderItems();cloud.start();
