// Ausführen: node --test tools/wishlist/toolya-buddy.test.mjs
// Kein Browser, Netzwerk, Supabase-Zugang oder produktive Daten erforderlich.
import test from 'node:test';
import assert from 'node:assert/strict';
import {ToolyaBuddy} from '../../shared/toolya/buddy.mjs';

class Element {
 constructor(tag='div'){this.tag=tag;this.children=[];this.parent=null;this.attrs={};this.hidden=false;this.isConnected=true;this.textContent='';this.className='';}
 set innerHTML(html){this.children=[];if(html.includes('tb-message-box')){const box=new Element();box.className='tb-message-box';box.hidden=true;const img=new Element('img');img.className='tb-avatar';const title=new Element('strong');title.className='tb-title';const body=new Element('p');body.className='tb-body';const close=new Element('button');close.className='tb-close';const txt=new Element();txt.className='tb-text';txt.append(title,body,close);box.append(img,txt);this.append(box)}}
 append(...items){for(const item of items){this.children.push(item);item.parent=this}}
 *walk(){for(const child of this.children){yield child;yield* child.walk()}}
 querySelector(selector){return [...this.walk()].find(x=>x.className.split(' ').includes(selector.slice(1)))||null}
 setAttribute(name,value){this.attrs[name]=value}
 removeAttribute(name){delete this.attrs[name]}
 addEventListener(){}
 showModal(){this.open=true}
 close(){this.open=false}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);this.isConnected=false}
 focus(){document.activeElement=this}
}
const listeners=new Map();
globalThis.document={body:new Element('body'),activeElement:null,createElement:tag=>new Element(tag),addEventListener:(type,fn)=>listeners.set(type,[...(listeners.get(type)||[]),fn]),removeEventListener:(type,fn)=>listeners.set(type,(listeners.get(type)||[]).filter(x=>x!==fn))};
function press(key,shiftKey=false){let prevented=false;const event={key,shiftKey,preventDefault(){prevented=true},stopPropagation(){}};for(const fn of [...(listeners.get('keydown')||[])])fn(event);return prevented}
const buddy=new ToolyaBuddy({root:document.body});
test('Komponente wird eingebunden',()=>assert.ok(document.body.querySelector('.toolya-buddy')));
test('Warnung hat Vorrang vor Erfolg',()=>{buddy.show('warning','Kritisch');buddy.show('success','Später');assert.equal(buddy.current.type,'warning')});
test('Warteschlange liefert nächste Meldung',()=>{buddy.dismiss();assert.equal(buddy.current.type,'success')});
test('Ruhemodus überspringt optionale Meldungen',()=>{buddy.show('warning','Kritisch');buddy.show('tip','Optional');buddy.show('warning','Noch kritisch');buddy.setQuiet(true);buddy.dismiss();assert.equal(buddy.current.type,'warning')});
test('Ruhemodus unterdrückt neue optionale Meldungen',()=>assert.equal(buddy.show('tip','Still'),false));
test('Warnung bleibt auch im Ruhemodus sichtbar',()=>{buddy.show('error','Fehler');assert.equal(buddy.current.type,'warning');buddy.dismiss();assert.equal(buddy.current.type,'error')});
test('Gleichzeitige Bestätigung wird sicher abgebrochen',async()=>{const first=buddy.confirm({message:'Erste Frage'});assert.equal(await buddy.confirm({message:'Zweite Frage'}),false);assert.equal(buddy.dialogs.length,1);assert.equal(press('Escape'),true);assert.equal(await first,false)});
test('Escape entfernt Sicherheitsdialog',()=>assert.equal(buddy.dialogs.length,0));
test('Bestätigen liefert true',async()=>{const promise=buddy.confirm({message:'Ja'});buddy.dialogs[0].img.parent.children.at(-1).onclick();assert.equal(await promise,true)});
test('Abbrechen liefert false',async()=>{const promise=buddy.confirm({message:'Nein'});buddy.dialogs[0].img.parent.children.at(-2).onclick();assert.equal(await promise,false)});
test('Charakterwechsel funktioniert',()=>{buddy.setCharacter('purple');assert.equal(buddy.character,'purple')});
test('Ungültiger Charakter wird abgelehnt',()=>assert.throws(()=>buddy.setCharacter('invalid'),/Ungültiger Charakter/));

