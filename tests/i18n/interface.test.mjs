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
