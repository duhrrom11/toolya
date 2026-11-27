import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calendarDateLabel} from '../../tools/wishes/calendar-copy.mjs';
import {applyWishLocale} from '../../shared/toolya/i18n/wishes-dom.mjs';
import {parseHTML} from 'linkedom';
const read=name=>readFileSync(new URL('../../tools/wishes/'+name+'.mjs',import.meta.url),'utf8');

test('date-only display is localized without changing the original stored date',()=>{
 for(const [date,de,en] of [['2026-12-01','01.12.2026','01/12/2026'],['2028-02-29','29.02.2028','29/02/2028'],['2027-01-01','01.01.2027','01/01/2027']]){
  assert.equal(calendarDateLabel(date,'de-DE'),de);
  assert.equal(calendarDateLabel(date,'en-GB'),en);
 }
 for(const value of [null,'','2026-02-30','unknown','2026-12-01T10:00:00Z'])assert.equal(calendarDateLabel(value,'en'),value);
});

test('gift planning displays translate dates and hints without changing storage or export values',()=>{
 const tasks=read('gift-tasks'),report=read('gift-task-report'),analytics=read('gift-analytics');
 assert.match(tasks,/paintDueHint\(\);paintTemplateHint\(\)/);
 assert.match(tasks,/if\(missingDueDate\)\$\('dueHint'\)\.textContent=ui\(/);
 assert.match(tasks,/selectedTemplateLabel=template\.label;paintTemplateHint\(\)/);
 assert.match(tasks,/calendarDateLabel\(t\.due_date,locale\(\)\)/);
 assert.match(tasks,/timeZone:'UTC',day:'2-digit',month:'short'/);
 assert.match(report,/calendarDateLabel\(e\.old_due_date,locale\(\)\)/);
 assert.match(report,/calendarDateLabel\(e\.new_due_date,locale\(\)\)/);
 assert.match(report,/events:exportRows/);
 assert.match(analytics,/calendarDateLabel\(t\.due_date,locale\(\)\)/);
});

test('stored occasion and task headings are never translated even if they equal UI labels',()=>{
 const {document}=parseHTML('<html><body><h3 data-user-content>Offen</h3><h3 data-user-content>Speichern</h3><button>Speichern</button></body></html>');
 applyWishLocale(document,'en');
 assert.deepEqual([...document.querySelectorAll('h3')].map(x=>x.textContent),['Offen','Speichern']);
 assert.equal(document.querySelector('button').textContent,'Save');
 applyWishLocale(document,'de');assert.equal(document.querySelector('button').textContent,'Speichern');
 assert.match(read('gift-cockpit'),/box\.querySelector\('h3'\)\.setAttribute\('data-user-content',''\)/);
 assert.match(read('gift-task-report'),/heading\.setAttribute\('data-user-content',''\)/);
});
