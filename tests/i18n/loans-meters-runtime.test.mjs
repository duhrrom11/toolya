import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const tool=name=>readFileSync(resolve(root,'tools/'+name+'/index.html'),'utf8');
test('loan badges and confirmations translate but stored status codes do not',()=>{
 const html=tool('loans');
 for(const phrase of ['No inventory items recorded yet.','No items match this filter.','Return date extended by ','✅ Returned','⚠️ Lost / damaged'])assert.ok(html.includes(phrase),phrase);
 for(const status of ["i.status === 'returned'","i.status === 'lost'","value=\"active\"","value=\"returned\"","value=\"lost\""])assert.ok(html.includes(status),status);
 assert.match(html,/if \(!await saveData\(data\)\) return;\s*renderApp\(\);\s*alert\(window\.__toolyaUILocale/);
});
test('loan and meter language changes redraw loaded CloudOnly only, never save',()=>{
 for(const [name,ready,controller]of [['loans','loansCloudReady','loansCloudController'],['meters','metersCloudReady','metersCloudController']]){
  const listener=tool(name).match(/document\.addEventListener\('toolya:locale-change',\s*\(\)\s*=>\s*\{[\s\S]*?\}\);/);
  assert.ok(listener,name);
  for(const value of [ready,controller,'renderApp()'])assert.ok(listener[0].includes(value),value);
  assert.doesNotMatch(listener[0],/saveData|\.replace\(|\.upsert\(|localStorage/);
 }
 assert.ok(tool('meters').includes('No entries found.'));
 assert.ok(tool('meters').includes('Meter readings overview:'));
});
