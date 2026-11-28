import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {applyToolInterfaceLocale,translateToolDialog,translateAccountStatus,translateToolRuntimeStatus} from '../../shared/toolya/i18n/interface.mjs';

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
  assert.match(html,tool==='plants' ? /toLocaleDateString\(exportEnglish \? 'en-GB' : 'de-DE'\)/ : /toLocaleDateString\((?:window\.__toolyaUILocale|exportLanguage) === 'en' \? 'en-GB' : 'de-DE'\)/,'PDF date format in '+tool);
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
 assert.ok(html.includes("const name = document.getElementById('recipe-name').value || (window.__toolyaUILocale === 'en' ? 'Untitled recipe' : 'Unbenanntes Rezept');"),'new unnamed recipe uses the selected locale while named recipes stay verbatim');
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
 assert.match(html,/if \(plantsCloudReady\) \{ loadLocationDropdown\(\); renderApp\(\); \}/,'switching locale refreshes locations and cards only when cloud data is ready');
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
 assert.match(html,/if \(movingCloudReady && document\.getElementById\('inventoryContainer'\)\) renderInventory\(\)/);
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
  assert.ok(saveLine && (saveLine.includes("window.__toolyaUILocale === 'en'") || (tool==='plants' && saveLine.includes('exportEnglish ?')) || ((tool==='moving'||tool==='housemates') && saveLine.includes("exportLanguage === 'en'"))),tool+': filename is locale-specific');
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
  "value === 'Allesesser' ? 'Omnivore'","value === 'Keine' ? 'None' : value",
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
 assert.match(html,/escapeUserHtml\(dietDisplay\(info\.pref\)\)/,'translated diet defaults remain escaped');
 assert.match(html,/escapeUserHtml\(dietDisplay\(info\.allergy\)\)/,'translated allergy defaults remain escaped');
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
  const start=html.indexOf(tool==='moving'?'let userDisplayRequest = 0;':'async function '+method+'() {');
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
 assert.match(homepage,/toolyaAuth\?\.forClient\(window\.supabaseClient\) \|\| window\.supabaseClient\.auth\)\.resetPasswordForEmail\(email,/,'existing one-time recovery email flow is retained');
 assert.match(homepage,/toolyaAuth\?\.forClient\(window\.supabaseClient\) \|\| window\.supabaseClient\.auth\)\.updateUser\(\{ password: newPassword \}\)/,'password update remains in central account flow');
 assert.match(homepage,/if \(!passwordRecoveryActive\)/,'recovery panel requires active recovery state');
 assert.match(homepage,/first\.value\.length < 8 \|\| first\.value !== second\.value/,'password confirmation is required');
 assert.match(homepage,/redirectTo: "https:\/\/toolya\.app\/index\.html"/,'the recovery token targets the central account page');
 const {runInNewContext}=await import('node:vm');
 for(const [search,saved,expected] of [
  ['?lang=en','de','../../index.html?auth=required&lang=en'],
  ['?lang=de','en','../../index.html?auth=required'],
  ['','en','../../index.html?auth=required&lang=en'],
  ['',null,'../../index.html?auth=required'],
 ]){
  let destination;
  const window={
   location:{search,replace:value=>{destination=value}},
   localStorage:{getItem:()=>saved},
   supabase:{createClient:()=>({auth:{getUser:()=>Promise.resolve({data:{user:null}}),onAuthStateChange(){}}})},
  };
  runInNewContext(authGate,{
   window,URLSearchParams,document:{documentElement:{},addEventListener(){}},
   setTimeout:()=>1,clearTimeout() {},
  });
  await Promise.resolve();
  assert.equal(destination,expected);
 }
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
 assert.ok(Object.values(catalog).reduce((n,m)=>n+Object.keys(m).length,0)>=37,'existing guidance translations must not be removed');
 for(const tool of ['moving','housemates','plants','baking']){
  const html=await readFile(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  for(const [de,en] of Object.entries(catalog[tool])){
   assert.ok(html.includes(de),'missing source guidance in '+tool+': '+de);
   assert.ok(en&&en!==de,'untranslated guidance: '+de);
  }
 }
 assert.match(source,/document\.querySelectorAll\('#main-content p,\.ty-tool-hero-copy p,#frostBanner p,#guideSection p'\)/);
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
 assert.equal(Object.values(catalog).reduce((n,pairs)=>n+pairs.length,0),18);
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
 assert.equal(html.split(englishFormat).length-1,5,'five inventory screen values use English formatting');
 for(const value of ['totalVal','locVal','tagVal','b.value || 0'])
  assert.ok(html.includes('Number('+value+').'+englishFormat),'English formatting covers '+value);
 assert.ok(html.includes("b.expiry.split('-').reverse().join(window.__toolyaUILocale === 'en' ? '/' : '.')"),'expiry date uses the active language separator');
 assert.ok(html.includes("Number(item.value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })"),'English subitem preview uses locale formatting');
 assert.ok(html.includes(": Number(item.value || 0).toFixed(2)"),'German subitem preview keeps existing formatting');
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
 const match=html.match(/function formatHouseholdCategoryLabel\(category, isEnglish = window\.__toolyaUILocale === 'en'\) \{([\s\S]*?)\n        \}/);
 assert.ok(match,'category display formatter available');
 const translate=new Function('window','category','isEnglish = window.__toolyaUILocale === \'en\'',match[1]);
 assert.equal(translate({__toolyaUILocale:'en'},'Lebensmittel'),'Groceries');
 assert.equal(translate({__toolyaUILocale:'en'},'Verträge'),'Contracts');
 assert.equal(translate({__toolyaUILocale:'de'},'Lebensmittel'),'Lebensmittel');
 assert.equal(translate({__toolyaUILocale:'en'},'Custom user category'),'Custom user category');
 assert.ok(html.includes('catLabels.map(category => formatHouseholdCategoryLabel(category))'),'chart axis labels localized');
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
 const match=html.match(/function formatBakingDisplayNumber\(value, decimals = 2, minimumDecimals = decimals\) \{([\s\S]*?)\n        \}/);
 assert.ok(match,'pure baking display helper present');
 const locale={__toolyaUILocale:'en'};
 const format=new Function('window','return ('+match[0]+');')(locale);
 assert.equal(format(1234.5,2),'1,234.50');
 locale.__toolyaUILocale='de';
 assert.equal(format(1234.5,2),'1.234,50');
 locale.__toolyaUILocale='en';
 assert.equal(format(2.35,1),'2.4');
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
  loadLocationDropdown:()=>record('locations'),renderApp:()=>record('cards'),renderSeedList:()=>record('seeds'),
  renderInventoryList:()=>record('inventory'),calculateRoiValues:()=>record('roi'),
  updateCisternDisplay:()=>record('cistern'),renderBeetGrid:()=>record('bed'),
  renderGalleryGrid:id=>{assert.equal(id,7);record('gallery');}
 };
 createContext(context);runInContext(html.slice(start,end),context);
 handler['toolya:locale-change']();
 for(const name of ['calendar','water','locations','cards','roi','cistern','bed','gallery'])
  assert.equal(updates[name],1,'visible read-only panel refreshed: '+name);
 assert.equal(updates.seeds,1,'open seeds list refreshed');
 assert.equal(updates.inventory,1,'open inventory refreshed');
 context.plantsCloudReady=false;
 handler['toolya:locale-change']();
 assert.equal(updates.calendar,2);
 assert.equal(updates.cards,1,'unloaded plant data must not render');
 assert.equal(updates.locations,1,'unloaded locations must not render');
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


test('Sprint A household budget labels use English presentation without changing category storage keys',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const category=html.match(/function formatHouseholdCategoryLabel\(category, isEnglish = window\.__toolyaUILocale === 'en'\) \{([\s\S]*?)\n        \}/);
 const amount=html.match(/function formatHouseholdDisplayAmount\(value\) \{([\s\S]*?)\n        \}/);
 assert.ok(category&&amount,'display-only formatters present');
 const name=new Function('window','category','isEnglish = window.__toolyaUILocale === \'en\'',category[1]);
 const number=new Function('window','value',amount[1]);
 const english={__toolyaUILocale:'en'},german={__toolyaUILocale:'de'};
 assert.equal(name(english,'Lebensmittel'),'Groceries');
 assert.equal(name(english,'Sonstiges'),'Other');
 assert.equal(name(german,'Lebensmittel'),'Lebensmittel');
 assert.equal(name(english,'My own category'),'My own category');
 assert.equal(number(english,1234.5),'1,234.50');
 assert.equal(number(german,1234.5),'1234.50');
 assert.ok(html.includes('escapeUserHtml(formatHouseholdCategoryLabel(cat))'),'budget category display translated and escaped');
 assert.ok(html.includes('formatHouseholdDisplayAmount(spent)'),'budget spending format localized');
 assert.ok(html.includes('formatHouseholdDisplayAmount(limit)'),'budget target format localized');
 assert.ok(html.includes('const limit = budgets[cat] || 0'),'budget lookups use original keys');
 assert.ok(html.includes('const spent = categoryExpenses[cat] || 0'),'expense lookups use original keys');
});


test('Sprint A plant photo and identifier errors translate without leaking or modifying source errors',()=>{
 const messages=[
  ['Pflanzenfoto konnte nicht verarbeitet werden. Nichts gespeichert.','The plant photo could not be processed. Nothing was saved.'],
  ['Es konnte keine eindeutige Pflanzen-ID erzeugt werden.','Could not generate a unique plant ID.']
 ];
 for(const [original,english] of messages){
  assert.equal(translateToolDialog('plants','en',original),english);
  assert.equal(translateToolDialog('plants','de',original),original,'German original unchanged');
 }
 assert.equal(translateToolDialog('plants','en','Custom server diagnostic 123'),'Custom server diagnostic 123','unknown error messages untouched');
});


test('Sprint A household settlement and receipt values use localized display only',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const match=html.match(/function formatHouseholdDisplayAmount\(value\) \{([\s\S]*?)\n        \}/);
 assert.ok(match,'household display formatter exists');
 const format=new Function('window','value',match[1]);
 assert.equal(format({__toolyaUILocale:'en'},1234.5),'1,234.50');
 assert.equal(format({__toolyaUILocale:'de'},1234.5),'1234.50');
 assert.equal(format({__toolyaUILocale:'en'},-25.5),'-25.50');
 assert.ok(html.includes('${formatHouseholdDisplayAmount(s.amount)} €'),'settlement display uses locale');
 assert.ok(html.includes('formatHouseholdDisplayAmount(totalVolume) + " €"'),'debt volume uses locale');
 assert.ok(html.includes('${formatHouseholdDisplayAmount(r.price)} €</strong>'),'receipt display uses locale');
 assert.ok(html.includes("r.payer || (window.__toolyaUILocale === 'en' ? 'Private' : 'Privat')"),'only fallback payer label translates');
 assert.ok(html.includes('const share = amount / splitWith.length;'),'debt calculation remains unchanged');
 assert.ok(html.includes('transactions.push({ from: debtor.name, to: creditor.name, amount: min })'),'settlement amounts stay numeric');
 assert.ok(html.includes('data.unshift({ id: Date.now(), title, store, date, price, category, payer, isFixkosten, isTax, entryType, splitWith })'),'receipt payload unchanged');
 assert.ok(html.includes('escapeUserHtml(r.payer ||'),'payer still HTML escaped');
});


test('Sprint A moving help toggle follows language and visibility without replacing controls',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/moving/index.html',import.meta.url),'utf8');
 const a=html.indexOf('function updateMovingHelpToggleLabel() {');
 const b=html.indexOf('let movingCloudController',a);
 assert.ok(a>0&&b>a,'moving help display functions are available');
 const flags=new Set(['hidden']),label={textContent:''};
 const box={classList:{
  contains:name=>flags.has(name),
  toggle:name=>flags.has(name)?flags.delete(name):flags.add(name)
 }};
 const context={window:{__toolyaUILocale:'de'},document:{
  getElementById:id=>id==='helpBox'?box:null,
  querySelector:selector=>selector==='#helpToggleBtn span'?label:null
 }};
 createContext(context);runInContext(html.slice(a,b),context);
 runInContext('updateMovingHelpToggleLabel()',context);
 assert.equal(label.textContent,'Hilfe & Anleitung anzeigen');
 context.window.__toolyaUILocale='en';
 runInContext('updateMovingHelpToggleLabel()',context);
 assert.equal(label.textContent,'Show help and guide');
 runInContext('toggleHelp()',context);
 assert.equal(flags.has('hidden'),false);
 assert.equal(label.textContent,'Hide help and guide');
 context.window.__toolyaUILocale='de';
 runInContext('updateMovingHelpToggleLabel()',context);
 assert.equal(label.textContent,'Hilfe & Anleitung ausblenden');
 runInContext('toggleHelp()',context);
 assert.equal(flags.has('hidden'),true);
 assert.equal(label.textContent,'Hilfe & Anleitung anzeigen');
 assert.match(html,/document\.addEventListener\('toolya:locale-change', \(\) => \{\s*updateMovingHelpToggleLabel\(\)/,'language event updates help label');
 assert.match(html,/id="helpToggleBtn"[^>]*>[\s\S]*?<span>Hilfe & Anleitung anzeigen<\/span>/,'original markup and click binding remain');
 assert.ok(!html.slice(a,b).includes('innerHTML'),'help toggle does not replace nested DOM elements');
});

test('Sprint A household budget editor translates labels but keeps persisted category attributes',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const start=html.indexOf('function openBudgetModal()');
 const end=html.indexOf('function closeBudgetModal()',start);
 const modal=html.slice(start,end);
 assert.ok(modal.includes('escapeUserHtml(formatHouseholdCategoryLabel(cat))'),'budget editor uses display translation');
 assert.ok(modal.includes('data-cat="${escapeUserHtml(cat)}"'),'original category key remains on input');
 assert.ok(modal.includes('value="${escapeUserHtml(budgets[cat] || 0)}"'),'stored budget value displayed without mutation');
 assert.ok(html.includes("budgets[input.getAttribute('data-cat')] = parseFloat(input.value) || 0"),'save still uses original category IDs');
 const mapping=html.match(/function formatHouseholdCategoryLabel\(category, isEnglish = window\.__toolyaUILocale === 'en'\) \{([\s\S]*?)\n        \}/);
 const format=new Function('window','category','isEnglish = window.__toolyaUILocale === \'en\'',mapping[1]);
 assert.equal(format({__toolyaUILocale:'en'},'Wohnen'),'Housing');
 assert.equal(format({__toolyaUILocale:'de'},'Wohnen'),'Wohnen');
});


test('Sprint A open household budget labels switch language in place and retain unsaved values',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const category=html.match(/function formatHouseholdCategoryLabel\(category, isEnglish = window\.__toolyaUILocale === 'en'\) \{([\s\S]*?)\n        \}/);
 const a=html.indexOf('function refreshOpenBudgetLabels() {');
 const b=html.indexOf('function openBudgetModal()',a);
 assert.ok(category&&a>0&&b>a,'locale-aware budget label updater available');
 const {document}=parseHTML('<div id="budgetModal"><div id="budgetInputList"><div><label for="budget-amount-0">Lebensmittel:</label><input id="budget-amount-0" type="number" data-cat="Lebensmittel" value="150"></div><div><label for="budget-amount-1">Wohnen:</label><input id="budget-amount-1" type="number" data-cat="Wohnen" value="900"></div></div></div>');
 const inputs=[...document.querySelectorAll('#budgetInputList input')];
 inputs[0].value='175';
 inputs[1].value='925';
 const context={window:{__toolyaUILocale:'en'},document};
 createContext(context);
 runInContext("function formatHouseholdCategoryLabel(category, isEnglish = window.__toolyaUILocale === 'en') {"+category[1]+'\n}',context);
 runInContext(html.slice(a,b),context);
 runInContext('refreshOpenBudgetLabels()',context);
 assert.deepEqual([...document.querySelectorAll('#budgetInputList label')].map(x=>x.textContent),['Groceries:','Housing:']);
 assert.deepEqual(inputs.map(x=>x.value),['175','925'],'unsaved input values retained');
 assert.deepEqual(inputs.map(x=>x.getAttribute('data-cat')),['Lebensmittel','Wohnen'],'original storage keys retained');
 context.window.__toolyaUILocale='de';
 runInContext('refreshOpenBudgetLabels()',context);
 assert.deepEqual([...document.querySelectorAll('#budgetInputList label')].map(x=>x.textContent),['Lebensmittel:','Wohnen:']);
 assert.equal(document.querySelector('#budgetInputList input'),inputs[0],'form inputs are never recreated');
 document.getElementById('budgetModal').classList.add('hidden');
 context.window.__toolyaUILocale='en';
 runInContext('refreshOpenBudgetLabels()',context);
 assert.equal(document.querySelector('#budgetInputList label').textContent,'Lebensmittel:','closed modal not touched');
 const listenerStart=html.indexOf("document.addEventListener('toolya:locale-change'");
 const listenerEnd=html.indexOf('/* Storage Helper */',listenerStart);
 const listener=html.slice(listenerStart,listenerEnd);
 assert.ok(listener.includes('refreshOpenBudgetLabels()'),'language change refreshes budget label');
 assert.ok(!listener.includes('saveBudgets(')&&!listener.includes('localStorage.setItem('),'language change is read-only');
});


