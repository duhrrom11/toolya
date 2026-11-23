import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';

const source=readFileSync(new URL('../../tools/wishes/gift-assistant.mjs',import.meta.url),'utf8');
const labels=[
 'Bitte anmelden.',
 'Private Planungsvorschläge geladen. Keine Daten wurden geändert.',
 'Die privaten Planungsvorschläge konnten nicht vollständig geladen werden. Bitte später erneut versuchen.'
];

test('gift assistant load states are reversible DE/EN UI-only strings',()=>{
 for(const label of labels){
  const english=wishesText(label,'en');
  assert.notEqual(english,label);
  assert.equal(wishesText(english,'de'),label);
  assert.ok(source.includes("showAssistantStatus('"+label+"')"));
 }
});

test('gift assistant locale change updates load status without fetching or writing',()=>{
 const listener=source.slice(source.lastIndexOf("document.addEventListener('toolya:wishes-locale-change'"));
 assert.match(source,/function showAssistantStatus\(key\)\{assistantStatusKey=key;\$\('status'\)\.textContent=ui\(key\)\}/);
 assert.match(listener,/const statusKey=assistantStatusKey\|\|\(!\$\('login'\)\.hidden\?'Bitte anmelden\.':null\)/);
 assert.match(listener,/queueMicrotask\(\(\)=>showAssistantStatus\(statusKey\)\)/);
 assert.match(listener,/if\(!assistantReady\)return/);
 assert.match(listener,/if\(taskBusy\|\|checklistBusy\)/);
 assert.match(listener,/refreshTaskDisplay\(\)/);
 assert.doesNotMatch(listener,/db\.|\.update\(|\.insert\(|\.rpc\(/);
 assert.doesNotMatch(listener,/Private Planungsvorschläge geladen/);
});

test('planning calendar weekday headings follow DE/EN without changing dates',()=>{
 assert.match(source,/__toolyaWishesLocale==='en'\?\['Mon','Tue','Wed','Thu','Fri','Sat','Sun'\]:\['Mo','Di','Mi','Do','Fr','Sa','So'\]/);
 assert.match(source,/dateLabel\(current\)/);
});
