import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('../../tools/'+name+'/index.html',import.meta.url),'utf8');
function extract(source,name){
 const start=source.indexOf('function '+name+'(');
 assert.ok(start>=0,name);
 const rest=source.slice(start);
 const end=rest.indexOf('\n        }');
 assert.ok(end>=0,name+' closing brace');
 return rest.slice(0,end+10);
}
function context(source,names){
 const ctx=vm.createContext({window:{__toolyaUILocale:'de'}});
 vm.runInContext(names.map(n=>extract(source,n)).join('\n'),ctx);
 return ctx;
}
test('receipt display localizes dates without changing ISO storage or QR payload',()=>{
 const source=read('budget'),ctx=context(source,['parseReceiptDate','displayReceiptDate']);
 const date='2026-11-24';
 assert.equal(ctx.displayReceiptDate(date,false),'24.11.2026');
 assert.equal(ctx.displayReceiptDate(date,true),'24/11/2026');
 assert.equal(ctx.displayReceiptDate('2026-02-30',true),'2026-02-30');
 assert.ok(source.includes('KAUFDATUM: ${r.date}'));
 assert.ok(source.includes("r.store || 'n/a'"));
 assert.ok(source.includes('displayReceiptDate(r.date, true)'));
 assert.equal(date,'2026-11-24');
});
test('plant display preserves valid legacy and ISO dates and invalid data',()=>{
 const source=read('plants'),ctx=context(source,['isValidCalendarDate','displayLegacyDate']);
 for(const [raw,de,en] of [['2026-11-24','24.11.2026','24/11/2026'],['24.11.2026','24.11.2026','24/11/2026'],['31.02.2026','31.02.2026','31.02.2026']]){
  assert.equal(ctx.displayLegacyDate(raw,false),de);
  assert.equal(ctx.displayLegacyDate(raw,true),en);
 }
 assert.ok(source.includes("harvestLog.push({ date: new Date().toLocaleDateString('de-DE')"));
 assert.ok(source.includes("diary.unshift({ date: new Date().toLocaleDateString('de-DE')"));
 assert.ok(source.includes('displayLegacyDate(p.propDate)'));
 assert.ok(source.includes('displayLegacyDate(p.connectDue)'));
});
test('parking legacy date fallback keeps time and stored representation',()=>{
 const source=read('parking'),ctx=context(source,['displayLegacyDate']);
 const raw='24.11.2026 09:15';
 assert.equal(ctx.displayLegacyDate(raw,false),raw);
 assert.equal(ctx.displayLegacyDate(raw,true),'24/11/2026 09:15');
 assert.equal(ctx.displayLegacyDate('31.02.2026 09:15',true),'31.02.2026 09:15');
 assert.ok(source.includes("date:now.toLocaleDateString('de-DE')+' '+now.toLocaleTimeString('de-DE'"));
 assert.ok(source.includes(': displayLegacyDate(s.date, english)'));
 assert.ok(source.includes('displayLegacyDate(s.date, pdfEn)'));
});
