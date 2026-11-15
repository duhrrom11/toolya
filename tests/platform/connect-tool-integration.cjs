// Static regression: no production access or test accounts.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const home=fs.readFileSync('index.html','utf8');
assert.match(home,/\.ty-tool-link/);
assert.match(home,/supabaseClient\.auth\.getUser\(\)/);
assert.match(home,/openSettings\(\)/);
for(const [tool,controller] of [['car','toolyaCloudController'],['budget','toolyaCloudController'],['moving','movingCloudController'],['loans','loansCloudController']]){
 const html=fs.readFileSync('tools/'+tool+'/index.html','utf8');
 assert.ok(html.includes(controller),'CloudOnly controller missing: '+tool);
 assert.ok(!html.includes('mountConnectPanel'),'Connect check must not appear: '+tool);
 assert.ok(!html.includes('toolyaConnectPanel'),'orphaned Connect panel: '+tool);
 assert.ok(html.includes('Cloud'),'CloudOnly gate missing: '+tool);
}
console.log('PASS: account-gated home links and four CloudOnly tools without Connect panel');
