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


test('public wishlist editorial copy is complete and translated only when explicitly marked',()=>{
 const html=readFileSync(new URL('../../tools/wishes/public.html',import.meta.url),'utf8');
 const {document}=parseHTML(html);
 const fixed=[...document.querySelectorAll('p[data-wishes-copy],span[data-wishes-copy]')];
 assert.equal(fixed.length,28,'all selected author-owned editorial nodes must be marked');
 const original=fixed.map(el=>el.textContent.trim());
 for(const de of original){
  assert.ok(Object.hasOwn(WISHES_COPY,de),'Missing author-owned translation: '+de);
  assert.notEqual(wishesText(de,'en'),de,'Untranslated author-owned copy: '+de);
  assert.equal(wishesText(wishesText(de,'en'),'de'),de,'Not reversible: '+de);
 }
 assert.equal(new Set(original).size,original.length,'Every opted-in editorial source must be unique');
 const privateCard=document.createElement('div');
 privateCard.className='profile-card';
 privateCard.innerHTML='<p data-wishes-copy>Bitte keine Anschriften, Telefonnummern oder vertraulichen Angaben eintragen.</p>'+
  '<span>Privater Wunsch: Speichern</span><input value="Persönliche Notiz">';
 document.body.append(privateCard);
 const unmarked=document.createElement('p');
 unmarked.textContent='Bitte keine Anschriften, Telefonnummern oder vertraulichen Angaben eintragen.';
 document.body.append(unmarked);
 applyWishLocale(document,'en');
 for(let i=0;i<fixed.length;i++){
  assert.equal(fixed[i].textContent.trim(),wishesText(original[i],'en'),original[i]);
 }
 assert.equal(privateCard.querySelector('p').textContent,
  'Bitte keine Anschriften, Telefonnummern oder vertraulichen Angaben eintragen.');
 assert.equal(privateCard.querySelector('span').textContent,'Privater Wunsch: Speichern');
 assert.equal(privateCard.querySelector('input').value,'Persönliche Notiz');
 assert.equal(unmarked.textContent,'Bitte keine Anschriften, Telefonnummern oder vertraulichen Angaben eintragen.');
 applyWishLocale(document,'de');
 for(let i=0;i<fixed.length;i++)assert.equal(fixed[i].textContent.trim(),original[i]);
 assert.equal(privateCard.querySelector('input').value,'Persönliche Notiz');
});

test('public wishlist title and privacy/affiliate statements have exact bilingual copy',()=>{
 const title='Amazon-Wunschliste nach Namen finden – ohne Link | Toolya';
 assert.equal(wishesText(title,'en'),'Find Amazon wish lists by name – no link needed | Toolya');
 assert.equal(wishesText(wishesText(title,'en'),'de'),title);
 const disclosures=[
  'Werbung · Amazon-Partnerlinks. Als Amazon-Partner verdiene ich an qualifizierten Verkäufen.',
  'Bitte keine Anschriften, Telefonnummern oder vertraulichen Angaben eintragen.',
  'Eine bis fünf bereits bei Amazon angelegte, öffentlich freigegebene Listen. Toolya speichert ausschließlich die Verweise; die Amazon-Listen und ihre Artikel bleiben bei Amazon. Beim Öffnen wird eine Partnerkennung angehängt.',
  'Gib ihren Vor- oder Nachnamen oder den Namen der Organisation ein. Bei gleichnamigen Treffern helfen freiwillige Angaben zu Land und Ort. Nur bereits erfasste öffentliche Listen können gefunden werden; die Identität importierter Treffer ist nicht immer bestätigt. Produkte innerhalb der Amazon-Listen werden nicht durchsucht.'
 ];
 for(const source of disclosures){
  const target=wishesText(source,'en');
  assert.notEqual(target,source);
  assert.equal(wishesText(target,'de'),source);
  assert.match(target,/Amazon|public|address|phone/i);
 }
});
