// Static regression: no production access or test accounts.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const home=fs.readFileSync('index.html','utf8');
assert.match(home,/\.ty-tool-link/);
assert.match(home,/toolyaAuth\?\.forClient\(window\.supabaseClient\) \|\| window\.supabaseClient\.auth\)\.getUser\(\)/);
assert.match(home,/openSettings\(\)/);
for(const [tool,controller] of [['car','toolyaCloudController'],['budget','toolyaCloudController'],['moving','movingCloudController'],['loans','loansCloudController']]){
 const html=fs.readFileSync('tools/'+tool+'/index.html','utf8');
 assert.ok(html.includes(controller),'CloudOnly controller missing: '+tool);
 assert.ok(!html.includes('mountConnectPanel'),'Connect check must not appear: '+tool);
 assert.ok(!html.includes('toolyaConnectPanel'),'orphaned Connect panel: '+tool);
 assert.ok(html.includes('Cloud'),'CloudOnly gate missing: '+tool);
}
console.log('PASS: account-gated home links and four CloudOnly tools without Connect panel');

const gate=fs.readFileSync('shared/toolya/auth-page-gate.js','utf8');
assert.match(gate,/toolyaAuth\?\.forClient\(client\) \|\| client\.auth\)\.getUser\(\)/);
assert.match(gate,/is_anonymous/);
assert.match(gate,/SIGNED_OUT/);
for(const tool of ['moving','plants','housemates','pet-health','parking','loans','meters','baking','car','budget']){
 const html=fs.readFileSync('tools/'+tool+'/index.html','utf8');
 assert.ok(html.includes('toolya-auth-pending'),'no fail-closed initial privacy mask: '+tool);
 assert.ok(html.includes('auth-page-gate.js'),'direct navigation gate missing: '+tool);
}
const estate=fs.readFileSync('tools/estate/index.html','utf8');
assert.ok(estate.includes('login-panel')&&estate.includes('login-form'),'estate must keep its own login screen');
console.log('PASS: ten private direct URL gates and estate login form');

const publicEntry=fs.readFileSync('tools/wishes/index.html','utf8');
assert.doesNotMatch(publicEntry,/auth-page-gate|toolya-auth-pending/);
assert.match(publicEntry,/public\.html/);
console.log('PASS: public wishlist discovery remains public');


// Public guides and embedded assistance must stay aligned with the supported
// inline Connect workflow. Static-only: no browser accounts or production writes.
for(const [guide,tool,category] of [
 ['autokosten','car','Auto'],
 ['parkplatz-merker','parking','Auto'],
 ['tiergesundheit','pet-health','Haustiere']
]){
 const guideHtml=fs.readFileSync(guide+'/index.html','utf8');
 const toolHtml=fs.readFileSync('tools/'+tool+'/index.html','utf8');
 assert.match(guideHtml,/<a href="#connect">Toolya Connect<\/a>/,guide+' guidance navigation');
 assert.match(guideHtml,/<section id="connect">/,guide+' public instructions');
 assert.match(guideHtml,/ins Haushaltsbuch übernehmen/,guide+' optional action');
 assert.ok(guideHtml.includes(category),guide+' mapped category missing');
 assert.match(guideHtml,/Bargeld/,guide+' payment-method review missing');
 assert.match(toolHtml,/Toolya Connect/,tool+' embedded help missing');
 assert.match(toolHtml,/Haushaltsbuch/,tool+' target missing in help');
}
const budgetHelp=fs.readFileSync('haushaltsbuch/index.html','utf8');
assert.match(budgetHelp,/<a href="#connect">Toolya Connect<\/a>/);
assert.match(budgetHelp,/<section id="connect">/);
for(const path of ['/autokosten/','/parkplatz-merker/','/tiergesundheit/'])
 assert.ok(budgetHelp.includes('href="'+path+'"'),'budget guidance missing source '+path);
assert.match(budgetHelp,/keine Doppelbuchung/);
console.log('PASS: four public Connect guides and three embedded tool help sections');