test('Sprint A household cooking weekdays localize without modifying original plan or unsaved edits',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const start=html.indexOf('function formatHouseholdWeekday(day) {');
 const end=html.indexOf('function renderCookingPlan()',start);
 assert.ok(start>0&&end>start,'weekday rendering helpers present');
 const {document}=parseHTML('<div id="cookingModal"><div id="cookingInputList"><div><span data-cooking-day="Montag">Montag</span><select class="chefSelect"><option value="Frei">Frei</option><option value="Anna" selected>Anna</option></select><input class="dishInput" placeholder="Gericht" value="Linsensuppe"><input class="ingredientsInput" placeholder="Zutaten (kommagetrennt)" value="Linsen, Kartoffeln"></div><div><span data-cooking-day="Dienstag">Dienstag</span><input class="dishInput" value="Pasta"></div></div></div>');
 const context={window:{__toolyaUILocale:'en'},document};
 createContext(context);
 runInContext(html.slice(start,end),context);
 assert.equal(runInContext('formatHouseholdWeekday("Montag")',context),'Monday');
 assert.equal(runInContext('formatHouseholdWeekday("Sonntag")',context),'Sunday');
 assert.equal(runInContext('formatHouseholdWeekday("My custom day")',context),'My custom day');
 runInContext('refreshOpenCookingDayLabels()',context);
 assert.deepEqual([...document.querySelectorAll('[data-cooking-day]')].map(x=>x.textContent),['Monday','Tuesday']);
 assert.equal(document.querySelector('.dishInput').value,'Linsensuppe','dish draft not overwritten');
 assert.equal(document.querySelector('.ingredientsInput').value,'Linsen, Kartoffeln','ingredients draft not overwritten');
 assert.equal(document.querySelector('option[value="Frei"]').textContent,'Unassigned');
 assert.equal(document.querySelector('option[value="Frei"]').value,'Frei','stored chef default remains German');
 assert.equal(document.querySelector('option[value="Anna"]').selected,true,'selected chef is unchanged');
 assert.equal(document.querySelector('.dishInput').placeholder,'Dish');
 assert.equal(document.querySelector('.ingredientsInput').placeholder,'Ingredients (comma-separated)');
 assert.deepEqual([...document.querySelectorAll('[data-cooking-day]')].map(x=>x.getAttribute('data-cooking-day')),['Montag','Dienstag'],'original weekday keys retained');
 context.window.__toolyaUILocale='de';
 runInContext('refreshOpenCookingDayLabels()',context);
 assert.deepEqual([...document.querySelectorAll('[data-cooking-day]')].map(x=>x.textContent),['Montag','Dienstag']);
 assert.equal(document.querySelector('option[value="Frei"]').textContent,'Frei');
 assert.equal(document.querySelector('.dishInput').placeholder,'Gericht');
 assert.equal(document.querySelector('.ingredientsInput').placeholder,'Zutaten (kommagetrennt)');
 document.getElementById('cookingModal').classList.add('hidden');
 context.window.__toolyaUILocale='en';
 runInContext('refreshOpenCookingDayLabels()',context);
 assert.equal(document.querySelector('[data-cooking-day]').textContent,'Montag','closed editor remains unchanged');
 assert.equal(document.querySelector('option[value="Frei"]').textContent,'Frei','closed selector remains unchanged');
 assert.equal(document.querySelector('.dishInput').placeholder,'Gericht','closed placeholders remain unchanged');
 assert.ok(html.includes('escapeUserHtml(formatHouseholdWeekday(p.day))'),'display labels use weekday formatter');
 assert.ok(html.includes('data-cooking-day="${escapeUserHtml(p.day)}"'),'editor retains original source day');
 assert.ok(html.includes('refreshOpenCookingDayLabels();'),'locale event triggers in-place update');
 assert.ok(html.includes('p.chef = chefs[idx].value; p.dish = dishes[idx].value.trim(); p.ingredients = ingredients[idx].value.trim();'),'stored plan is unchanged');
});


test('Sprint A household diet editor reverses placeholders without touching draft diet fields',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const start=html.indexOf('function refreshOpenDietPlaceholders() {');
 const end=html.indexOf('function openDietModal()',start);
 assert.ok(start>0&&end>start,'diet display helper available');
 const {document}=parseHTML('<div id="dietModal"><div id="dietInputContainer"><input class="dietPref" data-mate="Anna" placeholder="Ernährung" value="Vegetarisch"><input class="dietAllergy" data-mate="Anna" placeholder="Allergien" value="Nüsse"></div></div>');
 const preference=document.querySelector('.dietPref'),allergy=document.querySelector('.dietAllergy');
 preference.value='Vegan';
 allergy.value='Sesam';
 const context={window:{__toolyaUILocale:'en'},document};
 createContext(context);runInContext(html.slice(start,end),context);
 runInContext('refreshOpenDietPlaceholders()',context);
 assert.equal(preference.placeholder,'Diet');
 assert.equal(allergy.placeholder,'Allergies');
 assert.equal(preference.value,'Vegan');
 assert.equal(allergy.value,'Sesam');
 assert.equal(preference.getAttribute('data-mate'),'Anna');
 context.window.__toolyaUILocale='de';
 runInContext('refreshOpenDietPlaceholders()',context);
 assert.equal(preference.placeholder,'Ernährung');
 assert.equal(allergy.placeholder,'Allergien');
 assert.equal(document.querySelector('.dietPref'),preference,'input DOM node unchanged');
 document.getElementById('dietModal').classList.add('hidden');
 context.window.__toolyaUILocale='en';
 runInContext('refreshOpenDietPlaceholders()',context);
 assert.equal(preference.placeholder,'Ernährung','closed editor stays untouched');
 const listenerStart=html.indexOf("document.addEventListener('toolya:locale-change'");
 const listenerEnd=html.indexOf('/* Storage Helper */',listenerStart);
 const listener=html.slice(listenerStart,listenerEnd);
 assert.ok(listener.includes('if (!householdReadyForLocaleRefresh) return;'),'cloud-ready check retained');
 assert.ok(listener.includes('refreshOpenDietPlaceholders();'),'language change refreshes diet placeholders');
 assert.ok(!listener.includes('saveDiets(')&&!listener.includes('localStorage.setItem('),'locale switch does not save diets');
});


test('Sprint A baking stored recipe labels change in place without losing unsaved note edits',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/baking/index.html',import.meta.url),'utf8');
 const begin=html.indexOf('function refreshSavedRecipeLocale() {');
 const end=html.indexOf('async function saveNote(idx, note)',begin);
 assert.ok(begin>0&&end>begin,'read-only recipe label refresh exists');
 const {document}=parseHTML('<div id="saved-recipes-list"><div><p data-recipe-factor><span data-recipe-factor-label>Faktor</span>: ×1.50 | <span data-recipe-date-source="21.11.2026">21.11.2026</span></p><button data-recipe-delete>Löschen</button><label data-recipe-note-label>Geling-Protokoll / Notiz:</label><input data-recipe-note-input placeholder="Z.B. Nächstes Mal 5 Min weniger backen..." value="Original saved note"></div></div>');
 const input=document.querySelector('[data-recipe-note-input]'),factor=document.querySelector('[data-recipe-factor]');
 input.value='Unsaved edit in progress';
 const context={document,window:{__toolyaUILocale:'en'},bakingCloudReady:true};
 createContext(context);
 const dateBegin=html.indexOf('function displaySavedRecipeDate(');
 const dateEnd=html.indexOf('function renderSavedRecipes()',dateBegin);
 assert.ok(dateBegin>0&&dateEnd>dateBegin);
 runInContext(html.slice(dateBegin,dateEnd),context);
 runInContext(html.slice(begin,end),context);
 const dateNode=document.querySelector('[data-recipe-date-source]');
 runInContext('refreshSavedRecipeLocale()',context);
 assert.equal(factor.textContent,'Factor: ×1.50 | 21/11/2026');
 assert.equal(dateNode.getAttribute('data-recipe-date-source'),'21.11.2026');
 assert.equal(document.querySelector('[data-recipe-delete]').textContent,'Delete');
 assert.equal(document.querySelector('[data-recipe-note-label]').textContent,'Baking notes:');
 assert.equal(input.placeholder,'e.g. bake 5 minutes less next time…');
 assert.equal(input.value,'Unsaved edit in progress');
 assert.equal(document.querySelector('[data-recipe-note-input]'),input,'note input not replaced');
 context.window.__toolyaUILocale='de';
 runInContext('refreshSavedRecipeLocale()',context);
 assert.equal(factor.textContent,'Faktor: ×1.50 | 21.11.2026');
 assert.equal(document.querySelector('[data-recipe-date-source]'),dateNode,'date node not replaced');
 assert.equal(input.value,'Unsaved edit in progress');
 assert.equal(document.querySelector('[data-recipe-delete]').textContent,'Löschen');
 const locale=html.slice(html.indexOf("document.addEventListener('toolya:locale-change'"),html.indexOf('// Initialisierung beim Laden'));
 assert.ok(locale.includes('if (bakingCloudReady) refreshSavedRecipeLocale();'));
 assert.ok(!locale.includes('renderSavedRecipes();')&&!locale.includes('persistRecipes('),'locale change never rebuilds/saves recipe inputs');
 assert.match(html,/data-recipe-delete>\$\{window\.__toolyaUILocale/,'delete button has a valid opening tag and localized label');
});

test('Sprint A moving tags translate display labels and options but retain the original values',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/moving/index.html',import.meta.url),'utf8');
 const start=html.indexOf('function formatMovingTagLabel(');
 const end=html.indexOf('function loadLocationsDropdown()',start);
 assert.ok(start>0&&end>start);
 const {document}=parseHTML('<select id="tagFilter"><option value="">Alle Tags</option><option value="Zerbrechlich">Zerbrechlich</option><option value="Wertvoll">Wertvoll</option></select><select id="boxTag"><option value="Standard">🏷️ Standard</option><option value="Saison">❄️ Saison / Deko</option></select><select id="editBoxTag"><option value="Wertvoll">💎 Wertvoll</option></select>');
 const filter=document.getElementById('tagFilter'),box=document.getElementById('boxTag');
 const filterChosen=filter.querySelector('option[value="Wertvoll"]');
 const boxChosen=box.querySelector('option[value="Saison"]');
 filterChosen.setAttribute('selected','');boxChosen.setAttribute('selected','');
 const context={window:{__toolyaUILocale:'en'},document};
 createContext(context);runInContext(html.slice(start,end),context);
 runInContext('refreshMovingSelectLabels()',context);
 assert.equal(filterChosen.hasAttribute('selected'),true);
 assert.equal(boxChosen.hasAttribute('selected'),true);
 assert.equal(document.querySelector('#tagFilter option[value="Zerbrechlich"]').textContent,'Fragile');
 assert.equal(document.querySelector('#tagFilter option[value="Wertvoll"]').textContent,'Valuable');
 assert.equal(document.querySelector('#boxTag option[value="Saison"]').textContent,'❄️ Seasonal / decoration');
 assert.equal(document.querySelector('#tagFilter option[value=""]').textContent,'All tags');
 assert.equal(runInContext('formatMovingTagLabel("Custom")',context),'Custom');
 context.window.__toolyaUILocale='de';
 runInContext('refreshMovingSelectLabels()',context);
 assert.equal(document.querySelector('#boxTag option[value="Saison"]').textContent,'❄️ Saison / Deko');
 assert.equal(document.querySelector('#tagFilter option[value=""]').textContent,'Alle Tags');
 assert.equal(filterChosen.hasAttribute('selected'),true);
 assert.equal(boxChosen.hasAttribute('selected'),true);
 assert.ok(html.includes('refreshMovingSelectLabels();'),'language event updates existing selectors');
 assert.ok(html.includes('refreshMovingLocationPrompts();'),'location prompt translation does not rebuild selected choices');
 assert.ok(!html.slice(html.indexOf("document.addEventListener('toolya:locale-change'"),html.indexOf('async function exportInventoryPDF()')).includes('loadLocationsDropdown()'),'locale refresh never resets unsaved location selections');
});

test('Sprint A household note and receipt titles change language without resetting draft fields',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const start=html.indexOf('function refreshOpenHouseholdFormTitles() {');
 const end=html.indexOf('function openNoteModal()',start);
 assert.ok(start>0&&end>start);
 const {document}=parseHTML('<div id="noteModal"><h3 id="noteModalTitle"></h3><input id="noteTitleInput" value="Draft note"></div><h3 id="formTitle"></h3><button id="saveBtn"></button><input id="receiptPrice" value="125.40">');
 const note=document.getElementById('noteTitleInput'),price=document.getElementById('receiptPrice');
 note.value='Unsaved note';
 price.value='125.40';
 const context={window:{__toolyaUILocale:'en'},document,editingNoteId:7,editingReceiptId:12,getData:()=>[{id:12,title:'Rent November'}]};
 createContext(context);runInContext(html.slice(start,end),context);
 runInContext('refreshOpenHouseholdFormTitles()',context);
 assert.equal(document.getElementById('noteModalTitle').textContent,'✏️ Edit sticky note');
 assert.equal(document.getElementById('formTitle').textContent,'✏️ Edit transaction: Rent November');
 assert.equal(price.value,'125.40');
 assert.equal(note.value,'Unsaved note');
 context.window.__toolyaUILocale='de';
 runInContext('refreshOpenHouseholdFormTitles()',context);
 assert.equal(document.getElementById('formTitle').textContent,'✏️ Buchung bearbeiten: Rent November');
 context.editingNoteId=null;context.editingReceiptId=null;
 context.window.__toolyaUILocale='en';
 runInContext('refreshOpenHouseholdFormTitles()',context);
 assert.equal(document.getElementById('noteModalTitle').textContent,'✏️ New sticky note');
 assert.equal(document.getElementById('formTitle').textContent,'✍️ Record transaction / receipt');
 assert.equal(note.value,'Unsaved note');
 assert.equal(price.value,'125.40');
 document.getElementById('noteModal').classList.add('hidden');
 context.window.__toolyaUILocale='de';
 runInContext('refreshOpenHouseholdFormTitles()',context);
 assert.equal(document.getElementById('noteModalTitle').textContent,'✏️ New sticky note','closed dialog not refreshed');
 const listener=html.slice(html.indexOf("document.addEventListener('toolya:locale-change'"),html.indexOf('/* Storage Helper */'));
 assert.ok(listener.includes('refreshOpenHouseholdFormTitles();'));
 assert.ok(!listener.includes('saveNote(')&&!listener.includes('saveReceipt('),'locale update read-only');
});

test('Sprint A plant whole-unit cistern and harvest values format English thousands only at display',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/plants/index.html',import.meta.url),'utf8');
 const match=html.match(/function formatPlantDisplayNumber\(value, decimals = 2\) \{([\s\S]*?)\n        \}/);
 assert.ok(match);
 const format=new Function('window','value','decimals',match[1]);
 assert.equal(format({__toolyaUILocale:'en'},12345,0),'12,345');
 assert.equal(format({__toolyaUILocale:'de'},12345,0),'12345');
 assert.equal(format({__toolyaUILocale:'en'},12345.5,1),'12,345.5');
 assert.ok(html.includes("formatPlantDisplayNumber(cur, 0) + ' L / ' + formatPlantDisplayNumber(max, 0) + ' L'"));
 assert.ok(html.includes("formatPlantDisplayNumber(totalWaterTodayMl, 0) + ' ml'"));
 assert.ok(html.includes("formatPlantDisplayNumber(harvestGrams, 0) + ' g'"));
 assert.ok(html.includes('data.cisternCurrent = data.cisternMax;'),'stored cistern refill logic unchanged');
 assert.ok(html.includes('let totalKg = harvestGrams / 1000;'),'stored harvest conversion unchanged');
});


test('Sprint A moving location prompts change in place without losing unsaved select choices',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/moving/index.html',import.meta.url),'utf8');
 const start=html.indexOf('function refreshMovingLocationPrompts() {');
 const end=html.indexOf('function loadLocationsDropdown()',start);
 assert.ok(start>0&&end>start,'in-place moving prompts are present');
 const {document}=parseHTML('<select id="boxLocationSelect"><option value="">-- Standort wählen --</option><option value="11" selected>🧰 Garage</option></select><select id="editBoxLocSelect"><option value="">-- Standort wählen --</option><option value="22" selected>📦 Keller</option></select><input id="boxName" value="Unfinished packing box">');
 const chosen=document.querySelector('#boxLocationSelect option[value="11"]');
 const editChosen=document.querySelector('#editBoxLocSelect option[value="22"]');
 const input=document.getElementById('boxName');
 input.value='Edited but unsaved';
 const context={window:{__toolyaUILocale:'en'},document};
 createContext(context);runInContext(html.slice(start,end),context);
 runInContext('refreshMovingLocationPrompts()',context);
 assert.equal(document.querySelector('#boxLocationSelect option[value=""]').textContent,'-- Choose location --');
 assert.equal(document.querySelector('#editBoxLocSelect option[value=""]').textContent,'-- Choose location --');
 assert.equal(chosen.hasAttribute('selected'),true);
 assert.equal(editChosen.hasAttribute('selected'),true);
 assert.equal(input.value,'Edited but unsaved');
 context.window.__toolyaUILocale='de';
 runInContext('refreshMovingLocationPrompts()',context);
 assert.equal(document.querySelector('#boxLocationSelect option[value=""]').textContent,'-- Standort wählen --');
 assert.equal(document.querySelector('#boxLocationSelect option[value="11"]'),chosen,'selected option node is unchanged');
 assert.equal(input.value,'Edited but unsaved');
 const listener=html.slice(html.indexOf("document.addEventListener('toolya:locale-change'"),html.indexOf('async function exportInventoryPDF()'));
 assert.ok(listener.includes('refreshMovingLocationPrompts();'),'language switch refreshes placeholder');
 assert.ok(!listener.includes('loadLocationsDropdown()'),'language switch does not rebuild selected location options');
 assert.ok(!listener.includes('saveData('),'language switch does not persist any boxes');
});

test('Sprint A baking existing recipe preview changes language without adding saved recipes',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/baking/index.html',import.meta.url),'utf8');
 const start=html.indexOf('function renderRecipePreview() {');
 const end=html.indexOf('function calculateRecipe()',start);
 assert.ok(start>0&&end>start,'recipe preview is isolated from persistence');
 const escapeStart=html.indexOf('function escapeRecipeHtml(value) {');
 const escapeEnd=html.indexOf('function renderSavedRecipes()',escapeStart);
 assert.ok(escapeStart>0&&escapeEnd>escapeStart);
 const fields={
  'recipe-input':{value:'2 Eier\n100 g Mehl'},
  'res-factor':{innerText:'1.50'},
  'recipe-name':{value:''},
  'unit-system':{value:'metric'},
  'print-card':{innerHTML:''}
 };
 const context={
  document:{getElementById:id=>fields[id]},
  window:{__toolyaUILocale:'en'},
  saveRecipeToStorage:()=>{throw Error('Preview must never store recipes');}
 };
 createContext(context);
 const formatStart=html.indexOf('function formatBakingDisplayNumber(');
 const formatEnd=html.indexOf('function updateSlices()',formatStart);
 assert.ok(formatStart>0&&formatEnd>formatStart);
 runInContext(html.slice(formatStart,formatEnd),context);
 runInContext(html.slice(escapeStart,escapeEnd),context);
 runInContext(html.slice(start,end),context);
 runInContext('renderRecipePreview()',context);
 assert.match(fields['print-card'].innerHTML,/Untitled recipe \(Factor ×1\.50\)/);
 assert.match(fields['print-card'].innerHTML,/3 eggs/);
 assert.equal(fields['recipe-input'].value,'2 Eier\n100 g Mehl');
 context.window.__toolyaUILocale='de';
 runInContext('renderRecipePreview()',context);
 assert.match(fields['print-card'].innerHTML,/Unbenanntes Rezept \(Faktor ×1,50\)/);
 assert.match(fields['print-card'].innerHTML,/3 Eier/);
 assert.equal(fields['recipe-input'].value,'2 Eier\n100 g Mehl');
 const renderer=html.slice(start,end);
 assert.ok(!renderer.includes('saveRecipeToStorage(')&&!renderer.includes('persistRecipes('),'read-only render does not persist');
 assert.ok(html.includes('saveRecipeToStorage(name, rawText, factor);'),'user-initiated calculation still saves once');
 const locale=html.slice(html.indexOf("document.addEventListener('toolya:locale-change'"),html.indexOf('// Initialisierung beim Laden'));
 assert.ok(locale.includes("if (document.getElementById('print-card')?.innerHTML) renderRecipePreview();"));
 assert.ok(!locale.includes('calculateRecipe();'),'language switch never calls saving handler');
});


