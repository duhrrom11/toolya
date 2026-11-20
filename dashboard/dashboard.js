import { createDashboardCloud } from './modules/cloud-sync.mjs';

const tools = [
  ['wishlist','Wishlist','wishes','wishlist.webp'],['kassenbon','Haushaltsbuch','budget','budget.webp'],
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
function show(msg) { $('notice').textContent = msg; $('notice').hidden = false; }
function save(key, items) {
  try { localStorage.setItem(key, JSON.stringify(items)); return true; }
  catch { show('Lokales Speichern nicht möglich. Bitte überprüfe deinen Browser-Speicher.'); return false; }
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
    const content=element('span',t.name);content.append(element('small','Tool öffnen'));
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
  listTools('favorites',fav,'Du hast noch keine Favoriten. Markiere deine Lieblings-Tools auf der Startseite mit einem Stern.');
  listTools('recent',recent,'Noch keine letzten Tools gespeichert. Öffne ein Tool über die Startseite oder hier im Dashboard.');
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
        if(items.length>=MAX_ITEMS)throw Error('Maximal '+MAX_ITEMS+' Einträge möglich.');
        items.push(item);
      } else if(action==='delete') {
        if(!save(key,items.filter(x=>x.id!==item.id)))return false;
        renderItems();return true;
      } else {
        const target=items.find(x=>x.id===item.id);
        if(!target)throw Error('Eintrag wurde nicht gefunden.');
        target.done=completed;
      }
      if(!save(key,items))return false;
    }
    renderItems();
    return true;
  } catch(error) {
    show(error?.message || 'Speichern fehlgeschlagen. Es wurden keine lokalen Daten gelöscht.');
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
function renderItems() {
  const tasks=activeItems('tasks');
  const reminders=activeItems('reminders').filter(x=>typeof x.due==='string'&&!Number.isNaN(Date.parse(x.due))).sort((a,b)=>a.due.localeCompare(b.due));
  $('task-count').textContent=tasks.filter(t=>!t.done).length;
  $('reminder-count').textContent=reminders.filter(r=>!r.done).length;
  const taskHost=$('tasks');taskHost.replaceChildren();
  if(!tasks.length)taskHost.append(element('li','Noch keine Aufgaben angelegt.','empty'));
  for(const t of tasks) {
    const li=element('li',undefined,t.done?'done':'');
    const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!t.done;
    cb.setAttribute('aria-label','Aufgabe '+t.text+' erledigt');cb.dataset.entryId=t.id;
    cb.onchange=async()=>{const ok=await mutation('tasks','toggle',t,cb.checked);if(ok)refreshFocus($('tasks'),t.id)};
    const txt=element('span',t.text);
    const del=element('button','Entfernen');del.type='button';
    del.setAttribute('aria-label','Aufgabe entfernen: '+t.text);del.dataset.entryId=t.id;
    del.onclick=()=>mutation('tasks','delete',t);
    li.append(cb,txt,del);taskHost.append(li);
  }
  const remindHost=$('reminders');remindHost.replaceChildren();
  if(!reminders.length)remindHost.append(element('li','Noch keine Erinnerungen angelegt.','empty'));
  for(const r of reminders) {
    const overdue=!r.done&&Date.parse(r.due)<=Date.now();
    const li=element('li',undefined,(r.done?'done ':'')+(overdue?'overdue':''));
    const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!r.done;
    cb.setAttribute('aria-label','Erinnerung '+r.text+' erledigt');cb.dataset.entryId=r.id;
    cb.onchange=async()=>{const ok=await mutation('reminders','toggle',r,cb.checked);if(ok)refreshFocus($('reminders'),r.id)};
    const txt=element('span',r.text);
    txt.append(element('small',new Date(r.due).toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'})+(overdue?' · Fällig':''),'date'));
    const del=element('button','Entfernen');del.type='button';del.dataset.entryId=r.id;
    del.setAttribute('aria-label','Erinnerung entfernen: '+r.text);
    del.onclick=()=>mutation('reminders','delete',r);
    li.append(cb,txt,del);remindHost.append(li);
  }
  renderControls();
}
const cloud=createDashboardCloud(({status:next,message,userId})=>{
  status=next;
  document.documentElement.dataset.dashboardSync=next;
  $('sync-status').textContent=next==='cloud'?'☁ Cloud synchronisiert':next==='local'?'Nur auf diesem Gerät':next==='loading'?'Cloud wird geladen …':'Cloud nicht erreichbar';
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
renderTools();renderItems();cloud.start();
