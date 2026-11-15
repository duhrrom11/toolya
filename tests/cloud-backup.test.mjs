import { test } from 'node:test';
import assert from 'node:assert/strict';
import { confirmCloudReplacement } from '../shared/toolya/cloud-backup.mjs';
import { createCarCloudController, createBudgetCloudController } from '../shared/toolya/cloud-controller.mjs';

function repository(initial) {
  let data = structuredClone(initial), revision = 1, writes = 0;
  return {
    get writes() { return writes; },
    get data() { return structuredClone(data); },
    async read() { return { exists:true, data:structuredClone(data), revision }; },
    async save(next, expected) {
      if (expected !== revision) throw Error('conflict');
      data = structuredClone(next);revision = ++writes + 1;
      return { data:structuredClone(data), revision };
    }
  };
}
test('cancel before backup leaves cloud untouched', async () => {
  const repo = repository({cars:[],events:[],tires:[]});
  const controller = createCarCloudController(repo);await controller.load();
  const result = await confirmCloudReplacement({
    controller,incoming:{cars:[{id:1}],events:[],tires:[]},
    validate:x=>x,confirm:async()=>false,exportBackup:async()=>{throw Error('should not run');}
  });
  assert.equal(result.status,'cancelled');assert.equal(repo.writes,0);
});
test('backup not confirmed prevents overwrite', async () => {
  const repo = repository({entries:[],budgets:{},goals:[]});
  const controller = createBudgetCloudController(repo);await controller.load();
  await assert.rejects(confirmCloudReplacement({
    controller,incoming:{entries:[{id:1}],budgets:{},goals:[]},
    validate:x=>x,confirm:async()=>true,exportBackup:async()=>false
  }),/Sicherung nicht bestätigt/);
  assert.equal(repo.writes,0);
});
test('double consent and confirmed backup allow overwrite', async () => {
  const repo = repository({cars:[],events:[],tires:[]});
  const controller = createCarCloudController(repo);await controller.load();
  let confirmations=0,backups=0;
  const result=await confirmCloudReplacement({
    controller,incoming:{cars:[{id:1}],events:[],tires:[]},
    validate:x=>x,confirm:async()=>{confirmations++;return true;},
    exportBackup:async()=>{backups++;return true;}
  });
  assert.equal(result.status,'confirmed');assert.equal(confirmations,2);
  assert.equal(backups,1);assert.equal(repo.writes,1);
});
test('changing revision during backup aborts import', async () => {
  const repo=repository({cars:[],events:[],tires:[]});
  const controller=createCarCloudController(repo);await controller.load();
  await assert.rejects(confirmCloudReplacement({
    controller,incoming:{cars:[{id:1}],events:[],tires:[]},validate:x=>x,
    confirm:async()=>true,
    exportBackup:async()=>{await controller.replace({cars:[{id:2}],events:[],tires:[]});return true;}
  }),/geändert/);
  assert.equal(repo.writes,1);assert.deepEqual(repo.data.cars,[{id:2}]);
});

test('session invalidation during confirmation blocks cloud import', async () => {
  const repo=repository({cars:[],events:[],tires:[]});
  const controller=createCarCloudController(repo);
  await controller.load();
  let confirmations=0;
  await assert.rejects(confirmCloudReplacement({
    controller,incoming:{cars:[{id:7}],events:[],tires:[]},validate:x=>x,
    confirm:async()=>{
      confirmations++;
      if (confirmations===2) controller.invalidate();
      return true;
    },
    exportBackup:async()=>true
  }),/Cloud-Sitzung/);
  assert.equal(repo.writes,0);
  assert.equal(controller.ready,false);
});
