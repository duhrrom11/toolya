import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';

const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');

test('all fixed Amazon scraper errors and incomplete preview warnings have reversible English copy',()=>{
 const core=read('supabase/functions/amazon-scrape/core.mjs');
 const edge=read('supabase/functions/amazon-scrape/index.ts');
 const messages=new Set([
  ...[...core.matchAll(/new ScrapeError\('[^']+','([^']+)'\)/g)].map(m=>m[1]),
  ...[...edge.matchAll(/error:'([^']+)'/g)].map(m=>m[1]),
  'Amazon-Vorschau konnte nicht erstellt werden.',
  'Die Liste konnte nicht vollständig gelesen werden. Es wird nichts importiert.'
 ]);
 assert.ok(messages.size>=22);
 for(const de of messages){
  const en=wishesText(de,'en');
  assert.notEqual(en,de,'Missing translation: '+de);
  assert.equal(wishesText(en,'de'),de,'Not reversible: '+de);
 }
 assert.equal(wishesText('Die Liste konnte nicht vollständig gelesen werden. Es wird nichts importiert.','en'),
  'The list could not be read in full. Nothing will be imported.');
});

test('Amazon HTTP errors preserve status codes, unknown diagnostics and private text',()=>{
 for(const code of [403,429,503]){
  const de='Amazon-Abruf fehlgeschlagen ('+code+').',en='Amazon request failed ('+code+').';
  assert.equal(wishesText(de,'en'),en);
  assert.equal(wishesText(en,'de'),de);
 }
 for(const unknown of ['Private Liste: Link fehlt.','Unexpected error: sample-id','Amazon-Abruf fehlgeschlagen (unknown).']){
  assert.equal(wishesText(unknown,'en'),unknown);
 }
});

test('import refresh failure retains a single source language and confirmed snapshot outcome',()=>{
 const source=read('tools/wishes/amazon-import.mjs');
 assert.match(source,/const saved=`Gespeichert:/);
 assert.match(source,/status\.textContent=saved\+' Bitte Seite neu laden/);
 assert.match(source,/img\.alt=p\.title\|\|copy\('Produktbild'\)/);
 assert.match(source,/previewInfo\.push\(renderAlt\)/);
 assert.match(source,/p_preview_id:s\.id/);
 assert.match(source,/if\(s\.uid!==getUser\(\)\?\.id\|\|s\.gen!==generation\)return/);
 for(const n of [0,2]){
  const de='Gespeichert: '+n+' neue Wünsche, 1 bereits vorhanden. Bitte Seite neu laden, um die gespeicherten Wünsche anzuzeigen.';
  const en='Saved: '+n+' new wishes, 1 already present. Reload the page to see the saved wishes.';
  assert.equal(wishesText(de,'en'),en);
  assert.equal(wishesText(en,'de'),de);
 }
});
