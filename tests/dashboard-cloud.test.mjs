import test from 'node:test';
import assert from 'node:assert/strict';
import { createDashboardCloud } from '../dashboard/modules/cloud-sync.mjs';

function mockSupabase() {
  const store = { dashboard_tasks: [], dashboard_reminders: [] };
  let user = null;
  const listeners = [];
  let serial = 0;
  const client = {
    auth: {
      async getUser() {
        return user ? { data: { user }, error: null } :
          { data: { user: null }, error: { name: 'AuthSessionMissingError', message: 'Auth session missing' } };
      },
      onAuthStateChange(callback) { listeners.push(callback); return { data: { subscription: { unsubscribe() {} } } }; }
    },
    from(table) {
      const args = { table, action: 'select', filters: [], values: null };
      const q = {
        select() { return q; },
        eq(col, val) { args.filters.push(row => row[col] === val); return q; },
        is(col, val) { args.filters.push(row => row[col] === val); return q; },
        order() { return q; },
        limit() { return q; },
        insert(values) { args.action = 'insert'; args.values = values; return q; },
        update(values) { args.action = 'update'; args.values = values; return q; },
        upsert(values) { args.action = 'upsert'; args.values = values; return q; },
        single() { return Promise.resolve(execute(true)); },
        then(resolve, reject) { return Promise.resolve(execute(false)).then(resolve, reject); }
      };
      function execute(single) {
        const visible = () => store[table].filter(row => row.user_id === user?.id && args.filters.every(fn => fn(row)));
        if (args.action === 'select') return { data: structuredClone(visible()), error: null };
        if (!user) return { data: null, error: { message: 'Not authenticated' } };
        if (args.action === 'insert') {
          if (args.values.user_id !== user.id) return {data:null,error:{message:'RLS'}};
          const row = { id: '00000000-0000-4000-8000-' + String(++serial).padStart(12,'0'),
            created_at:new Date().toISOString(), revision:1, deleted_at:null, due_at:null,...args.values };
          store[table].push(row);
          return { data:single ? structuredClone(row) : [structuredClone(row)], error:null };
        }
        if (args.action === 'upsert') {
          for (const value of args.values) {
            if (value.user_id !== user.id) return {data:null,error:{message:'RLS'}};
            if (store[table].some(r=>r.user_id===value.user_id && r.legacy_id===value.legacy_id)) continue;
            const row={id:'00000000-0000-4000-8000-'+String(++serial).padStart(12,'0'),
              created_at:new Date().toISOString(),revision:1,deleted_at:null,due_at:null,...value};
            store[table].push(row);
          }
          return {data:null,error:null};
        }
        const result = visible();
        for (const row of result) Object.assign(row,args.values);
        return {data:structuredClone(result),error:null};
      }
      return q;
    }
  };
  return {store,client,signIn(id) {user={id,is_anonymous:false};listeners.forEach(fn=>fn('SIGNED_IN',{user}));},
    signOut() {user=null;listeners.forEach(fn=>fn('SIGNED_OUT',null));}};
}
const settle = () => new Promise(resolve => setTimeout(resolve, 10));

test('guest mode, opt-in import, idempotency, CAS conflicts and logout isolation',async()=>{
  const old = {supabase:globalThis.supabase,document:globalThis.document,setInterval:globalThis.setInterval};
  const fake = mockSupabase();
  globalThis.supabase={createClient:()=>fake.client};
  globalThis.document={hidden:false,addEventListener(){}};
  globalThis.setInterval=()=>0;
  try {
    const states=[];
    const cloud=createDashboardCloud(event=>states.push(event));
    cloud.start();
    await settle();
    assert.equal(cloud.status,'local');
    fake.signIn('user-A'); await settle();
    assert.equal(cloud.status,'cloud');
    const imported={tasks:[{id:'local-task',text:'Aufgabe',done:false}],reminders:[{id:'local-reminder',text:'Pflanzen',due:'2026-11-22T12:00:00.000Z',done:false}]};
    assert.equal(await cloud.importLocal(imported),2);
    await cloud.refresh();
    assert.equal(cloud.snapshot('tasks').length,1);
    assert.equal(cloud.snapshot('reminders').length,1);
    await cloud.importLocal(imported);
    await cloud.refresh();
    assert.equal(cloud.snapshot('tasks').length,1,'reimport does not duplicate data');
    const original=cloud.snapshot('tasks')[0];
    await cloud.change('tasks',original.id,true);
    assert.equal(cloud.snapshot('tasks')[0].done,true);
    // Mutated on another device, stale revision must not overwrite.
    fake.store.dashboard_tasks[0].revision++;
    await assert.rejects(cloud.change('tasks',original.id,false),/Speicherkonflikt/);
    await cloud.refresh();
    assert.equal(cloud.snapshot('tasks')[0].done,true);
    await cloud.change('tasks',original.id,null,true);
    assert.equal(cloud.snapshot('tasks').length,0);
    assert.ok(fake.store.dashboard_tasks[0].deleted_at,'soft-delete preserves revision history');
    fake.signIn('user-B'); await settle();
    assert.equal(cloud.snapshot('reminders').length,0,'other account has no access to user A records');
    await cloud.create('tasks',{text:'Nur B'});
    assert.equal(cloud.snapshot('tasks').length,1);
    fake.signOut(); await settle();
    assert.equal(cloud.status,'local');
    assert.equal(cloud.snapshot('tasks').length,0,'cloud cache cleared on logout');
    assert.ok(states.some(s=>s.status==='cloud'));
  } finally {
    globalThis.supabase=old.supabase; globalThis.document=old.document; globalThis.setInterval=old.setInterval;
  }
});
