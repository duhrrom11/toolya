import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {applyToolInterfaceLocale,translateToolDialog,translateAccountStatus} from '../../shared/toolya/i18n/interface.mjs';

test('auth sign-in, sign-out and validation shell are reversible without touching account data', () => {
 const {document} = parseHTML(`<html lang="de"><body>
 <section class="toolya-auth-status"><span class="toolya-auth-loading">Wir prüfen deine Anmeldung …</span><span class="toolya-auth-error">Deine Anmeldung konnte gerade nicht geprüft werden. Prüfe deine Internetverbindung und versuche es erneut.</span><button id="toolya-auth-retry" class="toolya-auth-error">Erneut versuchen</button><a href="../../wg-organisator/">Zur Anleitung</a></section>
 <header><a class="b3-brand" aria-label="Toolya Startseite">Toolya</a><button class="b3-settings-trigger" title="Einstellungen" aria-label="Einstellungen öffnen">⚙</button></header>
 <div id="settingsModal"><h3>⚙️ Einstellungen und Konto</h3><label for="auth-email">E-Mail-Adresse</label><input id="auth-email"><label for="auth-password">Passwort</label><input id="auth-password"><span id="header-user-email">real.user@example.org</span>
 <button onclick="supabaseLogin()">Anmelden</button><button onclick="supabaseRegister()">Registrieren</button><button onclick="supabaseLogout()">Abmelden</button><button class="w-full" onclick="toggleSettingsModal()">Schließen</button></div>
 </body></html>`);
 const email=document.querySelector('#auth-email');
 applyToolInterfaceLocale(document,'housemates','en');
 assert.equal(document.querySelector('[onclick="supabaseLogin()"]').textContent,'Sign in');
 assert.equal(document.querySelector('[onclick="supabaseRegister()"]').textContent,'Register');
 assert.equal(document.querySelector('[onclick="supabaseLogout()"]').textContent,'Sign out');
 assert.equal(document.querySelector('[for="auth-email"]').textContent,'Email address');
 assert.equal(document.querySelector('.b3-settings-trigger').getAttribute('aria-label'),'Open settings');
 assert.equal(document.querySelector('#header-user-email').textContent,'real.user@example.org');
 assert.equal(document.querySelector('#auth-email'),email,'input and event handler untouched');
 applyToolInterfaceLocale(document,'housemates','de');
 assert.equal(document.querySelector('[onclick="supabaseLogin()"]').textContent,'Anmelden');
 assert.equal(document.querySelector('[for="auth-email"]').textContent,'E-Mail-Adresse');
 assert.equal(document.querySelector('.b3-settings-trigger').getAttribute('title'),'Einstellungen');
 assert.equal(document.documentElement.lang,'de','still partial English localization');
});

test('baking navigation translation preserves the original click handlers',()=>{
 const {document}=parseHTML('<html><body><button id="btn-tab-rechner" onclick="openTab(\'rechner\')">🧮 Backform-Rechner</button><button id="btn-tab-rezepte" onclick="openTab(\'rezepte\')">📚 Meine Rezepte</button></body></html>');
 applyToolInterfaceLocale(document,'baking','en');
 assert.equal(document.querySelector('#btn-tab-rechner').textContent,'🧮 Cake pan calculator');
 assert.match(document.querySelector('#btn-tab-rechner').getAttribute('onclick'),/openTab/);
 applyToolInterfaceLocale(document,'baking','de');
 assert.equal(document.querySelector('#btn-tab-rechner').textContent,'🧮 Backform-Rechner');
});

test('extended form labels across four tools are reversible and preserve data and handlers', () => {
 const fixtures={
  moving:['Standort speichern','Save location'],
  housemates:['📅 Termin / Slot buchen','📅 Book event / slot'],
  plants:['Pflanze speichern','Save plant'],
  baking:['Mengen ausrechnen','Calculate quantities']
 };
 for(const [tool,[german,english]] of Object.entries(fixtures)){
  const {document}=parseHTML(`<html lang="de"><body><button onclick="preserveAction()">${german}</button><input id="private-value" value="fake-data"></body></html>`);
  const button=document.querySelector('button');
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(button.textContent,english,tool);
  assert.equal(button.getAttribute('onclick'),'preserveAction()');
  assert.equal(document.querySelector('input').value,'fake-data');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(button.textContent,german);
 }
});


test('extended form localization is reversible and never changes input values or handlers',()=>{
 const examples=[
  ['moving','<input id="boxName" placeholder="Kisten-Name" value="Privat"><button onclick="closeScannerModal()">Scanner schließen</button>','#boxName','placeholder','Box name (e.g. Box #3)'],
  ['housemates','<input id="receiptTitle" placeholder="z. B. Miete" value="Miete"><button onclick="addShoppingItem()">Hinzufügen</button>','#receiptTitle','placeholder','e.g. detergent, rent, salary'],
  ['plants','<input id="plantName" placeholder="Name" value="Tomate"><button onclick="addSeedItem()">Hinzufügen</button>','#plantName','placeholder','Name (e.g. tomato)'],
  ['baking','<input id="recipe-name" placeholder="Rezeptname" value="Kuchen"><button onclick="calculateRecipe()">Mengen ausrechnen</button>','#recipe-name','placeholder','Recipe name (e.g. apple cake)']
 ];
 for(const [tool,html,selector,attribute,translation] of examples){
  const {document}=parseHTML('<html><body>'+html+'</body></html>');
  const field=document.querySelector(selector), original=field.getAttribute(attribute), value=field.value;
  const button=document.querySelector('button'), handler=button.getAttribute('onclick'),buttonLabel=button.textContent;
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(field.getAttribute(attribute),translation,tool);
  assert.equal(field.value,value,'input value preserved');
  assert.equal(button.getAttribute('onclick'),handler,'handler preserved');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(field.getAttribute(attribute),original,'original placeholder restored');
  assert.equal(field.value,value,'input value remains untouched');
  assert.equal(button.textContent,buttonLabel,'original button restored');
 }
});

test('native dialog localization covers all four tools and preserves dynamic payloads',()=>{
 const samples=[
  ['moving','Bitte Standort eingeben!','Enter a location.'],
  ['housemates','Registrierung fehlgeschlagen: fake error','Registration failed: fake error'],
  ['plants','Ungültige Pflanzen-ID.','Invalid plant ID.'],
  ['baking','Timer abgelaufen!','Timer finished!']
 ];
 for(const [tool,de,en] of samples){
  assert.equal(translateToolDialog(tool,'en',de),en);
  assert.equal(translateToolDialog(tool,'de',de),de);
 }
 assert.equal(translateToolDialog('moving','en','Private box data'), 'Private box data');
 assert.equal(translateToolDialog('housemates','en','Registrierung fehlgeschlagen: fake@example.org'),
              'Registration failed: fake@example.org');
 assert.equal(translateToolDialog('baking','en',null),null);
});

test('English PDF labels are localized without modifying user records or export names',async()=>{
 const {readFile}=await import('node:fs/promises');
 const paths=['moving','housemates','plants'];
 for(const tool of paths){
  const html=await readFile(new URL(`../../tools/${tool}/index.html`,import.meta.url),'utf8');
  assert.match(html,/window\.__toolyaUILocale === ['"]en['"]/,'PDF language gate in '+tool);
  assert.match(html,/toLocaleDateString\(window\.__toolyaUILocale === 'en' \? 'en-GB' : 'de-DE'\)/,'PDF date format in '+tool);
 }
});

test('account status localization is reversible and never translates identity content',()=>{
 const cases=[
  ['Nicht angemeldet','Not signed in'],
  ['Status: Verbunden & Angemeldet','Status: Connected and signed in'],
  ['Status: Verbindung oder Sitzung nicht überprüfbar','Status: Unable to verify connection or session'],
  ['✅ Angemeldet – person@example.org','✅ Signed in – person@example.org']
 ];
 for(const [de,en] of cases){
  assert.equal(translateAccountStatus('en',de),en);
  assert.equal(translateAccountStatus('de',en),de);
 }
 assert.equal(translateAccountStatus('en','person@example.org'),'person@example.org');
});
test('static translation leaves nested children and their handlers intact',()=>{
 const {document}=parseHTML('<html><body><button id="btn-tab-rechner" onclick="openTab()"><svg id="icon" aria-hidden="true"></svg>🧮 Backform-Rechner</button></body></html>');
 const button=document.querySelector('button'),icon=document.querySelector('#icon');
 applyToolInterfaceLocale(document,'baking','en');
 assert.equal(document.querySelector('#icon'),icon);
 assert.equal(button.getAttribute('onclick'),'openTab()');
 applyToolInterfaceLocale(document,'baking','de');
 assert.equal(document.querySelector('#icon'),icon);
});

test('calculated baking and plant-care feedback has explicit DE/EN branches',async()=>{
 const {readFile}=await import('node:fs/promises');
 for(const [tool,phrases] of [
  ['baking',['Batter is much deeper','Batter is quite shallow','Ideal baking conditions','Use stevia concentrate','per slice at the edge']],
  ['plants',['Suggested watering amount','Enter valid, non-negative amounts','Total harvest:','% full']]
 ]){
  const html=await readFile(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  for(const phrase of phrases)assert.ok(html.includes(phrase),tool+': '+phrase);
  assert.match(html,/window\.__toolyaUILocale === ['"]en['"]/);
 }
});

test('dynamic empty states and labels are localized in each tool without touching stored fields',async()=>{
 const {readFile}=await import('node:fs/promises');
 const cases={
  moving:['No items recorded.','No locations added yet.','QR code for: '],
  housemates:['No upcoming events or slots.','No matching bookings.','No contracts added.','No members yet.','Edit member','Add new member','The household could not be loaded safely.'],
  plants:['No photos.','No plants added yet.'],
  baking:['Overall ratio','No saved recipes yet.']
 };
 for(const [tool,expected] of Object.entries(cases)){
  const html=await readFile(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  for(const translation of expected) assert.ok(html.includes(translation),tool+': '+translation);
 }
});

test('household inventory, savings and receipt editing localize display copy only',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const pairs=[
  ['Noch kein Inventar erfasst.','No inventory recorded yet.'],
  ["'Purchased' : 'Kauf'","Purchased"],
  ["'Current value' : 'Zeitwert'","Current value"],
  ["'Share' : 'Anteil'","Share"],
  ['Buchung bearbeiten','Edit transaction'],
  ['Buchung / WG-Kassenbon erfassen','Record transaction / receipt'],
  ['Buchung / Kassenbon speichern','Save transaction / receipt'],
  ['Noch keine Sparziele angelegt.','No savings goals yet.'],
  ["'Saved' : 'Gespart'","Saved"],
  ["'Goal' : 'Ziel'","Goal"],
  ["'+ Deposit' : '+ Einzahlen'","+ Deposit"]
 ];
 for(const [german,english] of pairs){
  assert.ok(html.includes(german),'German copy preserved: '+german);
  assert.ok(html.includes(english),'English copy present: '+english);
 }
 assert.match(html,/escapeUserHtml\(item\.title\)/,'inventory item names still escaped');
 assert.match(html,/escapeUserHtml\(g\.title\)/,'savings goal titles still escaped');
 assert.match(html,/editingReceiptId = id/,'receipt edit identity not replaced');
});

test('translated implicit option values stay stable and Backstudio copy is reversible',()=>{
 const {document}=parseHTML('<html><body><select><option>Gugelhupf</option><option value="round">Rund (Springform)</option></select><div id="bsui-app"><nav class="bsui-stepper" aria-label="Vier Schritte zum Backergebnis"><button class="bsui-step"><span>1</span><span>Form wählen</span></button></nav></div></body></html>');
 const [bundt,round]=document.querySelectorAll('option');
 const nav=document.querySelector('.bsui-stepper');
 applyToolInterfaceLocale(document,'baking','en');
 assert.equal(bundt.textContent,'Bundt');
 assert.equal(bundt.getAttribute('value'),'Gugelhupf');
 assert.equal(round.getAttribute('value'),'round');
 assert.equal(nav.getAttribute('aria-label'),'Four steps for resizing a recipe');
 assert.equal(nav.textContent,'1Choose a pan');
 applyToolInterfaceLocale(document,'baking','de');
 assert.equal(bundt.textContent,'Gugelhupf');
 assert.equal(bundt.getAttribute('value'),null);
 assert.equal(round.getAttribute('value'),'round');
 assert.equal(nav.textContent,'1Form wählen');
});

test('backup and safety dialogs use exact translations without altering unknown content',()=>{
 const cases=[
  ['moving','Backup importieren? Vorhandene Daten werden ersetzt.','Import backup? Existing data will be replaced.'],
  ['moving','Kamera-Zugriff fehlgeschlagen oder nicht unterstützt.','Camera access failed or is not supported.'],
  ['housemates','Cloud-Daten neu laden? Nicht synchronisierte lokale Änderungen können verloren gehen.','Reload cloud data? Unsynced local changes may be lost.'],
  ['housemates','Speicherkonflikt: Die WG wurde andernorts geändert. Lokale Änderungen bleiben erhalten; bitte vor dem Neuladen sichern.','Save conflict: The household was changed elsewhere. Local changes are kept; back them up before reloading.'],
  ['housemates','Bitte mindestens Titel, Datum und Betrag angeben!','Enter at least a title, date and amount.'],
  ['plants','⚠️ Pflanze wirklich löschen?','⚠️ Delete this plant?'],
  ['plants','Ungültige Pflanzen-ID. Die Änderungen wurden nicht gespeichert.','Invalid plant ID. Changes were not saved.']
 ];
 for(const [tool,de,en] of cases){
  assert.equal(translateToolDialog(tool,'en',de),en);
  assert.equal(translateToolDialog(tool,'de',de),de);
 }
 for(const tool of ['moving','housemates','plants']){
  assert.equal(translateToolDialog(tool,'en','Person@example.org'),'Person@example.org');
  assert.equal(translateToolDialog(tool,'en','Unrecognized server failure'),'Unrecognized server failure');
 }
});

test('household access dialogs retain ownership and membership identifiers while localizing warnings',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const sourceEnglish=[
  'Copy the older household to a new account-protected storage area?',
  'Currently authorized user IDs:',
  'Revoke access for ',
  'Grant editing access to ',
  'The link alone does not grant access.',
  'Remove "${mates[idx].vorname}" from the household?'
 ];
 for(const message of sourceEnglish)assert.ok(html.includes(message),'missing localized permission copy: '+message);
 assert.match(html,/existing\.join\('\\n'\)/,'member IDs still assembled from existing records');
 assert.match(html,/memberId \+ '\?'/,'confirmation keeps targeted member ID');
 assert.match(html,/mates\[idx\]\.vorname/,'contact name kept in confirmation');
 const exact=[
  ['Hinweis: Diese ältere WG verwendet einen ungeschützten Link-Speicher. Wer die WG-ID kennt, kann die Daten möglicherweise lesen oder verändern. Für neue WGs steht geschützter Kontospeicher zur Verfügung.','Notice: This older household uses unprotected link-based storage. Anyone who knows the household ID may be able to read or change the data. Protected account storage is available for new households.'],
  ['Es muss mindestens ein Mitglied in der WG verbleiben!','At least one household member must remain.'],
  ['Ungültige Benutzer-ID. Das Mitglied muss sich zuerst registrieren.','Invalid user ID. The member must register first.']
 ];
 for(const [de,en] of exact)assert.equal(translateToolDialog('housemates','en',de),en);
});

test('planting plots and gallery expose localized display labels without changing plant records',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/plants/index.html',import.meta.url),'utf8');
 for(const phrase of [
  'Companion planting tip:', 'Grows well alongside',
  "'Plot' : 'Feld'", "'+ Assign' : '+ Belegen'",
  "type 'clear' to empty", "input.toLowerCase() === 'clear'",
  "'Plant photo' : 'Pflanzenfoto'", "'Photo' : 'Foto'"
 ]) assert.ok(html.includes(phrase),'missing translated plant display: '+phrase);
 assert.match(html,/escapeHtml\(p\.name\)/,'plant names remain escaped in grid');
 assert.match(html,/match\.gute\.join/,'companion plant recommendations still use original data');
 assert.match(html,/match\.schlechte\.join/,'avoidance recommendations still use original data');
 assert.match(html,/input\.toLowerCase\(\) !== 'leer'/,'existing German clear command preserved');
});

test('seasonal garden calendar has all 12 English months and updates on DE/EN changes',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/plants/index.html',import.meta.url),'utf8');
 const start=html.indexOf('const gartenKalender = {');
 const end=html.indexOf('const mischkulturDb =',start);
 assert.ok(start>0 && end>start,'seasonal calendar code is present');
 const output={textContent:''},handlers={};
 const context={
  window:{__toolyaUILocale:'de'},
  plantsCloudReady:false,
  document:{
   getElementById:id=>id==='calendarTodoText'?output:null,
   addEventListener:(name,fn)=>{handlers[name]=fn;}
  },
  Date:class{getMonth(){return 0;}}
 };
 createContext(context);
 runInContext(html.slice(start,end),context);
 assert.equal(typeof handlers['toolya:locale-change'],'function');
 assert.equal(context.window.__toolyaUILocale,'de');
 for(let month=0;month<12;month++){
  context.window.__toolyaUILocale='de';
  runInContext('renderGardenCalendar('+month+')',context);
  assert.match(output.textContent,/^(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember):/);
  context.window.__toolyaUILocale='en';
  runInContext('renderGardenCalendar('+month+')',context);
  assert.match(output.textContent,/^(January|February|March|April|May|June|July|August|September|October|November|December):/);
 }
 context.window.__toolyaUILocale='en';
 handlers['toolya:locale-change']();
 assert.match(output.textContent,/^January:/,'language event refreshes current month');
 context.window.__toolyaUILocale='de';
 handlers['toolya:locale-change']();
 assert.match(output.textContent,/^Januar:/,'language toggle restores German copy');
 assert.match(html,/renderGardenCalendar\(month\)/,'initial cloud boot uses localized renderer');
});

test('baking outputs translate presentation without changing saved recipe names or values',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/baking/index.html',import.meta.url),'utf8');
 for(const phrase of [
  'Equivalent pans for a', 'Approximately equivalent to',
  'springform pan', 'small springform pans', 'Untitled recipe',
  "'Factor' : 'Faktor'", "eggs === 1 ? 'egg' : 'eggs'",
  "'Delete' : 'Löschen'", "'Baking notes:' : 'Geling-Protokoll / Notiz:'",
  'bake 5 minutes less next time'
 ]) assert.ok(html.includes(phrase),'missing localized baking display: '+phrase);
 assert.match(html,/const name = document\.getElementById\('recipe-name'\)\.value \|\| 'Unbenanntes Rezept'/);
 assert.match(html,/saveRecipeToStorage\(name, rawText, factor\)/,'original persistence values retained');
 assert.match(html,/escapeRecipeHtml\(displayName\)/,'display name is HTML escaped');
 assert.match(html,/escapeRecipeHtml\(r\.note\)/,'user notes are HTML escaped');
 assert.match(html,/escapeRecipeHtml\(r\.date\)/,'saved dates unchanged');
});

test('plant card watering states and accessible controls localize without modifying records',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/plants/index.html',import.meta.url),'utf8');
 for(const text of [
  'Check watering date', "'Overdue' : 'Überfällig'",
  "'Due in' : 'Fällig in'", "'Diary' : 'Tagebuch'",
  "'Photo of plant' : 'Foto der Pflanze'",
  "'Water every' : 'Gießen: alle'", "'💧 Water' : '💧 Gießen'",
  "'Harvest' : 'Ernte'", "'Gallery' : 'Galerie'", "'Edit' : 'Bearbeiten'"
 ])assert.ok(html.includes(text),'missing translated plant card: '+text);
 assert.match(html,/if \(plantsCloudReady\) renderApp\(\)/,'switching locale rerenders cards only when cloud data is ready');
 assert.ok(html.includes('? `<span class="text-[10px] bg-gray-100'), 'missing-date label uses interpolated template');
 assert.match(html,/escapeHtml\(p\.name\)/,'plant name escaped');
 assert.match(html,/escapeHtml\(p\.interval\)/,'watering interval escaped');
 assert.match(html,/escapeHtml\(p\.note\)/,'plant note escaped');
 assert.match(html,/escapeHtml\(d\.text\)/,'diary content escaped');
});

