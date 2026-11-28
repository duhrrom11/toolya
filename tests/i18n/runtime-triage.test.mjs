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

import {attachRuntimeEvidence} from '../../scripts/i18n-runtime-evidence.mjs';
test('confirm evidence requires passing exact-kind, exact-line, unique handler claims',()=>{
 const file='tools/budget/index.html',de='Sparziel löschen?',en='Delete this savings goal?';
 const source='function deleteSavingsGoal(id) {\n if (!confirm("Sparziel löschen?")) return;\n}';
 const claim={file,handler:'deleteSavingsGoal',kind:'confirm',line:2,de,en};
 const occurrence={kind:'confirm',line:2,literal:de,english:en,catalogueState:'catalogue-match-runtime-unverified'};
 function verify(overrides={},status='passed',extra=[]){
  const sightings=[{...occurrence},...extra];
  const report={suites:[{specs:[{title:'i18n runtime catalogue: budget cancellation',ok:true,tests:[{status:'expected',results:[{status}],annotations:[{type:'toolya-runtime-message',description:JSON.stringify({...claim,...overrides})}]}]}]}]};
  const count=attachRuntimeEvidence([{file,sightings}],report,()=>source);
  return {count,state:sightings[0].catalogueState};
 }
 assert.deepEqual(verify(),{count:1,state:'runtime-browser-verified'});
 for(const bad of [{kind:'alert'},{kind:undefined},{line:null},{line:3},{handler:'other'},{en:de}]){
  assert.deepEqual(verify(bad),{count:0,state:'catalogue-match-runtime-unverified'});
 }
 assert.equal(verify({},'failed').count,0);
 assert.equal(verify({},'passed',[{...occurrence}]).count,0);
});
