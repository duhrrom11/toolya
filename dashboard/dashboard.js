(()=>{'use strict';
const tools=[
['wishlist','Wishlist','wishes','wishlist.webp'],['kassenbon','Haushaltsbuch','budget','budget.webp'],['kisten','Umzugskisten','moving','moving.webp'],['pflanzen','Pflanzenpflege','plants','plants.webp'],['wg-kasse','WG-Organisator','housemates','wg-organisator.webp'],['notizen','Digitaler Nachlass','estate','digitaler-nachlass.webp'],['kfz','Autokosten','car','autokosten.webp'],['haustier','Tiergesundheit','pet-health','tiergesundheit.webp'],['parken','Parkplatz-Merker','parking','parkplatz-merker.webp'],['verleih','Verliehene Dinge','loans','verliehene-dinge.webp'],['energie','Zählerstände','meters','zaehlerstaende.webp'],['backform','Backform-Rechner','baking','backform-rechner.webp']
].map(([id,name,route,img])=>({id,name,url:'../tools/'+route+'/',img:'../assets/toolya/home/'+img}));
const byId=new Map(tools.map(t=>[t.id,t]));
const preferencesKey='helferlein-toolya-preferences-v1';
const companionKey='toolya_dashboard_companion_v1';
function companionEnabled(){try{return localStorage.getItem(companionKey)!=='off'}catch{return true}}
function selectedCharacter(){try{return JSON.parse(localStorage.getItem(preferencesKey)||'{}').character==='purple'?'purple':'turquoise'}catch{return 'turquoise'}}
function renderCompanion(){
 const enabled=companionEnabled(),img=$('dashboard-mascot'),toggle=$('buddy-toggle');
 img.src='../assets/toolya/originals/toolya_wishlist_'+selectedCharacter()+'_welcome_1024.png';
 img.hidden=!enabled;toggle.setAttribute('aria-pressed',String(enabled));toggle.textContent=enabled?'Begleiter-Tipps ausschalten':'Begleiter-Tipps einschalten';
 $('buddy-message').textContent=enabled?'Dein Toolya-Begleiter ist da. Deine Aufgaben und Termine hast du hier im Blick.':'Begleiter-Tipps sind ausgeschaltet.';
}
function companionTip(message){
 if(companionEnabled())$('buddy-message').textContent=message;
}

const keys={favorites:'hub_favorites',recent:'toolya_recent_tools_v1',tasks:'toolya_dashboard_tasks_v1',reminders:'toolya_dashboard_reminders_v1'};
const $=id=>document.getElementById(id);
function read(key){try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[]}catch{return []}}
function save(key,items){try{localStorage.setItem(key,JSON.stringify(items));return true}catch{show('Speichern nicht möglich. Bitte überprüfe deinen Browser-Speicher.');return false}}
function show(msg){$('notice').textContent=msg;$('notice').hidden=false}
function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
function listTools(id,items,empty){const host=$(id);host.replaceChildren();if(!items.length){host.append(element('p',empty,'empty'));return}for(const t of items){const a=element('a',undefined,'tool-item');a.href=t.url;const img=document.createElement('img');img.src=t.img;img.alt='';img.loading='lazy';img.onerror=()=>img.remove();const content=element('span',t.name);content.append(element('small','Tool öffnen'));a.append(img,content);a.addEventListener('click',()=>recordRecent(t.id));host.append(a)}}
function recordRecent(id){const items=read(keys.recent).filter(x=>typeof x==='string'&&x!==id&&byId.has(x));items.unshift(id);save(keys.recent,items.slice(0,8))}
function renderTools(){const fav=[...new Set(read(keys.favorites))].map(id=>byId.get(id)).filter(Boolean),recent=[...new Set(read(keys.recent))].map(id=>byId.get(id)).filter(Boolean);$('fav-count').textContent=fav.length;$('recent-count').textContent=recent.length;listTools('favorites',fav,'Du hast noch keine Favoriten. Markiere deine Lieblings-Tools auf der Startseite mit einem Stern.');listTools('recent',recent,'Noch keine letzten Tools gespeichert. Öffne ein Tool über die Startseite oder hier im Dashboard.')}
const MAX_ITEMS=150;
function validItems(key){return read(key).filter(x=>x&&typeof x.id==='string'&&typeof x.text==='string'&&x.text.length<=160).slice(0,MAX_ITEMS)}
function addItem(key,entry){const items=validItems(key);if(items.length>=MAX_ITEMS){show('Maximal '+MAX_ITEMS+' '+(key===keys.tasks?'Aufgaben':'Erinnerungen')+' möglich. Entferne zuerst einen Eintrag.');return false}items.push(entry);if(!save(key,items))return false;renderItems();companionTip(key===keys.tasks?'Prima, deine Aufgabe ist notiert!':'Deine Erinnerung ist gespeichert. Du siehst sie hier, wenn du das Dashboard öffnest.');return true}
function removeItem(key,id){if(save(key,validItems(key).filter(x=>x.id!==id))){renderItems();companionTip('Eintrag entfernt. Weiter geht’s!')}}
function id(){return globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2)}
function restoreCheckboxFocus(host,id){for(const control of host.querySelectorAll('input[type="checkbox"]')){if(control.dataset.entryId===id){control.focus();return}}}
function renderItems(){
const tasks=validItems(keys.tasks),reminders=validItems(keys.reminders).filter(x=>typeof x.due==='string'&&!Number.isNaN(Date.parse(x.due))).sort((a,b)=>a.due.localeCompare(b.due));const pending=tasks.filter(t=>!t.done);$('task-count').textContent=pending.length;$('reminder-count').textContent=reminders.filter(r=>!r.done).length;
const taskHost=$('tasks');taskHost.replaceChildren();if(!tasks.length)taskHost.append(element('li','Noch keine Aufgaben angelegt.','empty'));for(const t of tasks){const li=element('li',undefined,t.done?'done':'');const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!t.done;cb.setAttribute('aria-label','Aufgabe '+t.text+' erledigt');cb.dataset.entryId=t.id;cb.addEventListener('change',()=>{const checked=cb.checked;t.done=checked;if(save(keys.tasks,tasks)){renderItems();restoreCheckboxFocus($('tasks'),t.id)}else{t.done=!checked;cb.checked=!checked}});const txt=element('span',t.text);const del=element('button','Entfernen');del.type='button';del.setAttribute('aria-label','Aufgabe entfernen: '+t.text);del.onclick=()=>removeItem(keys.tasks,t.id);li.append(cb,txt,del);taskHost.append(li)}
const remindHost=$('reminders');remindHost.replaceChildren();if(!reminders.length)remindHost.append(element('li','Noch keine Erinnerungen angelegt.','empty'));for(const r of reminders){const overdue=!r.done&&Date.parse(r.due)<=Date.now();const li=element('li',undefined,(r.done?'done ':'')+(overdue?'overdue':''));const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!r.done;cb.setAttribute('aria-label','Erinnerung '+r.text+' erledigt');cb.dataset.entryId=r.id;cb.onchange=()=>{const checked=cb.checked;r.done=checked;if(save(keys.reminders,reminders)){renderItems();restoreCheckboxFocus($('reminders'),r.id)}else{r.done=!checked;cb.checked=!checked}};const txt=element('span',r.text);const date=element('small',new Date(r.due).toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'})+(overdue?' · Fällig':''),'date');txt.append(date);const del=element('button','Entfernen');del.type='button';del.setAttribute('aria-label','Erinnerung entfernen: '+r.text);del.onclick=()=>removeItem(keys.reminders,r.id);li.append(cb,txt,del);remindHost.append(li)}
}
$('task-form').addEventListener('submit',e=>{e.preventDefault();const input=$('task-text'),text=input.value.trim();if(!text)return;if(addItem(keys.tasks,{id:id(),text,done:false})){input.value=''}input.focus()});
$('reminder-form').addEventListener('submit',e=>{e.preventDefault();const text=$('reminder-text').value.trim(),due=$('reminder-date').value;if(!text||!due||Number.isNaN(Date.parse(due)))return;if(addItem(keys.reminders,{id:id(),text,due:new Date(due).toISOString(),done:false})){$('reminder-text').value='';$('reminder-date').value=''}});
window.addEventListener('storage',e=>{if(Object.values(keys).includes(e.key)||e.key===null){renderTools();renderItems()}if(e.key===preferencesKey||e.key===companionKey||e.key===null)renderCompanion()});
$('buddy-toggle').addEventListener('click',()=>{try{localStorage.setItem(companionKey,companionEnabled()?'off':'on')}catch{show('Diese Einstellung konnte nicht gespeichert werden.')}renderCompanion()});
renderTools();renderItems();renderCompanion();
})();