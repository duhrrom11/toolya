import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../../tools/car/index.html',import.meta.url),'utf8');
const begin=source.indexOf('const vehicleTypeEn = Object.freeze(');
const end=source.indexOf('function vehicleTypeDisplay(',begin);
const catalogue=source.slice(begin,end);
const pdfMatch=source.match(/const eventType = pdfEn && Object\.hasOwn\(vehicleTypeEn, String\(e\.type\)\)[\s\S]*? : e\.type;/);
assert.ok(begin>0&&pdfMatch,'PDF uses the same canonical source catalogue');

function eventType(locale,type){
 const script=catalogue+'\nconst pdfEn = '+JSON.stringify(locale==='en')+';\nconst e = {type:'+JSON.stringify(type)+'};\n'+pdfMatch[0]+'\neventType';
 return runInNewContext(script);
}

test('car PDF event type translates every canonical DE ID without modifying records',()=>{
 const originals=['TÜV / HU','Inspektion','Versicherung','Kfz-Steuer','Reifenwechsel','Reifentiefe','Ölwechsel','Reparatur','Tanken'];
 const english=['Vehicle inspection','Inspection & service','Insurance','Vehicle tax','Tyre change','Tyre tread check','Oil change','Repair','Refuelling'];
 for(let i=0;i<originals.length;i++){
  assert.equal(eventType('de',originals[i]),originals[i]);
  assert.equal(eventType('en',originals[i]),english[i]);
 }
 for(const value of ['__proto__','constructor','Custom service','<private>']){
  assert.equal(eventType('en',value),value);
  assert.equal(eventType('de',value),value);
 }
});

test('car PDF captures language before asynchronous library load and does not rewrite event values',()=>{
 assert.match(source,/async function exportPDF\(\) \{\s*const pdfEn = window\.__toolyaUILocale === 'en';/);
 assert.match(source,/const pdfDateLocale = pdfEn \? 'en-GB' : 'de-DE';[\s\S]*?await import\('\.\.\/\.\.\/shared\/toolya\/pdf-export\.mjs'\)/);
 assert.doesNotMatch(pdfMatch[0],/\.type\s*=|saveData\(|localStorage/);
 assert.match(source,/data\.events\.forEach\(e => \{/);
});
