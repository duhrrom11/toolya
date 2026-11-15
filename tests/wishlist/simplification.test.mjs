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

test('private Wishlist feed does not query follows or expose people search',()=>{
 const app=source('app.mjs');
 const html=readFileSync(resolve(root,'tools/wishes/index.html'),'utf8');
 assert.match(app,/const allowed=\[user\.id\]/);
 assert.doesNotMatch(app,/wishlist_follows/);
 assert.doesNotMatch(app,/profileLink\.href/);
 assert.doesNotMatch(html,/id="peopleSearch"/);
 assert.match(html,/id="saveProfile"/);
 assert.match(html,/id="feed"/);
 assert.match(app,/mountAmazonImport/);
 assert.match(app,/mountListsDashboard/);
});

test('gift discovery modules do not depend on community feed',()=>{
 for(const file of ['gift-finder.mjs','wish-worlds.mjs']){
  const code=source(file);
  assert.ok(code.includes('gift-ideas.mjs'));
  for(const forbidden of ['getCandidates','readPublicWishes','wishlist_follows','db.from(',"('feed')"])
   assert.equal(code.includes(forbidden),false,file+': '+forbidden);
 }
 const html=readFileSync(resolve(root,'tools/wishes/index.html'),'utf8');
 for(const required of ['giftFinderForm','wishWorldsTopics'])
  assert.ok(html.includes('id="'+required+'"'));
 for(const removed of ['giftFinderSurprise','wishWorldsShuffle'])
  assert.equal(html.includes('id="'+removed+'"'),false);
});
test('offline gift ideas filter by category, occasion and query',async()=>{
 const {ideas,categories,matchingIdeas}=await import('../../tools/wishes/gift-ideas.mjs');
 assert.ok(ideas.length>=6);
 assert.ok(categories.length>=6);
 assert.equal(matchingIdeas().length,ideas.length);
 assert.ok(matchingIdeas({interest:'gaming'}).every(item=>item.category==='gaming'));
 assert.ok(matchingIdeas({occasion:'baby'}).every(item=>item.occasions.includes('baby')));
 assert.ok(matchingIdeas({query:'Pflanze'}).some(item=>item.title.includes('Pflanze')));
 assert.ok(matchingIdeas({budget:'20'}).every(item=>!('price' in item)));
});

test('social profile state and obsolete profile controls are absent',()=>{
 const app=source('app.mjs');
 const html=readFileSync(resolve(root,'tools/wishes/index.html'),'utf8');
 for(const state of ['hiddenProfileIds','selectedProfileId','updateHiddenProfiles'])
  assert.equal(app.includes(state),false,state);
 for(const id of ['restoreHiddenProfiles','hiddenProfileInfo','copyMyProfile'])
  assert.equal(html.includes('id="'+id+'"'),false,id);
 assert.match(app,/\$\('saveProfile'\)\.onclick/);
 assert.match(app,/const allowed=\[user\.id\]/);
});
