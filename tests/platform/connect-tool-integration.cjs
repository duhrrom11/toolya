// Static safety contract for CloudOnly Connect entry points; no accounts or network.
const assert=require('node:assert/strict');
const fs=require('node:fs');
for(const [tool,controller,refresh] of [
 ['car','toolyaCloudController','renderApp'],
 ['budget','toolyaCloudController','renderApp'],
 ['moving','movingCloudController','renderInventory'],
 ['loans','loansCloudController','renderInventory']
]){
 const html=fs.readFileSync('tools/'+tool+'/index.html','utf8');
 assert.match(html,/mountConnectPanel\s*\(/,'Connect panel missing: '+tool);
 assert.ok(html.includes('controller:'+controller),'wrong CloudOnly controller: '+tool);
 assert.ok(html.includes('onReload:'),'manual reload callback missing: '+tool);
 assert.ok(html.includes(refresh),'UI refresh missing: '+tool);
 assert.ok(html.includes('toolyaConnectPanel?.dispose()'),'panel cleanup missing: '+tool);
}
console.log('PASS: four CloudOnly tools mount Connect with reload and cleanup');