test('Sprint A open household contact editor title translates without touching unsaved contact details',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const start=html.indexOf('function refreshHouseholdMemberFormTitle() {');
 const end=html.indexOf('function resetMateForm()',start);
 assert.ok(start>0&&end>start,'read-only member editor label updater exists');
 const {document}=parseHTML('<div id="mitbewohnerModal"><h3 id="mateFormTitle">✏️ Mitglied bearbeiten</h3><input id="editMateIndex" value="2"><input id="mateVorname" value="Anna"><input id="mateEmail" value="anna@example.test"></div>');
 const index=document.getElementById('editMateIndex');
 const name=document.getElementById('mateVorname'),email=document.getElementById('mateEmail');
 name.value='Draft Name';email.value='draft@example.test';
 const context={window:{__toolyaUILocale:'en'},document};
 createContext(context);runInContext(html.slice(start,end),context);
 runInContext('refreshHouseholdMemberFormTitle()',context);
 assert.equal(document.getElementById('mateFormTitle').textContent,'✏️ Edit member');
 assert.equal(name.value,'Draft Name');
 assert.equal(email.value,'draft@example.test');
 assert.equal(index.value,'2');
 context.window.__toolyaUILocale='de';
 runInContext('refreshHouseholdMemberFormTitle()',context);
 assert.equal(document.getElementById('mateFormTitle').textContent,'✏️ Mitglied bearbeiten');
 index.value='-1';context.window.__toolyaUILocale='en';
 runInContext('refreshHouseholdMemberFormTitle()',context);
 assert.equal(document.getElementById('mateFormTitle').textContent,'➕ Add new member');
 assert.equal(name.value,'Draft Name','unsaved contact text retained');
 document.getElementById('mitbewohnerModal').classList.add('hidden');
 context.window.__toolyaUILocale='de';
 runInContext('refreshHouseholdMemberFormTitle()',context);
 assert.equal(document.getElementById('mateFormTitle').textContent,'➕ Add new member','closed contact modal not modified');
 const listener=html.slice(html.indexOf("document.addEventListener('toolya:locale-change'"),html.indexOf('/* Storage Helper */'));
 assert.ok(listener.includes('refreshHouseholdMemberFormTitle();'));
 assert.ok(!listener.includes('saveFlatmates('),'language switch never saves contact records');
});


test('Sprint A phone-visible form labels translate reversibly without removing icons, inputs or handlers',()=>{
 const moving=parseHTML('<main><label for="boxName"><span class="helferlein-field-label">Kisten-Name</span><input id="boxName" value="Unsent draft"></label></main>').document;
 const input=moving.getElementById('boxName');
 applyToolInterfaceLocale(moving,'moving','en');
 assert.equal(moving.querySelector('label[for="boxName"] span').textContent,'Box name');
 assert.equal(moving.getElementById('boxName'),input);
 assert.equal(input.getAttribute('value'),'Unsent draft');
 applyToolInterfaceLocale(moving,'moving','de');
 assert.equal(moving.querySelector('label[for="boxName"] span').textContent,'Kisten-Name');

 const plants=parseHTML('<main><div id="cisternModal"><p class="text-sky-700">Restbestand</p><button onclick="closeCisternModal()">Schließen</button><input id="cisternMaxLiters" value="15000"></div></main>').document;
 const close=plants.querySelector('button');
 applyToolInterfaceLocale(plants,'plants','en');
 assert.equal(plants.querySelector('#cisternModal p').textContent,'Remaining volume');
 assert.equal(close.textContent,'Close');
 assert.equal(close.getAttribute('onclick'),'closeCisternModal()');
 assert.equal(plants.getElementById('cisternMaxLiters').getAttribute('value'),'15000');
 applyToolInterfaceLocale(plants,'plants','de');
 assert.equal(plants.querySelector('#cisternModal p').textContent,'Restbestand');
 assert.equal(close.textContent,'Schließen');

 const baking=parseHTML('<main><h2><i data-lucide="file-text"></i> 2. Deine Zutaten</h2><label for="recipe-name"><span class="helferlein-field-label">Mein Rezept</span><input id="recipe-name" value="Draft"></label><label for="recipe-input"><span class="helferlein-field-label">Meine Zutaten</span><textarea id="recipe-input">Mehl</textarea></label><button onclick="calculateRecipe()"><i data-lucide="calculator"></i> Mengen ausrechnen</button></main>').document;
 const heading=baking.querySelector('h2'),headingIcon=heading.querySelector('i');
 const action=baking.querySelector('button'),actionIcon=action.querySelector('i'),textarea=baking.getElementById('recipe-input');
 applyToolInterfaceLocale(baking,'baking','en');
 assert.match(heading.textContent,/2\. Your ingredients/);
 assert.equal(heading.querySelector('i'),headingIcon,'heading icon preserved');
 assert.equal(baking.querySelector('label[for="recipe-name"] span').textContent,'My recipe');
 assert.equal(baking.querySelector('label[for="recipe-input"] span').textContent,'My ingredients');
 assert.match(action.textContent,/Calculate quantities/);
 assert.equal(action.querySelector('i'),actionIcon,'button icon preserved');
 assert.equal(action.getAttribute('onclick'),'calculateRecipe()');
 assert.equal(baking.getElementById('recipe-input'),textarea,'editable recipe node retained');
 applyToolInterfaceLocale(baking,'baking','de');
 assert.match(heading.textContent,/2\. Deine Zutaten/);
 assert.match(action.textContent,/Mengen ausrechnen/);
 assert.equal(baking.querySelector('label[for="recipe-name"] span').textContent,'Mein Rezept');
 assert.equal(baking.querySelector('label[for="recipe-input"] span').textContent,'Meine Zutaten');
});


test('Sprint A backup, migration, membership and Wi-Fi dialogs translate only known source messages',async()=>{
 const {readFile}=await import('node:fs/promises');
 const moving=await readFile(new URL('../../tools/moving/index.html',import.meta.url),'utf8');
 const housemates=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const cases=[
  ['moving','Backup erfolgreich importiert!','Backup imported successfully!'],
  ['moving','Backup-Datei konnte nicht gelesen werden.','The backup file could not be read.'],
  ['housemates','WLAN-Name (SSID):','Wi-Fi network name (SSID):'],
  ['housemates',`Private WG-Kopie erstellt.\\nDer alte WG-Link bleibt bestehen.\\nBitte teile ab jetzt nur den neuen Link mit freigegebenen Mitgliedern.`,`Private household copy created.\\nThe old household link remains active.\\nFrom now on, only share the new link with authorized members.`],
  ['housemates','Mitgliederverwaltung: Auth request failed','Member management: Auth request failed']
 ];
 for(const [tool,source,target] of cases){
  assert.equal(translateToolDialog(tool,'en',source),target,'known author text translated');
  assert.equal(translateToolDialog(tool,'de',source),source,'German message intact');
 }
 for(const original of ['Unrecognized server error #902','Private WG-Kopie created by user']){
  assert.equal(translateToolDialog('housemates','en',original),original,'unknown backend text preserved');
 }
 assert.ok(moving.includes("alert(window.__toolyaUILocale === 'en' ? 'Backup imported successfully!' : 'Backup erfolgreich importiert!')"),'backup dialog exists in current UI');
 assert.ok(moving.includes("alert(window.__toolyaUILocale === 'en' ? 'Backup file could not be read.' : 'Backup-Datei konnte nicht gelesen werden.')"),'backup reader error covered');
 assert.ok(housemates.includes("prompt('WLAN-Name (SSID):', '')"),'Wi-Fi prompt covered');
 assert.ok(housemates.includes("alert('Mitgliederverwaltung: ' + error.message)"),'dynamic member error retains backend tail');
 assert.ok(housemates.includes("alert(window.__toolyaUILocale === 'en'"),'contact success explicitly localized');
 assert.ok(housemates.includes('${contacts.length} contact(s) imported from your phone successfully!'),'only display copies count');
 assert.ok(housemates.includes('saveFlatmates(mates)'),'contact persistence untouched');
});


test('Sprint A member access and pending cloud backup warnings localize without changing server details',()=>{
 const phrases=[
  ['Mitgliederzugriff entfernt.','Member access revoked.'],
  ['Mitgliederzugriff erteilt. Der WG-Link kann jetzt geteilt werden.','Member access granted. You can now share the household link.'],
  ['Deine WG-Änderungen sind auf diesem Gerät gespeichert. Die Online-Sicherung ist noch nicht bestätigt. Prüfe deine Verbindung und nutze die manuelle Synchronisation.','Your household changes are saved on this device. The online backup is not confirmed yet. Check your connection and sync manually.']
 ];
 for(const [de,en] of phrases){
  assert.equal(translateToolDialog('housemates','en',de),en);
  assert.equal(translateToolDialog('housemates','de',de),de);
 }
 assert.equal(translateToolDialog('housemates','en','Mitgliederverwaltung: 403 unauthorized'),'Member management: 403 unauthorized');
 assert.equal(translateToolDialog('housemates','en','Error: row 42'),'Error: row 42');
});

test('Sprint A QR export uses only locale-specific filenames, never rewrites backup payloads',async()=>{
 const {readFile}=await import('node:fs/promises');
 const src=await readFile(new URL('../../tools/moving/index.html',import.meta.url),'utf8');
 assert.match(src,/doc\.save\(exportLanguage === 'en' \? "moving-box-qr-labels\.pdf" : "kisten-qr-etiketten\.pdf"\)/);
 assert.match(src,/homebox-backup-\$\{new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\}\.json/);
 assert.match(src,/if \(!confirm\(window\.__toolyaUILocale === 'en' \? 'Import backup\? Existing data will be replaced\.' : 'Backup importieren\? Vorhandene Daten werden ersetzt\.'\)\) return;/);
 const invalid=src.indexOf("return alert(window.__toolyaUILocale === 'en' ? 'Invalid backup format.' : 'Ungültiges Backup-Format.');");
 const confirmation=src.indexOf("if (!confirm(window.__toolyaUILocale === 'en' ? 'Import backup? Existing data will be replaced.' : 'Backup importieren? Vorhandene Daten werden ersetzt.'))");
 const storage=src.indexOf('if (!await saveData(parsed))');
 assert.ok(invalid>=0&&invalid<confirmation&&confirmation<storage,'schema check and explicit confirmation precede any import write');
});


test('Sprint A household concurrent-save and signed-out states are presented in EN without changing data',()=>{
 const warnings=[
  ['Die WG wurde inzwischen an anderer Stelle geändert. Sichere deine Änderungen auf diesem Gerät, bevor du die Seite neu lädst.','The household was changed elsewhere. Back up your changes on this device before reloading.'],
  ['WG-Änderungen online gespeichert.','Household changes saved online.'],
  ['Bitte zuerst in den Einstellungen anmelden.','Sign in through settings first.']
 ];
 for(const [original,translated] of warnings){
  assert.equal(translateToolDialog('housemates','en',original),translated);
  assert.equal(translateToolDialog('housemates','de',original),original);
 }
 assert.equal(translateToolDialog('housemates','en','supabase: permission denied for user 123'),'supabase: permission denied for user 123');
});


test('Sprint A composed member error localizes authored tail but preserves unknown server diagnostics',()=>{
 assert.equal(translateToolDialog('housemates','en','Mitgliederverwaltung: Bitte zuerst in den Einstellungen anmelden.'),'Member management: Sign in through settings first.');
 assert.equal(translateToolDialog('housemates','en','Mitgliederverwaltung: 401 backend details'),'Member management: 401 backend details');
 assert.equal(translateToolDialog('housemates','de','Mitgliederverwaltung: Bitte zuerst in den Einstellungen anmelden.'),'Mitgliederverwaltung: Bitte zuerst in den Einstellungen anmelden.');
});

test('Sprint A successful protected-household sync toast uses the active UI locale only',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 assert.match(html,/if\(saved\)window\.toolyaNotice\?\.\('success',window\.__toolyaUILocale === 'en' \? 'Household changes saved online\.' : 'WG-Änderungen online gespeichert\.'\)/);
 assert.match(html,/secureWgDirty = secureWgSavedVersion < secureWgChangeVersion/);
 assert.match(html,/if \(!saved\) return false/);
});


