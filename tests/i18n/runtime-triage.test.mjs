import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewRuntimeLiteral} from '../../scripts/i18n-runtime-triage.mjs';
test('runtime triage distinguishes family catalogue evidence from unresolved source',()=>{
 const found=reviewRuntimeLiteral('tools/wishes/occasions.mjs','Diesen Anlass dauerhaft löschen?',"confirm('Diesen Anlass dauerhaft löschen?'",')');
 assert.equal(found.catalogueState,'catalogue-match-runtime-unverified');
 assert.equal(found.english,'Permanently delete this occasion?');
 assert.equal(reviewRuntimeLiteral('tools/wishes/occasions.mjs','Bitte unbekannter Text','textContent=').catalogueState,'no-catalogue-match-review');
 assert.equal(reviewRuntimeLiteral('tools/wishes/occasions.mjs','Bitte ','textContent=','+userName').catalogueState,'composite-source-review');
 assert.equal(reviewRuntimeLiteral('shared/toolya/cloud-backup.mjs','Bitte prüfen','confirm(').catalogueState,'shared-context-review');
});
