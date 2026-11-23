import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeVerifiedLedger,FIRST_BOX_EVENT,BADGES} from './rules.mjs';
const event=(i,tool,competency='organisation',kp=10,day='2026-11-23',type='example.first_success.v1')=>({
  eventKey:'verified-'+i,eventType:type,toolId:tool,competency,xp:20,kp,awardedAt:day+'T12:00:00Z'
});
test('nine badge definitions are unique',()=>{
  assert.equal(BADGES.length,9);assert.equal(new Set(BADGES.map(x=>x.id)).size,9);
});
test('empty ledger has no XP or badges',()=>{
  const result=summarizeVerifiedLedger([]);
  assert.equal(result.xp,0);assert.equal(result.badges.length,0);
});
test('verified first box gives 20 XP, 10 Organisation KP and first badge',()=>{
  const x=summarizeVerifiedLedger([event(1,FIRST_BOX_EVENT.toolId,'organisation',10,'2026-11-23',FIRST_BOX_EVENT.eventType)]);
  assert.equal(x.xp,20);assert.equal(x.kp.organisation,10);assert.deepEqual(x.badges,['first_success']);
});
test('three and five distinct tools unlock exact diversity badges',()=>{
  const e=Array.from({length:5},(_,i)=>event(i,'tool-'+i));
  assert.equal(summarizeVerifiedLedger(e.slice(2)).badges.includes('three_tools'),true);
  assert.equal(summarizeVerifiedLedger(e.slice(2)).badges.includes('five_tools'),false);
  assert.equal(summarizeVerifiedLedger(e).badges.includes('five_tools'),true);
});
test('repeat success records for same tool do not inflate diversity',()=>{
  const x=summarizeVerifiedLedger([event(1,'tool-A'),event(2,'tool-A'),event(3,'tool-A')]);
  assert.equal(x.distinctTools,1);assert.equal(x.badges.includes('three_tools'),false);
});
test('category badges use competency thresholds',()=>{
  const x=summarizeVerifiedLedger([
    event(1,'tool-a','finanzen',10),event(2,'tool-b','finanzen',10),
    event(3,'tool-c','finanzen',10),event(4,'tool-d','fuersorge',10),
    event(5,'tool-e','fuersorge',10)
  ]);
  assert.ok(x.badges.includes('finance_30'));assert.ok(x.badges.includes('care_20'));
  assert.ok(!x.badges.includes('organization_30'));
});
test('three UTC calendar days unlock Beständig, without streak requirement',()=>{
  const x=summarizeVerifiedLedger([
    event(1,'A','planung',10,'2026-01-01'),
    event(2,'B','planung',10,'2026-05-20'),
    event(3,'C','planung',10,'2026-11-23')
  ]);
  assert.ok(x.badges.includes('three_days'));
});
test('duplicate ledger keys are rejected instead of double-counted',()=>{
  assert.throws(()=>summarizeVerifiedLedger([event(1,'A'),event(1,'A')]),/Duplicate event/);
});
test('invalid values and untrusted event shapes are rejected',()=>{
  assert.throws(()=>summarizeVerifiedLedger([ {...event(1,'A'),xp:9999} ]),/Invalid verified/);
  assert.throws(()=>summarizeVerifiedLedger([ {...event(1,'A'),competency:'medical'} ]),/Invalid verified/);
  assert.throws(()=>summarizeVerifiedLedger([ {...event(1,'A'),awardedAt:'bad-date'} ]),/Invalid verified/);
});
