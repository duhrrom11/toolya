import test from 'node:test';import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {readFileSync} from 'node:fs';
import {WISHES_COPY,WISHES_RUNTIME_COPY,wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';
import {applyWishLocale} from '../../shared/toolya/i18n/wishes-dom.mjs';
test('Wishlist translation changes only author-owned controls and restores implicit option keys',()=>{
 const {document}=parseHTML('<html><body><h1>Meine Merkliste</h1><button onclick="saveGift()">Abbrechen</button><select><option>Geplant</option></select><input placeholder="Name oder Organisation" value="Private value"><div class="profile-card"><h2>Geplant</h2></div></body></html>');
 const button=document.querySelector('button'),option=document.querySelector('option'),input=document.querySelector('input');
 applyWishLocale(document,'en');
 assert.equal(document.querySelector('h1').textContent,'My bookmarks');
 assert.equal(button.textContent,'Cancel');
 assert.equal(button.getAttribute('onclick'),'saveGift()');
 assert.equal(option.textContent,'Planned');
 assert.equal(option.getAttribute('value'),'Geplant');
 assert.equal(input.value,'Private value');
 assert.equal(document.querySelector('.profile-card h2').textContent,'Geplant');
 applyWishLocale(document,'de');
 assert.equal(option.textContent,'Geplant');
 assert.ok(!option.hasAttribute('value'));
 assert.equal(input.getAttribute('placeholder'),'Name oder Organisation');
});
test('wishlist catalogue includes public, planning, social and account UI without free-text translation',()=>{
 assert.ok(Object.keys(WISHES_COPY).length>=160);
 assert.equal(wishesText('Geschenk speichern','en'),'Save gift');
 assert.equal(wishesText('Private note from a user','en'),'Private note from a user');
});
test('all seventeen interactive wishlist pages load only the reversible locale shell',async()=>{
 const {readFileSync}=await import('node:fs');
 const names=['public','dashboard','collection','discover','feed','planner','profile','occasions','reservations','assistant','bookmarks','cockpit','gift-analytics','gift-tasks','notifications','report','social'];
 for(const name of names){
  const html=readFileSync(new URL('../../tools/wishes/'+name+'.html',import.meta.url),'utf8');
  assert.ok(html.includes('wishes-entry.mjs'),name);
  assert.ok(html.includes('wishes-choice.css'),name);
  assert.ok(html.includes('lang="de"'),name);
 }
});

test('dynamic Wishes statuses and auth warnings translate but preserve user payloads',()=>{
 const sample=[
  ['Aufgabe gelöscht.','Task deleted.'],
  ['Bitte ein Passwort mit mindestens acht Zeichen verwenden.','Use a password of at least eight characters.'],
  ['Benachrichtigungen konnten nicht geladen werden. Bitte erneut versuchen.','Notifications could not be loaded. Try again.'],
  ['Dieses Geschenk dauerhaft löschen?','Permanently delete this gift?']
 ];
 for(const [de,en]of sample){assert.equal(wishesText(de,'en'),en);assert.equal(wishesText(en,'de'),de)}
 assert.equal(wishesText('Vorschlag: My private note','en'),'Suggestion: My private note');
 assert.equal(wishesText('my@example.org','en'),'my@example.org');
});
test('Wishes direct text node changes are recognised as new app updates',()=>{
 const {document}=parseHTML('<html><body><button>Aufgabe gespeichert.</button></body></html>');
 const button=document.querySelector('button');
 applyWishLocale(document,'en');assert.equal(button.textContent,'Task saved.');
 button.firstChild.nodeValue='Aufgabe gelöscht.';
 applyWishLocale(document,'en');assert.equal(button.textContent,'Task deleted.');
 applyWishLocale(document,'de');assert.equal(button.textContent,'Aufgabe gelöscht.');
});

test('cloud conflict, export/import and occasion notifications have reversible English text',()=>{
 const cases=[
  ['Cloud-Konflikte konnten nicht vollständig geprüft werden. Kein Import.','Cloud conflicts could not be fully checked. Nothing was imported.'],
  ['Importvorschau abgelaufen. Bitte neu prüfen.','Import preview expired. Check again.'],
  ['Export fehlgeschlagen. Bitte erneut versuchen.','Export failed. Try again.'],
  ['Wünsche konnten nicht geladen werden. Mit „Erneut laden“ kannst du es noch einmal versuchen.',"Wishes could not be loaded. Select 'Reload' to try again."],
  ['Diesen Anlass dauerhaft löschen?','Permanently delete this occasion?']
 ];
 for(const [de,en] of cases){assert.equal(wishesText(de,'en'),en);assert.equal(wishesText(en,'de'),de)}
 for(const [de,en]of Object.entries(WISHES_RUNTIME_COPY)){assert.equal(wishesText(de,'en'),en,de);assert.equal(wishesText(en,'de'),de,en)}
});

test('all known application-owned status fields in Wishes are eligible for live translation',()=>{
 const source=readFileSync(new URL('../../shared/toolya/i18n/wishes-entry.mjs',import.meta.url),'utf8');
 for(const id of ['status','taskStatus','checklistStatus','giftStatus','giftFormFeedback',
  'settingsAuthMessage','profileStatus','actionStatus','notice','reviewStatus','closingStatus']){
  assert.ok(source.includes("'#"+id+"'"),'status not tracked: '+id);
 }
 for(const id of ['progressBar','dailyProgress','budgetProgress']){
  assert.ok(!source.includes("'#"+id+"'"),'progress indicator must not be translated: '+id);
 }
});

test('safety-critical Wishes messages remain present in their source modules and have reversible translations',()=>{
 const cases=[
  ['gift-start.mjs','JSON-Sicherung lokal heruntergeladen. Keine Daten hochgeladen.','JSON backup downloaded locally. No data was uploaded.'],
  ['gift-start.mjs','Cloud-Ansichten konnten nicht geladen werden. Lokale Ansichten wurden nicht verändert.','Cloud views could not be loaded. Local views were not changed.'],
  ['app.mjs','Importvorschau abgelaufen. Bitte neu prüfen.','Import preview expired. Check again.'],
  ['app.mjs','Cloud-Konflikte konnten nicht vollständig geprüft werden. Kein Import.','Cloud conflicts could not be fully checked. Nothing was imported.'],
  ['lists-dashboard.mjs','Die Listenzuordnung hat sich geändert. Bitte Auswahl und Aktion erneut prüfen.','List assignment changed. Review the selection and action again.'],
  ['gift-assistant.mjs','Bitte zuerst die Übernahme ausdrücklich bestätigen.','Explicitly confirm the import first.'],
  ['occasions.mjs','Diesen Anlass dauerhaft löschen?','Permanently delete this occasion?'],
  ['gift-dashboard.mjs','Priorität konnte nicht gespeichert werden.','Priority could not be saved.']
 ];
 for(const [file,de,en] of cases){
  const source=readFileSync(new URL('../../tools/wishes/'+file,import.meta.url),'utf8');
  assert.ok(source.includes(de),'Missing application source warning: '+file+' / '+de);
  assert.equal(wishesText(de,'en'),en,file);
  assert.equal(wishesText(en,'de'),de,file);
 }
});

test('Wishes planning and privacy notices render in English and restore German safely',()=>{
 const pairs=[
  ['Die Vorschläge sind ausschließlich für dein angemeldetes Konto sichtbar.','Suggestions are visible only to your signed-in account.'],
  ['Dieser Bericht ist ausschließlich für das angemeldete Konto sichtbar.','This report is visible only to the signed-in account.'],
  ['Kalenderwochen nach tatsächlichem Ereigniszeitpunkt, nicht nach Fälligkeitsdatum.','Calendar weeks are based on when events occurred, not on due dates.'],
  ['Reservierungen werden geladen …','Loading reservations…'],
  ['Anlässe in 30 Tagen','Occasions in 30 days'],
  ['← Wünsche','← Wishes'],
  ['Öffentliche Sammlungen werden geladen …','Loading public collections…'],
  ['Wähle, welche Arten von Hinweisen in deiner Benachrichtigungszentrale erscheinen.','Choose which types of notifications appear in your notification centre.']
 ];
 for(const [de,en] of pairs){assert.equal(wishesText(de,'en'),en);assert.equal(wishesText(en,'de'),de)}
 const {document}=parseHTML('<html><body><main><p data-wish-copy>Dieser Bericht ist ausschließlich für das angemeldete Konto sichtbar.</p><a href="/tools/wishes/" data-wish-copy>← Wünsche</a><div data-user-content><p data-wish-copy>Dieser Bericht ist ausschließlich für das angemeldete Konto sichtbar.</p></div><input value="private note"></main></body></html>');
 applyWishLocale(document,'en');
 assert.equal(document.querySelector('main > p').textContent,pairs[1][1]);
 assert.equal(document.querySelector('main > a').textContent,'← Wishes');
 assert.equal(document.querySelector('[data-user-content] p').textContent,pairs[1][0]);
 assert.equal(document.querySelector('input').value,'private note');
 assert.equal(document.querySelector('main > a').getAttribute('href'),'/tools/wishes/');
 applyWishLocale(document,'de');
 assert.equal(document.querySelector('main > p').textContent,pairs[1][0]);
 assert.equal(document.querySelector('main > a').textContent,'← Wünsche');
});
test('Wishes translated long-form notices are explicitly marked in source HTML',()=>{
 for(const name of ['assistant','planner','report','occasions','reservations','dashboard','cockpit','notifications','gift-analytics','bookmarks','feed']){
  const html=readFileSync(new URL('../../tools/wishes/'+name+'.html',import.meta.url),'utf8');
  assert.match(html,/data-wish-copy/,name);
 }
});

test('Wishes community and navigation text remains reversible and excludes user content',()=>{
 const pairs=[["Entdecke öffentliche Sammlungen, lerne ihre Ersteller kennen und finde neue Geschenkideen. Private Sammlungen werden nicht angezeigt.","Explore public collections, meet their creators and discover new gift ideas. Private collections are not displayed."],["Meine Merkliste öffnen ↗","Open my bookmarks ↗"],["Neue öffentliche Sammlungen gefolgter Profile, deine gemerkten Wunschwelten und passende Inspiration an einem Ort.","New public collections from profiles you follow, your bookmarked wish lists and relevant inspiration in one place."],["Öffentliche Wunschsammlung","Public wish collection"],["🔖 Meine Merkliste","🔖 My bookmarks"],["🎀 Meine Geschenkreservierungen verwalten","🎀 Manage my gift reservations"],["Profil wird geladen …","Loading profile…"],["ÖFFENTLICHES WISHES-PROFIL","PUBLIC WISHES PROFILE"],["💝 Öffentliche Wünsche ansehen","💝 View public wishes"],["Neue öffentliche Wunschwelten gefolgter Profile, neue Follower und Likes auf deine Sammlungen – alles aus den vorhandenen Community-Daten.","New public wish lists from followed profiles, new followers and likes on your collections, all based on existing community data."],["🎀 Meine Reservierungen","🎀 My reservations"],["Alle Aufgaben verwalten ↗","Manage all tasks ↗"],["🌈 Weitere Sammlungen entdecken","🌈 Discover more collections"]];
 for(const [de,en] of pairs){assert.equal(wishesText(de,'en'),en);assert.equal(wishesText(en,'de'),de)}
 const {document}=parseHTML('<html><body><main><a data-wish-copy href="discover.html">Meine Merkliste öffnen ↗</a><p data-wish-copy>Entdecke öffentliche Sammlungen, lerne ihre Ersteller kennen und finde neue Geschenkideen. Private Sammlungen werden nicht angezeigt.</p><div data-user-content><a data-wish-copy>Meine Merkliste öffnen ↗</a></div></main></body></html>');
 applyWishLocale(document,'en');assert.equal(document.querySelector('main > a').textContent,'Open my bookmarks ↗');assert.equal(document.querySelector('main > a').getAttribute('href'),'discover.html');
 assert.equal(document.querySelector('[data-user-content] a').textContent,'Meine Merkliste öffnen ↗');
 applyWishLocale(document,'de');assert.equal(document.querySelector('main > a').textContent,'Meine Merkliste öffnen ↗');
});

test('Wishes notifications, occasions and community metadata translate reversibly',()=>{
 const pairs=[["🌈 Weitere Wunschwelten","🌈 More wish lists"],["🏠 Mein Feed","🏠 My feed"],["Neu seit Besuch","New since last visit"],["Termine werden geladen …","Loading dates…"],["Anlässe","Occasions"],["Privat · Mein Überblick","Private · My overview"],["Benachrichtigungen werden geladen …","Loading notifications…"],["Für wen?","For whom?"],["Anlässe filtern","Filter occasions"],["Deine Social-Zahlen","Your social metrics"]];
 for(const [de,en] of pairs){assert.equal(wishesText(de,'en'),en);assert.equal(wishesText(en,'de'),de)}
 const {document}=parseHTML('<html><body><section><span data-wish-copy>Neu seit Besuch</span><p data-wish-copy>Benachrichtigungen werden geladen …</p><input placeholder="Für wen?" value="private name"><div data-user-content><span data-wish-copy>Neu seit Besuch</span></div></section></body></html>');
 applyWishLocale(document,'en');assert.equal(document.querySelector('section > span').textContent,'New since last visit');
 assert.equal(document.querySelector('section > p').textContent,'Loading notifications…');
 assert.equal(document.querySelector('input').getAttribute('placeholder'),'For whom?');assert.equal(document.querySelector('input').value,'private name');
 assert.equal(document.querySelector('[data-user-content] span').textContent,'Neu seit Besuch');
 applyWishLocale(document,'de');assert.equal(document.querySelector('section > span').textContent,'Neu seit Besuch');
});

test('notification and social feed presentation text is reversible, titles are not translated',()=>{
 const pairs=[
  ['🌈 Neue Wunschwelt: ','🌈 New wish list: '],
  ['👥 Jemand folgt dir','👥 Someone follows you'],
  ['❤️ Like auf: ','❤️ Like on: '],
  ['Dein Profil hat einen neuen Follower.','Your profile has a new follower.'],
  ['Als gelesen markieren','Mark as read'],
  [' ungelesen (geladen)',' unread (loaded)'],
  ['Neue öffentliche Sammlungen der Profile, denen du folgst.','New public collections from profiles you follow.'],
  ['Noch keine gemerkten Sammlungen. Öffne Entdecken und tippe auf „Merken“.','No bookmarked collections yet. Open Discover and select “Save”.'],
  ['Titelbild der Sammlung: ','Collection cover image: ']
 ];
 for(const [de,en] of pairs){assert.equal(wishesText(de,'en'),en);assert.equal(wishesText(en,'de'),de)}
 assert.equal(wishesText('Private custom list title','en'),'Private custom list title');
 const notification=readFileSync(new URL('../../tools/wishes/notifications.mjs',import.meta.url),'utf8');
 const feed=readFileSync(new URL('../../tools/wishes/social-feed.mjs',import.meta.url),'utf8');
 assert.match(notification,/ui\('🌈 Neue Wunschwelt: '\)\+item\.title/);
 assert.match(notification,/ui\('❤️ Like auf: '\)\+item\.title/);
 assert.match(notification,/document\.addEventListener\('toolya:wishes-locale-change'/);
 assert.match(feed,/img\.alt=ui\('Titelbild der Sammlung: '\)\+\(item\.title/);
 assert.match(feed,/document\.addEventListener\('toolya:wishes-locale-change'/);
 assert.match(feed,/title\.textContent=item\.title/);
});

test('Wishes task report copy translates in both directions while keeping private event titles untouched',()=>{
 const pairs=[["Historisch nicht zugeordnet","Historically unassigned"],["Noch keine protokollierten Monate.","No recorded months yet."],[" Erledigungen · "," completions · "],[" Terminverschiebungen · "," rescheduled dates · "],[" Wiedereröffnungen"," reopenings"],["Noch keine protokollierten Anlassdaten.","No recorded occasion data yet."],["Ohne im Ereignis gespeicherte Anlasszuordnung.","No occasion assignment recorded in this event."],["Sobald echte Ereignisse vorliegen, erscheinen hier datengestützte Hinweise.","Data-based insights will appear here once actual events have been recorded."],["Planungsfenster prüfen","Review planning window"],["Es wurden ","There were "],[" Terminverschiebungen und "," date changes and "],[" Erledigungen protokolliert. Frühere Starttermine können helfen."," completions recorded. Earlier start dates may help."],["Erledigungen sichtbar machen","Review completed tasks"],[" Erledigungsereignisse dokumentiert. Nutze die Monatsübersicht, um deine tatsächliche Aktivität zu vergleichen."," completion events recorded. Use the monthly view to compare actual activity."],["Mehr Verlauf sammeln","Collect more history"],["Für belastbare Monatstrends sind bislang weniger als zwei Monate mit protokollierten Ereignissen vorhanden.","Fewer than two months of recorded events are currently available for reliable monthly trends."],["Monate vergleichen","Compare months"],[" Erledigungen; "," completions; "],[". Der Vergleich beschreibt Aktivität, keine Erfolgsquote aller Aufgaben.",". This comparison shows activity, not the completion rate of all tasks."],["Eigene protokollierte Aufgabenereignisse als JSON-Datei auf diesem Gerät speichern? Die Datei enthält private Aufgabentitel und Zeitpunkte.","Save your recorded task events as a JSON file on this device? The file contains private task titles and timestamps."],["Ereignisse vom ","Events from "],[" bis "," to "],[". Bericht erstellt am ",". Report generated on "],["Noch keine Ereignisse seit Aktivierung des Protokolls. Es werden keine früheren Änderungen geschätzt.","No events since logging was enabled. Earlier changes are not estimated."],["Erledigungsereignisse","Completion events"],["Tatsächlich serverseitig protokolliert.","Actually recorded on the server."],["Wiedereröffnungen","Reopenings"],["Protokollierte Ereignisse","Recorded events"],["Durchschnittliche Verschiebung","Average rescheduling"],["Nicht berechenbar","Not available"],[" Tage"," days"],[" von "," of "],[" Ereignissen mit beiden Datumswerten."," events with both date values."],["Später geplant","Moved later"],["Früher geplant","Moved earlier"],["Unverändert / ohne Datumsvergleich","Unchanged / no date comparison"],[" Erledigungen"," completions"],[" Ereignisse"," events"],["Erledigungsereignisse im Vergleich zum Maximum der acht Wochen","Completion events compared with the eight-week maximum"],["Wieder geöffnet","Reopened"],["Status geändert","Status changed"],["Termin verschoben","Due date changed"],["Änderung","Change"],["ohne Datum","no date"],["Chronik auf die 200 neuesten Ereignisse begrenzt; Kennzahlen berücksichtigen alle geladenen Ereignisse.","Timeline limited to the latest 200 events; metrics include all loaded events."],["Privater Bericht bereit. Keine Produktivdaten geändert.","Private report ready. No production data changed."],["Bericht konnte nicht vollständig geladen werden. Bitte später erneut versuchen.","Could not load the full report. Try again later."]];
 for(const [de,en] of pairs){assert.equal(wishesText(de,'en'),en,de);assert.equal(wishesText(en,'de'),de,en)}
 const report=readFileSync(new URL('../../tools/wishes/gift-task-report.mjs',import.meta.url),'utf8');
 assert.match(report,/const ui=value=>wishesText/);
 assert.match(report,/document\.addEventListener\('toolya:wishes-locale-change'/);
 assert.match(report,/e\.task_title/);
 assert.match(report,/event_count:exportRows\.length,events:exportRows/);
 assert.match(report,/for\(const id of \['kpis','moves','weeks','events'\]\)/);
 assert.equal(wishesText('Private task named Erledigt','en'),'Private task named Erledigt');
});

test('Wishes private cockpit display copy is reversible and private task data remains untouched',()=>{
 const pairs=[["Offene Aufgaben","Open tasks"],["Überfällig","Overdue"],["Heute fällig","Due today"],["Heute gut aufgestellt","On track today"],["Keine offenen Aufgaben mit Fälligkeit bis heute.","No open tasks due by today."],["Seit ","Overdue by "],[" Tagen überfällig"," days past due"],[" · Priorität "," · Priority "],["hoch","high"],["mittel","medium"],["niedrig","low"],[". Empfehlung: ",". Recommendation: "],["Zuerst nachholen.","Catch up on this first."],["Heute einplanen.","Schedule for today."],["Keine kommenden Anlässe","No upcoming occasions"],["Du kannst in der Anlassverwaltung einen neuen Anlass anlegen.","Add an occasion in the occasion planner."],["Heute","Today"],[" Tage verbleibend"," days remaining"],[" · jährlich"," · yearly"],["Empfehlung: Planung jetzt beginnen.","Recommendation: Start planning now."],["Empfohlener Planungsstart: ","Suggested planning start: "],["Anlass öffnen","Open occasion"],[" aktuell nicht archivierten Aufgaben erledigt ("," currently unarchived tasks completed ("],[" %). Dieser Wert beschreibt den aktuellen Stand, keine historische Erledigungsquote."," %). This shows the current status, not a historical completion rate."],["Protokollierte Erledigungsereignisse","Recorded completion events"],["Protokollierte Terminverschiebungen","Recorded due-date changes"],["Historische Jahresabschlüsse","Historical year-end summaries"],["Abschluss ","Year-end summary "],[" von "," of "],[" Geschenken als verschenkt gespeichert"," gifts recorded as given"],[". Historischer Snapshot, nicht nachträglich verändert.",". Historical snapshot, not modified afterwards."],["Noch keine Abschlüsse","No year-end summaries yet"],["Historische Erkenntnisse werden erst nach ausdrücklich gespeicherten Jahresabschlüssen angezeigt.","Historical insights appear only after year-end summaries have been explicitly saved."],["Überfälliges priorisieren","Prioritise overdue tasks"],[" offene Aufgaben sind überfällig. Bearbeite zunächst die am höchsten priorisierten."," open tasks are overdue. Tackle the highest-priority tasks first."],["Geschenkplanung beginnen","Start gift planning"],["Mindestens ein Anlass liegt innerhalb der nächsten 21 Tage. Plane offene Aufgaben frühzeitig.","At least one occasion is within the next 21 days. Plan outstanding tasks early."],["Puffer prüfen","Review time buffers"],[" Terminverschiebungen gegenüber "," due-date changes compared with "],[" protokollierten Erledigungen. Ein früherer Start kann helfen."," recorded completions. An earlier start may help."],["Aus vergangenen Jahren lernen","Learn from previous years"],["Für ","For "],[" abgeschlossene Jahre liegen unveränderliche historische Snapshots vor. Details findest du in der Planungsassistenz."," completed years have immutable historical snapshots. Details are available in the planning assistant."],["Alles im Blick","All on track"],["Aktuell ergeben sich aus den gespeicherten Daten keine dringenden Empfehlungen.","No urgent recommendations arise from the stored data at present."],["Privates Planungscockpit geladen. Keine Daten geändert.","Private planning dashboard loaded. No data changed."],["Das Cockpit konnte nicht vollständig geladen werden. Bitte später erneut versuchen.","Could not fully load the dashboard. Try again later."]];
 for(const [de,en] of pairs){assert.equal(wishesText(de,'en'),en,de);assert.equal(wishesText(en,'de'),de,en)}
 const source=readFileSync(new URL('../../tools/wishes/gift-cockpit.mjs',import.meta.url),'utf8');
 assert.match(source,/const ui=value=>wishesText/);
 assert.match(source,/const locale=\(\)=>/);
 assert.match(source,/renderedSnapshot=\{tasks,occasions,closings,events\}/);
 assert.match(source,/document\.addEventListener\('toolya:wishes-locale-change'/);
 assert.match(source,/for\(const id of \['kpis','priorities','occasions','activity','history','tips'\]\)/);
 assert.match(source,/x\.t\.title/);
 assert.match(source,/x\.o\.title/);
 assert.equal(wishesText('A private task: Überfällig','en'),'A private task: Überfällig');
});

test('Wishes gift dashboard labels translate without changing saved gifts or priority persistence',()=>{
 const pairs=[
  ['Noch keine Geschenk-Checklisten angelegt.','No gift checklists created yet.'],
  ['Keine fälligen Aufgaben-Erinnerungen.','No task reminders due.'],
  ['Keine Anlässe in den nächsten 30 Tagen.','No occasions in the next 30 days.'],
  ['Keine offenen Geschenke für diese Priorität.','No pending gifts for this priority.'],
  ['Priorität für ','Priority for '],
  ['Priorität ändern','Change priority'],
  ['Geschenk bearbeiten ↗','Edit gift ↗'],
  ['Weitere ','Another '],
  [' Aufgaben findest du in der Geschenkplanung.',' tasks can be found in the gift planner.'],
  ['Aktuell keine Budgetüberschreitungen bei Anlässen mit festgelegtem Budget.','No budget overruns for occasions with a set budget at present.'],
  [' eigene Reservierungen, davon ',' own reservations, including '],
  [' mit deiner Geschenkplanung verknüpft.',' linked to your gift planner.']
 ];
 for(const [de,en] of pairs){assert.equal(wishesText(de,'en'),en,de);assert.equal(wishesText(en,'de'),de,en)}
 const source=readFileSync(new URL('../../tools/wishes/gift-dashboard.mjs',import.meta.url),'utf8');
 assert.match(source,/const ui=source=>wishesText/);
 assert.match(source,/new Intl.NumberFormat\(locale\(\)/);
 assert.match(source,/document\.addEventListener\('toolya:wishes-locale-change'/);
 assert.match(source,/if\(priorityWrites\)\{localeUpdatePending=true;return\}/);
 assert.match(source,/if\(!priorityWrites&&localeUpdatePending\)\{localeUpdatePending=false;render\(\)\}/);
 assert.match(source,/ui\(labels\[g\.status\]\)/);
 assert.match(source,/ui\(priority\[next\]\)/);
 assert.match(source,/g\.title/);
 assert.match(source,/o\.title/);
 assert.match(source,/\.update\(\{priority:next,updated_at:/);
 assert.equal(wishesText('Private wish: Keine Anlässe in den nächsten 30 Tagen.','en'),'Private wish: Keine Anlässe in den nächsten 30 Tagen.');
});

test('gift assistant dynamic task UI translates reversibly without mutating private task data',()=>{
 const pairs=[
  ['Noch keine protokollierten Aufgabenänderungen seit Aktivierung.','No task changes logged since activation.'],
  ['✓ Erledigt','✓ Completed'],
  ['↩ Wieder geöffnet','↩ Reopened'],
  ['Heute fällige erledigt','Due today, completed'],
  ['Offen/überfällig','Open/overdue'],
  ['Keine offenen Aufgaben in dieser Gruppe.','No open tasks in this group.'],
  ['Auf morgen verschieben','Move to tomorrow'],
  ['✓ Erledigt markieren','✓ Mark completed'],
  ['Neues Fälligkeitsdatum','New due date'],
  ['Datum bestätigt verschieben','Confirm due-date change'],
  ['Aufgabenverwaltung öffnen','Open task manager'],
  ['Aufgabe wurde zwischenzeitlich verändert. Bitte Seite neu laden.','The task was changed in the meantime. Reload the page.'],
  [' Tagen fällig',' days until due'],
  ['Bis Sonntag fällig','Due by Sunday']
 ];
 for(const [de,en] of pairs){assert.equal(wishesText(de,'en'),en,de);assert.equal(wishesText(en,'de'),de,en)}
 const source=readFileSync(new URL('../../tools/wishes/gift-assistant.mjs',import.meta.url),'utf8');
 assert.match(source,/const ui=text=>wishesText/);
 assert.match(source,/toLocaleDateString\(locale\(\)/);
 assert.match(source,/document\.addEventListener\('toolya:wishes-locale-change'/);
 assert.match(source,/if\(taskBusy\|\|checklistBusy\)\{localePending=true;return\}/);
 assert.match(source,/taskBusy=false;button.disabled=false;if\(localePending&&!checklistBusy\)/);
 assert.match(source,/\.eq\('user_id',taskUserId\)/);
 assert.match(source,/el\('h3',t\.title\)/);
 assert.match(source,/e\.task_title/);
 assert.equal(wishesText('Private task: Heute fällig','en'),'Private task: Heute fällig');
});

test('assistant task confirmations translate prompts but preserve the task name, dates and write contract',()=>{
 const pairs=[
  ['Aufgabe „','Task “'],
  ['“ wirklich als erledigt markieren?','”: mark as completed?'],
  ['“ wirklich auf ','”: move to '],
  [' verschieben?','?']
 ];
 for(const [de,en] of pairs){assert.equal(wishesText(de,'en'),en);assert.equal(wishesText(en,'de'),de)}
 const title='Private title / Benutzername',date='2026-12-04';
 const german='Aufgabe „'+title+'“ wirklich auf '+date+' verschieben?';
 const english=wishesText('Aufgabe „','en')+title+wishesText('“ wirklich auf ','en')+date+wishesText(' verschieben?','en');
 assert.equal(english,'Task “'+title+'”: move to '+date+'?');
 assert.equal(german,'Aufgabe „'+title+'“ wirklich auf '+date+' verschieben?');
 const source=readFileSync(new URL('../../tools/wishes/gift-assistant.mjs',import.meta.url),'utf8');
 assert.match(source,/if\(!window\.confirm\(confirmation\)\)return/);
 assert.match(source,/task\.title\+\(field==='status'/);
 assert.match(source,/new Intl\.NumberFormat\(locale\(\)/);
 assert.match(source,/\.update\(\{\[field\]:newValue,updated_at:/);
});

test('historical task status display is reversible while event codes and unknown values remain intact',()=>{
 for(const [de,en] of [['Offen','Open'],['In Arbeit','In progress'],['Erledigt','Done']]){
  assert.equal(wishesText(de,'en'),en);
  assert.equal(wishesText(en,'de'),de);
 }
 for(const file of ['gift-assistant.mjs','gift-task-report.mjs']){
  const source=readFileSync(new URL('../../tools/wishes/'+file,import.meta.url),'utf8');
  assert.match(source,/const taskStatusLabel=value=>value==='open'\?ui\('Offen'\)/);
  assert.match(source,/value==='in_progress'\?ui\('In Arbeit'\)/);
  assert.match(source,/value==='done'\?ui\('Erledigt'\):value\|\|'—'/);
  assert.match(source,/taskStatusLabel\(e\.old_status\).*taskStatusLabel\(e\.new_status\)/);
  assert.match(source,/e\.task_title/);
 }
 assert.equal(wishesText('Private event title: Offen','en'),'Private event title: Offen');
 assert.equal(wishesText('__proto__','en'),'__proto__');
});

test('Wishes occasion planning and checklist copy remains reversible without translating private data',()=>{
 const pairs=[
  ['Noch keine kommenden Anlässe erfasst.','No upcoming occasions recorded.'],
  ['💶 Unverbindlicher Budgetrichtwert: ','💶 Indicative budget benchmark: '],
  ['gespeicherten Anlassbudgets','saved occasion budgets'],
  ['historisch erfassten Geschenkausgaben','historically recorded gift spending'],
  ['💶 Noch kein belastbarer historischer Budgetrichtwert für diesen Anlass.','💶 No reliable historical budget benchmark for this occasion yet.'],
  ['✅ Checklistenempfehlung: ','✅ Suggested checklist: '],
  ['Versand-Checkliste (ca. 28 Tage Vorlauf)','Shipping checklist (about 28 days ahead)'],
  ['Standard-Checkliste (ca. 21 Tage Vorlauf)','Standard checklist (about 21 days ahead)'],
  ['Checkliste auswählen','Choose checklist'],
  ['Standard (21 Tage)','Standard (21 days)'],
  ['Versand (28 Tage)','Shipping (28 days)'],
  ['Kurzfristig (5 Tage)','Last minute (5 days)'],
  ['Ausgewählte Checkliste übernehmen','Apply selected checklist'],
  ['Bitte zuerst die Übernahme ausdrücklich bestätigen.','Explicitly confirm the import first.'],
  ['Übernahme läuft …','Import in progress…'],
  ['Übernahme fehlgeschlagen. Bitte Anmeldung und Anlass prüfen.','Import failed. Check the sign-in and occasion.'],
  ['Mit dem ersten Jahresabschluss starten','Start with your first year-end summary'],
  ['Checklisten frühzeitig starten','Start checklists early'],
  ['Historische Budgets aufbauen','Build historical budget data'],
  ['Budgethistorie nutzen','Use historical budget data']
 ];
 for(const [de,en] of pairs){assert.equal(wishesText(de,'en'),en,de);assert.equal(wishesText(en,'de'),de,en)}
 const privateOccasion='Geburtstag von Sophia — private note';
 assert.equal(wishesText(privateOccasion,'en'),privateOccasion);
 const translatedConfirmation=wishesText('Checkliste für „','en')+privateOccasion+wishesText('“ im Jahr ','en')+'2027'+wishesText(' jetzt erstellen?','en');
 assert.equal(translatedConfirmation,'Create checklist for “'+privateOccasion+'” in 2027 now?');
});
test('occasion planner locale changes preserve checklist controls and do not change RPC arguments',()=>{
 const source=readFileSync(new URL('../../tools/wishes/gift-assistant.mjs',import.meta.url),'utf8');
 assert.match(source,/function renderOccasionPlanning\(\)/);
 assert.match(source,/root\.replaceChildren\(\);tips\.replaceChildren\(\);calendarEvents=\[\]/);
 assert.match(source,/savedControls=new Map/);
 assert.match(source,/card\.dataset\.occasionId=String\(o\.id\)/);
 assert.match(source,/select\.value=savedControls\.get\(String\(o\.id\)\)\?\.template/);
 assert.match(source,/check\.checked=Boolean\(savedControls\.get\(String\(o\.id\)\)\?\.confirmed\)/);
 assert.match(source,/if\(taskBusy\|\|checklistBusy\)\{localePending=true;return\}/);
 assert.match(source,/if\(localePending&&!checklistBusy&&!taskBusy\)/);
 assert.match(source,/db\.rpc\('wishlist_create_occasion_checklist_year',\{p_occasion_id:o\.id,p_template:select\.value,p_year:new Date\(o\.next\)\.getUTCFullYear\(\)\}\)/);
 assert.match(source,/addCard\(root,o\.title,lines\)/);
 assert.match(source,/t\.title\|\|''/);
 assert.match(source,/toLocaleDateString\(locale\(\)/);
});
