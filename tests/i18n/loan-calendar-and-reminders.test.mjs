import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
import {buildAllDayCalendar} from '../../shared/toolya/calendar-export.mjs';

const src=readFileSync(resolve(import.meta.dirname,'../../tools/loans/index.html'),'utf8');
const start=src.indexOf('async function downloadICS('),end=src.indexOf('function escapeHtml(',start);
test('loan ICS uses shared exporter, stable UID and literal personal details',async()=>{
 assert.ok(start>=0&&end>start);
 const fn=src.slice(start,end).replace("await import('../../shared/toolya/calendar-export.mjs')",'await calendarModule');
 let finish;
 const calendarModule=new Promise(resolve=>finish=resolve);
 const exported=[],alerts=[];
 const window={__toolyaUILocale:'en'};
 const context={window,calendarModule,alert:v=>alerts.push(v),Date,Number};
 const pending=runInNewContext(fn+";downloadICS('Mias, Öl & Küche','2026-12-05','Tester & Co',19)",context);
 window.__toolyaUILocale='de';
 finish({downloadAllDayCalendar:entry=>exported.push(entry)});
 await pending;
 const event=exported[0];
 assert.equal(event.title,'Return: Mias, Öl & Küche (Tester & Co)');
 assert.equal(event.description,'Item due for return');
 assert.equal(event.uid,'loan-19@toolya.app');
 assert.equal(event.date,'2026-12-05');
 const ics=buildAllDayCalendar({...event,now:new Date('2026-11-22T01:00:00Z')});
 assert.ok(ics.includes('SUMMARY:Return: Mias\\, Öl & Küche (Tester & Co)\r\n'));
 assert.ok(ics.includes('DTSTART;VALUE=DATE:20261205\r\n'));
 assert.ok(ics.includes('UID:loan-19@toolya.app\r\n'));
 assert.deepEqual(alerts,[]);
});
test('invalid loan date aborts before calendar import',async()=>{
 const fn=src.slice(start,end).replace("await import('../../shared/toolya/calendar-export.mjs')",'await calendarModule');
 let read=0,alerts=[];
 const context={window:{__toolyaUILocale:'en'},calendarModule:{then(){read++}},alert:v=>alerts.push(v),Date,Number};
 await runInNewContext(fn+";downloadICS('test','2026-02-31','borrower',7)",context);
 assert.equal(read,0);
 assert.equal(alerts[0],'Invalid return date.');
 const german=[];
 await runInNewContext(fn+";downloadICS('test','2026-02-31','borrower',7)",
  {window:{__toolyaUILocale:'de'},calendarModule:{then(){throw Error('unexpected import')}},alert:v=>german.push(v),Date,Number});
 assert.equal(german[0],'Ungültiges Rückgabedatum.');
});
test('calendar and reminder UI follows selected locale, preserving item IDs',()=>{
 for(const phrase of ['Friendly reminder','Urgent return','Just checking when','in the next few days','Item due for return','Google Calendar','en-GB'])
  assert.ok(src.includes(phrase),phrase);
 assert.match(src,/case 'ics': void downloadICS\(item\.title,item\.returnDate,item\.person,item\.id\)/);
 assert.match(src,/new Date\(rd\.getTime\(\) \+ 86400000\)/);
 assert.match(src,/document\.addEventListener\('click',event=>loanItemAction\(event,'click'\)\)/);
});