test('Animation verwendet die passende Originalpose',()=>{
 const animated=new ToolyaBuddy({root:document.body,character:'purple'});animated.show('welcome','Hallo');
 assert.equal(animated.host.attrs['data-pose'],'welcome');
 animated.show('success','Erledigt');
 assert.equal(animated.host.attrs['data-pose'],'success');
 animated.show('tip','Hinweis');
 assert.equal(animated.host.attrs['data-pose'],'tip');
 animated.show('error','Fehler');
 assert.equal(animated.host.attrs['data-pose'],'error');
 assert.equal(animated.host.querySelector('.tb-avatar').src,'./toolya_wishlist_purple_error_1024.png');
 animated.destroy();
});
test('Ruhemodus deaktiviert Bewegungen, nicht Fehlermeldungen',()=>{
 buddy.setQuiet(true);
 assert.equal(buddy.host.attrs['data-motion'],'off');
 assert.equal(buddy.show('welcome','Leise'),false);
 assert.equal(buddy.show('error','Wichtig'),true);
 buddy.setQuiet(false);
 assert.equal(buddy.host.attrs['data-motion'],'on');
});

test('v5: kritische Meldung unterbricht optionalen Hinweis und stellt ihn danach wieder her',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('tip','Hinweis');b.show('error','Wichtig');assert.equal(b.current.type,'error');b.dismiss();assert.equal(b.current.type,'tip');}finally{b.destroy()}
});
test('v5: gleiche Meldung wird nicht mehrfach eingereiht',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('warning','Kritisch');b.show('tip','Einmal');b.show('tip','Einmal');assert.equal(b.queue.length,1);b.show('warning','Kritisch');assert.equal(b.queue.length,1);}finally{b.destroy()}
});
test('v5: wichtige Warteschlangenmeldungen gehen optionalen vor',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('error','Eins');b.show('tip','Optional');b.show('warning','Zwei');b.dismiss();assert.equal(b.current.type,'warning');b.dismiss();assert.equal(b.current.type,'tip');}finally{b.destroy()}
});
test('v5: Ruhemodus entfernt optionale Warteschlangeneinträge',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('error','Wichtig');b.show('tip','Optional');b.setQuiet(true);assert.equal(b.queue.length,0);assert.equal(b.current.type,'error');}finally{b.destroy()}
});
test('v5: nach destroy werden Meldungen abgelehnt',()=>{
 const b=new ToolyaBuddy({root:document.body});b.destroy();assert.equal(b.show('error','Nicht mehr anzeigen'),false);
});
test('v6: Animation lässt sich abschalten und in Stufen einstellen',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.setMotion('off');assert.equal(b.host.attrs['data-motion'],'off');b.setMotion('lively');assert.equal(b.host.attrs['data-motion'],'lively');b.setQuiet(true);assert.equal(b.host.attrs['data-motion'],'off');b.setQuiet(false);assert.equal(b.host.attrs['data-motion'],'lively');assert.throws(()=>b.setMotion('unknown'),/Animationsstufe/)}finally{b.destroy()}
});
test('v6: Tipps können separat abgeschaltet werden',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.setTips(false);assert.equal(b.show('tip','Ungewollt'),false);assert.equal(b.show('warning','Wichtig'),true)}finally{b.destroy()}
});
test('v6: ausgeblendeter Begleiter zeigt wichtige Warnungen weiterhin',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.setHidden(true);assert.equal(b.host.hidden,true);b.show('warning','Wichtig');assert.equal(b.host.hidden,false);b.dismiss();assert.equal(b.host.hidden,true)}finally{b.destroy()}
});
test('v7: ausgeblendet unterdrückt optionale Meldungen, zeigt Fehler aber an',()=>{
 const b=new ToolyaBuddy({root:document.body,hidden:true});
 try{assert.equal(b.show('success','Nicht anzeigen'),false);assert.equal(b.show('error','Wichtig'),true);assert.equal(b.host.hidden,false);assert.equal(b.host.querySelector('.tb-text').attrs['aria-live'],'assertive');b.dismiss();assert.equal(b.host.hidden,true)}finally{b.destroy()}
});
test('v7: normaler Animationsmodus bleibt kompatibel',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.setMotion('normal');assert.equal(b.host.attrs['data-motion'],'on');b.setMotion('calm');assert.equal(b.host.attrs['data-motion'],'calm')}finally{b.destroy()}
});
test('v8: Charakterwechsel startet die Meldefrist nicht neu',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('tip','Zeitlich begrenzt');const deadline=b.deadline;assert.ok(deadline>Date.now());b.setCharacter('purple');assert.ok(b.deadline<=deadline);b.dismiss();assert.equal(b.deadline,0)}finally{b.destroy()}
});
test('v8: wichtige Meldungen haben keine automatische Ablauffrist',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('warning','Bitte prüfen');assert.equal(b.deadline,0);assert.equal(b.host.querySelector('.tb-text').attrs['aria-live'],'assertive')}finally{b.destroy()}
});
test('v9: Shift+Tab von außerhalb bleibt im Dialog',async()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{const result=b.confirm({message:'Tastaturtest'});document.activeElement=new Element('button');assert.equal(press('Tab',true),true);const dialog=b.dialogs[0].img.parent;assert.equal(document.activeElement,dialog.children.at(-1));assert.equal(press('Escape'),true);assert.equal(await result,false)}finally{b.destroy()}
});
test('v9: nach destroy wird kein Bestätigungsdialog geöffnet',async()=>{
 const b=new ToolyaBuddy({root:document.body});b.destroy();
 assert.equal(await b.confirm({message:'Nicht mehr öffnen'}),false);
});
test('v10: Ruhemoduswechsel verlängert aktive Hinweise nicht',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('tip','Ablaufzeit');const deadline=b.deadline;b.setQuiet(false);assert.ok(b.deadline<=deadline);b.setQuiet(true);assert.equal(b.current,null);assert.equal(b.deadline,0)}finally{b.destroy()}
});
test('v10: Warteschlange verliert auch bei vielen Warnungen keine kritische Meldung',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('error','Erste Warnung');for(let i=0;i<20;i++)b.show('warning','Warnung '+i);assert.equal(b.queue.length,20);for(let i=0;i<20;i++){b.dismiss();assert.equal(b.current.message,'Warnung '+i)}}finally{b.destroy()}
});
test('v11: ausgeblendeter Begleiter überspringt alte optionale Meldungen',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('error','Wichtig');b.show('tip','Alter Tipp');b.setHidden(true);b.dismiss();assert.equal(b.current,null);assert.equal(b.host.hidden,true)}finally{b.destroy()}
});
test('v11: deaktivierte Tipps erscheinen nach einer Warnung nicht wieder',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('warning','Wichtig');b.show('tip','Alter Tipp');b.setTips(false);b.dismiss();assert.equal(b.current,null)}finally{b.destroy()}
});
test('v12: Schließen besitzt einen eindeutigen Screenreader-Namen',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('warning','Wichtiger Hinweis');assert.equal(b.host.querySelector('.tb-close').attrs['aria-label'],'Toolya-Meldung schließen')}finally{b.destroy()}
});
test('v13: veralteter Bildladefehler versteckt nicht den neuen Charakter',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('welcome','Hallo');const img=b.host.querySelector('.tb-avatar');const oldError=img.onerror;b.setCharacter('purple');oldError();assert.equal(img.hidden,false);assert.match(img.src,/purple_welcome/);img.onerror();assert.equal(img.hidden,true)}finally{b.destroy()}
});
test('v14: Meldungstext erhält vor der Aktualisierung die passende Live-Region',()=>{
 const b=new ToolyaBuddy({root:document.body});
 const body=b.host.querySelector('.tb-body'),live=b.host.querySelector('.tb-text');
 const original=Object.getOwnPropertyDescriptor(body,'textContent');
 let roleWhenWritten;
 Object.defineProperty(body,'textContent',{configurable:true,get(){return this._text},set(value){this._text=value;roleWhenWritten=live.attrs.role}});
 try{b.show('warning','Dringend');assert.equal(roleWhenWritten,'alert');b.dismiss();b.show('tip','Optional');assert.equal(roleWhenWritten,'status')}finally{if(original)Object.defineProperty(body,'textContent',original);b.destroy()}
});
test('v14: verspätete UI-Ereignisse nach destroy bleiben wirkungslos',()=>{
 const b=new ToolyaBuddy({root:document.body});b.show('tip','Vorher');b.destroy();
 b.dismiss();b.setCharacter('purple');b.setMotion('lively');b.setQuiet(true);b.setTips(false);b.setHidden(true);
 assert.equal(b.current,null);assert.equal(b.queue.length,0);assert.equal(b.deadline,0);assert.equal(b.character,'turquoise');assert.equal(b.motion,'normal');
});
test('v15: fokussierter Schließen-Knopf verhindert automatisches Verschwinden',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('tip','Noch am Lesen');b.host.querySelector('.tb-close').focus();b.expireOptional();assert.equal(b.current.type,'tip');document.activeElement=null;b.expireOptional();assert.equal(b.current,null)}finally{b.destroy()}
});
test('v15: kritische Warnungen bleiben auch beim Ablaufversuch bestehen',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('warning','Kritisch');b.expireOptional();assert.equal(b.current.type,'warning')}finally{b.destroy()}
});
test('v16: Mauszeiger hält optionale Meldung sichtbar',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('tip','Bitte lesen');b.host.onpointerenter({pointerType:'mouse'});b.expireOptional();assert.equal(b.current.type,'tip');b.host.onpointerleave();b.expireOptional();assert.equal(b.current,null)}finally{b.destroy()}
});
test('v16: Android-Touch erzeugt keine dauerhafte Hover-Sperre',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('tip','Touch');b.host.onpointerenter({pointerType:'touch'});assert.equal(b.pointerOver,false);b.expireOptional();assert.equal(b.current,null)}finally{b.destroy()}
});
test('v16: inaktiver Browser-Tab hält optionale Meldung sichtbar',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('success','Noch lesen');document.hidden=true;b.expireOptional();assert.equal(b.current.type,'success');document.hidden=false;b.expireOptional();assert.equal(b.current,null)}finally{document.hidden=false;b.destroy()}
});
test('v17: alter Timer darf neue Meldung nicht schließen',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('tip','Alt');const oldEpoch=b.noticeEpoch;b.show('success','Neu');b.expireOptional(oldEpoch);assert.equal(b.current.message,'Neu');assert.ok(b.noticeEpoch>oldEpoch)}finally{b.destroy()}
});
test('v17: nach destroy darf alter Timer keine Meldung verändern',()=>{
 const b=new ToolyaBuddy({root:document.body});b.show('tip','Alt');const epoch=b.noticeEpoch;b.destroy();b.expireOptional(epoch);assert.equal(b.current,null);
});
test('v18: Android pointercancel löst die Hover-Pause wieder',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('tip','Pointer');b.host.onpointerenter({pointerType:'pen'});assert.equal(b.pointerOver,true);b.host.onpointercancel();assert.equal(b.pointerOver,false);b.expireOptional();assert.equal(b.current,null)}finally{b.destroy()}
});
test('v19: Fokusverlust hebt die Hover-Pause auf',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('tip','Hinweis');b.host.onpointerenter({pointerType:'mouse'});assert.equal(b.pointerOver,true);b.host.onblur();assert.equal(b.pointerOver,false);b.expireOptional();assert.equal(b.current,null)}finally{b.destroy()}
});
test('v20: Schließen hat bereits vor erster Meldung einen zugänglichen Namen',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{assert.equal(b.host.querySelector('.tb-close').attrs['aria-label'],'Toolya-Meldung schließen')}finally{b.destroy()}
});
test('v21: Dialogende toleriert verbundenes Element ohne focus-Methode',async()=>{
 const b=new ToolyaBuddy({root:document.body});const previous=document.activeElement;
 try{document.activeElement={isConnected:true};const result=b.confirm({message:'Fokus prüfen'});b.dialogs[0].img.parent.children.at(-2).onclick();assert.equal(await result,false);assert.equal(b.dialogs.length,0)}finally{document.activeElement=previous;b.destroy()}
});
test('v22: geerbte Objektschlüssel sind keine gültigen Meldungstypen',()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{assert.equal(b.show('constructor','Unsicher'),false);assert.equal(b.show('toString','Unsicher'),false);assert.equal(b.show('__proto__','Unsicher'),false);assert.equal(b.current,null)}finally{b.destroy()}
});
test('v23: leerer Bestätigungstext öffnet keinen unbeschrifteten Dialog',async()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{await assert.rejects(b.confirm({message:'  \n  '}),/Bestätigungstext fehlt/);assert.equal(b.dialogs.length,0)}finally{b.destroy()}
});
test('Zerstören entfernt Komponente',()=>{buddy.destroy();assert.equal(document.body.querySelector('.toolya-buddy'),null)});

