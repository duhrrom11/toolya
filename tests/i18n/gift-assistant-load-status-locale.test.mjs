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
  assert.ok(source.includes("ui('"+label+"')"));
 }
});

test('gift assistant locale change updates load status without fetching or writing',()=>{
 const listener=source.slice(source.lastIndexOf("document.addEventListener('toolya:wishes-locale-change'"));
 assert.match(listener,/if\(!assistantReady\)/);
 assert.match(listener,/status\.textContent=ui\(status\.textContent\)/);
 assert.match(listener,/if\(taskBusy\|\|checklistBusy\)/);
 assert.match(listener,/refreshTaskDisplay\(\)/);
 assert.doesNotMatch(listener,/db\.|\.update\(|\.insert\(|\.rpc\(/);
});
