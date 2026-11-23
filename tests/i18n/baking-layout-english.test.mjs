import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const layout=readFileSync(new URL('../../tools/baking/backstudio-layout.js',import.meta.url),'utf8');
test('Backstudio redesign has reversible fixed English labels for every navigation and instruction',()=>{
 const pairs=[['Welche Backform brauchst du?','Which baking pan do you need?'],['✎ Zutaten eingeben','✎ Enter ingredients'],['♨ Backzeit und Ofen','♨ Baking time and oven'],['Meine Einkaufsliste','My shopping list'],['So sieht deine Form aus','This is what your pan looks like'],['Form wählen','Choose pan'],['Foto auswählen','Choose photo'],['Backstudio-Navigation','Backstudio navigation']];
 for(const [de,en] of pairs){assert.ok(layout.includes(JSON.stringify(de))||layout.includes("'"+de+"'"),de);assert.ok(layout.includes(en),en)}
 assert.match(layout,/document\.addEventListener\('toolya:locale-change',repaintShell\)/);
 assert.match(layout,/repaintShell\(\)/);
});
test('Backstudio shell localization never walks recipe or shopping content',()=>{
 assert.match(layout,/Only the redesigned shell's fixed copy is localized/);
 assert.match(layout,/for\(const node of new Set\(nodes\)\)/);
 assert.match(layout,/for\(const child of node\.childNodes\)/);
 assert.ok(!layout.includes('shell.querySelectorAll(\'*\')'));
 assert.match(layout,/window\.__toolyaUILocale==='en'/);
});
