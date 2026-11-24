import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';

const path=fileURLToPath(new URL('../../tools/wishes/gift-analytics.mjs',import.meta.url));
const source=readFileSync(path,'utf8');

test('gift analytics module remains valid JavaScript',()=>{
 assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',path],{stdio:'pipe'}));
});
test('dynamic budget, gift-year, and irreversible closing texts round trip',()=>{
 const pairs=[
  ['Keine Anlässe für dieses Jahr vorhanden.','No occasions for this year.'],
  ['Jahresbudget: ','Annual budget: '],
  [' · Geplant: ',' · Planned: '],
  [' · Erfasst: ',' · Recorded: '],
  [' · ⚠️ Budget überschritten',' · ⚠️ Budget exceeded'],
  ['Jahresbudget speichern','Save annual budget'],
  ['Bitte ein gültiges Budget eingeben.','Enter a valid budget.'],
  ['Historisches Jahresbudget gespeichert.','Historical annual budget saved.'],
  ['Für dieses Jahr sind noch keine vollständig erledigten Anlass-Checklisten oder Geschenkgruppen erfasst.','No fully completed occasion checklists or gift groups recorded for this year.'],
  [' · ⚠️ aus Erstellungsdatum geschätzt',' · ⚠️ estimated from creation date'],
  ['Geschenkjahr ','Gift year '],
  ['Geschenkjahr konnte nicht gespeichert werden.','Could not save gift year.'],
  ['Privater JSON-Bericht lokal erstellt. Bewahre die Datei sicher auf.','Private JSON report created locally. Store the file securely.'],
  ['Gespeicherte Abschlussdetails anzeigen','Show saved closing details'],
  ['Bitte die Bestätigung aktivieren.','Select the confirmation checkbox.'],
  [' jetzt endgültig abschließen? Der gespeicherte Abschluss kann nicht geändert oder gelöscht werden.',': close permanently now? The saved closing cannot be changed or deleted.'],
  ['Jahresabschluss konnte nicht gespeichert oder geladen werden.','Could not save or load the year-end summary.']
 ];
 for(const [de,en] of pairs){
  assert.equal(wishesText(de,'en'),en,de);
  assert.equal(wishesText(en,'de'),de,en);
 }
 const keys=[...source.matchAll(/ui\('([^'\n]+)'\)/g)].map(m=>m[1]);
 for(const de of new Set(keys))assert.notEqual(wishesText(de,'en'),de,'Untranslated owned UI key: '+de);
 assert.equal(wishesText('Private birthday gift','en'),'Private birthday gift');
});
test('language change repaints editor labels without resetting any unsaved values or changing writes',()=>{
 assert.match(source,/function repaintEditorLabels\(\)/);
 const repaint=source.slice(source.indexOf('function repaintEditorLabels(){'),source.indexOf('function render(){'));
 assert.match(repaint,/budgetSummary\(amount,planned,spent\)/);
 assert.match(repaint,/giftYearSummary\(g\)/);
 assert.match(repaint,/querySelector\('button'\)\.textContent/);
 assert.match(repaint,/setAttribute\('aria-label'/);
 assert.doesNotMatch(repaint,/\.value\s*=/);
 assert.doesNotMatch(repaint,/\.replaceChildren\(/);
 assert.doesNotMatch(repaint,/db\.from\(|db\.rpc\(/);
 assert.match(source,/document\.addEventListener\('toolya:wishes-locale-change',\(\)=>\{if\(userId\)repaintEditorLabels\(\)\}\)/);
 assert.match(source,/\.upsert\(\{user_id:userId,occasion_id:o\.id,budget_year:year,budget_amount:n\}/);
 assert.match(source,/db\.rpc\('wishlist_set_gift_year',\{p_plan_id:g\.id,p_year:y\}\)/);
 assert.match(source,/db\.rpc\('wishlist_close_gift_year',\{p_year:year,p_confirm:true\}\)/);
 assert.match(source,/report:reviewData\(c\)/);
 assert.match(source,/o\.title/);
 assert.match(source,/g\.title/);
});

test('historical closing details repaint in place and preserve immutable snapshots',()=>{
 const body=source.slice(source.indexOf('function repaintClosedYearLabels(){'),source.indexOf('function renderClosings(){'));
 assert.match(body,/closingHeading\(c\)/);
 assert.match(body,/closingSummary\(c\)/);
 assert.match(body,/historicalGiftLine\(g\)/);
 assert.match(body,/historicalTaskLine\(t\)/);
 assert.match(body,/ui\('Gespeicherte Abschlussdetails anzeigen'\)/);
 assert.doesNotMatch(body,/\.replaceChildren\(|\.value\s*=|\.open\s*=/);
 assert.doesNotMatch(body,/db\.from\(|db\.rpc\(/);
 assert.match(source,/document\.addEventListener\('toolya:wishes-locale-change',\(\)=>\{if\(userId\)repaintClosedYearLabels\(\)\}\)/);
 assert.match(source,/historicalGiftLabels\[g\.status\]/);
 assert.match(source,/historicalTaskLabels\[t\.status\]/);
 for(const [de,en]of [['💡 Idee','💡 Idea'],['📝 Geplant','📝 Planned'],['🎁 Verschenkt','🎁 Given']]){
  assert.equal(wishesText(de,'en'),en);
  assert.equal(wishesText(en,'de'),de);
 }
});
