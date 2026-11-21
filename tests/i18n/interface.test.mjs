import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {applyToolInterfaceLocale,translateToolDialog} from '../../shared/toolya/i18n/interface.mjs';

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
