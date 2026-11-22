import test from 'node:test';import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {estateText,ESTATE_RUNTIME_COPY} from '../../shared/toolya/i18n/estate-copy.mjs';
import {applyEstateLocale} from '../../shared/toolya/i18n/estate-dom.mjs';
test('estate labels are translated without changing secret input or print data',()=>{
 const {document}=parseHTML('<html><body><h1>Digitaler Nachlass: Mein Tresor</h1><button onclick="lock()">Tresor schließen</button><input value="sensitive-key"><main id="print-pages"><h2>Meine Unterlagen</h2></main></body></html>');
 const button=document.querySelector('button'),input=document.querySelector('input');
 applyEstateLocale(document,'en');
 assert.equal(document.querySelector('h1').textContent,'Digital estate: My vault');
 assert.equal(button.getAttribute('onclick'),'lock()');
 assert.equal(button.textContent,'Close vault');
 assert.equal(input.value,'sensitive-key');
 assert.equal(document.querySelector('#print-pages h2').textContent,'Meine Unterlagen');
 applyEstateLocale(document,'de');
 assert.equal(button.textContent,'Tresor schließen');
});
test('unknown user messages and cryptographic material are never rewritten',()=>{assert.equal(estateText('real user@example.org','en'),'real user@example.org');});
test('estate options preserve source keys on locale change',()=>{const {document}=parseHTML('<html><body><select><option>30 Tage</option></select></body></html>');const option=document.querySelector('option');applyEstateLocale(document,'en');assert.equal(option.textContent,'30 days');assert.equal(option.getAttribute('value'),'30 Tage');applyEstateLocale(document,'de');assert.equal(option.textContent,'30 Tage');assert.equal(option.hasAttribute('value'),false);});

test('estate runtime safety warnings are reversible and unknown private data is unchanged',()=>{
 const cases=[
  ['Der Tresor wurde auf einem anderen Gerät geändert. Nutze zunächst das Gerät mit dem aktuellen Stand. Deine Änderungen hier bleiben verschlüsselt erhalten.','The vault was changed on another device. Use the device with the latest copy first. Your local changes remain encrypted.'],
  ['Die Alarm-E-Mail ist noch nicht eingerichtet. Es wurde kein Alarm gestartet.','The alert email service is not configured. No alert has started.'],
  ['Entschlüsselung fehlgeschlagen. Bitte passenden privaten Schlüssel und Nachlassdatei prüfen.','Decryption failed. Check the matching private key and estate file.'],
  ['Verschlüsseltes Nachlasspaket erstellt. Nur der passende private Erbenschlüssel kann es öffnen. Bereits übergebene Kopien lassen sich später nicht zurückrufen.','Encrypted estate package created. Only the matching private recipient key can open it. Previously handed-over copies cannot be revoked later.']
 ];
 for(const [de,en]of cases){assert.equal(estateText(de,'en'),en);assert.equal(estateText(en,'de'),de)}
 assert.equal(estateText('Verbleibende Zeit: 01:02:03','en'),'Time remaining: 01:02:03');
 assert.equal(estateText('Time remaining: 01:02:03','de'),'Verbleibende Zeit: 01:02:03');
 assert.equal(estateText('Alice private@example.org','en'),'Alice private@example.org');
 assert.ok(Object.keys(ESTATE_RUNTIME_COPY).length>=55);
});
