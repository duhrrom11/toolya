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
      revision = writes + 1;
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
