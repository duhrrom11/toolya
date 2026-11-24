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

test('estate handover and trustee copy is reversible and preserves form values',()=>{
 const pairs=[["Dein Tresorpasswort schützt deine verschlüsselten Daten auch auf einem neuen Gerät. Bei einem neuen Tresor entspricht es zunächst deinem Konto-Passwort. Bewahre es gut auf: Ein Zurücksetzen des Konto-Passworts entschlüsselt den Tresor nicht.","Your vault password also protects your encrypted data on a new device. For a new vault, it initially matches your account password. Keep it safe: resetting your account password will not decrypt the vault."],["Dein persönlicher Schlüssel","Your personal key"],["Schlüssel der zweiten Person","Second person's key"],["← Zurück zum digitalen Nachlass","← Back to digital estate"],["Du kannst deine Unterlagen verschlüsselt an eine vertraute Person weitergeben.","You can share an encrypted copy of your documents with someone you trust."],["Sobald du die Dateien übergeben hast, kannst du den Zugriff auf diese Kopie nicht mehr zurücknehmen.","Once you have handed over the files, you cannot revoke access to that copy."],["Der private Schlüssel wird mit einem eigenen Passwort verschlüsselt. Speichere die Schlüsseldatei und das Passwort getrennt und sicher; teile ausschließlich den öffentlichen Schlüssel. Bereits erstellte unverschlüsselte Schlüsseldateien aus der Vorgängerversion werden nicht mehr akzeptiert.","The private key is encrypted with a separate password. Store the key file and password securely in different places; share only the public key. Previously created unencrypted key files from the older version are no longer accepted."],["Passwort für den privaten Schlüssel (mindestens 16 Zeichen)","Password for the private key (at least 16 characters)"],["Passwort bestätigen","Confirm password"],["Öffentliche Schlüsseldatei des Erben","Beneficiary's public key file"],["Ich möchte jetzt eine vollständige Kopie meiner Nachlasseinträge freigeben. Mir ist bewusst, dass ich diese Kopie später nicht widerrufen kann.","I want to share a complete copy of my estate records now. I understand that I cannot revoke access to this copy later."],["Privater Erbenschlüssel","Beneficiary's private key"],["Verschlüsseltes Nachlasspaket","Encrypted estate package"],["Passwort für den privaten Schlüssel","Private key password"]];
 for(const [de,en] of pairs){assert.equal(estateText(de,'en'),en);assert.equal(estateText(en,'de'),de)}
 const {document}=parseHTML('<html><body><main><a href="index.html">← Zurück zum digitalen Nachlass</a><p>Du kannst deine Unterlagen verschlüsselt an eine vertraute Person weitergeben.</p><label>Privater Erbenschlüssel<input value="secret"></label></main></body></html>');
 applyEstateLocale(document,'en');
 assert.equal(document.querySelector('main a').textContent,'← Back to digital estate');
 assert.equal(document.querySelector('main p').textContent,'You can share an encrypted copy of your documents with someone you trust.');
 assert.equal(document.querySelector('input').value,'secret');
 assert.equal(document.querySelector('main a').getAttribute('href'),'index.html');
 applyEstateLocale(document,'de');assert.equal(document.querySelector('main a').textContent,'← Zurück zum digitalen Nachlass');
});
