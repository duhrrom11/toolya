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
test('Backstudio scripts remain executable and keep fixed accessibility copy reversible',async()=>{
 const {execFileSync}=await import('node:child_process');
 for(const path of ['backstudio.js','backstudio-pro.js','backstudio-layout.js']){
  assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',new URL('../../tools/baking/'+path,import.meta.url).pathname]),path);
 }
 assert.match(layout,/\.bsui-baker\[role="img"\]/);
 assert.match(layout,/\['↻ Form drehen','↻ Rotate pan'\]/);
 const backstudio=readFileSync(new URL('../../tools/baking/backstudio.js',import.meta.url),'utf8');
 assert.match(backstudio,/Schematischer Füllstand','Illustration of the pan fill level/);
});

test('Backstudio action status retains DE/EN source pair across locale switches',()=>{
 const backstudio=readFileSync(new URL('../../tools/baking/backstudio.js',import.meta.url),'utf8');
 assert.match(backstudio,/const statusTranslations=new Map\(\)/);
 assert.match(backstudio,/statusTranslations\.get\(status\?\.textContent\)/);
 assert.match(backstudio,/showStatus\('Rezept neu analysiert\.','Recipe analysed again\.'\)/);
 assert.match(backstudio,/showStatus\('Backerfahrung lokal gespeichert\.','Baking notes saved on this device\.'\)/);
 assert.match(backstudio,/showStatus\('Erkanntes Rezept unbedingt prüfen\.','Check the recognised recipe carefully\.'\)/);
});

test('Backstudio subview headings are included in reversible shell translation without traversing private content',()=>{
 // The view wrapper contains nested h2 elements; translating only the wrapper's
 // direct text nodes leaves every tool subview heading in German.
 assert.match(layout,/\.bsui-tool-head h2/);
 for(const [de,en] of [
  ['Meine Backformen','My baking pans'],
  ['Rezept einlesen','Import recipe'],
  ['Meine Torte planen','Plan my cake'],
  ['Meine Backnotizen','My baking notes'],
  ['Meine Einkaufsliste','My shopping list']
 ]){
  assert.ok(layout.includes(JSON.stringify(de))||layout.includes("'"+de+"'"),de);
  assert.ok(layout.includes(JSON.stringify(en))||layout.includes("'"+en+"'"),en);
 }
 assert.match(layout,/for\(const child of node\.childNodes\)/);
 assert.ok(!layout.includes('shell.querySelectorAll(\'*\')'));
});

test('Relocated 3D launch controls repaint on DE/EN switches',()=>{
 assert.match(layout,/\.bsui-webgl button/);
 assert.match(layout,/\['↻ Form drehen','↻ Rotate pan'\]/);
 assert.match(layout,/document\.addEventListener\('toolya:locale-change',repaintShell\)/);
 // 3D launch is moved into the redesigned stage, not necessarily .bsp-actions.
 assert.match(layout,/webgl\.append\(threePanel\)/);
});

test('Pan dimension presentation uses selected locale without changing numeric inputs',()=>{
 assert.match(layout,/const displayNumber=value=>new Intl\.NumberFormat\(window\.__toolyaUILocale==='en'\?'en-GB':'de-DE'/);
 assert.match(layout,/displayNumber\(cleanNumber\('target-d',20\)\)/);
 assert.match(layout,/displayNumber\(cleanNumber\('combo-d1',20\)\)/);
 assert.match(layout,/displayNumber\(cleanNumber\('combo-d2',16\)\)/);
 assert.match(layout,/displayNumber\(cleanNumber\('target-l',25\)\)/);
 assert.match(layout,/displayNumber\(cleanNumber\('target-w',11\)\)/);
 assert.match(layout,/document\.addEventListener\('toolya:locale-change',requestSync\)/);
 assert.match(layout,/\$\('target-d'\)\.value=diameter/);
});
