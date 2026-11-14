import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const source=name=>readFileSync(resolve(root,'tools/wishes',name),'utf8');
test('Wishlist module syntax',()=>{
 for(const file of ['app.mjs','lists-dashboard.mjs','gift-start.mjs','workspace.mjs'])
  assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',resolve(root,'tools/wishes',file)],{stdio:'pipe'}),file);
});
test('batch actions removed, single wish movement retained',()=>{
 const c=source('lists-dashboard.mjs');
 for(const s of ['executeBulkJob(','bulkAssign(','applyBulk(','moveSelectedWishes(','bulkControlsEnabled(','retryBulkResult('])
  assert.equal(c.includes(s),false,s);
 assert.match(c,/async function moveWishToList\(/);
});
test('dashboard history and cloud checkpoint views removed',()=>{
 const c=source('gift-start.mjs');
 for(const s of ['loadCheckpoints(','loadHistory(','cloudCheckpointViews','checkpointRows','backupSettings('])
  assert.equal(c.includes(s),false,s);
 assert.match(c,/homeGiftSettingsForm/);
 assert.match(c,/showPreview\(/);
});
test('wishlist and Amazon import remain wired',()=>{
 const c=source('app.mjs');
 assert.match(c,/mountListsDashboard/);
 assert.match(c,/amazon-import\.mjs/);
});

test('obsolete dashboard history HTML is removed without removing settings',()=>{
 const html=readFileSync(resolve(root,'tools/wishes/index.html'),'utf8');
 for(const id of ['homeGiftCheckpoints','homeGiftBackup','homeGiftHistory'])
  assert.equal(html.includes('id="'+id+'"'),false,id);
 assert.match(html,/id="homeGiftSettings"/);
 assert.match(html,/id="homePreviewDraft"/);
});

test('static Wishlist element references resolve in HTML',()=>{
 const html=readFileSync(resolve(root,'tools/wishes/index.html'),'utf8');
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 for(const file of ['app.mjs','lists-dashboard.mjs','gift-start.mjs','workspace.mjs']){
  const code=source(file);
  for(const match of code.matchAll(/\$\(['"]([^'"]+)['"]\)|getElementById\(['"]([^'"]+)['"]\)/g))
   assert.ok(ids.has(match[1]||match[2]),file+': missing #'+(match[1]||match[2]));
 }
});
test('obsolete bulk history and multi-wish move HTML removed',()=>{
 const html=readFileSync(resolve(root,'tools/wishes/index.html'),'utf8');
 for(const id of ['bulkHistoryPanel','bulkMoveTarget','bulkMove'])
  assert.equal(html.includes('id="'+id+'"'),false,id);
 assert.match(html,/id="wishDetailDialog"/);
});
