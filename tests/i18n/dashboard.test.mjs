import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {DASHBOARD_COPY,dashboardText} from '../../shared/toolya/i18n/dashboard-copy.mjs';
import {applyDashboardPageLocale} from '../../shared/toolya/i18n/dashboard-dom.mjs';

test('dashboard copy is reversible, user identifiers and unknown server errors remain unchanged',()=>{
 for(const [de,en] of Object.entries(DASHBOARD_COPY)){
  assert.equal(dashboardText(de,'en'),en,de);
  assert.equal(dashboardText(en,'de'),de,en);
 }
 assert.equal(dashboardText('User notes: Passwort ist geheim','en'),'User notes: Passwort ist geheim');
 assert.equal(dashboardText('user@example.org','en'),'user@example.org');
 assert.equal(dashboardText('Abmeldung fehlgeschlagen: user@example.org','en'),'Sign-out failed: user@example.org');
 assert.equal(dashboardText('3 offene Artikel aus 2 Quellen.','en'),'3 open items from 2 sources.');
});
test('dashboard DOM language switch changes app-authored leaf text and attributes but never input values or user entries',()=>{
 const fixture='<body><div><h2>✓ Meine Aufgaben</h2><label>Neue Aufgabe<input value="Privater Wert" placeholder="Was möchtest du erledigen?"></label><button onclick="save()">Hinzufügen</button></div><ul id="tasks"><li>Passwort</li></ul><select id="watering-connect-plant"><option>Einstellungen</option></select><p id="loginMessage">Bitte eine gültige E-Mail-Adresse eingeben.</p></body>';
 const {document}=parseHTML('<html lang="de">'+fixture+'</html>');
 const input=document.querySelector('input'),button=document.querySelector('button');
 applyDashboardPageLocale(document,'en');
 assert.equal(document.querySelector('#loginMessage').textContent,'Bitte eine gültige E-Mail-Adresse eingeben.','dynamic status must not be overwritten by static translator');
 assert.equal(document.querySelector('h2').textContent,'✓ My tasks');
 assert.equal(input.getAttribute('placeholder'),'What do you want to do?');
 assert.equal(input.value,'Privater Wert');
 assert.equal(button.getAttribute('onclick'),'save()');
 assert.equal(document.querySelector('#tasks li').textContent,'Passwort');
 assert.equal(document.querySelector('#watering-connect-plant option').textContent,'Einstellungen','personal plant names must never be translated');
 applyDashboardPageLocale(document,'de');
 assert.equal(document.querySelector('h2').textContent,'✓ Meine Aufgaben');
 assert.equal(input.getAttribute('placeholder'),'Was möchtest du erledigen?');
 assert.equal(document.querySelector('#tasks li').textContent,'Passwort');
});
test('dashboard uses the same account and data keys; language is presentation-only',()=>{
 const file=readFileSync(new URL('../../dashboard/dashboard.js',import.meta.url),'utf8');
 const account=readFileSync(new URL('../../dashboard/account-settings.js',import.meta.url),'utf8');
 assert.match(file,/hub_favorites/);assert.match(file,/toolya_dashboard_tasks_v1/);
 assert.match(account,/redirectTo:'https:\/\/toolya\.app\/index\.html'/);
 assert.match(file,/dashboardDateLocale\(\)/);
});

test('new cloud revision label follows language without altering revision identifiers',()=>{
 assert.equal(dashboardText('Cloud-Datenstand ist unverändert (Revision neu).','en'),'Cloud state unchanged (revision new).');
 assert.equal(dashboardText('Cloud state unchanged (revision new).','de'),'Cloud-Datenstand ist unverändert (Revision neu).');
 assert.equal(dashboardText('Cloud-Datenstand ist unverändert (Revision 42).','en'),'Cloud state unchanged (revision 42).');
});