test('baking timer phase labels are localized without mutating timer state',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/baking/index.html',import.meta.url),'utf8');
 const start=html.indexOf('function updateTimerDisplay() {');
 const end=html.indexOf('// Initialisierung beim Laden',start);
 assert.ok(start>0 && end>start);
 const elements={ 'timer-phase-title':{innerText:''},'timer-display':{innerText:''} };
 const handlers={};
 const context={
  window:{__toolyaUILocale:'en'},
  document:{getElementById:id=>elements[id],addEventListener:(name,fn)=>handlers[name]=fn},
  timerPhases:[{title:'Phase 1: Teig gehen lassen / Kühlen'},{title:'Phase 2: Backen im Ofen'},{title:'Phase 3: Auskühlen in der Form'}],
  currentPhaseIdx:1,timeLeft:125,bakingCloudReady:false,calculationRefreshCount:0,
  calculateAll:()=>{context.calculationRefreshCount++;},renderSavedRecipes:()=>{throw Error('Unexpected cloud render');}
 };
 createContext(context);runInContext(html.slice(start,end),context);
 runInContext('updateTimerDisplay()',context);
 assert.equal(elements['timer-phase-title'].innerText,'Phase 2: Bake in the oven');
 assert.equal(elements['timer-display'].innerText,'02:05');
 context.window.__toolyaUILocale='de';
 handlers['toolya:locale-change']();
 assert.equal(elements['timer-phase-title'].innerText,'Phase 2: Backen im Ofen');
 assert.equal(elements['timer-display'].innerText,'02:05');
 assert.equal(context.timerPhases[1].title,'Phase 2: Backen im Ofen');
 assert.equal(context.timeLeft,125);
 assert.equal(context.calculationRefreshCount,1,'language switch refreshes derived baking calculations');
 context.window.__toolyaUILocale='en';
 for(const [index,title] of ['Phase 1: Let dough rise / chill','Phase 2: Bake in the oven','Phase 3: Cool in the pan'].entries()){
  context.currentPhaseIdx=index;
  runInContext('updateTimerDisplay()',context);
  assert.equal(elements['timer-phase-title'].innerText,title);
 }
});

