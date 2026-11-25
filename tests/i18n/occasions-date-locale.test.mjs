import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../../tools/wishes/occasions.mjs',import.meta.url),'utf8');
test('occasion dates use the selected language and UTC without changing date values',()=>{
 const helper=source.slice(source.indexOf('const language='),source.indexOf('const reminder='));
 assert.ok(helper.includes('const format='));
 const context=vm.createContext({__toolyaWishesLocale:'de'});
 vm.runInContext(helper+'\nglobalThis.formatDate=format;',context);
 const timestamp=Date.UTC(2026,10,24);
 assert.equal(context.formatDate(timestamp),'24. November 2026');
 context.__toolyaWishesLocale='en';
 assert.equal(context.formatDate(timestamp),'24 November 2026');
 assert.equal(new Date(timestamp).toISOString(),'2026-11-24T00:00:00.000Z');
});
test('occasion language handler updates time nodes only, not form drafts or remote records',()=>{
 const handler=source.split('\n').find(line=>line.includes("document.addEventListener('toolya:wishes-locale-change'"));
 assert.ok(handler);
 assert.match(handler,/querySelectorAll\('time'\)/);
 assert.match(handler,/dateNodes\.get\(node\)/);
 assert.doesNotMatch(handler,/reset\(|render\(|load\(|db\./);
 assert.ok(source.includes("ui('Heute','Today')"));
 assert.ok(source.includes("ui('Morgen','Tomorrow')"));
 assert.ok(source.includes("ui('in '+item.days+' Tagen','in '+item.days+' days')"));
});
