import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const tool=name=>readFileSync(resolve(root,'tools/'+name+'/index.html'),'utf8');

test('parking history escapes arbitrary user text and rejects unsafe images and GPS',()=>{
 const html=tool('parking');
 const a=html.indexOf('function escapeParkingHtml('),b=html.indexOf('function renderParkingList()');
 assert.ok(a>=0&&b>a);
 const safety=vm.runInNewContext(html.slice(a,b)+';({escapeParkingHtml,safeParkingPhoto,safeParkingGps})');
 assert.equal(safety.escapeParkingHtml('<img src=x onerror="alert(1)"> &'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp;');
 assert.equal(safety.safeParkingPhoto('javascript:alert(1)'),'');
 assert.equal(safety.safeParkingPhoto('data:image/svg+xml;base64,PHN2Zz4='),'');
 assert.equal(safety.safeParkingPhoto('data:image/png;base64,aGVsbG8='),'data:image/png;base64,aGVsbG8=');
 assert.equal(safety.safeParkingGps({lat:'0" onclick="x',lng:7}),null);
 assert.equal(safety.safeParkingGps({lat:91,lng:8}),null);
 assert.equal(safety.safeParkingGps({lat:49.3,lng:7.1}).lat,49.3);
 const render=html.slice(b,html.indexOf('function zoomImage('));
 for(const value of ['s.desc','s.sector','displayDate'])assert.ok(render.includes('escapeParkingHtml('+value+')'),value);
 assert.match(render,/safeParkingPhoto\(s\.photo\)/);
 assert.match(render,/safeParkingGps\(s\.gps\)/);
 assert.match(render,/Number\.isSafeInteger\(s\.id\)/);
 assert.match(render,/parkingCloudReady && parkingCloudController\?\.ready/);
 assert.doesNotMatch(render,/saveData\(|parkingCloudController\.replace\(/);
});
test('existing DE and new EN empty states are rendered in three tools',()=>{
 for(const [name,en] of [['parking','No parking sessions saved for this period.'],['car','No tyre sets recorded yet.'],['pet-health','No medicines recorded.']])assert.ok(tool(name).includes(en),name);
 assert.match(tool('car'),/label\('Keine Reifensätze\.', 'No tyre sets\.'/);
});