test('moving box cards localize status and actions without changing stored box fields',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/moving/index.html',import.meta.url),'utf8');
 const expected=[
  "'Location' : 'Standort'", "'✏️ Edit' : '✏️ Bearbeiten'",
  "'🗑️ Delete' : '🗑️ Löschen'",
  "'Enlarge box photo' : 'Kistenfoto vergrößern'",
  "'Photo of moving box' : 'Foto der Umzugskiste'",
  "'No image' : 'Kein Bild'", "'Lent to' : 'Ausgeliehen an'",
  "'🤝 Lent' : '🤝 Ausgeliehen'", "'⚠️ Expired' : '⚠️ Ablauf'",
  "'No description' : 'Keine Beschreibung'",
  "'Contents' : 'Inhalt'", "'Value' : 'Wert'",
  "'Expires' : 'Ablauf'", "'No matching boxes at this location.'",
  "'No matching entries found.'", "'Detected' : 'Erkannt'"
 ];
 for(const label of expected)assert.ok(html.includes(label),'missing English box-card translation: '+label);
 assert.match(html,/document\.addEventListener\('toolya:locale-change', \(\) => \{/);
 assert.match(html,/if \(document\.getElementById\('inventoryContainer'\)\) renderInventory\(\)/);
 assert.match(html,/const subItemsText = b\.subItems/,'subitems still sourced from existing box records');
 assert.match(html,/const isLent = b\.lentTo/,'lending status still uses existing data');
 assert.match(html,/const isExpired = b\.expiry/,'expiry status still uses existing data');
});

test('PDF filenames follow selected language while retaining German names and export data paths',async()=>{
 const {readFile}=await import('node:fs/promises');
 const paths={
  moving:['moving-box-inventory-report.pdf','kisten-inventar-report.pdf'],
  plants:['plant-garden-report.pdf','pflanzen-report.pdf'],
  housemates:['household-finance-report','haushaltsbericht']
 };
 for(const [tool,[english,german]] of Object.entries(paths)){
  const html=await readFile(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  assert.ok(html.includes(english),tool+': English filename');
  assert.ok(html.includes(german),tool+': German filename retained');
  const saveLine=html.split('\n').find(line=>line.includes('doc.save(') && line.includes(english));
  assert.ok(saveLine && saveLine.includes("window.__toolyaUILocale === 'en'"),tool+': filename is locale-specific');
  assert.match(html,/const doc = await createExportPdf\(\)/,tool+': export still uses shared PDF helper');
 }
 const household=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 assert.match(household,/new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/,'household export preserves date suffix');
});

test('seed age warnings and inventory modals localize display only',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/plants/index.html',import.meta.url),'utf8');
 for(const phrase of [
  'Check harvest year','Future harvest year','Germination rate may be low',
  "'✅ Good' : '✅ Gut'","'Harvested' : 'Ernte'",
  "'🛒 Buy again' : '🛒 Neu kaufen'",
  "'No seeds in stock.' : 'Kein Saatgut im Lager.'",
  "'🛒 Reorder' : '🛒 Nachbestellen'",
  "'Inventory is empty.' : 'Lager ist leer.'"
 ])assert.ok(html.includes(phrase),'missing localized seed or inventory display: '+phrase);
 assert.match(html,/escapeHtml\(s\.name\)/,'seed names are HTML-escaped');
 assert.match(html,/escapeHtml\(s\.year\)/,'harvest years are HTML-escaped');
 assert.match(html,/escapeHtml\(item\.name\)/,'stored inventory item names are HTML-escaped');
 assert.match(html,/encodeURIComponent\(String\(s\.name/,'search queries still use source seed name');
 assert.match(html,/if \(plantsCloudReady && !document\.getElementById\('seedsModal'\)\?\.classList\.contains\('hidden'\)\) renderSeedList\(\)/);
 assert.match(html,/if \(plantsCloudReady && !document\.getElementById\('inventoryModal'\)\?\.classList\.contains\('hidden'\)\) renderInventoryList\(\)/);
});

test('household finance accessibility labels and settlements localize without changing calculations',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 for(const phrase of [
  "'No expenses' : 'Keine Ausgaben'",
  "'Income: ' : 'Einnahmen: '",
  "'; Expenses: ' : '; Ausgaben: '",
  "'; Balance: ' : '; Saldo: '",
  "'✨ All debts settled!' : '✨ Alle Schulden ausgeglichen!'",
  "'to' : 'an'",
  "'✕ Delete' : '✕ Löschen'"
 ])assert.ok(html.includes(phrase),'missing household translation: '+phrase);
 assert.match(html,/formatChartAmount\(totalIncome - totalExpense\)/,'balance calculation preserved');
 assert.match(html,/totalVolume \+= s\.amount/,'settlement totals preserved');
 assert.match(html,/escapeUserHtml\(s\.from\)/,'debtor names still HTML escaped');
 assert.match(html,/escapeUserHtml\(s\.to\)/,'creditor names still HTML escaped');
 assert.match(html,/categoryChartInstance\.data\.labels = catLabels\.length/,'chart still uses source categories');
 assert.match(html,/removeFlatmateContact\(\$\{idx\}\)/,'member action still targets original index');
});

test('household shopping, cleaning, notes and Wi-Fi feedback keep stored content intact',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const pairs=[
  ['Cleaning schedule is empty.','Putzplan ist leer.'],
  ['Shopping list is empty.','Einkaufsliste ist leer.'],
  ['purchased','gekauft'],
  ['🧾 Record expense','🧾 Buchen'],
  ['🛒 Ingredients','🛒 Zutaten'],
  ['The noticeboard is empty. Create your first sticky note!','Die Pinnwand ist noch leer. Erstelle die erste Sticky Note!'],
  ['Today','Heute'],
  ['No Wi-Fi network name provided.','Kein WLAN-Name angegeben.'],
  ['QR code creation cancelled.','QR-Erstellung abgebrochen.']
 ];
 for(const [en,de] of pairs){
  assert.ok(html.includes(en),'missing English translation '+en);
  assert.ok(html.includes(de),'missing German original '+de);
 }
 assert.match(html,/escapeUserHtml\(item\.title\)/,'shopping item names remain HTML-escaped');
 assert.match(html,/escapeUserHtml\(n\.content\)/,'sticky note content remains HTML-escaped');
 assert.match(html,/safeInlineId\(item\.id\)/,'shopping IDs still pass through safe inline encoding');
 assert.match(html,/const wifiString = 'WIFI:T:WPA;S:'/,'Wi-Fi QR payload format remains unchanged');
 assert.match(html,/const price = parseFloat\(prompt\(/,'expense recording keeps original price input');
});

test('household batch localizes OCR, meal planning and savings without changing persisted keys',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const expected=[
  '🔍 Scanning receipt…','❌ Text recognition failed.','✏️ Edit sticky note',
  "'By' : 'Von'","'mo' : 'Mo'",
  "'Diet' : 'Ernährung'","'Allergies' : 'Allergien'",
  'Who paid for','Purchase price (€):',"'Unassigned' : 'Frei'",
  "'Dish' : 'Gericht'","'Ingredients (comma-separated)' : 'Zutaten (kommagetrennt)'",
  'Deposit into savings goal',"'n/a' : 'k.A.'",
  "'Omnivore' : info.pref","'None' : info.allergy",
  "'en-GB' : 'de-DE'"
 ];
 for(const phrase of expected)assert.ok(html.includes(phrase),'missing translated household UI: '+phrase);
 assert.match(html,/worker = await library\.createWorker\('deu'\)/,'receipt OCR recognition language unchanged');
 assert.match(html,/const price = parseFloat\(prompt\(window\.__toolyaUILocale/,'shopping expense price still parsed');
 assert.match(html,/category: "Haushalt", entryType: "ausgabe"/,'original expense values preserved');
 assert.match(html,/<option value="Frei">/,'meal-plan sentinel preserved');
 assert.match(html,/p\.chef !== 'Frei'/,'meal assignment sentinel preserved');
 assert.match(html,/diets\[mate\] = \{ pref: input\.value\.trim\(\) \|\| "Allesesser", allergy: allergies\[idx\]\.value\.trim\(\) \|\| "Keine" \}/,'diet storage fallbacks preserved');
 assert.match(html,/goal\.current \+= amount/,'deposit still uses existing savings goal');
 assert.match(html,/escapeUserHtml\(ev\.owner\)/,'event owners remain escaped');
 assert.match(html,/escapeUserHtml\(info\.pref === 'Allesesser'/,'translated diet defaults remain escaped');
 assert.match(html,/escapeUserHtml\(info\.allergy === 'Keine'/,'translated allergy defaults remain escaped');
 assert.match(html,/info\.wifi \|\| \(window\.__toolyaUILocale/,'stored Wi-Fi description is not translated');
});

test('household locale refresh is gated on completed load and preserves unsaved forms',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 assert.match(html,/let householdReadyForLocaleRefresh = false/);
 assert.match(html,/renderApp\(\);\s*householdReadyForLocaleRefresh = true/);
 assert.match(html,/document\.addEventListener\('toolya:locale-change', \(\) => \{\s*if \(!householdReadyForLocaleRefresh\) return;\s*renderApp\(\);/);
 const region=html.slice(html.indexOf('// Presentation-only refresh'),html.indexOf('/* Storage Helper */'));
 assert.ok(!region.includes('saveData(') && !region.includes('speichereWGinCloud('),'locale switch never persists data');
 assert.ok(!region.includes('openCookingModal(') && !region.includes('openDietModal('),'locale switch does not reset unsaved modal inputs');
 assert.ok(html.includes("retry.textContent = window.__toolyaUILocale === 'en' ? 'Try again' : 'Erneut versuchen'"));
});

test('expanded static labels across four tools translate and reverse without changing option semantics',()=>{
 const cases=[
  ['moving','<select><option>-- Standort wählen --</option><option>🏢 Büro</option></select><button onclick="keep()">✕ Schließen</button>', ['-- Select location --','🏢 Office','✕ Close']],
  ['housemates','<h3>📶 Gäste-WLAN QR-Code</h3><label>Aufgabe / Bereich *:</label><select><option>🌿 Grün</option></select><button onclick="keep()">🖨️ Für Küche Drucken</button>', ['📶 Guest Wi-Fi QR code','Task / area *:','🌿 Green','🖨️ Print for kitchen']],
  ['plants','<h3>📖 Hilfe & Anleitungen</h3><select><option>Alle Standorte / Räume</option><option>Groß (20 cm ~ 600ml)</option></select>', ['📖 Help and guides','All locations / rooms','Large (20 cm ~ 600 ml)']],
  ['baking','<button onclick="keep()">⭕ Welche Backform passt? Formen-Finder öffnen</button><select><option>Xylit (ungefähr 1:1)</option><option>Erythrit (weniger süß)</option></select>', ['⭕ Which pan fits? Open pan finder','Xylitol (approximately 1:1)','Erythritol (less sweet)']]
 ];
 for(const [tool,html,expected] of cases){
  const {document}=parseHTML('<html lang="de"><body>'+html+'<input id="private" value="personal entry"></body></html>');
  const elements=[...document.querySelectorAll('h3,label,button,option')];
  const originals=elements.map(el=>el.textContent);
  const actions=[...document.querySelectorAll('button')].map(el=>el.getAttribute('onclick'));
  applyToolInterfaceLocale(document,tool,'en');
  assert.deepEqual(elements.map(el=>el.textContent),expected,tool+' translated text');
  assert.equal(document.querySelector('#private').value,'personal entry',tool+' retained form input');
  for(const option of document.querySelectorAll('option')){
   assert.equal(option.getAttribute('value'),originals[elements.indexOf(option)],tool+' original option value preserved');
  }
  applyToolInterfaceLocale(document,tool,'de');
  assert.deepEqual(elements.map(el=>el.textContent),originals,tool+' original labels restored');
  assert.deepEqual([...document.querySelectorAll('button')].map(el=>el.getAttribute('onclick')),actions,tool+' actions unchanged');
  for(const option of document.querySelectorAll('option'))assert.equal(option.hasAttribute('value'),false,tool+' implicit option value restored');
 }
});

test('household contact and planning placeholders keep entered data and restore source text',()=>{
 const ids=[
  ['invTitle','e.g. microwave, coffee machine'],
  ['goalTitle','e.g. holiday, deposit reserve'],
  ['mateVorname','First name *'],
  ['mateNachname','Last name / display name *'],
  ['mateEmail','Email address'],
  ['matePhone','WhatsApp / phone number'],
  ['mateInsta','Instagram (@handle)'],
  ['mateFb','Facebook profile URL / name'],
  ['cleanTaskTitle','e.g. clean the bathroom'],
  ['contractName','e.g. broadband, broadcasting fee']
 ];
 const {document}=parseHTML('<html><body>'+ids.map(([id])=>'<input id="'+id+'" placeholder="Original German text" value="User input">').join('')+'</body></html>');
 applyToolInterfaceLocale(document,'housemates','en');
 for(const [id,translation] of ids){
  const el=document.getElementById(id);
  assert.equal(el.getAttribute('placeholder'),translation);
  assert.equal(el.value,'User input');
 }
 applyToolInterfaceLocale(document,'housemates','de');
 for(const [id] of ids){
  assert.equal(document.getElementById(id).getAttribute('placeholder'),'Original German text');
  assert.equal(document.getElementById(id).value,'User input');
 }
});

test('Backstudio static source-owned controls reverse DE/EN without touching entered values',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const script=await readFile(new URL('../../tools/baking/backstudio.js',import.meta.url),'utf8');
 const start=script.indexOf('const staticBackstudioCopy = new Map(');
 const end=script.indexOf('function missingIngredients()',start);
 assert.ok(start>0&&end>start,'static source-owned translations are present');
 const {document}=parseHTML('<html><body><section id="toolya-backstudio"><h2>🍰 Toolya Backstudio</h2><article><h3>1 · Meine Backformen</h3><label>Typ<select id="pan"><option value="round">Rund</option><option value="rect">Rechteck</option></select></label><label>Breite bei Rechteck<input id="width" value="user input"></label><button id="save" onclick="keep()">Form speichern</button></article><article><p>Deine Liste bleibt auf diesem Gerät.</p></article><div data-user-content><p>Meine Backformen</p></div><p id="bs-message">Bereit.</p></section><input id="bs-shopping-custom" placeholder="z. B. Vanillezucker" value="Do not change"></body></html>');
 const context={document,window:{__toolyaUILocale:'en'}};
 context.el=id=>document.getElementById(id);
 context.langEn=()=>context.window.__toolyaUILocale==='en';
 context.ui=(de,en)=>context.langEn()?en:de;
 createContext(context);
 runInContext(script.slice(start,end)+'\nrenderBackstudioStaticCopy();',context);
 assert.equal(document.querySelector('h3').textContent,'1 · My baking pans');
 assert.equal(document.getElementById('pan').querySelector('option').textContent,'Round');
 assert.equal(document.getElementById('pan').querySelector('option').value,'round');
 assert.equal(document.getElementById('save').textContent,'Save pan');
 assert.equal(document.getElementById('bs-message').textContent,'Ready.');
 assert.equal(document.getElementById('save').getAttribute('onclick'),'keep()');
 assert.equal(document.getElementById('width').value,'user input');
 assert.equal(document.getElementById('bs-shopping-custom').value,'Do not change');
 assert.equal(document.querySelector('[data-user-content] p').textContent,'Meine Backformen');
 context.window.__toolyaUILocale='de';
 runInContext('renderBackstudioStaticCopy()',context);
 assert.equal(document.querySelector('h3').textContent,'1 · Meine Backformen');
 assert.equal(document.getElementById('save').textContent,'Form speichern');
 assert.equal(document.getElementById('bs-message').textContent,'Bereit.');
 assert.equal(document.getElementById('pan').querySelector('option').value,'round');
 assert.equal(document.getElementById('bs-shopping-custom').placeholder,'z. B. Vanillezucker');
});

test('Backstudio external runtime localizes calculations, shopping and scheduling without changing models',async()=>{
 const {readFile}=await import('node:fs/promises');
 const script=await readFile(new URL('../../tools/baking/backstudio.js',import.meta.url),'utf8');
 for(const phrase of [
  'No missing ingredients identified yet.', 'Your shopping list is empty.',
  'Backstudio shopping list exported as a text file.',
  'Choose a serving date and time.', 'Start preparation', 'Start baking',
  'No pans saved yet.', 'Warning: possible overfilling!',
  'Scaling factor at desired height:', 'Start checking after approx.',
  'Batter is within the specified fill limit', 'Your pantry supports up to',
  'Photo recognition unavailable', 'Baking notes saved on this device.',
  'toolya-backstudio-shopping-list.txt'
 ])assert.ok(script.includes(phrase),'missing English Backstudio runtime text: '+phrase);
 assert.match(script,/fmt=n=>Number\(n\)\.toLocaleString\(langEn\(\)\?'en-GB':'de-DE'/);
 assert.match(script,/const factor=\(\)=>target\(\)\/Math\.max\(orig\(\),1\)/,'pan conversion still uses original formula');
 assert.match(script,/const KEY='toolya_backstudio_v1'/,'original storage key remains');
 assert.match(script,/localStorage\.setItem\(KEY,JSON\.stringify\(data\)\)/,'original storage schema remains');
 assert.match(script,/document\.addEventListener\('toolya:locale-change'/);
 const listener=script.slice(script.lastIndexOf("document.addEventListener('toolya:locale-change'"));
 assert.ok(!listener.includes('save()')&&!listener.includes('localStorage.setItem'),'language change is read-only');
});

test('Backstudio affiliate notices and saved pan descriptions localize while identifiers stay stable',async()=>{
 const {readFile}=await import('node:fs/promises');
 const script=await readFile(new URL('../../tools/baking/backstudio.js',import.meta.url),'utf8');
 for(const phrase of [
  'Could not save on this device.', 'Advertisement – Amazon affiliate link',
  'Round Ø ', 'Rectangular ', 'Difference ', 'Volume transferred to the special pan calculator.',
  'Enter valid dimensions (maximum 40 pans).', "'en-GB':'de-DE'"
 ])assert.ok(script.includes(phrase),'missing localized Backstudio label: '+phrase);
 assert.match(script,/TAG='duhrrom-21'/,'affiliate tag unchanged');
 assert.match(script,/const KEY='toolya_backstudio_v1'/,'storage key unchanged');
 assert.match(script,/const pantryKey=i=>/,'original pantry key generation unchanged');
 assert.match(script,/data\.pans\.push\(\{shape,a,b\}\)/,'pan storage schema unchanged');
 assert.match(script,/localStorage\.setItem\(KEY,JSON\.stringify\(data\)\)/,'storage persistence unchanged');
 assert.match(script,/a\.rel='noopener noreferrer sponsored'/,'sponsored links still disclosed');
});

test('Backstudio Pro static controls and accessibility reverse without changing inputs or pan selection',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const script=await readFile(new URL('../../tools/baking/backstudio-pro.js',import.meta.url),'utf8');
 const start=script.indexOf('const proEn=()=>');
 const end=script.indexOf("const KEY='toolya_backstudio_v1'",start);
 assert.ok(start>0&&end>start,'pro translation helper exists');
 const {document}=parseHTML('<html><body><section id="toolya-backstudio"><section class="bsp-panel"><h4>Welche Form passt?</h4><p class="bsp-muted">Wähle eine Form, die zu deinem Teig passt.</p><label><span>Vergleichsziel</span><select id="bsp-compare-target"><option value="recipe">Rezeptmenge und Teighöhe</option><option value="mixed">Meine vorhandene Teigmenge</option></select></label><div class="bsp-actions"><button id="find" onclick="run()">Passende Formen finden</button></div><input id="bsp-recipe-text" value="1000.5 g flour" placeholder="Rezept oder Zutatenliste hier einfügen …"></section><div class="bsp-match"><strong>Welche Form passt?</strong></div><div id="bsp-3d"></div><p id="bsp-3d-status">Hier erscheint deine drehbare Backform.</p><p id="bsp-ocr-status">Wähle Kamera oder Foto.</p><video id="bsp-camera-video"></video><img id="bsp-photo-preview" alt="Dein ausgewähltes Rezeptfoto"></section></body></html>');
 const ctx={document,window:{__toolyaUILocale:'en'},$:id=>document.getElementById(id)};
 createContext(ctx);
 runInContext(script.slice(start,end)+'\nlocalizeProControls()',ctx);
 assert.equal(document.querySelector('.bsp-panel h4').textContent,'Which pan fits?');
 assert.equal(document.querySelector('.bsp-muted').textContent,'Choose a pan that fits your batter.');
 assert.equal(document.getElementById('find').textContent,'Find matching pans');
 assert.equal(document.getElementById('bsp-3d-status').textContent,'Your interactive baking pan appears here.');
 assert.equal(document.getElementById('bsp-ocr-status').textContent,'Choose camera or photo.');
 assert.equal(document.getElementById('find').getAttribute('onclick'),'run()');
 assert.equal(document.getElementById('bsp-compare-target').querySelector('option[value="recipe"]').getAttribute('value'),'recipe');
 assert.equal(document.querySelector('option').getAttribute('value'),'recipe');
 assert.equal(document.querySelector('option').textContent,'Recipe quantity and cake height');
 assert.equal(document.getElementById('bsp-recipe-text').value,'1000.5 g flour');
 assert.equal(document.querySelector('.bsp-match strong').textContent,'Welche Form passt?','dynamic user content stays untouched');
 assert.match(document.getElementById('bsp-3d').getAttribute('aria-label'),/Interactive 3D pan/);
 assert.equal(document.getElementById('bsp-photo-preview').alt,'Selected recipe photo');
 ctx.window.__toolyaUILocale='de';
 runInContext('localizeProControls()',ctx);
 assert.equal(document.querySelector('.bsp-panel h4').textContent,'Welche Form passt?');
 assert.equal(document.getElementById('find').textContent,'Passende Formen finden');
 assert.equal(document.getElementById('bsp-3d-status').textContent,'Hier erscheint deine drehbare Backform.');
 assert.equal(document.getElementById('bsp-ocr-status').textContent,'Wähle Kamera oder Foto.');
 assert.equal(document.getElementById('bsp-compare-target').querySelector('option[value="recipe"]').getAttribute('value'),'recipe');
 assert.equal(document.querySelector('option').textContent,'Rezeptmenge und Teighöhe');
 assert.equal(document.getElementById('bsp-recipe-text').value,'1000.5 g flour');
 assert.equal(document.getElementById('bsp-photo-preview').alt,'Dein ausgewähltes Rezeptfoto');
});

test('Backstudio Pro English recipe import preserves decimal quantities in the editable recipe',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const script=await readFile(new URL('../../tools/baking/backstudio-pro.js',import.meta.url),'utf8');
 const start=script.indexOf('function applyReviewed(){');
 const end=script.indexOf('function initCake(){',start);
 assert.ok(start>0&&end>start);
 const field={value:'',dispatchEvent:()=>{}};
 let calculations=0;
 const ctx={
  reviewed:[{qty:1000.5,unit:'g',name:'flour'},{qty:.75,unit:'l',name:'milk'}],
  proEn:()=>ctx.window.__toolyaUILocale==='en',
  proUi:(de,en)=>ctx.window.__toolyaUILocale==='en'?en:de,
  fmt:(n,d)=>Number(n).toLocaleString('de-DE',{maximumFractionDigits:d}),
  $:id=>id==='recipe-input'?field:null,
  Event:class{constructor(type,params){this.type=type;this.bubbles=params.bubbles}},
  window:{__toolyaUILocale:'en',calculateRecipe:()=>{calculations++}},
  status:()=>{}
 };
 createContext(ctx);runInContext(script.slice(start,end),ctx);
 runInContext('applyReviewed()',ctx);
 assert.equal(field.value,'1000.5 g flour\n0.75 l milk');
 assert.equal(calculations,1);
 ctx.window.__toolyaUILocale='de';
 runInContext('applyReviewed()',ctx);
 assert.equal(field.value,'1000,5 g flour\n0,75 l milk','German display retains its prior decimal representation');
 assert.equal(calculations,2);
 assert.equal(ctx.reviewed[0].qty,1000.5,'parsed quantity is never modified');
});

test('Backstudio Pro translates dynamic camera, 3D, cake and memory messages without changing algorithms',async()=>{
 const {readFile}=await import('node:fs/promises');
 const code=await readFile(new URL('../../tools/baking/backstudio-pro.js',import.meta.url),'utf8');
 const english=[
  'Loading the baking pan…','3D view: approx.','Add your baking pans first.',
  'Batter required ','this pan is too small!', 'Check quantity range: ',
  'Camera unavailable. Choose','Allow camera access.','Photo read. Check ingredients',
  'Could not read the photo. Try another one.','Recognized ingredients applied.',
  'Total frosting (outside + fillings): approx.','No notes found.','Delete this note?',
  'toolya-baking-notes.json'
 ];
 for(const label of english)assert.ok(code.includes(label),'missing translated pro output: '+label);
 assert.match(code,/Tesseract\.recognize\(img,'deu\+eng'\)/,'bilingual OCR model retained');
 assert.match(code,/const sourceFactor=\(\)=>desiredVolume\(\)\/Math\.max\(sourceVolume\(\),1\)/,'volume scaling formula preserved');
 assert.match(code,/const fillRatio=Math\.min\(1,Math\.max\(0,n\('bs-volume'/,'3D fill calculation preserved');
 assert.match(code,/const creamArea=outerArea\+perimeter\*total/,'cake frosting formula preserved');
 assert.match(code,/const KEY='toolya_backstudio_v1'/,'storage key unchanged');
 assert.match(code,/const write=data=>\{try\{localStorage\.setItem\(KEY,JSON\.stringify\(data\)\)/,'stored schema unchanged');
 assert.match(code,/document\.addEventListener\('toolya:locale-change'/,'language change supported');
 const part=code.slice(code.indexOf("document.addEventListener('toolya:locale-change'"),code.indexOf('// Default rating'));
 assert.ok(!part.includes('write(')&&!part.includes('localStorage.setItem'),'language switch does not save data');
});

test('Backstudio Pro translates already-visible runtime statuses while skipping missing status nodes',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const code=await readFile(new URL('../../tools/baking/backstudio-pro.js',import.meta.url),'utf8');
 const start=code.indexOf('const proEn=()=>');
 const end=code.indexOf('const proStaticCopy=',start);
 assert.ok(start>0&&end>start);
 const {document}=parseHTML('<html><body><p id="bsp-ocr-status">Waiting</p><p id="bsp-3d-status">Waiting</p></body></html>');
 const ctx={document,$:id=>document.getElementById(id),window:{__toolyaUILocale:'de'}};
 createContext(ctx);runInContext(code.slice(start,end),ctx);
 runInContext("document.getElementById('bsp-ocr-status').textContent=proUi('Foto wurde gelesen.','Photo was read.');",ctx);
 runInContext("document.getElementById('bsp-3d-status').textContent=proUi('Form wird geladen.','Pan is loading.');",ctx);
 ctx.window.__toolyaUILocale='en';
 runInContext('localizeProLiveStatuses()',ctx);
 assert.equal(document.getElementById('bsp-ocr-status').textContent,'Photo was read.');
 assert.equal(document.getElementById('bsp-3d-status').textContent,'Pan is loading.');
 ctx.window.__toolyaUILocale='de';
 runInContext('localizeProLiveStatuses()',ctx);
 assert.equal(document.getElementById('bsp-ocr-status').textContent,'Foto wurde gelesen.');
 assert.equal(document.getElementById('bsp-3d-status').textContent,'Form wird geladen.');
});

test('auth gates across all four tools translate their headings and account loading status reversibly',()=>{
 const cases=[
  ['moving','Umzugskisten','Moving boxes'],
  ['housemates','WG-Organisator','Roommate organizer'],
  ['plants','Pflanzenpflege','Plant care tracker'],
  ['baking','Backform-Rechner','Cake pan calculator']
 ];
 for(const [tool,german,english] of cases){
  const {document}=parseHTML('<html lang="de"><body><section class="toolya-auth-status"><p id="toolya-auth-title"><strong>'+german+'</strong></p><span class="toolya-auth-loading">Wir prüfen deine Anmeldung …</span><span class="toolya-auth-error">Deine Anmeldung konnte gerade nicht geprüft werden. Prüfe deine Internetverbindung und versuche es erneut.</span><button class="toolya-auth-error" id="toolya-auth-retry" onclick="reload()">Erneut versuchen</button><a href="../../guide/">Zur Anleitung</a></section><div id="cloud-status-text">Konto wird geprüft …</div><span id="header-user-email">personal@example.org</span></body></html>');
  const title=document.querySelector('#toolya-auth-title strong');
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(title.textContent,english,tool+' gate title');
  assert.equal(document.querySelector('.toolya-auth-loading').textContent,'Checking your sign-in…');
  assert.equal(document.querySelector('.toolya-auth-error:not(button)').textContent,'We could not verify your sign-in. Check your internet connection and try again.');
  assert.equal(document.getElementById('toolya-auth-retry').textContent,'Try again');
  assert.equal(document.getElementById('toolya-auth-retry').getAttribute('onclick'),'reload()');
  assert.equal(document.getElementById('cloud-status-text').textContent,'Konto wird geprüft …','static form translator never modifies live account status');
  assert.equal(document.getElementById('header-user-email').textContent,'personal@example.org');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(title.textContent,german);
  assert.equal(document.querySelector('.toolya-auth-loading').textContent,'Wir prüfen deine Anmeldung …');
  assert.equal(document.getElementById('toolya-auth-retry').textContent,'Erneut versuchen');
 }
});

test('account loading and signed-in status translations preserve user identity and reverse cleanly',()=>{
 const values=[
  ['Konto wird geprüft …','Checking your account…'],
  ['Konto wird geprüft ...','Checking your account...'],
  ['Lade...','Loading…'],
  ['Status: Verbunden','Status: Connected'],
  ['✅ Angemeldet – member@example.org','✅ Signed in – member@example.org']
 ];
 for(const [de,en]of values){
  assert.equal(translateAccountStatus('en',de),en);
  assert.equal(translateAccountStatus('de',en),de);
 }
 for(const untrusted of ['member@example.org','SessionExpiredError: key-123','Person Name','Konto wird geprüft … @user']){
  assert.equal(translateAccountStatus('en',untrusted),untrusted,'unrecognized identity or error is untouched');
 }
});

test('auth gate guide links respect selected locale and preserve original German targets',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../../shared/toolya/i18n/tool-entry.mjs',import.meta.url),'utf8');
 assert.match(source,/const authGuide=document\.querySelector\('\.toolya-auth-status > a'\)/);
 assert.match(source,/const originalAuthGuideHref=authGuide\?\.getAttribute\('href'\)/);
 assert.match(source,/if\(lang==='en'\)authGuide\.setAttribute\('href',settings\.guide\)/);
 assert.match(source,/else if\(originalAuthGuideHref!==null\)authGuide\.setAttribute\('href',originalAuthGuideHref\)/);
 assert.match(source,/authGuide\.lang=lang/);
 for(const [tool,german]of [
  ['moving','umzugskisten'],['housemates','wg-organisator'],
  ['plants','pflanzenpflege'],['baking','backform-rechner']
 ]){
  const html=await readFile(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  assert.match(html,new RegExp('class="toolya-auth-status"[\\s\\S]*?<a href="\\.\\./\\.\\./'+german+'/">Zur Anleitung</a>'),'German guide remains in the source');
 }
});

test('saved household redirect keeps explicitly requested DE/EN and does not forward unrelated query data',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const start=html.indexOf('const urlParams = new URLSearchParams(window.location.search);');
 const end=html.indexOf('// Supabase Konfiguration',start);
 assert.ok(start>0&&end>start);
 const script=html.slice(start,end);
 for(const [query,expected] of [
  ['?lang=en&utm_source=example','/tools/housemates/?id=savedWG123&lang=en'],
  ['?lang=de','/tools/housemates/?id=savedWG123&lang=de'],
  ['?lang=fr&utm_campaign=private','/tools/housemates/?id=savedWG123']
 ]){
  let redirected=null;
  const ctx={
   URLSearchParams,window:{location:{
    search:query,pathname:'/tools/housemates/',replace:url=>{redirected=url}
   }},
   localStorage:{getItem:key=>key==='wg_active_bin_id'?'savedWG123':null,setItem:()=>{throw Error('Unexpected local storage mutation')}},
   alert:()=>{throw Error('Unexpected validation alert')}
  };
  createContext(ctx);runInContext(script,ctx);
  assert.equal(redirected,expected);
 }
});

test('registration outcome messages require an actual auth session across three tools',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const pending='Anfrage verarbeitet. Falls eine Bestätigung erforderlich ist, prüfe dein E-Mail-Postfach und bestätige die Adresse. Melde dich danach an.';
 const ready='Angemeldet. Dein Konto ist einsatzbereit.';
 for(const [tool,method,nextMethod] of [
  ['moving','registerUser','loginUser'],
  ['plants','supabaseRegister','supabaseLogin'],
  ['baking','supabaseRegister','supabaseLogin']
 ]){
  const html=await readFile(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  const start=html.indexOf('async function '+method+'() {');
  const end=html.indexOf('async function '+nextMethod+'()',start);
  assert.ok(start>0&&end>start,tool+' registration function exists');
  const fragment=html.slice(start,end);
  for(const [session,expected] of [[null,pending],[{access_token:'opaque'},ready]]){
   const messages=[];
   const mockClient={auth:{signUp:async()=>({data:{session},error:null})}};
   const values={'loginEmail':'someone@example.org','loginPassword':'example','auth-email':'someone@example.org','auth-password':'example'};
   const ctx={
    document:{getElementById:id=>({value:values[id]||''})},
    window:{supabaseClient:mockClient},
    supabaseClient:mockClient,
    alert:msg=>messages.push(msg),
    updateUserDisplay:async()=>{},
    checkUserSession:async()=>{},
    closeSettings:()=>{}
   };
   createContext(ctx);
   runInContext(fragment,ctx);
   await runInContext(method+'()',ctx);
   assert.deepEqual(messages,[expected],tool+' message depends on a real session');
   assert.equal(mockClient.auth.signUp instanceof Function,true);
   assert.equal(translateToolDialog(tool,'en',expected),session?'Signed in. Your account is ready.':'Request processed. If confirmation is required, check your inbox and verify your email address, then sign in.');
  }
 }
});

test('sign-out errors across moving, plants and baking do not claim success or refresh the account',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 for(const [tool,method,next] of [
  ['moving','logoutUser','updateUserDisplay'],
  ['plants','supabaseLogout','checkUserSession'],
  ['baking','supabaseLogout','checkUserSession']
 ]){
  const html=await readFile(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  const start=html.indexOf('async function '+method+'() {');
  const end=html.indexOf('async function '+next+'()',start);
  assert.ok(start>0&&end>start,tool+': expected sign-out handler');
  const fragment=html.slice(start,end);
  for(const mode of ['success','result-error','throw']){
   const messages=[];let refreshed=0;
   const auth={
    signOut:async()=>{
     if(mode==='throw')throw Error('temporary failure');
     return mode==='result-error'?{error:{message:'temporary failure'}}:{error:null};
    }
   };
   const ctx={
    window:{supabaseClient:{auth}},
    supabaseClient:{auth},
    updateUserDisplay:()=>{refreshed++},
    checkUserSession:()=>{refreshed++},
    alert:message=>messages.push(message)
   };
   createContext(ctx);
   runInContext(fragment,ctx);
   await runInContext(method+'()',ctx);
   assert.equal(refreshed,mode==='success'?1:0,tool+' '+mode+': refresh only on success');
   assert.deepEqual(messages,mode==='success'&&tool!=='moving'?['Abgemeldet.']:mode==='success'?[]:['Abmeldung fehlgeschlagen: temporary failure'],tool+' '+mode+' feedback');
   if(mode!=='success')assert.equal(translateToolDialog(tool,'en',messages[0]),'Sign-out failed: temporary failure',tool+' English error prefix');
  }
 }
});

test('Backstudio Pro recommendations and saved shape labels localize without modifying source keys',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../../tools/baking/backstudio-pro.js',import.meta.url),'utf8');
 assert.match(source,/action\(row,proUi\('Diese Form nehmen','Use this pan'\)/);
 assert.match(source,/action\(row,proUi\('Beide nehmen','Use both pans'\)/);
 assert.match(source,/x\.shape&&proUi\('Form: ','Pan: '\)/);
 for(const key of ['round','rect','volume','muffin']){
  assert.ok(source.includes("'"+key+"':proUi("),'shape '+key+' uses a display-only translation');
 }
 assert.match(source,/state\.logs\[index\]\.favorite=!state\.logs\[index\]\.favorite/,'favorite flags still use original log entry');
 assert.match(source,/state\.logs\.splice\(index,1\)/,'delete still targets original log entry');
});

test('account verification distinguishes a missing session from temporary Supabase failures in three tools',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 for(const [tool,method,next] of [
  ['moving','updateUserDisplay','openSettings'],
  ['plants','checkUserSession','const gartenKalender'],
  ['baking','checkUserSession','openHelpFromMenu']
 ]){
  const html=await readFile(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  const start=html.indexOf('async function '+method+'() {');
  const end=html.indexOf(tool==='plants'?next:'function '+next+'()',start);
  assert.ok(start>0&&end>start,tool+': account status handler');
  const fragment=html.slice(start,end);
  for(const [mode,expected] of [
   ['connected','connected'],
   ['missing','signed-out'],
   ['missing-error','signed-out'],
   ['server-error','unavailable'],
   ['throw','unavailable']
  ]){
   const elements=new Map();
   const element=id=>{
    if(!elements.has(id))elements.set(id,{
     textContent:'',innerText:'',classList:{add:()=>{},remove:()=>{}}
    });
    return elements.get(id);
   };
   const client={auth:{getUser:async()=>{
    if(mode==='throw')throw Error('Network unavailable');
    if(mode==='server-error')return {data:null,error:{message:'Network unavailable'}};
    if(mode==='missing-error')return {data:null,error:{name:'AuthSessionMissingError'}};
    if(mode==='connected')return {data:{user:{email:'person@example.org'}},error:null};
    return {data:{user:null},error:null};
   }}};
   const ctx={
    document:{getElementById:element},supabaseClient:client,
    window:{supabaseClient:client,toolyaUiText:value=>translateAccountStatus('en',value)}
   };
   createContext(ctx);
   runInContext(fragment,ctx);
   await runInContext(method+'()',ctx);
   const status=tool==='moving'?element('cloudStatus').textContent:element('cloud-status-text').innerText;
   const english=expected==='connected'?(tool==='moving'?'✅ Signed in – person@example.org':tool==='plants'?'Status: Connected and signed in':'Status: Connected'):expected==='signed-out'?'Not signed in':'Status: Unable to verify connection or session';
   assert.equal(status,english,tool+' '+mode);
   const email=tool==='moving'?element('userInfo').textContent:tool==='plants'?element('cloud-user-display').innerText:element('cloud-user-email').innerText;
   if(expected==='connected')assert.ok(email.includes('person@example.org'));
   else assert.ok(!email.includes('person@example.org'),tool+' '+mode+': no stale identity shown');
  }
 }
});

test('authentication network failures are reported without claiming registration or login success',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 for(const [tool,register,login,logout] of [
  ['moving','registerUser','loginUser','logoutUser'],
  ['plants','supabaseRegister','supabaseLogin','supabaseLogout'],
  ['baking','supabaseRegister','supabaseLogin','supabaseLogout']
 ]){
  const html=await readFile(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  for(const [method,next,verb,prefix,translated] of [
   [register,login,'signUp','Registrierung fehlgeschlagen: ','Registration failed: '],
   [login,logout,'signInWithPassword','Anmeldung fehlgeschlagen: ','Sign-in failed: ']
  ]){
   const start=html.indexOf('async function '+method+'() {');
   const end=html.indexOf('async function '+next+'()',start);
   assert.ok(start>0&&end>start,tool+' '+method+' must exist');
   const fragment=html.slice(start,end);
   for(const message of ['Temporary network error',null]){
    const alerts=[];
    let successfulActions=0;
    const client={auth:{
     [verb]:async()=>{throw message?Error(message):{}}
    }};
    const data={
     loginEmail:'member@example.org',loginPassword:'password123',
     'auth-email':'member@example.org','auth-password':'password123'
    };
    const ctx={
     document:{getElementById:id=>({value:data[id]||''})},
     window:{supabaseClient:client,__toolyaUILocale:'de'},
     supabaseClient:client,
     alert:x=>alerts.push(x),
     updateUserDisplay:()=>{successfulActions++},
     checkUserSession:()=>{successfulActions++},
     closeSettings:()=>{successfulActions++},
     toggleSettingsModal:()=>{successfulActions++}
    };
    createContext(ctx);runInContext(fragment,ctx);
    await runInContext(method+'()',ctx);
    const expected=prefix+(message||'Unbekannter Fehler');
    assert.deepEqual(alerts,[expected],tool+' '+method+' error message');
    assert.equal(successfulActions,0,'failed auth never shows success or opens account');
    assert.equal(translateToolDialog(tool,'en',expected),translated+(message||'Unbekannter Fehler'),'server diagnostics remain intact');
   }
  }
 }
});

test('Backstudio 3D launch button remains discoverable when Pro controls initialize in either language',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const source=await readFile(new URL('../../tools/baking/backstudio-layout.js',import.meta.url),'utf8');
 const start=source.indexOf("const orig3dOpen=[...webgl.querySelectorAll('button')]");
 const end=source.indexOf('// Pro UI uses 260px fixed camera',start);
 assert.ok(start>0&&end>start);
 const code=source.slice(start,end);
 for(const [locale,label,expected] of [
  ['de','Form drehen','↻ Form drehen'],
  ['en','Rotate pan','↻ Rotate pan'],
  ['en','Form drehen','↻ Rotate pan'],
  ['de','3D öffnen','↻ Form drehen']
 ]){
  let clicked=0;
  const button={textContent:label,click:()=>{clicked++}};
  const ctx={
   webgl:{querySelectorAll:selector=>selector==='button'?[button]:[]},
   text:(de,en)=>locale==='en'?en:de,
   window:{__toolyaUILocale:locale},
   stage:{}
  };
  createContext(ctx);runInContext(code,ctx);
  assert.equal(button.textContent,expected,'3D launch label '+locale+' / '+label);
  assert.equal(clicked,0,'3D view is not automatically started in unsupported browsers');
 }
});

test('global password recovery remains a single token-based flow; tool translations do not duplicate auth logic',async()=>{
 const {readFile}=await import('node:fs/promises');
 const homepage=await readFile(new URL('../../index.html',import.meta.url),'utf8');
 const authGate=await readFile(new URL('../../shared/toolya/auth-page-gate.js',import.meta.url),'utf8');
 assert.match(homepage,/auth\.resetPasswordForEmail\(email,/,'existing one-time recovery email flow is retained');
 assert.match(homepage,/auth\.updateUser\(\{ password: newPassword \}\)/,'password update remains in central account flow');
 assert.match(homepage,/if \(!passwordRecoveryActive\)/,'recovery panel requires active recovery state');
 assert.match(homepage,/first\.value\.length < 8 \|\| first\.value !== second\.value/,'password confirmation is required');
 assert.match(homepage,/redirectTo: "https:\/\/toolya\.app\/index\.html"/,'the recovery token targets the central account page');
 assert.match(authGate,/const reject = \(\) => window\.location\.replace\(home\)/,'unauthenticated tool access routes to central account');
 assert.doesNotMatch(authGate,/resetPasswordForEmail|updateUser\(/,'auth gate does not invent another password recovery flow');
});

test('generated B3 navigation and action menu switches DE/EN without altering links or handlers',()=>{
 for(const [tool,labels,translated] of [
  ['moving',
   ['📦 Übersicht','📊 Statistiken','🔍 QR- & Barcode-Scanner','💾 Sicherung herunterladen'],
   ['📦 Overview','📊 Statistics','🔍 QR & barcode scanner','💾 Download backup']],
  ['housemates',
   ['🏠 Übersicht','📌 Pinnwand','👥 Mitglieder / Kontakte','🔐 WG-Zugriff verwalten'],
   ['🏠 Overview','📌 Noticeboard','👥 Members / contacts','🔐 Manage household access']]
 ]){
  const {document}=parseHTML('<html><body><div class="b3-shell"><nav class="b3-nav" aria-label="'+(tool==='moving'?'Umzugskisten & Inventarliste Navigation':'WG-Organisator Navigation')+'"><div class="b3-nav-links">'+labels.slice(0,2).map((text,i)=>'<a href="#panel'+i+'">'+text+'</a>').join('')+'</div><details class="b3-more"><summary>☷ Weitere Tools</summary><div class="b3-more-content">'+labels.slice(2).map((text,i)=>'<button data-action="original'+i+'" onclick="go()"> '+text+'</button>').join('')+'</div></details></nav></div><section id="settingsModal"><section class="b3-preferences"><h4>Darstellung & Dashboard</h4><button onclick="edit()">✎ Dashboard bearbeiten</button></section><div class="b3-settings-footer"><a href="../../index.html">↗ Entdecke mehr Toolya</a></div></section></body></html>');
  const links=[...document.querySelectorAll('.b3-nav-links a')];
  const actions=[...document.querySelectorAll('.b3-more-content button')];
  const hrefs=links.map(x=>x.getAttribute('href'));
  const originalNavLabel=document.querySelector('.b3-nav').getAttribute('aria-label');
  const handlers=actions.map(x=>x.getAttribute('onclick'));
  const originalMenu=[...links,...actions].map(x=>x.textContent);
  applyToolInterfaceLocale(document,tool,'en');
  assert.deepEqual(links.map(x=>x.textContent),translated.slice(0,2));
  assert.deepEqual(actions.map(x=>x.textContent.trim()),translated.slice(2));
  assert.equal(document.querySelector('.b3-nav').getAttribute('aria-label'),tool==='moving'?'Moving boxes navigation':'Roommate organizer navigation');
  assert.equal(document.querySelector('.b3-more > summary').textContent,'☷ More tools');
  assert.equal(document.querySelector('.b3-preferences > h4').textContent,'Appearance & dashboard');
  assert.equal(document.querySelector('.b3-preferences > button').textContent,'✎ Edit dashboard');
  assert.equal(document.querySelector('.b3-settings-footer > a').textContent,'↗ Explore more Toolya');
  assert.deepEqual(links.map(x=>x.getAttribute('href')),hrefs);
  assert.deepEqual(actions.map(x=>x.getAttribute('onclick')),handlers);
  applyToolInterfaceLocale(document,tool,'de');
  assert.deepEqual([...links,...actions].map(x=>x.textContent),originalMenu,'original labels restored exactly');
  assert.equal(document.querySelector('.b3-nav').getAttribute('aria-label'),originalNavLabel);
  assert.equal(document.querySelector('.b3-more > summary').textContent,'☷ Weitere Tools');
  assert.deepEqual(actions.map(x=>x.getAttribute('onclick')),handlers,'handlers restored');
 }
});

test('generated menu translation leaves unknown dynamic links and user content alone',()=>{
 const {document}=parseHTML('<html><body><nav class="b3-nav"><div class="b3-nav-links"><a href="/private">Private link with personal data</a></div><details class="b3-more"><summary>My original menu</summary><div class="b3-more-content"><button>Personal saved entry</button></div></details></nav><div class="b3-preferences"><button><span aria-hidden="true">✎</span> User settings</button></div></body></html>');
 const before=document.body.innerHTML;
 applyToolInterfaceLocale(document,'housemates','en');
 assert.equal(document.body.innerHTML,before);
 applyToolInterfaceLocale(document,'housemates','de');
 assert.equal(document.body.innerHTML,before);
});

test('dashboard editor localizes panel titles, actions and accessibility without modifying layout choices',()=>{
 for(const [tool,panel,translated] of [
  ['moving','Inventar-Statistiken','Inventory statistics'],
  ['housemates','WG-Statistiken','Household statistics']
 ]){
  const {document}=parseHTML('<html><body><div id="b3-editor" aria-label="Dashboard bearbeiten"><h2>Dashboard bearbeiten</h2><p>Bereiche sortieren, ein-/ausblenden oder in S / M / L darstellen.</p><div class="b3-editor-row"><strong>'+panel+'</strong><button id="move-up" aria-label="'+panel+' nach oben" onclick="move()">↑</button><button id="move-down" aria-label="'+panel+' nach unten" onclick="move()">↓</button><label><input id="visible" type="checkbox" checked aria-label="'+panel+' sichtbar">Sichtbar</label><select id="size" aria-label="Kartengröße '+panel+'"><option value="s">S</option><option value="m" selected>M</option><option value="l">L</option></select></div><div class="flex"><button id="save" onclick="save()">Speichern</button><button id="cancel" onclick="cancel()">Abbrechen</button><button id="reset" onclick="reset()">Standardlayout</button></div></div></body></html>');
  const control=document.getElementById('visible');
  const select=document.getElementById('size');
  const original=document.getElementById('b3-editor').innerHTML;
  const originalActions=[...document.querySelectorAll('#b3-editor button')].map(el=>el.getAttribute('onclick'));
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(document.querySelector('#b3-editor').getAttribute('aria-label'),'Edit dashboard');
  assert.equal(document.querySelector('#b3-editor h2').textContent,'Edit dashboard');
  assert.equal(document.querySelector('#b3-editor p').textContent,'Sort sections, show or hide them, or choose S / M / L sizes.');
  assert.equal(document.querySelector('.b3-editor-row strong').textContent,translated);
  assert.equal(document.querySelector('.b3-editor-row label').textContent,'Visible');
  assert.equal(control.hasAttribute('checked'),true);
  assert.equal(select.querySelector('option[value="m"]').getAttribute('selected'),'');
  assert.equal(document.getElementById('save').textContent,'Save');
  assert.equal(document.getElementById('cancel').textContent,'Cancel');
  assert.equal(document.getElementById('reset').textContent,'Default layout');
  assert.equal(document.getElementById('move-up').getAttribute('aria-label'),translated+' move up');
  assert.equal(document.getElementById('move-down').getAttribute('aria-label'),translated+' move down');
  assert.equal(control.getAttribute('aria-label'),translated+' visible');
  assert.equal(select.getAttribute('aria-label'),'Card size: '+translated);
  assert.deepEqual([...document.querySelectorAll('#b3-editor button')].map(el=>el.getAttribute('onclick')),originalActions);
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(document.querySelector('#b3-editor').getAttribute('aria-label'),'Dashboard bearbeiten');
  assert.equal(document.querySelector('.b3-editor-row strong').textContent,panel);
  assert.equal(document.querySelector('.b3-editor-row label').textContent,'Sichtbar');
  assert.equal(document.getElementById('move-up').getAttribute('aria-label'),panel+' nach oben');
  assert.equal(select.getAttribute('aria-label'),'Kartengröße '+panel);
  assert.equal(document.getElementById('b3-editor').innerHTML,original,'all original editor markup is restored');
 }
});

test('dashboard editor translation runs after editor rerenders and never reinitializes saved dashboard settings',async()=>{
 const {readFile}=await import('node:fs/promises');
 const core=await readFile(new URL('../../assets/helferlein-b3-core.js',import.meta.url),'utf8');
 const entry=await readFile(new URL('../../shared/toolya/i18n/tool-entry.mjs',import.meta.url),'utf8');
 assert.match(core,/host\.append\(commands\);[\s\S]{0,180}document\.dispatchEvent\(new Event\('toolya:b3-editor-rendered'\)\)/);
 assert.match(entry,/document\.addEventListener\('toolya:b3-editor-rendered',\(\)=>applyToolInterfaceLocale\(document,name,selected\)\)/);
 const {document}=parseHTML('<html><body><div id="b3-editor"><h2>Dashboard bearbeiten</h2></div></body></html>');
 applyToolInterfaceLocale(document,'moving','en');
 assert.equal(document.querySelector('h2').textContent,'Edit dashboard');
 document.querySelector('#b3-editor').innerHTML='<h2>Dashboard bearbeiten</h2><div class="b3-editor-row"><strong>Inventar durchsuchen</strong></div>';
 applyToolInterfaceLocale(document,'moving','en');
 assert.equal(document.querySelector('h2').textContent,'Edit dashboard');
 assert.equal(document.querySelector('strong').textContent,'Search inventory');
 applyToolInterfaceLocale(document,'moving','de');
 assert.equal(document.querySelector('strong').textContent,'Inventar durchsuchen');
});

test('generated dashboard save errors translate exactly without modifying unknown backend errors',()=>{
 for(const tool of ['moving','housemates']){
  assert.equal(translateToolDialog(tool,'en','Layout konnte nicht gespeichert werden.'),'Could not save the dashboard layout.');
  assert.equal(translateToolDialog(tool,'en','Server-specific error 123'),'Server-specific error 123');
  assert.equal(translateToolDialog(tool,'de','Layout konnte nicht gespeichert werden.'),'Layout konnte nicht gespeichert werden.');
 }
});

test('plant-care dashboard menu translates navigation, shortcuts and landmark without changing actions',()=>{
 const {document}=parseHTML('<html><body><nav class="b3-nav" aria-label="Pflanzenpflege Navigation"><div class="b3-nav-links"><a href="#b3-stats">📊 Statistiken</a><a href="#b3-plants">🪴 Meine Pflanzen</a></div><details class="b3-more"><summary>☷ Weitere Tools</summary><div class="b3-more-content"><button id="seed" onclick="openSeedsModal()">🌰 Saatgut</button><button onclick="exportPDF()">📄 PDF exportieren</button></div></details></nav><section class="b3-preferences" aria-label="Darstellung und Dashboard"><h4>Darstellung & Dashboard</h4><button>✎ Dashboard bearbeiten</button></section></body></html>');
 const nav=document.querySelector('.b3-nav'),seed=document.getElementById('seed');
 const link=document.querySelector('.b3-nav-links a');
 const href=link.getAttribute('href'),action=seed.getAttribute('onclick');
 applyToolInterfaceLocale(document,'plants','en');
 assert.equal(nav.getAttribute('aria-label'),'Plant care navigation');
 assert.equal(link.textContent,'📊 Statistics');
 assert.equal(seed.textContent,'🌰 Seeds');
 assert.equal(document.querySelector('.b3-more > summary').textContent,'☷ More tools');
 assert.equal(document.querySelector('.b3-preferences h4').textContent,'Appearance & dashboard');
 assert.equal(link.getAttribute('href'),href);
 assert.equal(seed.getAttribute('onclick'),action);
 applyToolInterfaceLocale(document,'plants','de');
 assert.equal(nav.getAttribute('aria-label'),'Pflanzenpflege Navigation');
 assert.equal(link.textContent,'📊 Statistiken');
 assert.equal(seed.textContent,'🌰 Saatgut');
 assert.equal(seed.getAttribute('onclick'),action);
});

test('plant care and baking dashboard editors translate dynamically but preserve sizes, controls and original IDs',()=>{
 for(const [tool,root,panel,english,description,translatedDescription,rowClass] of [
  ['plants','b3-editor','Garten-Saisonkalender','Seasonal garden calendar',
   'Bereiche sortieren, ein- oder ausblenden und die Größe S / M / L wählen. Änderungen gelten nur für dieses Tool.',
   'Sort, show or hide sections and choose S / M / L sizes. Changes apply to this tool only.','b3-editor-row'],
  ['baking','b3-backform-editor','Formen-Finder','Pan finder',
   'Werkzeuge sortieren und Abstände anpassen. Alle Berechnungen bleiben erreichbar.',
   'Arrange tools and adjust spacing. All calculations stay available.','b3-backform-editor-row']
 ]){
  const isBaking=tool==='baking';
  const id=isBaking?'finder':'calendar';
  const label=isBaking?'Kartendichte '+id:'Größe: '+panel;
  const opts=isBaking?'<option value="s">Kompakt</option><option value="m" selected>Standard</option><option value="l">Großzügig</option>':'<option value="s">S</option><option value="m" selected>M</option><option value="l">L</option>';
  const row='<div class="'+rowClass+'"><strong>'+panel+'</strong><button aria-label="'+(isBaking?id:panel)+' nach oben" onclick="up()">↑</button><label><input type="checkbox" checked aria-label="'+panel+' sichtbar">Sichtbar</label><select aria-label="'+label+'">'+opts+'</select></div>';
  const actions=isBaking?'b3-backform-editor-actions':'flex';
  const {document}=parseHTML('<html><body><section id="'+root+'" aria-label="Dashboard bearbeiten"><h'+(isBaking?'3':'2')+'>Dashboard bearbeiten</h'+(isBaking?'3':'2')+'><p>'+description+'</p>'+row+'<div class="'+actions+'"><button onclick="save()">Speichern</button><button onclick="cancel()">Abbrechen</button><button onclick="reset()">Standardlayout</button></div></section></body></html>');
  const host=document.getElementById(root);
  const original=host.innerHTML;
  const buttons=[...host.querySelectorAll('button')],actionsBefore=buttons.map(x=>x.getAttribute('onclick'));
  const select=host.querySelector('select');
  const optionValues=[...select.querySelectorAll('option')].map(x=>x.getAttribute('value'));
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(host.querySelector('strong').textContent,english);
  assert.equal(host.querySelector('p').textContent,translatedDescription);
  assert.equal(host.getAttribute('aria-label'),'Edit dashboard');
  assert.equal(host.querySelector('button[aria-label]').getAttribute('aria-label'),english+' move up');
  assert.equal(host.querySelector('select').getAttribute('aria-label'),(isBaking?'Card density: ':'Size: ')+english);
  assert.deepEqual([...select.querySelectorAll('option')].map(x=>x.getAttribute('value')),optionValues);
  if(isBaking)assert.equal(select.querySelector('option[value="l"]').textContent,'Spacious');
  assert.deepEqual(buttons.map(x=>x.getAttribute('onclick')),actionsBefore);
  assert.equal(host.querySelector('input').hasAttribute('checked'),true);
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(host.innerHTML,original,'dashboard source markup and control state restored exactly');
 }
});

test('plants and baking core dashboard editors announce new render events without changing storage schema',async()=>{
 const {readFile}=await import('node:fs/promises');
 for(const [file,key] of [
  ['../../assets/helferlein-b3.js','helferlein_ui_layout_pflanzen_v1'],
  ['../../assets/helferlein-b3-backform.js','helferlein_ui_layout_backform_v1']
 ]){
  const script=await readFile(new URL(file,import.meta.url),'utf8');
  assert.match(script,/document\.dispatchEvent\(new Event\('toolya:b3-editor-rendered'\)\)/);
  assert.ok(script.includes(key));
  assert.match(script,/JSON\.stringify\(draft\)/,'original serialized layout structure is unchanged');
 }
});

test('all dashboard settings have reversible accessibility labels without losing actions',()=>{
 for(const tool of ['moving','housemates','plants','baking']){
  const {document}=parseHTML('<html><body><div class="b3-preferences" aria-label="Darstellung und Dashboard"><a class="b3-kofi-link" href="https://ko-fi.com/duhrrom" aria-label="Auf Ko-fi einen Kaffee spendieren">☕ Kaffee spendieren</a></div><button id="b3-backform-edit" type="button" onclick="edit()">✎ Dashboard bearbeiten</button><div id="b3-backform-editor" aria-label="Dashboard-Einstellungen"></div></body></html>');
  const prefs=document.querySelector('.b3-preferences'),support=document.querySelector('.b3-kofi-link'),edit=document.getElementById('b3-backform-edit'),editor=document.getElementById('b3-backform-editor');
  const original=document.body.innerHTML;
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(prefs.getAttribute('aria-label'),'Appearance and dashboard');
  assert.equal(support.getAttribute('aria-label'),'Support Toolya with a coffee');
  assert.equal(support.getAttribute('href'),'https://ko-fi.com/duhrrom');
  assert.equal(edit.textContent,'✎ Edit dashboard');
  assert.equal(edit.getAttribute('onclick'),'edit()');
  assert.equal(editor.getAttribute('aria-label'),'Dashboard settings');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(document.body.innerHTML,original,'all tool settings return to source state: '+tool);
 }
});

test('plants and baking layout save warnings translate without altering unknown error information',()=>{
 assert.equal(translateToolDialog('plants','en','Layout konnte nicht gespeichert werden. Bitte Browser-Speicher prüfen.'),'Could not save the layout. Check your browser storage.');
 assert.equal(translateToolDialog('baking','en','Layout konnte nicht gespeichert werden.'),'Could not save the dashboard layout.');
 for(const tool of ['plants','baking']){
  assert.equal(translateToolDialog(tool,'en','Unbekannte Serverfehlermeldung #903'),'Unbekannte Serverfehlermeldung #903');
 }
});

test('Wi-Fi QR password prompt and unreadable plant photo feedback are localized without changing entered content',async()=>{
 const {readFile}=await import('node:fs/promises');
 const household=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const plants=await readFile(new URL('../../tools/plants/index.html',import.meta.url),'utf8');
 const password='WLAN-Passwort (wird nicht gespeichert):';
 const feedback='Das Foto konnte nicht gelesen werden.';
 assert.ok(household.includes(password),'Wi-Fi prompt remains input-only');
 assert.ok(plants.includes(feedback),'photo error is still produced by the source workflow');
 assert.equal(translateToolDialog('housemates','en',password),'Wi-Fi password (not saved):');
 assert.equal(translateToolDialog('plants','en',feedback),'Could not read the photo.');
 assert.equal(translateToolDialog('housemates','de',password),password);
 assert.equal(translateToolDialog('plants','de',feedback),feedback);
 assert.equal(translateToolDialog('housemates','en','private-password-value'),'private-password-value','secret content stays verbatim');
});

test('household and plant help content switches between EN/DE without touching editable household notes',()=>{
 const cases=[
  ['housemates',
   'Farbige Sticky Notes erstellen, wichtige Zettel oben anpinnen 📌, Autor wählen und Notizen per Klick verwalten.',
   'Create colorful sticky notes, pin important items 📌, select an author, and manage notes with a click.',
   'Schritt-für-Schritt-Anleitung zum WG-Organisator',
   'Step-by-step roommate organizer guide'],
  ['plants',
   'Nutze den Button „📄 PDF“, um jederzeit einen kompakten Report aller erfassten Pflanzen und Daten als Dokument zu generieren.',
   'Use “📄 PDF” to generate a compact report of your recorded plants and data at any time.',
   'Schritt-für-Schritt-Anleitung zur Pflanzenpflege',
   'Step-by-step plant care guide']
 ];
 for(const [tool,de,en,guideDe,guideEn]of cases){
  const {document}=parseHTML('<html><body><section id="helpModal"><div><details><summary>Help</summary><p class="help">\n  '+de+'\n</p></details><p><a href="/original-guide/">'+guideDe+'</a></p></div></section><textarea id="personal-notes">My personal note</textarea><div id="user-data"><p>'+de+'</p></div></body></html>');
  const text=document.querySelector('.help'),anchor=document.querySelector('#helpModal > div > p > a');
  const original=text.textContent,initialHref=anchor.getAttribute('href');
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(text.textContent,'\n  '+en+'\n');
  assert.equal(anchor.textContent,guideEn);
  assert.equal(anchor.getAttribute('href'),initialHref,'the display translator does not redirect links itself');
  assert.equal(document.querySelector('#user-data p').textContent,de,'user-authored content is never translated');
  assert.equal(document.getElementById('personal-notes').value,'My personal note');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(text.textContent,original,'original whitespace and text restored exactly');
  assert.equal(anchor.textContent,guideDe);
  assert.equal(document.querySelector('#user-data p').textContent,de);
 }
});

test('help modal instructions and localized guide links are complete for WG and plants',async()=>{
 const {readFile}=await import('node:fs/promises');
 const entry=await readFile(new URL('../../shared/toolya/i18n/tool-entry.mjs',import.meta.url),'utf8');
 assert.match(entry,/const modalHelpGuide=document\.querySelector\('#helpModal > div > p > a'\)/);
 assert.match(entry,/if\(lang==='en'\)modalHelpGuide\.setAttribute\('href',settings\.guide\)/);
 assert.match(entry,/else if\(originalModalHelpGuideHref!==null\)modalHelpGuide\.setAttribute\('href',originalModalHelpGuideHref\)/);
 for(const [tool,guide]of [['housemates','/wg-organisator/'],['plants','/pflanzenpflege/']]){
  const html=await readFile(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  assert.ok(html.includes('href="'+guide+'"'),'original German guide is still present');
  assert.match(html,/<div id="helpModal"[\s\S]*?<details/);
  const sections=Array.from(html.matchAll(/<details class="bg-gray-50 border rounded-xl p-3">/g)).length;
  assert.ok(sections>=3,tool+' help sections retained');
 }
});

test('source-exact help translations leave unknown notes and help paragraphs unchanged',()=>{
 const {document}=parseHTML('<html><body><div id="helpModal"><div><details><p>My private gardening plan for a family member</p></details></div></div></body></html>');
 const before=document.body.innerHTML;
 for(const tool of ['plants','housemates']){
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(document.body.innerHTML,before);
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(document.body.innerHTML,before);
 }
});

test('frost precautions and member-management headings translate without touching alert logic or user entries',()=>{
 const {document}=parseHTML('<html><body><section id="frostBanner"><div><h4>Achtung: Frostgefahr!</h4><p>Bitte empfindliche Kübelpflanzen schützen oder ins Winterquartier holen!</p></div><button onclick="dismissFrostAlert()">Ausblenden</button></section><p id="private">Bitte empfindliche Kübelpflanzen schützen oder ins Winterquartier holen!</p></body></html>');
 const notice=document.querySelector('#frostBanner p');
 const original=notice.textContent,handler=document.querySelector('#frostBanner button').getAttribute('onclick');
 applyToolInterfaceLocale(document,'plants','en');
 assert.equal(notice.textContent,'Protect sensitive potted plants or move them indoors for winter.');
 assert.equal(document.getElementById('private').textContent,original);
 assert.equal(document.querySelector('#frostBanner button').getAttribute('onclick'),handler);
 applyToolInterfaceLocale(document,'plants','de');
 assert.equal(notice.textContent,original);
 const {document:wg}=parseHTML('<html><body><h3>👥 Mitglieder- & Kontaktverwaltung</h3><input id="person" value="Alex"></body></html>');
 applyToolInterfaceLocale(wg,'housemates','en');
 assert.equal(wg.querySelector('h3').textContent,'👥 Member and contact management');
 assert.equal(wg.getElementById('person').value,'Alex');
 applyToolInterfaceLocale(wg,'housemates','de');
 assert.equal(wg.querySelector('h3').textContent,'👥 Mitglieder- & Kontaktverwaltung');
});

test('four tool introductions, guidance and empty-state copy reverse DE/EN without touching user fields',()=>{
 const scenarios=[
  ['moving','Noch keine Standorte oder Kisten erfasst.','No locations or boxes added yet.'],
  ['housemates','Die Pinnwand ist noch leer. Erstelle die erste Sticky Note!','The noticeboard is empty. Create your first sticky note!'],
  ['plants','Keine Pflanzen erfasst.','No plants recorded.'],
  ['baking','Noch keine Rezepte gespeichert.','No recipes saved yet.']
 ];
 for(const [tool,de,en]of scenarios){
  const {document}=parseHTML('<html><body><main id="main-content"><section><p class="empty">  '+de+'  </p><textarea id="private">Private note</textarea><div id="owned"><p contenteditable="true">'+de+'</p></div><p><span>'+de+'</span></p></section></main><div id="unrelated"><p>'+de+'</p></div></body></html>');
  const target=document.querySelector('p.empty'),initial=target.textContent;
  const unchanged=document.querySelector('#unrelated p').textContent;
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(target.textContent,'  '+en+'  ',tool+' translates its own paragraph');
  assert.equal(document.querySelector('#unrelated p').textContent,unchanged,'outside tool-owned UI unchanged');
  assert.equal(document.getElementById('owned').querySelector('p').textContent,de,'editable user content unchanged');
  assert.equal(document.querySelector('#main-content p span').textContent,de,'nested controls not flattened');
  assert.equal(document.getElementById('private').value,'Private note');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(target.textContent,initial,'source paragraph restored including whitespace');
 }
});

test('tool paragraph translations remain source-exact across all four HTML files',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../../shared/toolya/i18n/interface.mjs',import.meta.url),'utf8');
 const start=source.indexOf('const toolParagraphCopy=Object.freeze(');
 const end=source.indexOf('\nfunction applyToolParagraphCopy',start);
 assert.ok(start>0&&end>start,'static guidance catalog is present');
 const catalog=JSON.parse(source.slice(start+'const toolParagraphCopy=Object.freeze('.length,end-2));
 assert.equal(Object.values(catalog).reduce((n,m)=>n+Object.keys(m).length,0),37);
 for(const tool of ['moving','housemates','plants','baking']){
  const html=await readFile(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  for(const [de,en] of Object.entries(catalog[tool])){
   assert.ok(html.includes(de),'missing source guidance in '+tool+': '+de);
   assert.ok(en&&en!==de,'untranslated guidance: '+de);
  }
 }
 assert.match(source,/document\.querySelectorAll\('#main-content p,\.ty-tool-hero-copy p,#frostBanner p'\)/);
 assert.match(source,/el\.children\.length\|\|el\.isContentEditable\|\|el\.closest\('\[contenteditable="true"\]'\)/);
});

test('baking guidance and plant-care watering tips change only visible copy, not recipe calculations',()=>{
 const {document}=parseHTML('<html><body><main id="main-content"><p>Richtwerte: Süßkraft und Backeigenschaften hängen vom Produkt und Rezept ab.</p><p>Teighöhe entspricht exakt dem Original.</p><input type="number" id="amount" value="125.5"></main></body></html>');
 const paragraphs=[...document.querySelectorAll('p')];
 applyToolInterfaceLocale(document,'baking','en');
 assert.equal(paragraphs[0].textContent,'Guidance only: sweetness and baking properties depend on the product and recipe.');
 assert.equal(paragraphs[1].textContent,'Batter height matches the original exactly.');
 assert.equal(document.getElementById('amount').getAttribute('value'),'125.5');
 applyToolInterfaceLocale(document,'baking','de');
 assert.equal(paragraphs[1].textContent,'Teighöhe entspricht exakt dem Original.');
});

test('small dashboard texts translate across four tools and restore source labels without touching values',()=>{
 const cases=[
  ['moving','span','Standort der Kiste','Box location'],
  ['housemates','p','Monats-Ausgaben','Monthly expenses'],
  ['plants','p','Überfällig','Overdue'],
  ['baking','li','Alle Zutaten abwiegen und bereitstellen.','Weigh out and prepare all ingredients.']
 ];
 for(const [tool,tag,de,en] of cases){
  const {document}=parseHTML('<html><body><main id="main-content"><'+tag+' id="label"> '+de+' </'+tag+'><label><input id="entry" value="User text"></label><p id="user" contenteditable="true">'+de+'</p></main><section id="unrelated"><'+tag+'>'+de+'</'+tag+'></section></body></html>');
  const node=document.getElementById('label'),before=node.textContent;
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(node.textContent,' '+en+' ',tool);
  assert.equal(document.getElementById('entry').getAttribute('value'),'User text');
  assert.equal(document.getElementById('user').textContent,de);
  assert.equal(document.querySelector('#unrelated '+tag).textContent,de);
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(node.textContent,before);
 }
});

test('baking checklist stays intact while its source-owned list items translate',()=>{
 const {document}=parseHTML('<html><body><main id="main-content"><ul><li>Butter 2 Std. vorher aus dem Kühlschrank nehmen.</li><li>Springform fetten und mit Mehl/Semmelbröseln ausstreuen.</li><li>Alle Zutaten abwiegen und bereitstellen.</li></ul><strong>Nährwerte (geschätzt):</strong><input id="recipe" value="300 g flour"></main></body></html>');
 const list=[...document.querySelectorAll('li')],before=list.map(x=>x.textContent);
 applyToolInterfaceLocale(document,'baking','en');
 assert.equal(list[0].textContent,'Take butter out of the fridge two hours ahead.');
 assert.equal(list[1].textContent,'Grease the cake pan and dust with flour or breadcrumbs.');
 assert.equal(list[2].textContent,'Weigh out and prepare all ingredients.');
 assert.equal(document.querySelector('strong').textContent,'Nutrition (estimated):');
 assert.equal(document.getElementById('recipe').getAttribute('value'),'300 g flour');
 applyToolInterfaceLocale(document,'baking','de');
 assert.deepEqual(list.map(x=>x.textContent),before);
});

test('compact dashboard catalog uses source labels appearing in HTML and never changes stored IDs',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../../shared/toolya/i18n/interface.mjs',import.meta.url),'utf8');
 const prefix='const toolSmallCopy=Object.freeze(';
 const start=source.indexOf(prefix),end=source.indexOf(');\nfunction applyToolSmallCopy',start);
 assert.ok(start>=0&&end>start);
 const catalog=JSON.parse(source.slice(start+prefix.length,end));
 assert.equal(Object.values(catalog).reduce((total,m)=>total+Object.keys(m).length,0),22);
 for(const tool of ['moving','housemates','plants','baking']){
  const html=await readFile(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  for(const [sourceText,translation] of Object.entries(catalog[tool])){
   assert.ok(html.includes(sourceText),tool+': missing source label '+sourceText);
   assert.ok(translation&&translation!==sourceText,'missing translation for '+sourceText);
  }
 }
 assert.match(source,/el\.children\.length\|\|el\.isContentEditable/);
 assert.match(source,/originals\.get\(el\)\?\.get\('text'\)/);
});

test('household header subtitle is translated while the brand and primary heading stay unchanged',()=>{
 const {document}=parseHTML('<html><body><header class="b3-header"><div class="b3-tool-title"><h1>WG-Organisator mit Haushaltsbuch</h1><p>WG-Ausgaben aufteilen, Putzplan, Kalender und gemeinsame Aufgaben organisieren</p></div><a class="b3-brand" href="../../index.html">Toolya</a></header></body></html>');
 const heading=document.querySelector('h1'),subtitle=document.querySelector('.b3-tool-title p'),brand=document.querySelector('.b3-brand');
 applyToolInterfaceLocale(document,'housemates','en');
 assert.equal(subtitle.textContent,'Split household expenses, organize cleaning, calendars and shared tasks');
 assert.equal(heading.textContent,'WG-Organisator mit Haushaltsbuch','header title ownership is separate from help copy');
 assert.equal(brand.textContent,'Toolya');
 assert.equal(brand.getAttribute('href'),'../../index.html');
 applyToolInterfaceLocale(document,'housemates','de');
 assert.equal(subtitle.textContent,'WG-Ausgaben aufteilen, Putzplan, Kalender und gemeinsame Aufgaben organisieren');
});

test('source-owned accessibility labels reverse DE/EN without altering form data or URLs',()=>{
 const cases=[
  ['moving','aria-label','Inventar nach Kennzeichnung filtern','Filter inventory by label'],
  ['moving','title','QR-Code & Deep-Link','QR code and deep link'],
  ['housemates','aria-label','Diagramm: WG-Ausgaben nach Kategorie','Chart: household expenses by category'],
  ['plants','aria-label','Name (z.B. Tomate Harzfeuer)','Plant name (e.g. Harzfeuer tomato)'],
  ['baking','aria-label','Zutaten des Rezepts','Recipe ingredients']
 ];
 for(const [tool,attribute,de,en] of cases){
  const {document}=parseHTML('<html><body><main id="main-content"><div id="control" '+attribute+'="'+de.replaceAll('&','&amp;')+'"><input id="content" value="My private content"></div></main><aside><div '+attribute+'="'+de.replaceAll('&','&amp;')+'">Unrelated content</div></aside></body></html>');
  const el=document.getElementById('control');
  assert.equal(el.getAttribute(attribute),de);
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(el.getAttribute(attribute),en,tool+' attribute localized');
  assert.equal(document.querySelector('aside div').getAttribute(attribute),de,'outside tool-owned UI is untouched');
  assert.equal(document.getElementById('content').getAttribute('value'),'My private content');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(el.getAttribute(attribute),de,'original attribute restored');
 }
});

test('all tool accessibility translations match source HTML and skip personal attributes',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../../shared/toolya/i18n/interface.mjs',import.meta.url),'utf8');
 const prefix='const toolAccessibilityCopy=Object.freeze(';
 const start=source.indexOf(prefix),end=source.indexOf(');\nfunction applyToolAccessibilityCopy',start);
 assert.ok(start>=0&&end>start);
 const catalog=JSON.parse(source.slice(start+prefix.length,end));
 assert.equal(Object.values(catalog).reduce((n,pairs)=>n+pairs.length,0),19);
 for(const tool of ['moving','housemates','plants','baking']){
  const html=await readFile(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  for(const [attribute,de,en]of catalog[tool]){
   const htmlEncoded=de.replaceAll('&','&amp;');
   assert.ok(html.includes(attribute+'="'+de+'"')||html.includes(attribute+'="'+htmlEncoded+'"'),tool+' '+de);
   assert.ok(en&&de!==en);
  }
 }
 assert.match(source,/element\.isContentEditable\|\|element\.closest\('\[contenteditable="true"\]'\)/);
});

test('plant water amount refreshes in selected language without mutating the pot size field',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/plants/index.html',import.meta.url),'utf8');
 const a=html.indexOf('function calculateWaterAmount() {');
 const b=html.indexOf('function getMlForPot(',a);
 assert.ok(a>0&&b>a);
 const snippet=html.slice(a,b);
 const attrs={'plantPotSize':{value:'18'},'waterMlHint':{innerText:''}};
 const ctx={document:{getElementById:id=>attrs[id]},window:{__toolyaUILocale:'en'}};
 createContext(ctx);runInContext(snippet,ctx);
 runInContext('calculateWaterAmount()',ctx);
 assert.equal(attrs.waterMlHint.innerText,'💧 Suggested watering amount: approx. 600 ml per watering');
 assert.equal(attrs.plantPotSize.value,'18');
 ctx.window.__toolyaUILocale='de';
 runInContext('calculateWaterAmount()',ctx);
 assert.equal(attrs.waterMlHint.innerText,'💧 Empfohlene Gießmenge: ca. 600 ml pro Vorgang');
 assert.equal(attrs.plantPotSize.value,'18');
 assert.match(html,/document\.addEventListener\('toolya:locale-change',[\s\S]*?calculateWaterAmount\(\)/,'locale listener refreshes the visible estimate');
});

test('photo zoom dialog translates its accessible name and alt text while keeping image URL untouched',()=>{
 const {document}=parseHTML('<html><body><dialog id="imageModal" aria-label="Bildvorschau"><img id="zoomedImage" src="blob:example-image" alt="Vergrößertes Foto der Umzugskiste"><button type="button" onclick="closeImageModal()">Schließen</button></dialog></body></html>');
 const modal=document.getElementById('imageModal'),image=document.getElementById('zoomedImage');
 const initial=document.body.innerHTML;
 applyToolInterfaceLocale(document,'moving','en');
 assert.equal(modal.getAttribute('aria-label'),'Image preview');
 assert.equal(image.getAttribute('alt'),'Enlarged photo of the moving box');
 assert.equal(image.getAttribute('src'),'blob:example-image');
 assert.equal(document.querySelector('#imageModal button').getAttribute('onclick'),'closeImageModal()');
 applyToolInterfaceLocale(document,'moving','de');
 assert.equal(document.body.innerHTML,initial);
});


test('moving inventory accessibility labels switch reversibly without changing data or handlers',()=>{
 const {document}=parseHTML(`<html><body>
 <select id="locIcon" aria-label="Symbol des Standorts"><option value="home">Haus</option></select>
 <input id="boxPhotoInput" type="file" aria-label="Foto der Kiste auswählen">
 <select id="tagFilter" aria-label="Inventar nach Kennzeichnung filtern" onchange="renderInventory()"><option value="stored">Gelagert</option></select>
 <select id="sortFilter" aria-label="Inventar sortieren" onchange="renderInventory()"></select>
 <dialog id="imageModal" aria-label="Bildvorschau"></dialog>
 </body></html>`);
 const original=[...document.querySelectorAll('[aria-label]')].map(el=>el.getAttribute('aria-label'));
 const option=document.querySelector('#tagFilter option'), handler=document.querySelector('#tagFilter').getAttribute('onchange');
 applyToolInterfaceLocale(document,'moving','en');
 assert.deepEqual([...document.querySelectorAll('[aria-label]')].map(el=>el.getAttribute('aria-label')),
  ['Location icon','Select box photo','Filter inventory by label','Sort inventory','Image preview']);
 assert.equal(document.querySelector('#tagFilter option'),option);
 assert.equal(option.value,'stored');
 assert.equal(document.querySelector('#tagFilter').getAttribute('onchange'),handler);
 applyToolInterfaceLocale(document,'moving','de');
 assert.deepEqual([...document.querySelectorAll('[aria-label]')].map(el=>el.getAttribute('aria-label')),original);
});

test('moving box form accessibility is reversible without mutating values or attached controls',()=>{
 const {document}=parseHTML(`<html><body><main id="main-content">
 <input id="boxValue" aria-label="Wert in € (optional)" value="42">
 <input id="boxDesc" aria-label="Inhalt / Beschreibung (z.B. Lichterketten)" value="Private description">
 <input id="boxBarcode" aria-label="Barcode / EAN (optional)" value="123456">
 <input id="boxName" aria-label="Kisten-Name (z.B. Karton #3)" value="My box">
 <input id="boxPhotoInput" type="file">
 </main></body></html>`);
 const nodes=[...document.querySelectorAll('input')];
 const labels=nodes.map(node=>node.getAttribute('aria-label'));
 const values=nodes.map(node=>node.value);
 applyToolInterfaceLocale(document,'moving','en');
 assert.deepEqual(nodes.map(node=>node.getAttribute('aria-label')),
  ['Value in euros (optional)','Contents / description (e.g. string lights)','Barcode / EAN (optional)','Box name (e.g. Box #3)','Select box photo']);
 assert.equal(nodes[4].getAttribute('title'),'Select box photo');
 assert.deepEqual(nodes.map(node=>node.value),values);
 applyToolInterfaceLocale(document,'moving','de');
 assert.deepEqual(nodes.map(node=>node.getAttribute('aria-label')),labels);
 assert.equal(nodes[4].hasAttribute('title'),false,'added title removed on switching back');
 assert.deepEqual(nodes.map(node=>node.value),values);
});

test('moving inventory uses English display-only number and date formatting',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/moving/index.html',import.meta.url),'utf8');
 const englishFormat="toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })";
 assert.equal(html.split(englishFormat).length-1,8,'five inventory screen values and three PDF values use English formatting');
 for(const value of ['totalVal','locVal','tagVal','b.value || 0'])
  assert.ok(html.includes('Number('+value+').'+englishFormat),'English formatting covers '+value);
 assert.equal(html.split("toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })").length-1,8,'five screen values plus three PDF numeric values');
 assert.ok(html.includes("Number(b.value || 0).toLocaleString('en-GB'"),'PDF values use English numeric formatting');
 assert.ok(html.includes(": Number(b.value || 0).toFixed(2)"),'German PDF numeric representation remains unchanged');
 assert.ok(html.includes("b.expiry.split('-').reverse().join('/')"),'English expiry date');
 assert.ok(html.includes("b.expiry.split('-').reverse().join('.')"),'original German expiry date');
 assert.ok(html.includes("Number(item.value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })"),'English subitem preview uses locale formatting');
 assert.ok(html.includes(": (item.value || 0).toFixed(2)"),'German subitem preview keeps existing formatting');
 assert.equal((1234.5).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2}),'1,234.50');
 assert.equal((1234.5).toFixed(2).replace('.',','),'1234,50','German legacy presentation remains unchanged');
});


test('Sprint A static workflow labels and filter options translate across four tools',()=>{
 const samples=[
  ['moving','<option value="fragile">⚠️ Zerbrechlich</option><button onclick="startScanner()">🔍 Live Scanner</button>',
   '⚠️ Fragile','🔍 Live scanner'],
  ['housemates','<option value="expense">🔻 Nur Ausgaben</option><button onclick="rotateCleaners()">🔄 Rotieren</button>',
   '🔻 Expenses only','🔄 Rotate'],
  ['plants','<option value="sun">☀️ Volle Sonne (ca. 7-8 Std.)</option><button onclick="noop()">🌱 Standard / Gekauft</button>',
   '☀️ Full sun (approx. 7–8 hrs)','🌱 Standard / purchased'],
  ['baking','<option value="cups">US Cups / Ounces</option><button onclick="findPans()">⭕ Formen-Finder</button>',
   'US cups / ounces','⭕ Pan finder']
 ];
 for(const [tool,html,expectedOption,expectedButton] of samples){
  const {document}=parseHTML('<html lang="de"><body><main id="main-content"><select>'+html.split('</option>')[0]+'</option></select>'+html.split('</option>')[1]+'<input id="safe" value="private-entry"></main></body></html>');
  const option=document.querySelector('option'), button=document.querySelector('button'),input=document.querySelector('#safe');
  const originalOption=option.textContent,originalButton=button.textContent,originalValue=option.value,handler=button.getAttribute('onclick');
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(option.textContent,expectedOption,tool+' select label');
  assert.equal(button.textContent,expectedButton,tool+' button');
  assert.equal(option.value,originalValue,'explicit selection value unchanged');
  assert.equal(input.value,'private-entry','private input unchanged');
  assert.equal(button.getAttribute('onclick'),handler,'click handler unchanged');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(option.textContent,originalOption,'option restored');
  assert.equal(button.textContent,originalButton,'button restored');
  assert.equal(option.value,originalValue,'option selection preserved');
 }
});

test('Sprint A implicit option value remains the original German storage key',()=>{
 const {document}=parseHTML('<main id="main-content"><select id="tag"><option>⚠️ Zerbrechlich</option></select></main>');
 const option=document.querySelector('option'),select=document.querySelector('select');
 assert.equal(option.hasAttribute('value'),false);
 applyToolInterfaceLocale(document,'moving','en');
 assert.equal(option.textContent,'⚠️ Fragile');
 assert.equal(option.getAttribute('value'),'⚠️ Zerbrechlich','English label does not become stored tag value');
 assert.equal(option.hasAttribute('value'),true,'implicit option receives stable original value during English display');
 applyToolInterfaceLocale(document,'moving','de');
 assert.equal(option.textContent,'⚠️ Zerbrechlich');
 assert.equal(option.hasAttribute('value'),false,'implicit value restored');
});


test('Sprint A household finance displays English separators and restores German values without data writes',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const match=html.match(/function formatHouseholdDisplayAmount\(value\) \{([\s\S]*?)\n        \}/);
 assert.ok(match,'isolated, presentation-only household amount formatter exists');
 const format=new Function('window','value',match[1]);
 assert.equal(format({__toolyaUILocale:'en'},1234.5),'1,234.50');
 assert.equal(format({__toolyaUILocale:'de'},1234.5),'1234.50','legacy German rendering retained');
 assert.equal(format({__toolyaUILocale:'en'},0),'0.00');
 assert.equal(format({__toolyaUILocale:'en'},-1020.4),'-1,020.40');
 assert.equal(html.includes("cashflowChartInstance.data.labels = [window.__toolyaUILocale === 'en' ? 'Income'"),true,'chart labels refresh on locale change');
 for(const expression of [
  'formatHouseholdDisplayAmount(totalIncome)','formatHouseholdDisplayAmount(totalExpense)',
  'formatHouseholdDisplayAmount(balance)','formatHouseholdDisplayAmount(item.price)',
  'formatHouseholdDisplayAmount(zeitwert)','formatHouseholdDisplayAmount(share)',
  'formatHouseholdDisplayAmount(totalZeitwert)','formatHouseholdDisplayAmount(g.current)',
  'formatHouseholdDisplayAmount(g.target)','formatHouseholdDisplayAmount(c.price)'
 ]) assert.ok(html.includes(expression),'display-only amount reference: '+expression);
 assert.match(html,/householdReadyForLocaleRefresh\) return;/,'locale switch still guarded against unloaded household');
 assert.match(html,/item\.price \* \(1 - \(ageYears \/ \(item\.lifespan \|\| 5\)\)\)/,'original remaining-value formula remains intact');
});


test('Sprint A household chart categories use English labels only at render time',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const match=html.match(/function formatHouseholdCategoryLabel\(category\) \{([\s\S]*?)\n        \}/);
 assert.ok(match,'category display formatter available');
 const translate=new Function('window','category',match[1]);
 assert.equal(translate({__toolyaUILocale:'en'},'Lebensmittel'),'Groceries');
 assert.equal(translate({__toolyaUILocale:'en'},'Verträge'),'Contracts');
 assert.equal(translate({__toolyaUILocale:'de'},'Lebensmittel'),'Lebensmittel');
 assert.equal(translate({__toolyaUILocale:'en'},'Custom user category'),'Custom user category');
 assert.ok(html.includes('catLabels.map(formatHouseholdCategoryLabel)'),'chart axis labels localized');
 assert.ok(html.includes("formatHouseholdCategoryLabel(category) + ': ' + formatChartAmount(amount)"),'accessible summary matches chart labels');
 assert.ok(html.includes('categoryExpenses[r.category]'),'saved category keys remain original');
 assert.ok(html.includes('const defaultCategories = ["Lebensmittel", "Wohnen", "Energie", "Auto", "Freizeit", "Elektronik", "Gesundheit", "Verträge", "Sonstiges"]'),'original category keys unchanged');
});


test('Sprint A plant ROI and dashboard numeric displays keep stored values untouched',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/plants/index.html',import.meta.url),'utf8');
 const match=html.match(/function formatPlantDisplayNumber\(value, decimals = 2\) \{([\s\S]*?)\n        \}/);
 assert.ok(match,'pure number display helper present');
 const format=new Function('window','value','decimals',match[1]);
 assert.equal(format({__toolyaUILocale:'en'},1234.5,2),'1,234.50');
 assert.equal(format({__toolyaUILocale:'de'},1234.5,2),'1234.50');
 assert.equal(format({__toolyaUILocale:'en'},1.5,1),'1.5');
 assert.equal(format({__toolyaUILocale:'en'},-1250.4,2),'-1,250.40');
 for(const source of [
  'formatPlantDisplayNumber(profit)',
  'formatPlantDisplayNumber(totalKg)',
  'formatPlantDisplayNumber(harvestValue)',
  'formatPlantDisplayNumber(expenses)',
  'formatPlantDisplayNumber(cur/1000, 1)',
  'formatPlantDisplayNumber(totalWaterTodayMl / 1000, 1)',
  'formatPlantDisplayNumber(totalKg, 1)'
 ]) assert.ok(html.includes(source),'localized displayed value: '+source);
 assert.ok(html.includes('let profit = harvestValue - expenses;'),'underlying ROI formula intact');
 assert.ok(html.includes('const totalGrams = Number.isFinite(storedGrams)'),'stored harvest still read as numeric data');
});

test('Sprint A baking calculation displays localize without modifying machine-readable factor',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/baking/index.html',import.meta.url),'utf8');
 const match=html.match(/function formatBakingDisplayNumber\(value, decimals = 2\) \{([\s\S]*?)\n        \}/);
 assert.ok(match,'pure baking display helper present');
 const format=new Function('window','value','decimals',match[1]);
 assert.equal(format({__toolyaUILocale:'en'},1234.5,2),'1,234.50');
 assert.equal(format({__toolyaUILocale:'de'},1234.5,2),'1234.50');
 assert.equal(format({__toolyaUILocale:'en'},2.35,1),'2.4');
 assert.ok(html.includes("document.getElementById('res-time').innerText = adjTime + (window.__toolyaUILocale === 'en' ? ' min' : ' Min.');"));
 assert.ok(html.includes("document.getElementById('res-cost').innerText = formatBakingDisplayNumber(matCost) + ' €';"));
 assert.ok(html.includes("const sliceWidth = formatBakingDisplayNumber((Math.PI * targetD) / count, 1);"));
 assert.ok(html.includes("document.getElementById('res-factor').innerText = factor.toFixed(2);"),'factor stays parseable');
 assert.ok(html.includes("parseFloat(document.getElementById('res-factor').innerText)"),'recipe calculator still parses original factor');
});


test('Sprint A plant locale change refreshes only visible read-only panels',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/plants/index.html',import.meta.url),'utf8');
 const start=html.indexOf("document.addEventListener('toolya:locale-change'");
 const end=html.indexOf('const mischkulturDb =',start);
 assert.ok(start>0&&end>start);
 const updates={};
 const record=name=>{updates[name]=(updates[name]||0)+1;};
 const panels=new Set(['roiModal','cisternModal','beetModal','galleryModal']);
 const handler={};
 const context={
  plantsCloudReady:true,
  document:{
   addEventListener:(name,fn)=>handler[name]=fn,
   getElementById:id=>id==='plantPotSize'?{value:'18'}:id==='waterMlHint'?{innerText:''}:id==='galleryPlantId'?{value:'7'}:panels.has(id)?{classList:{contains:()=>false}}:null
  },
  renderGardenCalendar:()=>record('calendar'),calculateWaterAmount:()=>record('water'),
  renderApp:()=>record('cards'),renderSeedList:()=>record('seeds'),
  renderInventoryList:()=>record('inventory'),calculateRoiValues:()=>record('roi'),
  updateCisternDisplay:()=>record('cistern'),renderBeetGrid:()=>record('bed'),
  renderGalleryGrid:id=>{assert.equal(id,7);record('gallery');}
 };
 createContext(context);runInContext(html.slice(start,end),context);
 handler['toolya:locale-change']();
 for(const name of ['calendar','water','cards','roi','cistern','bed','gallery'])
  assert.equal(updates[name],1,'visible read-only panel refreshed: '+name);
 assert.equal(updates.seeds,1,'open seeds list refreshed');
 assert.equal(updates.inventory,1,'open inventory refreshed');
 context.plantsCloudReady=false;
 handler['toolya:locale-change']();
 assert.equal(updates.calendar,2);
 assert.equal(updates.cards,1,'unloaded plant data must not render');
 assert.equal(updates.roi,1,'unloaded ROI must not render');
 assert.equal(updates.gallery,1,'unloaded gallery must not render');
 const region=html.slice(start,end);
 assert.ok(!region.includes('saveData(')&&!region.includes('localStorage.setItem('),'locale change does not persist data');
});


test('Sprint A companion planting advice recognizes English names and restores German without editing species input',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/plants/index.html',import.meta.url),'utf8');
 const dataStart=html.indexOf('const mischkulturDb = {');
 const dataEnd=html.indexOf("document.addEventListener('DOMContentLoaded'",dataStart);
 const functionStart=html.indexOf('function checkCompanionPlanting(speciesName) {');
 const functionEnd=html.indexOf('function calculateWaterAmount() {',functionStart);
 assert.ok(dataStart>0&&dataEnd>dataStart&&functionStart>0&&functionEnd>functionStart);
 const classNames=new Set(['hidden']);
 const hint={innerHTML:'',classList:{add:name=>classNames.add(name),remove:name=>classNames.delete(name)}};
 const species={value:'Tomato'};
 const context={window:{__toolyaUILocale:'en'},document:{getElementById:id=>id==='companionAlertBox'?hint:id==='plantSpecies'?species:null}};
 createContext(context);
 runInContext(html.slice(dataStart,dataEnd).split("document.addEventListener('DOMContentLoaded'")[0],context);
 runInContext(html.slice(functionStart,functionEnd),context);
 runInContext('checkCompanionPlanting("Tomato")',context);
 assert.match(hint.innerHTML,/Grows well alongside basil, lettuce, garlic, carrots/);
 assert.match(hint.innerHTML,/Avoid potatoes, fennel, peas/);
 assert.equal(classNames.has('hidden'),false);
 assert.equal(species.value,'Tomato','species input is untouched');
 context.window.__toolyaUILocale='de';
 runInContext('checkCompanionPlanting("Tomato")',context);
 assert.match(hint.innerHTML,/Liebt Nachbarschaft mit Basilikum, Salat, Knoblauch, Karotten/);
 assert.equal(species.value,'Tomato','language change never rewrites the species');
 context.window.__toolyaUILocale='en';
 runInContext('checkCompanionPlanting("strawberry")',context);
 assert.match(hint.innerHTML,/garlic, spinach, lettuce/);
 runInContext('checkCompanionPlanting("unknown species")',context);
 assert.equal(classNames.has('hidden'),true,'unknown user species do not produce made-up advice');
 assert.ok(html.includes("if (companionBox && !companionBox.classList.contains('hidden'))"),'only shown hint refreshes');
 const listenerStart=html.indexOf("document.addEventListener('toolya:locale-change'");
 const listenerEnd=html.indexOf('const mischkulturDb',listenerStart);
 const listener=html.slice(listenerStart,listenerEnd);
 assert.ok(listener.includes("checkCompanionPlanting(document.getElementById('plantSpecies')?.value || '')"));
 assert.ok(!listener.includes('saveData(')&&!listener.includes('localStorage.setItem('),'language change makes no data writes');
});


test('Sprint A baking locale switch refreshes existing helper results without saving recipes',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/baking/index.html',import.meta.url),'utf8');
 const start=html.indexOf("document.addEventListener('toolya:locale-change'");
 const end=html.indexOf('// Initialisierung beim Laden',start);
 assert.ok(start>0&&end>start);
 const refreshed=[];
 const nodes={
  'sugar-result':{innerText:'Old result'},
  'climate-result':{innerText:'Old climate'},
  'finder-results':{innerHTML:'Old finder'}
 };
 const handlers={};
 const context={
  bakingCloudReady:false,
  document:{addEventListener:(key,fn)=>handlers[key]=fn,getElementById:id=>nodes[id]||null},
  calculateAll:()=>refreshed.push('calculate'),
  updateTimerDisplay:()=>refreshed.push('timer'),
  calculateSugar:()=>refreshed.push('sugar'),
  checkClimate:()=>refreshed.push('climate'),
  runFormFinder:()=>refreshed.push('finder'),
  renderSavedRecipes:()=>{throw Error('Cloud render forbidden without ready session');},
  calculateRecipe:()=>{throw Error('Would persist a recipe');},
  saveRecipeToStorage:()=>{throw Error('Recipe persistence forbidden');}
 };
 createContext(context);runInContext(html.slice(start,end),context);
 handlers['toolya:locale-change']();
 assert.deepEqual(refreshed,['calculate','timer','sugar','climate','finder']);
 refreshed.length=0;
 nodes['sugar-result'].innerText='';
 nodes['climate-result'].innerText='';
 nodes['finder-results'].innerHTML='';
 handlers['toolya:locale-change']();
 assert.deepEqual(refreshed,['calculate','timer'],'empty/unopened helper results stay untouched');
 const listener=html.slice(start,end);
 assert.ok(!/^\s*calculateRecipe\(\);/m.test(listener)&&!listener.includes('saveRecipeToStorage(')&&!listener.includes('localStorage.setItem('),'locale changes never persist recipes');
});
