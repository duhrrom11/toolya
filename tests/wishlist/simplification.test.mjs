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