test('native modal pauses optional expiry and restores notice after cancellation',async()=>{
 const b=new ToolyaBuddy({root:document.body});
 try{b.show('tip','Weiterlesen');const result=b.confirm({message:'Sicher?'});b.expireOptional();assert.equal(b.current.message,'Weiterlesen');assert.equal(b.host.attrs['data-dialog-open'],'true');press('Escape');assert.equal(await result,false);assert.equal(b.host.attrs['data-dialog-open'],undefined);document.activeElement=null;b.expireOptional();assert.equal(b.current,null)}finally{b.destroy()}
});

test('Kitzelreaktion braucht fünf Aktivierungen, rotiert und respektiert die Abklingzeit',()=>{
 const b=new ToolyaBuddy({root:document.body});b.show('welcome','Hallo');
 for(let i=0;i<4;i++)assert.equal(b.tickle(1000+i),false);
 assert.equal(b.tickle(1004),true);assert.match(b.current.message,/kitzlig/);
 assert.equal(b.tickle(1005),false);
 for(let i=0;i<4;i++)assert.equal(b.tickle(17000+i),false);
 assert.equal(b.tickle(17004),true);assert.match(b.current.message,/Ohren/);b.destroy();
});
test('Kitzelreaktion unterbricht weder Warnungen noch Dialoge und ist im Ruhemodus aus',async()=>{
 const b=new ToolyaBuddy({root:document.body});b.show('warning','Wichtig');
 for(let i=0;i<7;i++)assert.equal(b.tickle(1000+i),false);
 assert.equal(b.current.message,'Wichtig');b.dismiss();
 const confirmed=b.confirm({message:'Sicher?'});assert.equal(b.tickle(2000),false);press('Escape');assert.equal(await confirmed,false);
 b.setQuiet(true);assert.equal(b.tickle(3000),false);b.destroy();
});
test('Langsame oder auseinanderliegende Aktivierungen lösen keine Kitzelreaktion aus',()=>{
 const b=new ToolyaBuddy({root:document.body});for(let i=0;i<8;i++)assert.equal(b.tickle(1000+i*5001),false);b.destroy();
});