test('Sprint A QR labels translate known UI category only; custom tags and QR payload are intact',async()=>{
 const {readFile}=await import('node:fs/promises');
 const src=await readFile(new URL('../../tools/moving/index.html',import.meta.url),'utf8');
 const block=src.slice(src.indexOf('async function exportQrLabelsPDF()'),src.indexOf('async function showQrCode('));
 assert.match(block,/formatMovingTagLabel\(b\.tag, exportLanguage\)/);
 assert.match(block,/\? 'Unknown' : 'Unbekannt'/);
 assert.match(block,/const deepLinkUrl = `\$\{window\.location\.origin\}\$\{window\.location\.pathname\}\?box=\$\{b\.id\}`/);
 assert.match(block,/doc\.save\(exportLanguage === 'en' \? "moving-box-qr-labels\.pdf"/);
 assert.match(src,/try \{ reader\.readAsText\(file\); \}/);
 assert.match(src,/catch \(error\) \{\s*input\.value = '';\s*alert\(window\.__toolyaUILocale === 'en' \? 'Backup file could not be read\.' : 'Backup-Datei konnte nicht gelesen werden\.'\)/);
});


test('Sprint A backup safety preflight is localized without skipping the separate destructive-import confirmation',()=>{
 assert.equal(translateToolDialog('moving','en','Vor dem Import bitte eine aktuelle Sicherung herunterladen und überprüfen.'),'Before importing, download and check a current backup.');
 assert.equal(translateToolDialog('moving','de','Vor dem Import bitte eine aktuelle Sicherung herunterladen und überprüfen.'),'Vor dem Import bitte eine aktuelle Sicherung herunterladen und überprüfen.');
 assert.equal(translateToolDialog('moving','en','Backup importieren? Vorhandene Daten werden ersetzt.'),'Import backup? Existing data will be replaced.');
});


test('Sprint A shared PDF dependency failure follows UI language without changing PDF creation contract',async()=>{
 const {readFile}=await import('node:fs/promises');
 const src=await readFile(new URL('../../shared/toolya/pdf-export.mjs',import.meta.url),'utf8');
 assert.match(src,/requestLanguage === 'en' \? 'Could not create the PDF\. Please try again\.' : 'Das PDF konnte nicht erstellt werden\. Bitte versuche es erneut\.'/);
 assert.match(src,/return new window\.jspdf\.jsPDF\(\)/);
 assert.match(src,/pendingLibrary = undefined/);
});

test('Sprint A second backup-download acknowledgement is localized, not removed',()=>{
 const de='Hast du die aktuelle Sicherung erfolgreich heruntergeladen?';
 assert.equal(translateToolDialog('moving','en',de),'Did you successfully download the current backup?');
 assert.equal(translateToolDialog('moving','de',de),de);
});

test('Sprint A PDF export error captures the request-time language before async script load',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../../shared/toolya/pdf-export.mjs',import.meta.url),'utf8');
 assert.match(source,/createExportPdf\(requestLanguage = window\.__toolyaUILocale === 'en' \? 'en' : 'de'/);
 assert.match(source,/window\.alert\(requestLanguage === 'en' \? 'Could not create the PDF/);
});


test('Sprint A QR export captures request locale before async loading and prints numeric backup values safely',async()=>{
 const {readFile}=await import('node:fs/promises');
 const src=await readFile(new URL('../../tools/moving/index.html',import.meta.url),'utf8');
 const qr=src.slice(src.indexOf('async function exportQrLabelsPDF()'),src.indexOf('async function showQrCode('));
 assert.match(qr,/const exportLanguage = window\.__toolyaUILocale === 'en' \? 'en' : 'de'/);
 assert.match(qr,/amounts\.format\(b\.value \|\| 0\)/);
 assert.ok(!qr.slice(qr.indexOf('const QRCode = await loadQrGenerator()')).includes('window.__toolyaUILocale'),'export labels must use request-time language');
 assert.match(qr,/formatMovingTagLabel\(b\.tag, exportLanguage\)/);
 assert.match(qr,/const deepLinkUrl = `\$\{window\.location\.origin\}\$\{window\.location\.pathname\}\?box=\$\{b\.id\}`/);
});


test('Sprint A QR category helper retains custom and prototype-like labels',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createContext,runInContext}=await import('node:vm');
 const src=await readFile(new URL('../../tools/moving/index.html',import.meta.url),'utf8');
 const start=src.indexOf('function formatMovingTagLabel(');
 const end=src.indexOf('function refreshMovingSelectLabels()',start);
 assert.ok(start>=0&&end>start);
 const context={window:{__toolyaUILocale:'en'}};
 createContext(context);
 runInContext(src.slice(start,end),context);
 assert.equal(runInContext("formatMovingTagLabel('Zerbrechlich','en')",context),'Fragile');
 assert.equal(runInContext("formatMovingTagLabel('__proto__','en')",context),'__proto__');
 assert.equal(runInContext("formatMovingTagLabel('Custom label','en')",context),'Custom label');
 assert.equal(runInContext("formatMovingTagLabel('Zerbrechlich','de')",context),'Zerbrechlich');
});

test('shared error prefixes localize across all tools without changing backend details',()=>{
 for(const tool of ['moving','housemates','plants','baking']){
  for(const [german,english] of [
   ['Passwort zurücksetzen fehlgeschlagen: ', 'Password reset failed: '],
   ['Speichern fehlgeschlagen: ', 'Save failed: '],
   ['Export fehlgeschlagen: ', 'Export failed: '],
   ['Import fehlgeschlagen: ', 'Import failed: '],
   ['Netzwerkfehler: ', 'Network error: ']
  ]){
   const detail='user@example.org / HTTP 403';
   assert.equal(translateToolDialog(tool,'en',german+detail),english+detail);
   assert.equal(translateToolDialog(tool,'de',german+detail),german+detail);
  }
 }
});

test('six additional tools localise source-exact form copy without changing data keys or handlers',()=>{
 const cases=[{"tool":"budget","de":"Haushaltsbuch mit Kassenbon-Scanner","en":"Household budget and receipt scanner"},{"tool":"car","de":"Autokosten-Rechner","en":"Vehicle cost tracker"},{"tool":"loans","de":"Verliehene Gegenstände verwalten","en":"Manage lent items"},{"tool":"meters","de":"Zählerstände erfassen: Strom, Gas & Wasser","en":"Record electricity, gas and water readings"},{"tool":"parking","de":"Parkplatz-Merker","en":"Parking spot saver"},{"tool":"pet-health","de":"Tiergesundheit – Gesundheitstagebuch für Haustiere","en":"Pet health – health diary"}];
 for(const {tool,de,en} of cases){
  const {document}=parseHTML('<html><body><main id="main-content"><button onclick="saveData()">'+de+'</button><input value="user-data" id="x"></main></body></html>');
  const b=document.querySelector('button'),x=document.querySelector('input');
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(b.textContent,en,tool);
  assert.equal(x.value,'user-data');
  assert.equal(b.getAttribute('onclick'),'saveData()');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(b.textContent,de);
 }
});

test('additional tools translate native warnings and preserve user/backend payloads',()=>{
 const cases=[["budget","Bitte wähle zuerst ein Belegfoto aus!","Select a receipt photo first."],["car","Bitte einen Fahrzeugnamen eingeben!","Enter a vehicle name."],["loans","Ungültiges Rückgabedatum.","Invalid return date."],["meters","⚠️ Diesen Zählerstand wirklich löschen?","⚠️ Delete this meter reading?"],["parking","Dein Browser unterstützt keine Benachrichtigungen.","Your browser does not support notifications."],["pet-health","Bitte Medikamenten-Namen angeben!","Enter a medication name."]];
 for(const [tool,de,en] of cases){
  assert.equal(translateToolDialog(tool,'en',de),en);
  assert.equal(translateToolDialog(tool,'de',de),de);
  assert.equal(translateToolDialog(tool,'en','user@example.org'),'user@example.org');
  assert.equal(translateToolDialog(tool,'en','Cloud-Import fehlgeschlagen: user@example.org'),'Cloud import failed: user@example.org');
 }
});

test('new B3 navigation and editor translate only visible labels, preserving route, handler and panel ID',()=>{
 const examples=[["budget","📊 Übersicht","📊 Overview","Monatsstatistiken","Monthly statistics","Household budget navigation"],["car","➕ Fahrzeug erfassen","➕ Add vehicle","Fahrzeug-Statistiken","Vehicle statistics","Vehicle costs navigation"],["loans","🤝 Übersicht","🤝 Overview","Ausleih-Statistiken","Lending statistics","Lending tracker navigation"],["meters","⚡ Übersicht","⚡ Overview","Ableseverlauf","Reading history","Meter readings navigation"],["parking","⏱️ Parkschein-Timer","⏱️ Parking timer","Parkstatistiken","Parking statistics","Parking saver navigation"],["pet-health","🐾 Übersicht","🐾 Overview","Haustier-Statistiken","Pet statistics","Pet health navigation"]];
 const originalNames={budget:'Haushaltsbuch & Kassenbon-Scanner',car:'Autokosten & Reifenwechsel',loans:'Verliehene Gegenstände',meters:'Zählerstände erfassen',parking:'Parkplatz-Merker','pet-health':'Haustier-Gesundheitspass'};
 for(const [tool,de,en,panelDe,panelEn,ariaEn] of examples){
  const html='<html><body><nav class="b3-nav" aria-label="'+originalNames[tool]+' Navigation"><div class="b3-nav-links"><a href="#b3-create">'+de+'</a></div></nav><div id="b3-editor"><div class="b3-editor-row"><strong>'+panelDe+'</strong><button onclick="move()">Speichern</button></div></div></body></html>';
  const {document}=parseHTML(html);
  const link=document.querySelector('.b3-nav-links a'),panel=document.querySelector('strong'),button=document.querySelector('button');
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(link.textContent,en,tool);
  assert.equal(document.querySelector('nav').getAttribute('aria-label'),ariaEn,tool);
  assert.equal(panel.textContent,panelEn,tool);
  assert.equal(link.getAttribute('href'),'#b3-create');
  assert.equal(button.getAttribute('onclick'),'move()');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(link.textContent,de);
  assert.equal(panel.textContent,panelDe);
 }
});

test('trusted dynamic OCR, editing and parking alerts translate both directions without changing user text',()=>{
 const scenarios=[
  ['budget','🔍 Scanne Kassenbon... Bitte warten.','🔍 Scanning receipt… Please wait.'],
  ['budget','Keine Ausgaben in diesem Monat.','No expenses this month.'],
  ['parking','⏰ ABGELAUFEN!','⏰ TIME EXPIRED!'],
  ['parking','Kein aktiver Parkschein-Timer','No active parking timer'],
  ['parking','Bitte Parkzeit verlängern oder zum Auto gehen!','Extend parking time or return to your car!']
 ];
 for(const [tool,de,en]of scenarios){
  assert.equal(translateToolRuntimeStatus(tool,'en',de),en);
  assert.equal(translateToolRuntimeStatus(tool,'de',en),de);
 }
 const personal='Alex 💼 Privat';
 assert.equal(translateToolRuntimeStatus('budget','en','✏️ Buchung bearbeiten: '+personal),'✏️ Edit transaction: '+personal);
 assert.equal(translateToolRuntimeStatus('budget','de','✏️ Edit transaction: '+personal),'✏️ Buchung bearbeiten: '+personal);
 assert.equal(translateToolRuntimeStatus('budget','en','A private note from someone'),'A private note from someone');
});
test('parking notification only changes display locale and keeps timer computation intact',async()=>{
 const {readFileSync}=await import('node:fs');
 const source=readFileSync(new URL('../../tools/parking/index.html',import.meta.url),'utf8');
 assert.ok(source.includes("window.__toolyaUILocale === 'en' ? 'Parking alert'"));
 assert.ok(source.includes('Number(activeEndTime) - Date.now()'));
});

test('additional PDF exports display EN labels without modifying storage structures or CSV schemas',async()=>{
 const {readFileSync}=await import('node:fs');
 for(const tool of ['budget','car','loans','meters','parking','pet-health']){
  const html=readFileSync(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  const pdfStart=html.indexOf('async function exportPDF()');
  assert.ok(pdfStart>=0,tool);
  const pdfEnd=html.indexOf('doc.save(',pdfStart);
  const segment=html.slice(pdfStart,pdfEnd+260);
  assert.ok(segment.includes("window.__toolyaUILocale === 'en'"),tool);
  assert.ok(segment.includes("pdfEn ? 'en-GB' : 'de-DE'"),tool);
  assert.ok(segment.includes('pdfLabel('),tool);
  assert.ok(segment.includes('en-GB'),'English date format');
 }
 const budget=readFileSync(new URL('../../tools/budget/index.html',import.meta.url),'utf8');
 assert.ok(budget.includes("'Haendler', 'Kategorie', 'Preis_EUR'"),'CSV machine-readable headers unchanged');
});

test('budget PDF uses selected locale for formatted amounts and date ranges',async()=>{
 const {readFileSync}=await import('node:fs');
 const budget=readFileSync(new URL('../../tools/budget/index.html',import.meta.url),'utf8');
 const parking=readFileSync(new URL('../../tools/parking/index.html',import.meta.url),'utf8');
 assert.ok(budget.includes("pdfEn ? amount.toFixed(2) : amount.toFixed(2).replace('.', ',')"));
 assert.ok(budget.includes("pdfLabel(' bis ', ' to ')"));
 assert.ok(parking.includes('pdfLabel("Gesamtkosten: ","Total costs: ")'));
});

test('seven PDF export paths render EN and DE without mutating records (isolated synthetic fixtures)',async()=>{
 const {readFileSync}=await import('node:fs');
 const {runInNewContext}=await import('node:vm');
 const fixtures={
  budget:[{date:'2026-11-01',entryType:'ausgabe',title:'Private receipt',store:'Shop',category:'Lebensmittel',price:12.5,paymentMethod:'Bargeld'}],
  car:{cars:[{id:'car1',name:'Personal car',plate:'AB-123',km:8000}],events:[{carId:'car1',type:'Reparatur',title:'Wheel service',date:'2026-11-01',cost:80}]},
  loans:{items:[{status:'active',title:'Personal drill',person:'Alex',date:'2026-11-01',deposit:20}]},
  meters:{readings:[{type:'Kaltwasser',name:'Meter-1',location:'Garten',value:120,date:'2026-11-01',note:'Private note'}]},
  parking:{sessions:[{desc:'Private parking',sector:'A2',date:'2026-11-01',cost:3.5}]},
  'pet-health':{pets:[{id:'pet1',name:'Momo',species:'Katze'}],events:[{petId:'pet1',type:'Impfung',title:'Check-up',date:'2026-11-01',cost:45}]}
 };
 const functions=[['budget','exportPDF'],['car','exportPDF'],['loans','exportPDF'],['meters','exportPDF'],['meters','exportHandoverPDF'],['parking','exportPDF'],['pet-health','exportPDF']];
 for(const [tool,func] of functions){
  const html=readFileSync(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  const start=html.indexOf('async function '+func+'()');
  assert.ok(start>=0,tool+' '+func);
  const save=html.indexOf('doc.save(',start),semicolon=html.indexOf(';',save),end=html.indexOf('}',semicolon)+1;
  assert.ok(save>start&&end>save);
  const original=html.slice(start,end);
  const meterLabels=tool==='meters' ? html.slice(html.indexOf('const englishMeterTypes'),html.indexOf('function copyShareText()')) : '';
  const vehicleLabels=tool==='car' ? html.slice(html.indexOf('const vehicleTypeEn = Object.freeze('),html.indexOf('function vehicleTypeDisplay(')) : '';
  const budgetLabels=tool==='budget' ? html.slice(html.indexOf('const budgetCategoryEn = Object.freeze('),html.indexOf('let budgetChartDisplaySnapshot')) : '';
  const code=original.replace("const { createExportPdf } = await import('../../shared/toolya/pdf-export.mjs');",
    'const createExportPdf=async()=>pdfStub;');
  assert.notEqual(code,original,tool+' stub replacement');
  for(const lang of ['de','en']){
   const rows=JSON.parse(JSON.stringify(fixtures[tool])),before=JSON.stringify(rows),texts=[],filenames=[];
   const pdfStub={setFont(){},setFontSize(){},text(value){texts.push(String(value))},splitTextToSize(value){return [String(value)]},addPage(){},save(name){filenames.push(String(name))}};
   const context={window:{__toolyaUILocale:lang},getData:()=>rows,pdfStub,parseReceiptDate:date=>new Date(date)};
   const parkingDates=tool==='parking'?html.slice(html.indexOf('function displayLegacyDate('),html.indexOf('// PDF Report Export via jsPDF')):'';
   await runInNewContext(meterLabels+vehicleLabels+budgetLabels+parkingDates+code+';'+func+'()',context);
   assert.equal(JSON.stringify(rows),before,'source data mutated: '+tool);
   assert.equal(filenames.length,1,'PDF not created: '+tool);
   assert.ok(texts.length>=3,'missing PDF text: '+tool);
   assert.ok(texts.some(value=>lang==='en'?/Created on:/.test(value):/Erstellt am:/.test(value)),tool+' report date '+lang);
   if(tool==='budget'){
    assert.ok(texts.some(value=>value.includes('Private receipt')&&value.includes(lang==='en'?'Groceries':'Lebensmittel')&&value.includes(lang==='en'?'Cash':'Bargeld')),'budget category and payment labels '+lang);
   }
   if(tool==='meters'){
    const type=lang==='en'?'Cold water':'Kaltwasser';
    const location=lang==='en'?'Garden':'Garten';
    assert.ok(texts.some(value=>value.includes(type)&&value.includes(location)&&value.includes('Meter-1')),func+' meter labels '+lang);
    assert.ok(texts.some(value=>value.includes('Private note')),func+' note');
   }
  }
 }
});

test('PDFs translate only controlled enum values; preserve user titles and stored records',async()=>{
 const {readFileSync}=await import('node:fs');
 const {runInNewContext}=await import('node:vm');
 const scenarios=[
  ['car',{cars:[{id:'c',name:'My car',plate:'AB'}],events:[{carId:'c',type:'Reparatur',title:'Private wheel service',date:'2026-11-01',cost:5}]},'Repair','Private wheel service'],
  ['pet-health',{pets:[{id:'p',name:'Momo',species:'Katze'}],events:[{petId:'p',type:'Impfung',title:'Private check-up',date:'2026-11-01',cost:5}]},'Vaccination','Private check-up'],
  ['meters',{readings:[{type:'Strom',name:'Private meter',date:'2026-11-01',value:10,note:'Private note'}]},'Electricity','Private note']
 ];
 for(const [tool,data,translated,privateValue]of scenarios){
  const html=readFileSync(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  const start=html.indexOf('async function exportPDF()'),save=html.indexOf('doc.save(',start);
  const end=html.indexOf('}',html.indexOf(';',save))+1;
  const meterLabels=tool==='meters' ? html.slice(html.indexOf('const englishMeterTypes'),html.indexOf('function copyShareText()')) : '';
  const vehicleLabels=tool==='car' ? html.slice(html.indexOf('const vehicleTypeEn = Object.freeze('),html.indexOf('function vehicleTypeDisplay(')) : '';
  const code=html.slice(start,end).replace("const { createExportPdf } = await import('../../shared/toolya/pdf-export.mjs');",'const createExportPdf=async()=>pdfStub;');
  const source=JSON.stringify(data),printed=[];
  const pdfStub={setFont(){},setFontSize(){},text(x){printed.push(String(x))},splitTextToSize(x){return [String(x)]},addPage(){},save(){}};
  await runInNewContext(meterLabels+vehicleLabels+code+';exportPDF()', {window:{__toolyaUILocale:'en'},getData:()=>data,pdfStub});
  assert.ok(printed.some(x=>x.includes(translated)),tool+' enum');
  assert.ok(printed.some(x=>x.includes(privateValue)),tool+' user data');
  assert.equal(JSON.stringify(data),source,tool+' data changed');
 }
});


test('plant export captures locale before async dependency and leaves user records untouched', async () => {
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../../tools/plants/index.html',import.meta.url),'utf8');
 const exportSource=html.slice(html.indexOf('async function exportPDF()'),html.indexOf('    </script>',html.indexOf('async function exportPDF()')));
 assert.match(exportSource,/const exportEnglish = window\.__toolyaUILocale === 'en';/);
 assert.ok(exportSource.indexOf('const exportEnglish')<exportSource.indexOf('await import('));
 assert.match(exportSource,/doc\.save\(exportEnglish \?/);
 assert.match(exportSource,/p\.name \?\? \(exportEnglish \?/);
 assert.doesNotMatch(exportSource.slice(exportSource.indexOf('await import(')),/window\.__toolyaUILocale/g,'no language rereads during PDF creation after initial capture');
 assert.match(html,/Object\.hasOwn\(propagationLabels, p\.propagation\)/);
 assert.match(html,/escapeHtml\(propagationDisplay\)/);
 assert.match(html,/locations\.includes\(selectedLocation\) \? selectedLocation : ''/);
 assert.match(html,/All locations \/ rooms/);
});

test('moving inventory renders literal names and labels the QR action in both languages', async () => {
 const {readFile}=await import('node:fs/promises');
 const {runInNewContext}=await import('node:vm');
 const html=await readFile(new URL('../../tools/moving/index.html',import.meta.url),'utf8');
 const extract=(from,to)=>html.slice(html.indexOf(from),html.indexOf(to));
 const source=[
  extract('function formatMovingTagLabel(', 'function refreshMovingSelectLabels('),
  extract('function escapeInventoryText(', 'async function saveBox('),
  extract('function renderInventory()', '// Rebuild the visible card list')
 ].join('\n');
 const fields=['inventoryContainer','statBoxes','statLocs','statValue','locationValueStatsCard','locationValueStatsList','tagValueStatsCard','tagValueStatsList'];
 const {document}=parseHTML('<html><body>'+fields.map(id=>'<div id="'+id+'"></div>').join('')+
  '<input id="searchBox"><input id="tagFilter"><input id="sortFilter"><select id="boxLocationSelect"></select><select id="editBoxLocSelect"></select></body></html>');
 const name="Mia's <b>Winter</b> & Co.";
 const data={locations:[{id:1,name}],boxes:[{id:7,locId:1,name,desc:'& Pins',value:'12.50',tag:'Zerbrechlich',lentTo:name}]};
 const snapshot=JSON.stringify(data);
 for(const [locale,title,tag] of [['en','QR code and deep link','Fragile'],['de','QR-Code & Deep-Link','Zerbrechlich']]){
  runInNewContext(source+'\nloadLocationsDropdown(); renderInventory();',{document,getData:()=>data,window:{__toolyaUILocale:locale}});
  const inventory=document.querySelector('#inventoryContainer');
  assert.equal(inventory.querySelector('h5').textContent,'📦 '+name);
  assert.equal(inventory.querySelector('h5 b'),null);
  assert.ok(inventory.textContent.includes(tag));
  assert.ok(document.querySelector('#boxLocationSelect option[value="1"]').textContent.includes(name));
  assert.equal(inventory.querySelector('button[title="'+title+'"]').getAttribute('onclick'),'showQrCode(7)');
  assert.equal(JSON.stringify(data),snapshot);
 }
});


test('move protection, household copy and duplicate transaction dialogs translate',()=>{
 for(const [tool, entries] of Object.entries({
  "moving": [
    [
      "Dieser Standort enthält Kisten aus einem aktiven Umzug. Bitte den Umzug erst abschließen.",
      "This location contains boxes assigned to an active move. Finish the move first."
    ],
    [
      "Diese Kiste ist einem aktiven Umzug zugeordnet. Bitte den Umzug erst abschließen.",
      "This box is assigned to an active move. Finish the move first."
    ]
  ],
  "housemates": [
    [
      "Private WG-Kopie erstellt.\nDer alte WG-Link bleibt bestehen.\nBitte teile ab jetzt nur den neuen Link mit freigegebenen Mitgliedern.",
      "Private household copy created.\nThe old household link stays active.\nFrom now on, share only the new link with approved members."
    ]
  ],
  "budget": [
    [
      "Eine Buchung mit gleichem Datum, Titel, Betrag und Typ existiert bereits.\n\nTrotzdem erneut speichern?",
      "A transaction with the same date, title, amount and type already exists.\n\nSave another copy anyway?"
    ]
  ]
})){
  for(const [de,en] of entries){
   assert.equal(translateToolDialog(tool,'en',de),en);
   assert.equal(translateToolDialog(tool,'de',de),de);
  }
 }
});


test('audited dialog catalogue never resolves inherited object keys',()=>{
 for(const key of ['__proto__','constructor','toString']){
  assert.equal(translateToolDialog('moving','en',key),key);
  assert.equal(translateToolDialog('housemates','en',key),key);
  assert.equal(translateToolDialog('housemates','en','Mitgliederverwaltung: '+key),'Member management: '+key);
 }
});

test('source-exact extended native dialogs across tools preserve data and DE fallbacks',()=>{
 const cases=[{"tool":"car","de":"Aktuellen Kilometerstand aktualisieren:","en":"Update current mileage:"},{"tool":"car","de":"Bitte bestätigen, dass die Cloud-Sicherung tatsächlich heruntergeladen und sicher gespeichert wurde.","en":"Confirm the cloud backup was downloaded and saved securely."},{"tool":"car","de":"Backup erfolgreich importiert!","en":"Backup imported successfully!"},{"tool":"budget","de":"Bitte bestätigen, dass die Cloud-Sicherung tatsächlich heruntergeladen und sicher gespeichert wurde.","en":"Confirm the cloud backup was downloaded and saved securely."},{"tool":"budget","de":"Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.","en":"The QR code could not be loaded. Please try again."},{"tool":"moving","de":"Standort umbenennen:","en":"Rename location:"},{"tool":"moving","de":"Dieser Standort enthält Kisten aus einem aktiven Umzug. Bitte den Umzug erst abschließen.","en":"This location contains boxes from an active move. Finish the move first."},{"tool":"moving","de":"Diese Kiste ist einem aktiven Umzug zugeordnet. Bitte den Umzug erst abschließen.","en":"This box belongs to an active move. Finish the move first."},{"tool":"moving","de":"Dieses Backup enthält keine Umzugsprojekte. Die bestehenden Umzugsplanungen würden verloren gehen. Trotzdem fortfahren?","en":"This backup contains no moving projects. Existing move plans would be lost. Continue anyway?"},{"tool":"moving","de":"Vor dem Import bitte eine aktuelle Sicherung herunterladen und überprüfen.","en":"Before importing, download and check a current backup."},{"tool":"moving","de":"Hast du die aktuelle Sicherung erfolgreich heruntergeladen?","en":"Did you download the current backup successfully?"},{"tool":"moving","de":"Der QR-Scanner konnte nicht geladen werden. Bitte versuche es erneut.","en":"The QR scanner could not be loaded. Please try again."},{"tool":"moving","de":"Kamera-Zugriff fehlgeschlagen oder nicht unterstützt.","en":"Camera access failed or is unsupported."},{"tool":"plants","de":"Nicht gefunden.","en":"Not found."},{"tool":"plants","de":"Pflanzenfoto konnte nicht verarbeitet werden. Nichts gespeichert.","en":"Plant photo could not be processed. Nothing was saved."},{"tool":"plants","de":"Das Foto konnte nicht gelesen werden.","en":"The photo could not be read."},{"tool":"plants","de":"Es konnte keine eindeutige Pflanzen-ID erzeugt werden.","en":"A unique plant ID could not be generated."},{"tool":"plants","de":"⚠️ Pflanze wirklich löschen?","en":"⚠️ Delete this plant?"},{"tool":"plants","de":"Ungültige Pflanzen-ID. Die Änderungen wurden nicht gespeichert.","en":"Invalid plant ID. Changes were not saved."},{"tool":"plants","de":"Pflanze nicht gefunden. Die Änderungen wurden nicht gespeichert.","en":"Plant not found. Changes were not saved."},{"tool":"plants","de":"Bitte einen Pflanzennamen eingeben.","en":"Enter a plant name."},{"tool":"plants","de":"Bitte ein gültiges Gießdatum eingeben.","en":"Enter a valid watering date."},{"tool":"housemates","de":"Mitgliederzugriff entfernt.","en":"Member access removed."},{"tool":"housemates","de":"Mitgliederzugriff erteilt. Der WG-Link kann jetzt geteilt werden.","en":"Member access granted. The household link can now be shared."},{"tool":"housemates","de":"🔗 WG-Link kopiert! Teile ihn nur mit berechtigten Personen.","en":"🔗 Household link copied! Share only with authorised people."},{"tool":"housemates","de":"WG-Link manuell kopieren:","en":"Copy household link manually:"},{"tool":"housemates","de":"Der automatische Schuldenausgleich ist vorübergehend deaktiviert, damit keine Buchungen gelöscht werden. Bitte die vorgeschlagenen Überweisungen manuell durchführen und die Buchungen zur Dokumentation aufbewahren.","en":"Automatic debt settlement is temporarily disabled to prevent deleting transactions. Make suggested transfers manually and keep transaction records."},{"tool":"baking","de":"Timer abgelaufen!","en":"Timer finished!"},{"tool":"loans","de":"Gespeichert","en":"Saved"},{"tool":"meters","de":"Gespeichert","en":"Saved"},{"tool":"meters","de":"Backup erfolgreich importiert!","en":"Backup imported successfully!"},{"tool":"pet-health","de":"Lokale Haustierdaten nach Sicherung in die Cloud übernehmen?","en":"Import local pet records into the cloud after backing them up?"}];
 for(const {tool,de,en} of cases){
  assert.notEqual(translateToolDialog(tool,'en',de),de,tool+': '+de);
  assert.equal(translateToolDialog(tool,'de',de),de);
 }
 for(const tool of [...new Set(cases.map(x=>x.tool))]){
  assert.equal(translateToolDialog(tool,'en','__proto__'),'__proto__');
  assert.equal(translateToolDialog(tool,'en','user@example.org'),'user@example.org');
 }
});

test('extended static tool labels translate reversibly without modifying user input',()=>{
 const examples=[{"tool":"parking","de":"Standort / Parkhaus","en":"Location / parking garage"},{"tool":"parking","de":"Parkebene / Sektor","en":"Parking level / section"},{"tool":"parking","de":"Gebühr in €","en":"Fee in €"},{"tool":"meters","de":"Verbrauch erfassen, Kosten auswerten und Ablesetermine im Blick behalten","en":"Record consumption, review costs and track meter-reading dates"},{"tool":"meters","de":"📖 Ausklappbare Anleitung: Richtig ablesen & Energie sparen","en":"📖 Expandable guide: Read meters correctly and save energy"},{"tool":"meters","de":"Erfasste Ablesungen","en":"Recorded readings"},{"tool":"loans","de":"Verliehene Dinge","en":"Lent items"},{"tool":"loans","de":"Aktiv","en":"Active"},{"tool":"loans","de":"Verloren/Defekt","en":"Lost / damaged"},{"tool":"car","de":"Registrierte Fahrzeuge","en":"Registered vehicles"},{"tool":"car","de":"Gesamtkosten (gefiltert)","en":"Total costs (filtered)"},{"tool":"car","de":"Fahrzeugname","en":"Vehicle name"},{"tool":"pet-health","de":"Impfungen, Tierarztbesuche, Medikamente und Gesundheitsdaten für Hund und Katze","en":"Vaccinations, vet visits, medication and health records for cats and dogs"},{"tool":"pet-health","de":"Registrierte Haustiere","en":"Registered pets"},{"tool":"pet-health","de":"Gesundheits-Einträge","en":"Health records"}];
 for(const {tool,de,en} of examples){
  const {document}=parseHTML('<main id="main-content"><strong>'+de+'</strong><input id="memo" value="user text"></main>');
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(document.querySelector('strong').textContent,en);
  assert.equal(document.querySelector('#memo').value,'user text');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(document.querySelector('strong').textContent,de);
 }
});

test('additional source-verified small labels localise reversibly in five tools',()=>{
 const cases=[{"tool":"moving","de":"Erfasste Kisten","en":"Recorded boxes"},{"tool":"moving","de":"Standorte","en":"Locations"},{"tool":"moving","de":"Gesamtwert Inventar","en":"Total inventory value"},{"tool":"moving","de":"Standort Name","en":"Location name"},{"tool":"moving","de":"Kisten-Name","en":"Box name"},{"tool":"moving","de":"Wert in € (optional)","en":"Value in € (optional)"},{"tool":"moving","de":"Inhalt / Beschreibung","en":"Contents / description"},{"tool":"moving","de":"Garantie- oder Ablaufdatum","en":"Warranty or expiry date"},{"tool":"moving","de":"Foto der Kiste auswählen","en":"Choose box photo"},{"tool":"moving","de":"3. QR-Code drucken","en":"3. Print QR code"},{"tool":"moving","de":"4. Scanne & Finde","en":"4. Scan and find"},{"tool":"plants","de":"Bestand","en":"Inventory"},{"tool":"plants","de":"Heutiger Bedarf","en":"Today's needs"},{"tool":"plants","de":"Zisternen-Stand","en":"Water tank level"},{"tool":"plants","de":"Ernte-Ertrag","en":"Harvest yield"},{"tool":"plants","de":"Leitfaden","en":"Guide"},{"tool":"plants","de":"Art / Sorte","en":"Species / variety"},{"tool":"plants","de":"Standort / Beet","en":"Location / garden bed"},{"tool":"plants","de":"Artikel","en":"Item"},{"tool":"plants","de":"Menge","en":"Quantity"},{"tool":"plants","de":"Neues Saatgut gesucht?","en":"Looking for new seeds?"},{"tool":"plants","de":"Sorte","en":"Variety"},{"tool":"plants","de":"Erntejahr","en":"Harvest year"},{"tool":"plants","de":"Gewinnbilanz","en":"Profit overview"},{"tool":"plants","de":"Restbestand","en":"Remaining stock"},{"tool":"baking","de":"In 3 Schritten zum passenden Backrezept","en":"Find your baking recipe in three steps"},{"tool":"baking","de":"Mein Rezept","en":"My recipe"},{"tool":"baking","de":"Meine Zutaten","en":"My ingredients"},{"tool":"baking","de":"Teigmenge nicht ändern","en":"Keep batter quantity"},{"tool":"baking","de":"Meinen Ofenfaktor nutzen","en":"Use my oven adjustment"},{"tool":"baking","de":"Mit Rand","en":"With rim"},{"tool":"baking","de":"Springformen","en":"Springform pans"},{"tool":"baking","de":"Ofenthermometer","en":"Oven thermometer"},{"tool":"baking","de":"Backpapier","en":"Baking paper"},{"tool":"baking","de":"Faktor","en":"Factor"},{"tool":"baking","de":"Backzeit (ca.)","en":"Baking time (approx.)"},{"tool":"baking","de":"Temperatur","en":"Temperature"},{"tool":"baking","de":"Kosten","en":"Costs"},{"tool":"baking","de":"So voll wird die Form:","en":"Expected pan fill level:"},{"tool":"baking","de":"Lagerungstipp:","en":"Storage tip:"},{"tool":"baking","de":"1. Rezept & Basis","en":"1. Recipe and basics"},{"tool":"baking","de":"2. Form vergleichen","en":"2. Compare pans"},{"tool":"baking","de":"4. Kochmodus","en":"4. Cooking mode"},{"tool":"baking","de":"Multi-Timer aktiv","en":"Multi-timer active"},{"tool":"budget","de":"Ausgaben erfassen, Budget planen, Belege scannen und Garantien verwalten","en":"Track expenses, plan budgets, scan receipts and manage warranties"},{"tool":"budget","de":"Ausgabe","en":"Expense"},{"tool":"budget","de":"Einnahme","en":"Income"},{"tool":"budget","de":"Fixkosten/Abos","en":"Fixed costs / subscriptions"},{"tool":"budget","de":"OCR-Scanner","en":"Receipt text scanner"},{"tool":"budget","de":"Monats-Einnahmen","en":"Monthly income"},{"tool":"budget","de":"Monats-Saldo","en":"Monthly balance"},{"tool":"budget","de":"Fixkosten-Quote","en":"Fixed-cost ratio"},{"tool":"budget","de":"Garantiewert aktiv","en":"Active warranty value"},{"tool":"budget","de":"Hausrat-Zeitwert","en":"Current household item value"},{"tool":"budget","de":"Steuer-Gesamtwert","en":"Total tax-relevant value"},{"tool":"budget","de":"Monatsverlauf (Cashflow)","en":"Monthly cash flow"},{"tool":"budget","de":"🔄 Wiederkehrende Fixkosten / Abo","en":"🔄 Recurring fixed costs / subscription"},{"tool":"budget","de":"💼 Steuerrelevant","en":"💼 Tax relevant"},{"tool":"budget","de":"⚡ Thermopapier-Filter (Helligkeit/Kontrast anpassen):","en":"⚡ Thermal paper filter (adjust brightness/contrast):"},{"tool":"budget","de":"🔄 Fixkosten","en":"🔄 Fixed costs"},{"tool":"budget","de":"💼 Steuer","en":"💼 Tax"},{"tool":"budget","de":"Garantie abgelaufen","en":"Warranty expired"},{"tool":"housemates","de":"Monats-Einnahmen","en":"Monthly income"},{"tool":"housemates","de":"Monats-Saldo","en":"Monthly balance"},{"tool":"housemates","de":"Offene WG-Schulden","en":"Outstanding household debts"},{"tool":"housemates","de":"Fixkosten-Quote","en":"Fixed-cost ratio"},{"tool":"housemates","de":"Inventar Restwert","en":"Remaining inventory value"},{"tool":"housemates","de":"Aktive Sticky Notes","en":"Active sticky notes"},{"tool":"housemates","de":"WLAN-Passwort:","en":"Wi-Fi password:"},{"tool":"housemates","de":"Vermieter:","en":"Landlord:"},{"tool":"housemates","de":"Hausmeister / Notdienst:","en":"Caretaker / emergency service:"},{"tool":"housemates","de":"🔄 Wiederkehrende Fixkosten","en":"🔄 Recurring fixed costs"},{"tool":"housemates","de":"💼 Steuerrelevant","en":"💼 Tax relevant"},{"tool":"housemates","de":"Berechne Ausgleich...","en":"Calculating settlement…"},{"tool":"housemates","de":"Berechnet den fairen Zeitwert & Auszahlungsanspruch bei Auszug.","en":"Calculates fair current value and compensation when moving out."},{"tool":"housemates","de":"Inkl. Amazon-Link & Kassen-Sync","en":"Includes Amazon link and receipt sync"},{"tool":"housemates","de":"Putz- & Reinigungsmittel","en":"Cleaning supplies"},{"tool":"housemates","de":"📌 Oben anpinnen (Wichtige Notiz)","en":"📌 Pin to top (important note)"},{"tool":"housemates","de":"📇 Smartphone-Kontakte importieren:","en":"📇 Import phone contacts:"}];
 for(const {tool,de,en} of cases){
  const {document}=parseHTML('<html><body><main id="main-content"><span>'+de+'</span><input id="user" value="private note"></main></body></html>');
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(document.querySelector('span').textContent,en,tool+': '+de);
  assert.equal(document.querySelector('#user').value,'private note');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(document.querySelector('span').textContent,de);
 }
});

test('additional vehicle pet meter and lending static text remains reversible',()=>{
 const cases=[{"tool":"car","de":"Autokosten","en":"Vehicle costs"},{"tool":"car","de":"Bezeichnung","en":"Description"},{"tool":"car","de":"Kosten in €","en":"Cost in €"},{"tool":"car","de":"Profil (mm)","en":"Tread (mm)"},{"tool":"car","de":"Liter","en":"Litres"},{"tool":"car","de":"DOT / Jahr","en":"DOT / year"},{"tool":"car","de":"Profil mm","en":"Tread mm"},{"tool":"car","de":"Hilfe & Anleitung anzeigen","en":"Show help and guide"},{"tool":"car","de":"📖 Kurzanleitung – So funktioniert's:","en":"📖 Quick guide – How it works:"},{"tool":"car","de":"1. Fahrzeug & Papiere","en":"1. Vehicle and documents"},{"tool":"car","de":"2. Wartung & Tanken","en":"2. Maintenance and refuelling"},{"tool":"car","de":"3. Wartung und Tankkosten","en":"3. Maintenance and fuel costs"},{"tool":"car","de":"4. Reifen & Backup","en":"4. Tyres and backup"},{"tool":"car","de":"Hilfe & Anleitung ausblenden","en":"Hide help and guide"},{"tool":"pet-health","de":"Tiergesundheit","en":"Pet health"},{"tool":"pet-health","de":"Gesamtkosten","en":"Total costs"},{"tool":"pet-health","de":"🏥 Tierarzt & Praxis-Verzeichnis:","en":"🏥 Vet and practice directory:"},{"tool":"pet-health","de":"Telefon / Notfall-Nr.","en":"Phone / emergency number"},{"tool":"pet-health","de":"Bezeichnung","en":"Description"},{"tool":"pet-health","de":"Kosten in € (optional)","en":"Cost in € (optional)"},{"tool":"pet-health","de":"Hilfe & Anleitung anzeigen","en":"Show help and guide"},{"tool":"pet-health","de":"📖 Kurzanleitung – So funktioniert's:","en":"📖 Quick guide – How it works:"},{"tool":"pet-health","de":"1. Haustier & Praxis","en":"1. Pet and vet practice"},{"tool":"pet-health","de":"2. Gewicht & Trends","en":"2. Weight and trends"},{"tool":"pet-health","de":"3. Apotheke & Vorräte","en":"3. Medicine and stock"},{"tool":"pet-health","de":"4. Kalender & Export","en":"4. Calendar and export"},{"tool":"pet-health","de":"Hilfe & Anleitung ausblenden","en":"Hide help and guide"},{"tool":"pet-health","de":"🛡️ TASSO / Register","en":"🛡️ TASSO / registry"},{"tool":"meters","de":"Zählerstände","en":"Meter readings"},{"tool":"meters","de":"Reduziere deine Jahres-Nachzahlung effektiv mit diesen praxiserprobten Spar-Tipps und passenden Amazon-Empfehlungen:","en":"Reduce your annual utility bill adjustment with these practical saving tips and related Amazon recommendations:"}];
 for(const {tool,de,en} of cases){
  const {document}=parseHTML('<html><body><main id="main-content"><span>'+de+'</span><input id="private" value="Private information"></main></body></html>');
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(document.querySelector('span').textContent,en,tool+': '+de);
  assert.equal(document.querySelector('#private').value,'Private information');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(document.querySelector('span').textContent,de);
 }
});

test('remaining source-owned baking, budget, household and form labels reverse without editing values',()=>{
 const cases=[{"tool":"baking","de":"1 EL Chiasamen + 3 EL Wasser ODER 2 EL Apfelmark.","en":"1 tbsp chia seeds + 3 tbsp water OR 2 tbsp applesauce."},{"tool":"baking","de":"1 TL Natron + 1 TL Zitronensaft oder Essig.","en":"1 tsp baking soda + 1 tsp lemon juice or vinegar."},{"tool":"baking","de":"250ml Milch + 1 EL Zitronensaft (5 Min. ruhen lassen).","en":"250 ml milk + 1 tbsp lemon juice (rest for 5 minutes)."},{"tool":"baking","de":"Finde passende Silikonformen, Teigschaber oder Spritzbeutel direkt online.","en":"Find suitable silicone pans, spatulas or piping bags online."},{"tool":"baking","de":"Ca. 180g Glasur","en":"Approx. 180 g icing"},{"tool":"baking","de":"Konto wird geprüft …","en":"Checking account…"},{"tool":"budget","de":"Lade Budgets...","en":"Loading budgets…"},{"tool":"budget","de":"Belegfoto auswählen","en":"Choose receipt photo"},{"tool":"housemates","de":"Lade...","en":"Loading…"},{"tool":"housemates","de":"Lade Budgets...","en":"Loading budgets…"},{"tool":"housemates","de":"Belegfoto auswählen","en":"Choose receipt photo"},{"tool":"housemates","de":"Spendier dem Entwickler einen Kaffee","en":"Buy the developer a coffee"},{"tool":"plants","de":"Wichtige Anmerkungen & Pflegehinweise...","en":"Important notes and care instructions…"},{"tool":"car","de":"Versicherung & Pol.-Nr.","en":"Insurance & policy no."},{"tool":"pet-health","de":"Futtermarke & Sorte","en":"Food brand & variety"},{"tool":"pet-health","de":"Praxisname & Tierarzt","en":"Practice name & veterinarian"}];
 for(const {tool,de,en} of cases){
  const {document}=parseHTML('<html><body><main id="main-content"><span>'+de.replaceAll('&','&amp;')+'</span><input id="note" value="untranslated private text"></main></body></html>');
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(document.querySelector('span').textContent,en,tool+': '+de);
  assert.equal(document.querySelector('#note').value,'untranslated private text');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(document.querySelector('span').textContent,de);
 }
});


test('budget category options localize without changing stored category values', () => {
 const {document}=parseHTML('<html><body><main id="main-content"><select id="receiptCategory"><option value="Freizeit">🎉 Freizeit, Gastronomie & Urlaub</option><option value="Haustiere">🐾 Haustiere</option></select></main></body></html>');
 const options=[...document.querySelectorAll('option')];
 const original=options.map(option=>option.textContent);
 const values=options.map(option=>option.value);
 applyToolInterfaceLocale(document,'budget','en');
 assert.deepEqual(options.map(option=>option.textContent),['🎉 Leisure, dining and holidays','🐾 Pets']);
 assert.deepEqual(options.map(option=>option.value),values,'category values remain stable');
 applyToolInterfaceLocale(document,'budget','de');
 assert.deepEqual(options.map(option=>option.textContent),original,'German labels restored');
 assert.deepEqual(options.map(option=>option.value),values,'category values remain stable after switching back');
});


test('tool browser titles switch DE → EN → DE for all ten tool pages without replacing custom titles', () => {
 const titles={
  moving:['Umzugskisten und Inventarliste | Toolya','Moving boxes and inventory | Toolya'],
  housemates:['WG-Organisator mit Haushaltsbuch | Toolya','Roommate organiser and household budget | Toolya'],
  plants:['Pflanzenpflege-App mit Gießplan | Toolya','Plant care and watering planner | Toolya'],
  baking:['Backform-Umrechner & Rezeptrechner | Toolya','Cake pan and recipe calculator | Toolya'],
  budget:['Haushaltsbuch mit Kassenbon-Scanner | Toolya','Household budget and receipt scanner | Toolya'],
  car:['Autokosten-Rechner | Toolya','Car expense calculator | Toolya'],
  loans:['Verliehene Gegenstände verwalten | Toolya','Track lent items | Toolya'],
  'pet-health':['Tiergesundheit – Gesundheitstagebuch für Haustiere | Toolya','Pet health journal | Toolya'],
  parking:['Parkplatz-Merker | Toolya','Parking spot tracker | Toolya'],
  meters:['Zählerstände erfassen: Strom, Gas & Wasser | Toolya','Meter readings: electricity, gas and water | Toolya']
 };
 for(const [tool,[de,en]] of Object.entries(titles)){
  const {document}=parseHTML('<html><head><title></title></head><body><input id="record" value="private entry"></body></html>');
  document.title=de;
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(document.title,en,tool+' English browser tab');
  assert.equal(document.querySelector('#record').value,'private entry','stored input untouched');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(document.title,de,tool+' German browser tab restored');
  document.title='User-defined page title';
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(document.title,'User-defined page title','non-catalog title preserved');
 }
});


test('housemate rotating support text provides six paired, locale-aware labels', async () => {
 const {readFileSync}=await import('node:fs');
 const {fileURLToPath}=await import('node:url');
 const {resolve,dirname}=await import('node:path');
 const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../../tools/housemates/index.html'),'utf8');
 const german=source.match(/const kofiSprueche = \[([\s\S]*?)\];/);
 const english=source.match(/const kofiSpruecheEn = \[([\s\S]*?)\];/);
 assert.ok(german && english,'both source-backed language catalogues exist');
 const labels=(block)=>[...block.matchAll(/^\s*"([^"]+)"\s*,?\s*$/gm)].map(match=>match[1]);
 const originalLabels=labels(german[1]),translatedLabels=labels(english[1]);
 assert.equal(originalLabels.length,6,'six original rotating messages');
 assert.equal(translatedLabels.length,6,'six corresponding English messages');
 assert.ok(translatedLabels.every((entry)=>entry.length>5 && !originalLabels.includes(entry)));
 assert.match(source,/kofiEl\.dataset\.kofiCopyIndex = String\(idx\)/,'selected message index is preserved');
 assert.match(source,/function refreshVisibleKofiText\(\) \{\s*const kofiEl = document\.getElementById\('kofiText'\)/,'visible-message refresh reads existing selected index');
 assert.match(source,/document\.addEventListener\('toolya:locale-change', \(\) => \{\s*if \(!householdReadyForLocaleRefresh\) return;\s*renderApp\(\);\s*refreshVisibleKofiText\(\)/,'existing guarded locale handler invokes the read-only refresh');
});


test('dynamic budget labels translate recognised categories without touching stored identifiers', async () => {
 const {readFileSync}=await import('node:fs');
 const {fileURLToPath}=await import('node:url');
 const {resolve,dirname}=await import('node:path');
 const {runInNewContext}=await import('node:vm');
 const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../../tools/budget/index.html'),'utf8');
 const dictionary=source.match(/const budgetCategoryEn = Object\.freeze\((\{[\s\S]*?\})\);/);
 const helper=source.match(/function budgetCategoryLabel\(category\) \{[\s\S]*?\n        \}/);
 assert.ok(dictionary && helper,'source-backed display dictionary and locale helper exist');
 const context={window:{__toolyaUILocale:'en'}};
 runInNewContext(dictionary[0]+'\n'+helper[0]+'\nthis.categoryLabel=budgetCategoryLabel;',context);
 const cases={
  Lebensmittel:'Groceries',Wohnen:'Housing',Energie:'Energy',Auto:'Car',
  Freizeit:'Leisure',Elektronik:'Electronics',Gesundheit:'Health',
  Haustiere:'Pets',Verträge:'Contracts',Sonstiges:'Other'
 };
 for(const [key,value] of Object.entries(cases)){
  assert.equal(context.categoryLabel(key),value,'English display for '+key);
  context.window.__toolyaUILocale='de';
  assert.equal(context.categoryLabel(key),key,'German stored key survives '+key);
  context.window.__toolyaUILocale='en';
 }
 for(const value of ['__proto__','constructor','toString','Custom user category','<img src=x>']){
  assert.equal(context.categoryLabel(value),value,'no prototype lookups or untrusted translation');
 }
 assert.match(source,/data-cat="\$\{cat\}"/,'budget input retains persisted category IDs');
 assert.match(source,/r\.category === catFilter/,'filter retains persisted category IDs');
 assert.match(source,/escapeHaushaltsHtml\(budgetCategoryLabel\(r\.category\)\)/,'receipt category output escaped');
 assert.match(source,/escapeHaushaltsHtml\(budgetCategoryLabel\(cat\)\)/,'budget labels escaped');
});

test('dynamic budget cards and receipt badges provide paired, display-only DE/EN copy', async () => {
 const {readFileSync}=await import('node:fs');
 const {fileURLToPath}=await import('node:url');
 const {resolve,dirname}=await import('node:path');
 const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../../tools/budget/index.html'),'utf8');
 for(const [de,en] of [
  ['Noch keine Sparziele angelegt.','No savings goals yet.'],
  ['Gespart:','Saved:'],['Ziel:','Target:'],['+ Einzahlen','+ Deposit'],
  ['🔄 Fixkosten','🔄 Recurring cost'],['💼 Steuer','💼 Tax'],
  ['Garantie aktiv (','Warranty active ('],['Garantie abgelaufen','Warranty expired'],['⏱️ Rückgabe: ','⏱️ Return: '],
  ['Betrag:','Amount:'],['Datum:','Date:'],['Zahlungsart:','Payment method:'],
  ['Karton: ','Box: '],['Notiz: ','Note: '],['✏️ Bearbeiten','✏️ Edit']
 ]){
  assert.ok(source.includes(de) && source.includes(en),'paired source copy: '+de);
 }
 assert.match(source,/escapeHaushaltsHtml\(budgetPaymentLabel\(r\.paymentMethod \|\|/,'payment values localized only for display and HTML-escaped');
 assert.match(source,/escapeHaushaltsHtml\(r\.title\)/,'user-supplied savings title untouched');
 assert.match(source,/escapeHaushaltsHtml\(displayReceiptDate\(r\.date\)\)/,'recorded dates formatted only in display');
 assert.match(source,/getElementById\('receiptDate'\)\.value = r\.date/,'raw date retained in edit field');
});


test('budget locale-change refresh keeps unsaved budget inputs and record keys stable', async () => {
 const {readFileSync}=await import('node:fs');
 const {fileURLToPath}=await import('node:url');
 const {resolve,dirname}=await import('node:path');
 const {createContext,runInContext}=await import('node:vm');
 const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../../tools/budget/index.html'),'utf8');
 const dictionary=source.match(/const budgetCategoryEn = Object\.freeze\((\{[\s\S]*?\})\);/);
 const formatter=source.match(/function budgetCategoryLabel\(category\) \{[\s\S]*?\n        \}/);
 const start=source.indexOf('function refreshBudgetDynamicLocale() {');
 const end=source.indexOf("document.addEventListener('toolya:locale-change', refreshBudgetDynamicLocale)",start);
 assert.ok(dictionary && formatter && start>0 && end>start,'source-backed budget locale refresh exists');
 const {document}=parseHTML('<div id="budgetProgressList"><span data-budget-category="Wohnen">Wohnen</span></div><div id="budgetInputList"><label for="budget-amount-0">Lebensmittel:</label><input id="budget-amount-0" data-cat="Lebensmittel" value="150"></div>');
 const input=document.getElementById('budget-amount-0');
 input.value='175';
 let savingsRefresh=0,receiptRefresh=0,chartRefresh=0,axisRefresh=0,stickerRefresh=0,photoPreviewRefresh=0;
 const context={
  window:{__toolyaUILocale:'en'},document,toolyaCloudReady:true,
  renderSavingsGoals:()=>{savingsRefresh++;},
  renderTransactionList:()=>{receiptRefresh++;},
  refreshBudgetChartSummaries:()=>{chartRefresh++;},
  refreshBudgetChartLabels:()=>{axisRefresh++;},
  refreshBudgetStickerLabels:()=>{stickerRefresh++;},
  refreshBudgetPhotoPreviewLocale:()=>{photoPreviewRefresh++;}
 };
 createContext(context);
 runInContext(dictionary[0]+'\n'+formatter[0]+'\n'+source.slice(start,end),context);
 runInContext('refreshBudgetDynamicLocale()',context);
 assert.equal(document.querySelector('[data-budget-category]').textContent,'Housing');
 assert.equal(document.querySelector('#budgetInputList label').textContent,'Groceries:');
 assert.equal(input.value,'175','unsaved input preserved');
 assert.equal(input.getAttribute('data-cat'),'Lebensmittel','stored category key unchanged');
 context.window.__toolyaUILocale='de';
 runInContext('refreshBudgetDynamicLocale()',context);
 assert.equal(document.querySelector('[data-budget-category]').textContent,'Wohnen');
 assert.equal(document.querySelector('#budgetInputList label').textContent,'Lebensmittel:');
 assert.equal(input.value,'175');
 assert.equal(savingsRefresh,2);
 assert.equal(receiptRefresh,2);
 assert.equal(chartRefresh,2,'accessible summaries refreshed without mutating the form');
 assert.equal(axisRefresh,2,'visual chart labels refreshed without touching data');
 assert.equal(stickerRefresh,2,'sticker labels refreshed without changing a draft');
 assert.equal(photoPreviewRefresh,2,'photo preview accessible names refreshed without rebuilding drafts');
 context.toolyaCloudReady=false;
 context.window.__toolyaUILocale='en';
 runInContext('refreshBudgetDynamicLocale()',context);
 assert.equal(document.querySelector('#budgetInputList label').textContent,'Lebensmittel:','cloud-gated refresh leaves inputs alone');
 assert.equal(savingsRefresh,2);
 assert.equal(receiptRefresh,2);
 assert.equal(chartRefresh,2,'cloud gate also prevents chart refresh');
 assert.equal(axisRefresh,2,'cloud gate prevents visual chart updates');
 assert.equal(stickerRefresh,2,'cloud gate prevents sticker updates');
 assert.equal(photoPreviewRefresh,2,'cloud gate prevents preview updates');
 assert.ok(!source.slice(start,end).includes('saveBudgets('),'locale refresh never persists budgets');
 assert.ok(!source.slice(start,end).includes('localStorage.setItem('),'locale refresh never writes storage');
});


test('budget accessible chart summaries switch DE/EN using read-only computed values', async () => {
 const {readFileSync}=await import('node:fs');
 const {fileURLToPath}=await import('node:url');
 const {resolve,dirname}=await import('node:path');
 const {createContext,runInContext}=await import('node:vm');
 const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../../tools/budget/index.html'),'utf8');
 const dictionary=source.match(/const budgetCategoryEn = Object\.freeze\((\{[\s\S]*?\})\);/);
 const formatter=source.match(/function budgetCategoryLabel\(category\) \{[\s\S]*?\n        \}/);
 const begin=source.indexOf('let budgetChartDisplaySnapshot = null;');
 const end=source.indexOf('// Read-only locale refresh:',begin);
 assert.ok(dictionary && formatter && begin>0 && end>begin,'accessibility helper is source-backed');
 const {document}=parseHTML('<div id="categoryChartSummary"></div><div id="cashflowChartSummary"></div>');
 const context={document,window:{__toolyaUILocale:'en'}};
 createContext(context);
 runInContext(dictionary[0]+'\n'+formatter[0]+'\n'+source.slice(begin,end),context);
 runInContext("budgetChartDisplaySnapshot={categories:[['Wohnen',25],['<private>',8]],income:100,expense:33}; refreshBudgetChartSummaries();",context);
 const category=document.getElementById('categoryChartSummary');
 const cashflow=document.getElementById('cashflowChartSummary');
 assert.match(category.textContent,/Housing:/);
 assert.match(category.textContent,/<private>:/,'custom category is not translated');
 assert.match(cashflow.textContent,/Income:/);
 assert.match(cashflow.textContent,/Expenses:/);
 assert.match(cashflow.textContent,/Balance:/);
 assert.ok(!category.querySelector('private'),'category renders as text rather than HTML');
 context.window.__toolyaUILocale='de';
 runInContext('refreshBudgetChartSummaries()',context);
 assert.match(category.textContent,/Wohnen:/);
 assert.match(cashflow.textContent,/Einnahmen:/);
 assert.match(cashflow.textContent,/Ausgaben:/);
 assert.match(cashflow.textContent,/Saldo:/);
 runInContext("budgetChartDisplaySnapshot={categories:[],income:0,expense:0}; refreshBudgetChartSummaries();",context);
 assert.equal(category.textContent,'Keine Ausgaben in diesem Monat.');
 context.window.__toolyaUILocale='en';
 runInContext('refreshBudgetChartSummaries()',context);
 assert.equal(category.textContent,'No expenses this month.');
 assert.match(source,/income: totalIncome, expense: totalExpense/,'snapshot retains calculated totals');
 const refresh=source.slice(source.indexOf('function refreshBudgetChartSummaries()'),end);
 assert.ok(!refresh.includes('saveBudgets(') && !refresh.includes('localStorage.setItem('),'summary refresh has no writes');
 assert.match(source,/refreshBudgetChartSummaries\(\);\s*refreshBudgetChartLabels\(\);\s*refreshBudgetStickerLabels\(\);\s*refreshBudgetPhotoPreviewLocale\(\);\s*\}\s*document\.addEventListener\('toolya:locale-change', refreshBudgetDynamicLocale\)/,'locale change refreshes accessible summaries, chart labels, sticker and photo preview display');
});


test('budget payment methods translate only known display values and retain saved IDs', async () => {
 const {readFileSync}=await import('node:fs');
 const {fileURLToPath}=await import('node:url');
 const {resolve,dirname}=await import('node:path');
 const {createContext,runInContext}=await import('node:vm');
 const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../../tools/budget/index.html'),'utf8');
 const dictionary=source.match(/const budgetPaymentEn = Object\.freeze\((\{[\s\S]*?\})\);/);
 const formatter=source.match(/function budgetPaymentLabel\(method\) \{[\s\S]*?\n        \}/);
 assert.ok(dictionary && formatter,'payment translation uses source-verified identifiers');
 const context={window:{__toolyaUILocale:'en'}};
 createContext(context);
 runInContext(dictionary[0]+'\n'+formatter[0],context);
 const pairs={
  'EC-Karte':'Debit card',Bargeld:'Cash',Kreditkarte:'Credit card',
  'Überweisung':'Bank transfer / standing order',PayPal:'PayPal'
 };
 for(const [key,expected] of Object.entries(pairs)){
  assert.equal(context.budgetPaymentLabel(key),expected);
  context.window.__toolyaUILocale='de';
  assert.equal(context.budgetPaymentLabel(key),key,'persisted German code remains unchanged');
  context.window.__toolyaUILocale='en';
  assert.match(source,new RegExp('value="'+key+'"'),'source select keeps the original payment code');
 }
 for(const key of ['__proto__','constructor','toString','Custom method','<img src=x>']){
  assert.equal(context.budgetPaymentLabel(key),key,'untrusted or prototype key stays verbatim');
 }
 assert.match(source,/escapeHaushaltsHtml\(budgetPaymentLabel\(r\.paymentMethod/,'transaction display escapes payment label');
 assert.match(source,/escapeHaushaltsHtml\(r\.note\)/,'free-form notes are escaped before dynamic insertion');
 assert.match(source,/receiptPaymentMethod'\)\.value = r\.paymentMethod/,'saved payment method unchanged when editing');
});


test('budget dynamic charts localize only legend labels and preserve numeric series', async () => {
 const {readFileSync}=await import('node:fs');
 const {fileURLToPath}=await import('node:url');
 const {resolve,dirname}=await import('node:path');
 const {createContext,runInContext}=await import('node:vm');
 const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../../tools/budget/index.html'),'utf8');
 const dictionary=source.match(/const budgetCategoryEn = Object\.freeze\((\{[\s\S]*?\})\);/);
 const formatter=source.match(/function budgetCategoryLabel\(category\) \{[\s\S]*?\n        \}/);
 const begin=source.indexOf('function refreshBudgetChartLabels() {');
 const end=source.indexOf('// Read-only locale refresh:',begin);
 assert.ok(dictionary && formatter && begin>0 && end>begin,'source-backed chart label updater present');
 let categoryUpdates=0,cashUpdates=0;
 const category={data:{labels:['Wohnen','Freizeit'],datasets:[{data:[25,40]}]},update:()=>{categoryUpdates++;}};
 const cash={data:{labels:['Einnahmen','Ausgaben'],datasets:[{label:'Betrag €',data:[100,65]}]},update:()=>{cashUpdates++;}};
 const context={
  window:{__toolyaUILocale:'en'},
  categoryChartInstance:category,cashflowChartInstance:cash
 };
 createContext(context);
 runInContext(dictionary[0]+'\n'+formatter[0]+'\nlet budgetChartDisplaySnapshot = {categories:[["Wohnen",25],["Freizeit",40]],income:100,expense:65};\n'+source.slice(begin,end),context);
 runInContext('refreshBudgetChartLabels()',context);
 assert.deepEqual(Array.from(category.data.labels),['Housing','Leisure']);
 assert.deepEqual(Array.from(cash.data.labels),['Income','Expenses']);
 assert.equal(cash.data.datasets[0].label,'Amount €');
 assert.deepEqual(category.data.datasets[0].data,[25,40]);
 assert.deepEqual(cash.data.datasets[0].data,[100,65]);
 context.window.__toolyaUILocale='de';
 runInContext('refreshBudgetChartLabels()',context);
 assert.deepEqual(Array.from(category.data.labels),['Wohnen','Freizeit']);
 assert.deepEqual(Array.from(cash.data.labels),['Einnahmen','Ausgaben']);
 assert.equal(cash.data.datasets[0].label,'Betrag €');
 assert.equal(categoryUpdates,2);
 assert.equal(cashUpdates,2);
 runInContext('budgetChartDisplaySnapshot={categories:[],income:0,expense:0}; refreshBudgetChartLabels()',context);
 assert.deepEqual(Array.from(category.data.labels),['Keine Ausgaben']);
 context.window.__toolyaUILocale='en';
 runInContext('refreshBudgetChartLabels()',context);
 assert.deepEqual(Array.from(category.data.labels),['No expenses']);
 runInContext('budgetChartDisplaySnapshot={categories:[["__proto__",3],["Custom <tag>",2]],income:5,expense:5}; refreshBudgetChartLabels()',context);
 assert.deepEqual(Array.from(category.data.labels),['__proto__','Custom <tag>'],'unknown categories remain unchanged');
 assert.deepEqual(category.data.datasets[0].data,[25,40],'no chart data rewrite');
 const updater=source.slice(begin,end);
 assert.ok(!/saveBudgets\(|localStorage\.setItem\(|\.datasets\[0\]\.data\s*=/.test(updater),'visual locale updater has no writes');
 assert.match(source,/catLabels\.map\(budgetCategoryLabel\)/,'initial chart render is locale-aware');
});


test('budget QR sticker labels round-trip without changing private QR payload', async () => {
 const {readFileSync}=await import('node:fs');
 const {fileURLToPath}=await import('node:url');
 const {resolve,dirname}=await import('node:path');
 const {createContext,runInContext}=await import('node:vm');
 const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../../tools/budget/index.html'),'utf8');
 const start=source.indexOf('let budgetStickerDisplaySnapshot = null;');
 const end=source.indexOf('async function openQRModal(id) {',start);
 assert.ok(start>0 && end>start,'source backed QR sticker helper exists');
 const {document}=parseHTML('<div id="qrModal"><span id="stickerTitle"></span><span id="stickerStoreDate"></span><span id="stickerSN"></span><span id="stickerWarranty"></span></div>');
 const context={
  document,window:{__toolyaUILocale:'en'},
  parseReceiptDate:(date)=>new Date(date+'T00:00:00Z'),
  addWarrantyMonths:()=>new Date('2027-01-15T00:00:00Z')
 };
 createContext(context);
 runInContext(source.slice(source.indexOf('function displayReceiptDate('),source.indexOf('function addWarrantyMonths('))+source.slice(start,end),context);
 runInContext("budgetStickerDisplaySnapshot={title:'Private <project>',date:'2026-11-22',store:'',serial:'',warrantyMonths:12}; refreshBudgetStickerLabels();",context);
 assert.equal(document.getElementById('stickerTitle').textContent,'Private <project>');
 assert.equal(document.getElementById('stickerStoreDate').textContent,'Purchased: 22/11/2026 (Warranty receipt)');
 assert.equal(document.getElementById('stickerSN').textContent,'S/N: none');
 assert.match(document.getElementById('stickerWarranty').textContent,/Warranty until: 15\/01\/2027/);
 assert.equal(document.querySelector('project'),null,'title is assigned as text, not HTML');
 context.window.__toolyaUILocale='de';
 runInContext('refreshBudgetStickerLabels()',context);
 assert.equal(document.getElementById('stickerStoreDate').textContent,'Kauf: 22.11.2026 (Garantie-Beleg)');
 assert.equal(document.getElementById('stickerSN').textContent,'S/N: keine');
 assert.match(document.getElementById('stickerWarranty').textContent,/Garantie bis: 15\.1\.2027/);
 document.getElementById('qrModal').classList.add('hidden');
 context.window.__toolyaUILocale='en';
 runInContext('refreshBudgetStickerLabels()',context);
 assert.equal(document.getElementById('stickerSN').textContent,'S/N: keine','closed dialog not updated');
 assert.ok(source.includes('const qrText = `GERÄT: ${r.title}\\nKAUFDATUM: ${r.date}\\nHÄNDLER: ${r.store || \'k.A.\'}\\nSERIENNR: ${r.sn || \'k.A.\'}`'),'QR data payload unchanged');
 assert.match(source,/budgetStickerDisplaySnapshot = null;\s*\}/,'closing the modal clears private render snapshot');
 assert.ok(!/localStorage\.setItem\(|saveData\(/.test(source.slice(start,end)),'sticker locale refresh does not persist');
});


test('parking countdown statuses switch DE/EN without changing running deadline or persistence', async () => {
 const {readFileSync}=await import('node:fs');
 const {fileURLToPath}=await import('node:url');
 const {resolve,dirname}=await import('node:path');
 const {createContext,runInContext}=await import('node:vm');
 const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../../tools/parking/index.html'),'utf8');
 const start=source.indexOf('const parkingTimerCopy = Object.freeze(');
 const end=source.indexOf('async function stopTimer()',start);
 assert.ok(start>0 && end>start,'parking status locale helper exists in source');
 const {document}=parseHTML('<div id="timerDisplay">00:12:45</div><p id="timerStatus">Parkzeit läuft...</p><input id="parkDesc" value="My private car park">');
 const state={window:{__toolyaUILocale:'en'},document};
 createContext(state);
 runInContext(source.slice(start,end),state);
 const status=document.getElementById('timerStatus');
 const display=document.getElementById('timerDisplay');
 runInContext('refreshParkingTimerLocale()',state);
 assert.equal(status.textContent,'Parking time is running...');
 assert.equal(display.textContent,'00:12:45');
 assert.equal(document.getElementById('parkDesc').value,'My private car park');
 state.window.__toolyaUILocale='de';
 runInContext('refreshParkingTimerLocale()',state);
 assert.equal(status.textContent,'Parkzeit läuft...');
 for(const [de,en] of [
  ['Kein aktiver Parkschein-Timer','No active parking ticket timer'],
  ['Bitte Parkzeit verlängern oder zum Auto gehen!','Extend your parking time or return to your car!']
 ]) {
  status.textContent=de;
  state.window.__toolyaUILocale='en';
  runInContext('refreshParkingTimerLocale()',state);
  assert.equal(status.textContent,en);
  state.window.__toolyaUILocale='de';
  runInContext('refreshParkingTimerLocale()',state);
  assert.equal(status.textContent,de);
 }
 display.textContent='⏰ ABGELAUFEN!';
 state.window.__toolyaUILocale='en';
 runInContext('refreshParkingTimerLocale()',state);
 assert.equal(display.textContent,'⏰ EXPIRED!');
 state.window.__toolyaUILocale='de';
 runInContext('refreshParkingTimerLocale()',state);
 assert.equal(display.textContent,'⏰ ABGELAUFEN!');
 status.textContent='User-added status';
 state.window.__toolyaUILocale='en';
 runInContext('refreshParkingTimerLocale()',state);
 assert.equal(status.textContent,'User-added status','unknown status preserved');
 const helper=source.slice(start,end);
 assert.ok(!/saveData\(|localStorage\.|setInterval\(|activeEndTime\s*=|runTimerLoop\(/.test(helper),'locale refresh has no deadline or persistence side effects');
 assert.match(source,/refreshParkingTimerLocale\(\);\s*(?:refreshParkingGpsLocale\(\);\s*)?if \(parkingCloudReady\) renderParkingList\(\)/,'locale event refreshes countdown and saved parking display without cloud writes');
});


test('meter monthly chart labels round-trip DE/EN without changing reading counts', async () => {
 const {readFileSync}=await import('node:fs');
 const {fileURLToPath}=await import('node:url');
 const {resolve,dirname}=await import('node:path');
 const {createContext,runInContext}=await import('node:vm');
 const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../../tools/meters/index.html'),'utf8');
 const begin=source.indexOf('function renderChart(data) {');
 const end=source.indexOf('function renderPrognosis(data) {',begin);
 assert.ok(begin>0 && end>begin,'source monthly chart renderer exists');
 const {document}=parseHTML('<section id="chartCard" class="hidden"><div id="chartContainer"></div></section>');
 const context={document,window:{__toolyaUILocale:'en'}};
 createContext(context);
 runInContext(source.slice(begin,end),context);
 const readings=[
  {date:'2026-10-01',value:100},
  {date:'2026-11-01',value:110},
  {date:'2026-11-15',value:120}
 ];
 context.readings=readings;
 runInContext('renderChart({readings})',context);
 const english=document.getElementById('chartContainer').textContent;
 assert.match(english,/Month: 2026-10/);
 assert.match(english,/Readings: 2/);
 context.window.__toolyaUILocale='de';
 runInContext('renderChart({readings})',context);
 const german=document.getElementById('chartContainer').textContent;
 assert.match(german,/Monat: 2026-10/);
 assert.match(german,/Ablesungen: 2/);
 assert.deepEqual(readings.map(x=>x.value),[100,110,120],'readings stay unchanged');
 assert.ok(!/saveData\(|localStorage\.setItem\(/.test(source.slice(begin,end)),'chart render never saves readings');
 assert.match(source,/if \(metersCloudReady\) renderApp\(\)/,'existing locale event re-renders meter charts only after cloud ready');
});

test('meter forecast and reading badge copy has paired DE/EN labels with escaped user fields', async () => {
 const {readFileSync}=await import('node:fs');
 const {fileURLToPath}=await import('node:url');
 const {resolve,dirname}=await import('node:path');
 const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../../tools/meters/index.html'),'utf8');
 const pairs=[
  ['Prognose & Live-Kosten','forecast & current costs'],
  ['Hochrechnung / Jahr:','Estimate / year:'],
  ['Tages-Schnitt:','Daily average:'],
  ['Abschlag nicht hinterlegt','Advance payment not entered'],
  ['Nachzahlung: ca. ','Additional payment: approx. '],
  ['Guthaben: ca. ','Credit: approx. '],
  ['Neuer Abschlag:','New advance payment:'],
  ['Zählerwechsel (Start:','Meter replaced (start:'],
  ['Differenz:','Difference:'],
  ['Zählerwechsel Start','Meter replacement start'],
  ['Stand:','Reading:'],
  ['Notiz:','Note:'],
  ['✕ Löschen','✕ Delete']
 ];
 for(const [de,en] of pairs) assert.ok(source.includes(de) && source.includes(en),'source DE/EN copy '+de);
 assert.match(source,/const matching = data\.readings\.filter\(r =>/,'forecast filters recorded readings');
 assert.match(source,/const yearlyCost = hasPrice && hasConversionFactor/,'forecast calculations unchanged');
 assert.match(source,/escapeHtml\(r\.name\)/,'meter names escaped');
 assert.match(source,/escapeHtml\(r\.note\)/,'meter notes escaped');
 assert.match(source,/escapeHtml\(prev\.date\)/,'previous date escaped');
 assert.match(source,/escapeHtml\(r\.value\)/,'reading values escaped');
 assert.match(source,/r\.type === filter/,'filter identifiers remain German');
 assert.match(source,/data\.readings\.filter\(r =>/,'no reading data migration');
});


test('car monthly fuel summary switches DE/EN with unchanged consumption and cost', async () => {
 const {readFileSync}=await import('node:fs');
 const {fileURLToPath}=await import('node:url');
 const {resolve,dirname}=await import('node:path');
 const {createContext,runInContext}=await import('node:vm');
 const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../../tools/car/index.html'),'utf8');
 const begin=source.indexOf('if (monthTankEvents.length > 0) {');
 const end=source.indexOf("document.getElementById('statEvents')",begin);
 assert.ok(begin>0 && end>begin,'source-backed fuel renderer exists');
 const {document}=parseHTML('<div id="fuelStatsBox" class="hidden"><div id="fuelStatsContent"></div></div>');
 const fuelStatsBox=document.getElementById('fuelStatsBox');
 const fuelStatsContent=document.getElementById('fuelStatsContent');
 const events=[{litres:40,cost:72,consumption:6.4},{litres:20,cost:36,consumption:5.6}];
 const context={window:{__toolyaUILocale:'en'},fuelStatsBox,fuelStatsContent,monthTankEvents:events};
 createContext(context);
 runInContext("const label=(de,en)=>window.__toolyaUILocale==='en'?en:de;\n"+source.slice(begin,end),context);
 const english=fuelStatsContent.textContent;
 assert.match(english,/Fuelled:/);
 assert.match(english,/60\.0 litres/);
 assert.match(english,/108,00 €/);
 assert.match(english,/Avg\. consumption:/);
 assert.match(english,/6,0 l\/100km/);
 context.window.__toolyaUILocale='de';
 runInContext(source.slice(begin,end),context);
 const german=fuelStatsContent.textContent;
 assert.match(german,/Getankt:/);
 assert.match(german,/60\.0 Liter/);
 assert.match(german,/Kosten:/);
 assert.match(german,/Ø Verbrauch:/);
 assert.deepEqual(events.map(e=>e.litres),[40,20]);
 assert.deepEqual(events.map(e=>e.cost),[72,36]);
 assert.ok(!/saveData\(|localStorage\.setItem\(/.test(source.slice(begin,end)),'render has no writes');
 assert.match(source,/if \(toolyaCloudReady\) renderApp\(\)/,'existing locale event refreshes only after cloud ready');
});

test('car deadlines and vehicle actions have reversible source-backed DE/EN text', async () => {
 const {readFileSync}=await import('node:fs');
 const source=readFileSync(new URL('../../tools/car/index.html',import.meta.url),'utf8');
 for(const [de,en] of [
  ['Prognose: ca.','Forecast: approx.'],['Jahr','year'],
  ['KM aktualisieren','Update mileage'],['Löschen','Delete'],
  ['Notruf:','Emergency:'],['Fahrzeugschein anzeigen','View vehicle registration'],
  ['Gesamtkosten:','Total costs:'],['Kosten ÷ Kilometerstand:','Costs ÷ mileage:'],
  ['Überfällig seit ','Overdue by '],['Heute fällig!','Due today!'],
  ['Fällig in ','Due in '],['kein Kennzeichen','no registration']
 ]) assert.ok(source.includes(de) && source.includes(en),'missing paired car copy: '+de);
 assert.match(source,/let carName = car \? car\.name : label\("Unbekannt","Unknown"\)/,'unknown vehicles are display-only');
 assert.match(source,/e\.carId === parseInt\(selectedFilter\)/,'vehicle filter still uses original IDs');
 assert.match(source,/e\.type === 'Tanken'/,'fuel event type is not translated in storage');
 assert.match(source,/let totalTankCost = monthTankEvents\.reduce/,'numeric fuel aggregation remains');
 assert.match(source,/const label = \(de, en\) => english \? en : de/,'labels use active locale');
 assert.match(source,/window\.__toolyaUILocale === 'en' \? '-- Select vehicle --' : '-- Fahrzeug wählen --'/,'selector language does not depend on render-local closure');
});


test('car dropdown labels localize in place without replacing selected vehicle options', async () => {
 const {readFileSync}=await import('node:fs');
 const {createContext,runInContext}=await import('node:vm');
 const source=readFileSync(new URL('../../tools/car/index.html',import.meta.url),'utf8');
 const begin=source.indexOf('function refreshCarDropdownLocale() {');
 const end=source.indexOf('function renderApp() {',begin);
 assert.ok(begin>0 && end>begin,'read-only dropdown refresh exists in source');
 const {document}=parseHTML('<select id="eventCarSelect"><option value="">-- Fahrzeug wählen --</option><option value="42" selected>Private car (kein Kennzeichen)</option></select><select id="tireCarSelect"><option value="">-- Fahrzeug wählen --</option><option value="42" selected>Private car (kein Kennzeichen)</option></select><select id="filterCarSelect"><option value="">Alle Fahrzeuge anzeigen</option><option value="42" selected>Private car</option></select>');
 const cars=[{id:42,name:'Private <car>',plate:''}];
 const selected=[...document.querySelectorAll('option[selected]')];
 const context={document,window:{__toolyaUILocale:'en'},getData:()=>({cars})};
 createContext(context);
 runInContext(source.slice(begin,end),context);
 runInContext('refreshCarDropdownLocale()',context);
 assert.equal(document.querySelector('#eventCarSelect option[value=""]').textContent,'-- Select vehicle --');
 assert.equal(document.querySelector('#filterCarSelect option[value=""]').textContent,'Show all vehicles');
 assert.equal(document.querySelector('#eventCarSelect option[value="42"]').textContent,'Private <car> (no registration)');
 assert.equal(document.querySelector('#tireCarSelect option[value="42"]').textContent,'Private <car> (no registration)');
 assert.equal(document.querySelector('#eventCarSelect car'),null,'user-owned vehicle name remains text');
 context.window.__toolyaUILocale='de';
 runInContext('refreshCarDropdownLocale()',context);
 assert.equal(document.querySelector('#eventCarSelect option[value="42"]').textContent,'Private <car> (kein Kennzeichen)');
 assert.equal(document.querySelector('#filterCarSelect option[value=""]').textContent,'Alle Fahrzeuge anzeigen');
 assert.deepEqual([...document.querySelectorAll('option[selected]')],selected,'selected option nodes unchanged');
 assert.deepEqual(cars,[{id:42,name:'Private <car>',plate:''}],'source vehicle details untouched');
 const refresh=source.slice(begin,end);
 assert.ok(!/saveData\(|localStorage\.setItem\(|innerHTML\s*=/.test(refresh),'refresh never saves or recreates inputs');
 assert.match(source,/if \(toolyaCloudReady\) refreshCarDropdownLocale\(\)/,'locale refresh gated on cloud state');
});


test('pet health confirmations, validation and cloud feedback use source-backed bilingual messages', async () => {
 const {readFileSync}=await import('node:fs');
 const {runInNewContext}=await import('node:vm');
 const source=readFileSync(new URL('../../tools/pet-health/index.html',import.meta.url),'utf8');
 const expected=[
  ['Lokale Haustierdaten nach Sicherung in die Cloud übernehmen?','Import local pet data into the cloud after backing it up?'],
  ['Cloud- und Gerätedaten vorhanden. Cloud-Bestand behalten und lokale Daten separat sichern?','Cloud and device data both exist. Keep cloud data and back up local data separately?'],
  ['Bitte bestätigen, dass die Sicherung heruntergeladen wurde.','Please confirm that you downloaded the backup.'],
  ['Bitte einen Namen für das Haustier eingeben!','Please enter a pet name!'],
  ['⚠️ Möchtest du dieses Haustier und alle zugehörigen Einträge wirklich löschen?','⚠️ Delete this pet and all associated records?'],
  ['Bitte Medikamenten-Namen angeben!','Please enter a medication name!'],
  ['Bitte Haustier, Datum und Bezeichnung angeben!','Please enter a pet, date and description!'],
  ['Eintrag oder Beleg konnte nicht gespeichert werden. Cloud-Datenstand prüfen.','Record or receipt could not be saved. Check the cloud data status.'],
  ['⚠️ Diesen Eintrag wirklich löschen?','⚠️ Really delete this record?']
 ];
 const pairs=[...source.matchAll(/(?:alert|confirm)\(window\.__toolyaUILocale === 'en' \? '([^']+)' : '([^']+)'\)/g)]
  .map(match=>({english:match[1],german:match[2]}));
 for(const [de,en] of expected) {
  assert.ok(pairs.some(pair=>pair.german===de&&pair.english===en),'missing exact pet DE/EN pair: '+de);
  const expr="window.__toolyaUILocale === 'en' ? "+JSON.stringify(en)+' : '+JSON.stringify(de);
  assert.equal(runInNewContext(expr,{window:{__toolyaUILocale:'en'}}),en);
  assert.equal(runInNewContext(expr,{window:{__toolyaUILocale:'de'}}),de);
 }
 assert.match(source,/if \(!confirm\(window\.__toolyaUILocale === 'en' \? '⚠️ Delete this pet and all associated records\?'/,'pet deletion still requires confirmation');
 assert.match(source,/if \(!confirm\(window\.__toolyaUILocale === 'en' \? '⚠️ Really delete this record\?'/,'record deletion still requires confirmation');
 assert.match(source,/confirmMigration:async\(\)=>confirm\(/,'backup migration remains opt-in');
 assert.match(source,/reviewExistingCloud:async\(\)=>confirm\(/,'cloud conflict remains opt-in');
 assert.match(source,/if \(!name\) return alert\(/,'pet validation still blocks invalid input');
});

test('lending backup and destructive messages localize with unchanged confirmation guards', async () => {
 const {readFileSync}=await import('node:fs');
 const {runInNewContext}=await import('node:vm');
 const source=readFileSync(new URL('../../tools/loans/index.html',import.meta.url),'utf8');
 const expected=[
  ['Bestehende Verleihdaten in dein Toolya-Konto übernehmen? Vorhandene Cloud-Daten werden nicht überschrieben.','Import existing loan data into your Toolya account? Existing cloud data will not be overwritten.'],
  ['Cloud- und Gerätedaten vorhanden. Cloud-Bestand behalten und lokale Daten separat sichern?','Cloud and device data both exist. Keep cloud data and back up local data separately?'],
  ['Bitte bestätigen, dass die Sicherung heruntergeladen wurde.','Please confirm that you downloaded the backup.'],
  ['Bitte einen Namen eingeben!','Please enter a name!'],
  ['Bitte eine Bezeichnung für den Gegenstand angeben!','Please enter an item description!'],
  ['Diesen Stamm-Gegenstand wirklich löschen?','Really delete this inventory item?'],
  ['Bitte Person und Ausleihdatum angeben!','Please enter a person and loan date!'],
  ['⚠️ Diesen Eintrag wirklich löschen?','⚠️ Really delete this record?'],
  ['Bitte Gegenstand, Person und Ausleihdatum angeben!','Please enter an item, person and loan date!'],
  ['Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.','The QR code could not be loaded. Please try again.']
 ];
 const pairs=[...source.matchAll(/(?:alert|confirm)\(window\.__toolyaUILocale === 'en' \? '([^']+)' : '([^']+)'\)/g)]
  .map(match=>({english:match[1],german:match[2]}));
 for(const [de,en] of expected) {
  assert.ok(pairs.some(pair=>pair.german===de&&pair.english===en),'missing exact lending DE/EN pair: '+de);
  const expression="window.__toolyaUILocale === 'en' ? "+JSON.stringify(en)+' : '+JSON.stringify(de);
  assert.equal(runInNewContext(expression,{window:{__toolyaUILocale:'en'}}),en);
  assert.equal(runInNewContext(expression,{window:{__toolyaUILocale:'de'}}),de);
 }
 assert.match(source,/if \(!confirm\(window\.__toolyaUILocale === 'en' \? 'Really delete this inventory item\?'/,'inventory deletion confirmation retained');
 assert.match(source,/if \(!confirm\(window\.__toolyaUILocale === 'en' \? '⚠️ Really delete this record\?'/,'loan deletion confirmation retained');
 assert.match(source,/confirmMigration:async\(\)=>confirm\(/,'cloud migration not automatic');
 assert.match(source,/if \(!title\) return alert\(/,'item validation preserved');
 assert.match(source,/if \(!person \|\| !date\) return alert\(/,'loan validation preserved');
 assert.match(source,/i\.status === 'active'/,'persisted status keys stay untouched');
});


test('moving planner dynamic dialogs translate DE/EN while backup and deletion guards remain', async () => {
 const {readFileSync}=await import('node:fs');
 const {runInNewContext}=await import('node:vm');
 const source=readFileSync(new URL('../../tools/moving/index.html',import.meta.url),'utf8');
 const pairs=[
  ['Vorhandene Gerätedaten in dein Toolya-Konto übernehmen? Cloud-Daten werden nicht überschrieben.','Import existing device data into your Toolya account? Cloud data will not be overwritten.'],
  ['Cloud- und Gerätedaten vorhanden. Cloud-Daten behalten und Gerätedaten separat sichern?','Cloud and device data both exist. Keep cloud data and back up device data separately?'],
  ['Bitte bestätigen, dass die Sicherung tatsächlich heruntergeladen wurde.','Please confirm that the backup was downloaded successfully.'],
  ['Bitte Standort eingeben!','Please enter a location!'],
  ['Dieser Standort enthält Kisten aus einem aktiven Umzug. Bitte den Umzug erst abschließen.','This location contains boxes from an active move. Complete the move first.'],
  ['⚠️ Möchtest du diesen Standort und ALLE Kisten darin wirklich löschen?','⚠️ Really delete this location and ALL boxes inside it?'],
  ['Bitte Standort und Kisten-Name angeben!','Please enter a location and box name!'],
  ['Bild konnte nicht gelesen werden. Nichts gespeichert.','Image could not be read. Nothing was saved.'],
  ['Bitte Artikel-Name eingeben!','Please enter an item name!'],
  ['Diese Kiste ist einem aktiven Umzug zugeordnet. Bitte den Umzug erst abschließen.','This box is assigned to an active move. Complete the move first.'],
  ['⚠️ Möchtest du diese Kiste wirklich löschen?','⚠️ Really delete this box?'],
  ['Keine Kisten vorhanden.','No boxes available.'],
  ['Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.','The QR code could not be loaded. Please try again.'],
  ['Backup zu groß (maximal 20 MB).','Backup is too large (maximum 20 MB).'],
  ['Ungültiges Backup-Format.','Invalid backup format.'],
  ['Dieses Backup enthält keine Umzugsprojekte. Die bestehenden Umzugsplanungen würden verloren gehen. Trotzdem fortfahren?','This backup contains no moving projects. Existing move plans would be lost. Continue anyway?'],
  ['Vor dem Import bitte eine aktuelle Sicherung herunterladen und überprüfen.','Before importing, download and check a current backup.'],
  ['Hast du die aktuelle Sicherung erfolgreich heruntergeladen?','Did you successfully download the current backup?'],
  ['Backup importieren? Vorhandene Daten werden ersetzt.','Import backup? Existing data will be replaced.'],
  ['Backup erfolgreich importiert!','Backup imported successfully!'],
  ['Backup-Datei konnte nicht gelesen werden.','Backup file could not be read.'],
  ['Der QR-Scanner konnte nicht geladen werden. Bitte versuche es erneut.','The QR scanner could not be loaded. Please try again.'],
  ['Kamera-Zugriff fehlgeschlagen oder nicht unterstützt.','Camera access failed or is not supported.']
 ];
 const found=[...source.matchAll(/(?:alert|confirm)\((?:window\.__toolyaUILocale|exportLanguage) === 'en' \? '([^']+)' : '([^']+)'\)/g)]
  .map(m=>({en:m[1],de:m[2]}));
 for(const [de,en] of pairs){
  assert.ok(found.some(x=>x.de===de&&x.en===en),'missing moving DE/EN pair: '+de);
  const expr="window.__toolyaUILocale === 'en' ? "+JSON.stringify(en)+' : '+JSON.stringify(de);
  assert.equal(runInNewContext(expr,{window:{__toolyaUILocale:'en'}}),en);
  assert.equal(runInNewContext(expr,{window:{__toolyaUILocale:'de'}}),de);
 }
 assert.match(source,/if \(!confirm\(window\.__toolyaUILocale === 'en' \? '⚠️ Really delete this location and ALL boxes inside it\?'/,'location deletion still guarded');
 assert.match(source,/if \(!confirm\(window\.__toolyaUILocale === 'en' \? '⚠️ Really delete this box\?'/,'box deletion still guarded');
 assert.match(source,/!confirm\(window\.__toolyaUILocale === 'en' \? 'This backup contains no moving projects/,'potential destructive moving import still requires approval');
 assert.match(source,/if\(!confirm\(window\.__toolyaUILocale === 'en' \? 'Before importing, download and check a current backup\.'/,'backup-before-import guard retained');
 assert.match(source,/if\(!confirm\(window\.__toolyaUILocale === 'en' \? 'Did you successfully download the current backup\?'/,'download confirmation retained');
 assert.match(source,/if \(!confirm\(window\.__toolyaUILocale === 'en' \? 'Import backup\? Existing data will be replaced\.'/,'overwrite approval retained');
 assert.match(source,/if \(!await saveData\(parsed\)\) return;/,'import write remains behind guards');
 assert.match(source,/confirmMigration:async\(\)=>confirm\(/,'cloud migration still opt in');
 assert.match(source,/reviewExistingCloud:async\(\)=>confirm\(/,'cloud conflict selection still opt in');
 assert.match(source,/p\.status==='active'/,'active move restriction uses original stored status');
});


test('housemates validation alerts round-trip DE/EN while guards and saved records remain unchanged',async()=>{
 const {readFileSync}=await import('node:fs');
 const {runInNewContext}=await import('node:vm');
 const source=readFileSync(new URL('../../tools/housemates/index.html',import.meta.url),'utf8');
 const pairs=[
  ['Bitte mindestens einen Titel angeben!','Please enter at least a title!'],
  ['Bitte Titel und Datum angeben!','Please enter a title and date!'],
  ['Bitte Pflichtfelder ausfüllen!','Please fill in the required fields!'],
  ['Bitte Belegfoto auswählen!','Please select a receipt photo!'],
  ['Bitte mindestens Titel, Datum und Betrag angeben!','Please enter at least a title, date and amount!'],
  ['Bitte Titel und Zielbetrag angeben!','Please enter a title and target amount!'],
  ['Bitte zuerst ein WG-Mitglied anlegen.','Please add a household member first.'],
  ['Bitte Aufgabe angeben!','Please enter a task!'],
  ['Bitte Bezeichnung eingeben!','Please enter a description!'],
  ['Bitte Name und gültige Kosten angeben!','Please enter a name and valid costs!'],
  ['Bitte mindestens einen Vornamen angeben!','Please enter at least a first name!']
 ];
 const actual=[...source.matchAll(/alert\(window\.__toolyaUILocale === 'en' \? '([^']+)' : '([^']+)'\)/g)];
 for(const [de,en] of pairs){
  assert.ok(actual.some(m=>m[1]===en&&m[2]===de),'missing source translation for '+de);
  const expression="window.__toolyaUILocale === 'en' ? "+JSON.stringify(en)+' : '+JSON.stringify(de);
  assert.equal(runInNewContext(expression,{window:{__toolyaUILocale:'en'}}),en);
  assert.equal(runInNewContext(expression,{window:{__toolyaUILocale:'de'}}),de);
 }
 const guards=[
  'if (!title) return alert(window.__toolyaUILocale',
  'if (!title || !date) return alert(window.__toolyaUILocale',
  'if (!title || price <= 0 || !date) return alert(window.__toolyaUILocale',
  'if (!input.files || !input.files[0]) return alert(window.__toolyaUILocale',
  'if (!title || !date || price <= 0) return alert(window.__toolyaUILocale',
  'if (!title || target <= 0) return alert(window.__toolyaUILocale',
  "if (mateNames.length === 0) return alert(window.__toolyaUILocale",
  'if (!task) return alert(window.__toolyaUILocale',
  'if (!name || !Number.isFinite(price) || price <= 0) return alert(window.__toolyaUILocale',
  'if (!vorname) return alert(window.__toolyaUILocale'
 ];
 for(const guard of guards)assert.ok(source.includes(guard),'validation still precedes mutation: '+guard);
 assert.match(source,/items\.push\(\{ id: Date\.now\(\), title, price, date, lifespan \}\); saveInventory\(items\)/);
 assert.match(source,/goals\.push\(\{ id: Date\.now\(\), title, target, current \}\)/);
 assert.match(source,/plan\.push\(\{ id: Date\.now\(\), task, assignee, done: false \}\)/);
 assert.match(source,/contracts\.push\(\{ id: Date\.now\(\), name, price, payer, noticeDate \}\)/);
});

test('household and parking PDFs localize report values without modifying stored records', async () => {
 const {readFileSync} = await import('node:fs');
 const {runInNewContext} = await import('node:vm');
 const scenarios = [
  {
   tool: 'housemates', action: 'exportAbrechnungPDF',
   data: [
    { title: 'Mein Einkauf', category: 'Lebensmittel', price: 12.5 },
    { title: 'Mein Eintrag', category: 'Eigene Kategorie', payer: 'Eigener Name', price: 7 }
   ],
   en: ['Mein Einkauf (Groceries): 12.50 EUR [Private]', 'Eigene Kategorie', 'Eigener Name'],
   de: ['Mein Einkauf (Lebensmittel): 12,50 EUR [Privat]', 'Eigene Kategorie', 'Eigener Name']
  },
  {
   tool: 'parking', action: 'exportPDF',
   data: { sessions: [{ desc: 'Mein Parkplatz', sector: 'Mein Sektor', date: '2026-11-20', cost: 12.5 }] },
   en: ['Total costs: 12.50 EUR', 'Mein Parkplatz [Sector: Mein Sektor] | 2026-11-20 | 12.50 EUR'],
   de: ['Gesamtkosten: 12,50 EUR', 'Mein Parkplatz [Sektor: Mein Sektor] | 2026-11-20 | 12,50 EUR']
  }
 ];
 for (const {tool, action, data, en, de} of scenarios) {
  const html = readFileSync(new URL('../../tools/' + tool + '/index.html', import.meta.url), 'utf8');
  const start = html.indexOf('async function ' + action + '()');
  const end = html.indexOf('    </script>', start);
  const dependencies = tool === 'housemates'
   ? html.slice(html.indexOf('function formatHouseholdCategoryLabel('), html.indexOf('/* Charts */', html.indexOf('function formatHouseholdCategoryLabel(')))
   : tool==='parking' ? html.slice(html.indexOf('function displayLegacyDate('),html.indexOf('// PDF Report Export via jsPDF')) : '';
  const source = html.slice(start, end).replace(
   "const { createExportPdf } = await import('../../shared/toolya/pdf-export.mjs');",
   'const createExportPdf = async () => pdfStub;'
  );
  const original = JSON.stringify(data);
  for (const [locale, expected] of [['en', en], ['de', de]]) {
   const texts = [];
   const window = { __toolyaUILocale: locale };
   const pdfStub = {
    setFont() {}, setFontSize() {}, addPage() {}, save() {},
    text(value) { texts.push(value); }, splitTextToSize(value) { return [value]; }
   };
   const exportPromise = runInNewContext(dependencies + source + '\n' + action + '()', {
    window, getData: () => data, pdfStub
   });
   window.__toolyaUILocale = locale === 'en' ? 'de' : 'en';
   await exportPromise;
   for (const value of expected) assert.ok(texts.some(line => line.includes(value)), tool + ': ' + value);
   assert.equal(JSON.stringify(data), original);
  }
 }
});

test('icon-only tool actions have distinct accessible names in German and English', async () => {
 const {readFileSync} = await import('node:fs');
 const {runInNewContext} = await import('node:vm');
 const cases = [
  ['housemates', 2, [
   ['deleteReceipt', 'Buchung löschen', 'Delete transaction'],
   ['deleteSavingsGoal', 'Sparziel löschen', 'Delete savings goal']
  ]],
  ['parking', 2, [['deleteSession', 'Parkvorgang löschen', 'Delete parking session']]],
  ['plants', 6, [
   ['removeSeedItem', 'Saatgut entfernen', 'Remove seeds'],
   ['removeInventoryItem', 'Lagerartikel entfernen', 'Remove inventory item'],
   ['deletePlant', 'Pflanze löschen', 'Delete plant']
  ]],
  ['meters', 1, []],
  ['budget', 4, [
   ['deleteSavingsGoal', 'Sparziel löschen', 'Delete savings goal'],
   ['deleteReceipt', 'Buchung löschen', 'Delete transaction']
  ]],
  ['car', 0, [
   ['deleteTireSet', 'Reifensatz löschen', 'Delete tyre set'],
   ['deleteEvent', 'Fahrzeugeintrag löschen', 'Delete vehicle entry']
  ]],
  ['pet-health', 0, [
   ['deleteMedication', 'Medikament löschen', 'Delete medication'],
   ['deleteEvent', 'Gesundheitseintrag löschen', 'Delete health entry']
  ]],
  ['loans', 1, [
   ['data-inventory-delete=', 'Inventargegenstand löschen', 'Delete inventory item'],
   ['data-loan-action="delete"', 'Verleiheintrag löschen', 'Delete loan record']
  ]],
  ['moving', 0, [
   ['removeSubItem', 'Inhalt entfernen', 'Remove item'],
   ['deleteBox', 'Kiste löschen', 'Delete box']
  ]]
 ];
 for (const [tool, closeCount, actions] of cases) {
  const html = readFileSync(new URL('../../tools/' + tool + '/index.html', import.meta.url), 'utf8');
  const {document} = parseHTML(html);
  const closeButtons = [...document.querySelectorAll('button[data-tool-en-aria-label="Close"]')]
   .filter(button => ['✕', '×'].includes(button.textContent.trim()));
  assert.equal(closeButtons.length, closeCount, tool);
  for (const [locale, expected] of [['en', 'Close'], ['de', 'Schließen']]) {
   applyToolInterfaceLocale(document, tool, locale);
   for (const button of closeButtons) assert.equal(button.getAttribute('aria-label'), expected);
   for (const [action, german, english] of actions) {
    const marker = action.startsWith('data-') ? action : 'onclick="' + action + '(';
    const start = html.lastIndexOf('<button', html.indexOf(marker));
    const expression = html.slice(start, html.indexOf(marker)).match(/aria-label="\$\{([^}]+)\}"/)?.[1];
    assert.ok(expression, action);
    assert.equal(runInNewContext(expression, {window: {__toolyaUILocale: locale}, english: locale === 'en'}),
     locale === 'en' ? english : german, action);
   }
  }
 }
});
