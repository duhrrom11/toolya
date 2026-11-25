import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {translateToolDialog} from '../../shared/toolya/i18n/interface.mjs';
test('known validation errors translate across all ten tools without changing German or private diagnostics',()=>{
 const cases={"moving":["Konto während des Ladens gewechselt.","The account changed while loading."],"loans":["Anmeldung nicht mehr gültig.","Sign-in is no longer valid."],"baking":["Anmeldung nicht gültig.","Sign-in is invalid."],"plants":["Canvas nicht verfügbar","Canvas unavailable"],"pet-health":["Anmeldung nicht gültig.","Sign-in is invalid."],"housemates":["Speicherkonflikt: Die WG wurde zwischenzeitlich geändert. Bitte Änderungen sichern und neu laden.","Save conflict: The household has changed in the meantime. Back up your changes and reload."],"budget":["Diese Backup-Version wird nicht unterstützt. Bitte eine kompatible Version verwenden.","This backup version is unsupported. Use a compatible version."],"car":["Bild ist nicht lesbar","Image cannot be read"],"parking":["Foto nicht lesbar","Photo cannot be read"],"meters":["Ungültiges Zählerstände-Backup","Invalid meter readings backup"]};
 for(const [tool,[de,en]] of Object.entries(cases)){assert.equal(translateToolDialog(tool,'en',de),en);assert.equal(translateToolDialog(tool,'de',de),de);assert.equal(translateToolDialog(tool,'en','Export fehlgeschlagen: '+de),'Export failed: '+en);assert.equal(translateToolDialog(tool,'en','Export fehlgeschlagen: private detail'),'Export failed: private detail')}
 assert.equal(translateToolDialog('budget','en','Ungültiger Backup-Bereich: private-key'),'Invalid backup section: private-key');
});
test('meter calendar export is bilingual and retains its monthly recurrence',()=>{
 const s=readFileSync(new URL('../../tools/meters/index.html',import.meta.url),'utf8');const start=s.indexOf('function downloadIcsCalendar()'),end=s.indexOf('let metersCloudController',start);assert.ok(start>=0&&end>start);
 for(const lang of ['de','en']){let contents,filename;const context={window:{__toolyaUILocale:lang},Blob:class{constructor(parts){contents=parts.join('')}},URL:{createObjectURL:()=> 'blob:fixture'},document:{createElement:()=>({click(){filename=this.download}})}};vm.runInNewContext(s.slice(start,end)+'\ndownloadIcsCalendar();',context);assert.ok(contents.includes('RRULE:FREQ=MONTHLY;BYDAY=-1SU'));assert.ok(contents.includes(lang==='en'?'SUMMARY:⚡ Read meters':'SUMMARY:⚡ Zählerstände ablesen'));assert.equal(filename,lang==='en'?'meter-reading-reminder.ics':'zaehler-ablesen-erinnerung.ics');assert.ok(contents.endsWith('END:VCALENDAR\r\n'))}
});
