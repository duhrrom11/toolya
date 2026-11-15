import { createCarCloudController, createBudgetCloudController } from '../shared/toolya/cloud-controller.mjs';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

function fakeRepository(initial = null) {
  let current = initial ? structuredClone(initial) : null;
  let revision = current ? 1 : null;
  let writes = 0, fail = false;
  return {
    get writes() { return writes; },
    get current() { return structuredClone(current); },
    setFail(value) { fail = value; },
    async read() {
      return { exists: current !== null, data: structuredClone(current), revision };
    },
    async save(data, expected) {
      if (fail) throw Error('network unavailable');
      if (expected !== revision) throw Error('revision conflict');
      writes++;
      current = structuredClone(data);
      revision = revision === null ? 1 : revision + 1;
      return { data: structuredClone(current), revision };
    }
  };
}
test('car: saves only after cloud confirmation', async () => {
  const repo = fakeRepository(), controller = createCarCloudController(repo);
  assert.equal(controller.ready, false);
  await controller.load();
  await controller.mutate(s => { s.cars.push({ id: 1, name: 'Demo' }); });
  assert.equal(repo.writes, 1);
  assert.equal(controller.snapshot().cars.length, 1);
});
test('budget: entries, budgets and goals are one atomic bundle', async () => {
  const repo = fakeRepository(), controller = createBudgetCloudController(repo);
  await controller.load();
  await controller.mutate(s => {
    s.entries.push({ id: 1 }); s.budgets.Food = 100; s.goals.push({ id: 2 });
  });
  assert.equal(repo.current.entries.length, 1);
  assert.equal(repo.current.budgets.Food, 100);
  assert.equal(repo.current.goals.length, 1);
});
test('failed cloud write never changes confirmed state', async () => {
  const repo = fakeRepository(), controller = createCarCloudController(repo);
  await controller.load();
  repo.setFail(true);
  await assert.rejects(controller.mutate(s => { s.cars.push({ id: 1 }); }), /network/);
  assert.equal(controller.ready, false);
  assert.equal(repo.writes, 0);
  await controller.load();
  assert.equal(controller.snapshot().cars.length, 0);
});
test('revision conflicts invalidate controller until reloaded', async () => {
  const repo = fakeRepository(), controller = createBudgetCloudController(repo);
  await controller.load();
  await assert.rejects(controller.replace({ entries: [], budgets: {}, goals: [] },
    { expectedRevision: 999 }), /Datenstand/);
  assert.equal(repo.writes, 0);
});
test('rejects invalid snapshot and async mutations', async () => {
  const repo = fakeRepository(), controller = createCarCloudController(repo);
  await controller.load();
  await assert.rejects(controller.replace({ cars: [] }), /Ungültiger/);
  assert.equal(repo.writes, 0);
  await assert.rejects(controller.mutate(async s => s), /Asynchrone/);
  assert.equal(repo.writes, 0);
});

test('reentrant mutations cannot race during transform', async () => {
  const repo = fakeRepository(), controller = createCarCloudController(repo);
  await controller.load();
  let nested;
  await controller.mutate(state => {
    nested = controller.mutate(other => { other.cars.push({ id: 2 }); });
    state.cars.push({ id: 1 });
  });
  await assert.rejects(nested, /Speichern läuft/);
  assert.deepEqual(repo.current.cars.map(c => c.id), [1]);
  assert.equal(repo.writes, 1);
});

test('late cloud confirmation after logout cannot restore controller state', async () => {
  let finish;
  const repo = {
    async read() { return { exists:false, data:null, revision:null }; },
    save() { return new Promise(resolve => { finish = resolve; }); }
  };
  const controller = createCarCloudController(repo);
  await controller.load();
  const pending = controller.replace({cars:[{id:1}],events:[],tires:[]});
  controller.invalidate();
  finish({data:{cars:[{id:1}],events:[],tires:[]},revision:1});
  await assert.rejects(pending, /Sitzung/);
  assert.equal(controller.ready,false);
  assert.equal(controller.revision,null);
  assert.throws(() => controller.snapshot(), /noch nicht geladen/);
});

test('controller rejects inconsistent read revisions and remains blocked', async () => {
  const invalid = [
    {exists:true,data:{cars:[],events:[],tires:[]},revision:null},
    {exists:true,data:{cars:[],events:[],tires:[]},revision:0},
    {exists:false,data:null,revision:2},
    {exists:false,data:null,revision:undefined},
    {exists:false,data:{cars:[],events:[],tires:[]},revision:null},
    {exists:false,data:undefined,revision:null},
    {exists:true,data:null,revision:1},
    {exists:true,data:undefined,revision:1}
  ];
  for (const response of invalid) {
    const controller=createCarCloudController({
      read:async()=>response,
      save:async()=>{throw Error('must not save');}
    });
    await assert.rejects(controller.load(),/inkonsistent/);
    assert.equal(controller.ready,false);
  }
});

test('invalid write acknowledgement locks controller until reload', async () => {
  const repo = {
    async read() { return {exists:false,data:null,revision:null}; },
    async save() { return {data:{cars:[],events:[],tires:[]},revision:99}; }
  };
  const controller = createCarCloudController(repo);
  await controller.load();
  await assert.rejects(controller.replace({cars:[],events:[],tires:[]}),/inkonsistent/);
  assert.equal(controller.ready,false);
});

test('write acknowledgement with different payload is rejected', async () => {
  const repo = {
    async read() { return {exists:false,data:null,revision:null}; },
    async save() { return {data:{cars:[{id:'unexpected'}],events:[],tires:[]},revision:1}; }
  };
  const controller = createCarCloudController(repo);
  await controller.load();
  await assert.rejects(controller.replace({cars:[],events:[],tires:[]}),/inkonsistent/);
  assert.equal(controller.ready,false);
});
