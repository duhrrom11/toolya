import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {translateToolDialog} from '../../shared/toolya/i18n/interface.mjs';

const tools=['moving','housemates','loans','plants','baking','budget',
 'car','parking','meters','pet-health'];
const german=/\b(?:Bitte|Speichern|Abbrechen|Sicherung|Bestätigen|Löschen|Wiederherstellen|Fehler|Daten|Konto|Wirklich|wirklich|Möchtest|Import|Gerät|verfügbar|gespeichert|nicht|konnten)\b|[äöüßÄÖÜ]/i;
const directCall=/\b(?:window\.)?(alert|confirm|prompt)\s*\(\s*(["'])((?:(?!\2)[^\n]){4,650})\2/g;

test('all ten daily tools have English mapping for every static German browser dialog',()=>{
 const issues=[],summary=[];
 for(const tool of tools){
  const source=readFileSync(new URL('../../tools/'+tool+'/index.html',import.meta.url),'utf8');
  const candidates=[],seen=new Set();
  for(const m of source.matchAll(directCall)){
   const de=m[3];
   if(!german.test(de)||de.includes('$'+'{')||seen.has(m.index))continue;
   seen.add(m.index);
   const en=translateToolDialog(tool,'en',de);
   const line=source.slice(0,m.index).split('\n').length;
   candidates.push({method:m[1],line,original:de,english:en});
   if(en===de)issues.push(tool+':'+line+': '+m[1]+' has no source-exact English message: '+de.slice(0,160));
  }
  summary.push({tool,dialogues:candidates.length});
 }
 const total=summary.reduce((n,x)=>n+x.dialogues,0);
 assert.equal(summary.length,10);
 assert.ok(total>=120,'Expected existing native-dialog coverage, got '+total);
 assert.deepEqual(issues,[],issues.join('\n'));
 console.log('DE/EN native browser dialogues verified: '+total+' exact messages across all ten daily tools.');
});

test('unknown dialogs, private content and technical IDs remain unchanged',()=>{
 for(const tool of tools){
  for(const value of ['__proto__','private-user@example.invalid',
   'Meine private Notiz: Löschung nicht beantragt','Account ID: 000001']){
   assert.equal(translateToolDialog(tool,'en',value),value,
    'Unexpected translation of unknown or user-authored data: '+tool);
  }
 }
});
