import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../../tools/car/index.html',import.meta.url),'utf8');
const from=source.indexOf('const vehicleTypeEn = Object.freeze(');
const to=source.indexOf('function renderApp()',from);
assert.ok(from>0&&to>from,'vehicle type display-only helper exists');
const helper=source.slice(from,to);
function context(locale) {
 const window={__toolyaUILocale:locale};
 const api=runInNewContext(helper+'\n({display:vehicleTypeDisplay,escape:escapeVehicleType})',{window});
 return {window,api};
}

test('canonical car event and tyre types render in EN and reverse to DE',()=>{
 const {window,api}=context('en');
 const examples=[
  ['TÜV / HU','Vehicle inspection'],['Inspektion','Inspection & service'],
  ['Versicherung','Insurance'],['Kfz-Steuer','Vehicle tax'],
  ['Reifenwechsel','Tyre change'],['Reifentiefe','Tyre tread check'],
  ['Ölwechsel','Oil change'],['Reparatur','Repair'],['Tanken','Refuelling'],
  ['Sommerreifen','Summer tyres'],['Winterreifen','Winter tyres'],
  ['Ganzjahresreifen','All-season tyres']
 ];
 for(const [de,en]of examples){
  assert.equal(api.display(de),en);
  window.__toolyaUILocale='de';
  assert.equal(api.display(de),de);
  window.__toolyaUILocale='en';
 }
 for(const custom of ['__proto__','constructor','toString','Wunschtyp','<img src=x onerror=alert(1)>']) {
  assert.equal(api.display(custom),custom);
 }
 assert.equal(api.escape(api.display('<img src=x onerror=alert(1)>')),'&lt;img src=x onerror=alert(1)&gt;');
});

test('all three dynamic car type displays escape free text, underlying types and filters remain unchanged',()=>{
 assert.equal((source.match(/escapeVehicleType\(vehicleTypeDisplay\((?:e|t)\.type\)\)/g)||[]).length,3);
 assert.match(source,/filteredEvents = filteredEvents\.filter\(e => e\.carId === parseInt\(selectedFilter\)\)/);
 assert.match(source,/e\.type === 'Tanken'/);
 assert.match(source,/\['TÜV \/ HU', 'Inspektion', 'Versicherung', 'Kfz-Steuer'\]\.includes\(e\.type\)/);
 assert.doesNotMatch(helper,/saveData\(|localStorage\.|\.value\s*=|\.type\s*=/);
});

test('static car and tyre select display labels keep original canonical values',()=>{
 const values=['Inspektion','Versicherung','Kfz-Steuer','Reifenwechsel','Reifentiefe','Reparatur','Tanken'];
 for(const value of values){
  const occurrence=source.split('<option value="'+value+'" data-tool-en=').length-1;
  assert.equal(occurrence,2,value);
 }
 for(const value of ['Sommerreifen','Winterreifen','Ganzjahresreifen'])
  assert.equal(source.split('<option value="'+value+'" data-tool-en=').length-1,1,value);
});
