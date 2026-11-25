import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../../tools/parking/index.html',import.meta.url),'utf8');
const start=html.indexOf('function saveParkingSession('),end=html.indexOf('async function processPhotoAndSave',start);
function fixture({gps='denied',lang='de'}={}){
 const fields=Object.fromEntries(['parkDesc','parkSector','parkCost','parkPhotoInput','saveParkingGpsBtn','parkingGpsFeedback'].map(id=>[id,{value:'',textContent:'',disabled:false}]));
 fields.parkDesc.value='Private title';fields.parkSector.value='A2';fields.parkCost.value='3,50';
 const ordinary={disabled:false},calls=[];
 const c={parkingSaveInProgress:false,currentGps:null,window:{__toolyaUILocale:lang},document:{getElementById:id=>fields[id],querySelector:()=>ordinary},navigator:gps==='missing'?{}:{geolocation:{getCurrentPosition(ok,fail,options){assert.equal(options.timeout,12000);if(gps==='success')ok({coords:{latitude:49.1,longitude:6.2}});else fail({code:1})}}},processPhotoAndSave:async(...args)=>{calls.push(args)},console,alert:()=>{throw Error('unexpected alert')}};
 vm.runInNewContext(html.slice(start,end)+'\nthis.save=saveParkingSession;',c);
 return {c,fields,ordinary,calls};
}
for(const gps of ['denied','missing'])test('ordinary parking save falls back exactly once when GPS is '+gps,async()=>{const f=fixture({gps});f.c.save();await new Promise(resolve=>setImmediate(resolve));assert.equal(f.calls.length,1);assert.equal(f.calls[0][0],'Private title');assert.equal(f.calls[0][2],3.5);assert.equal(f.calls[0][3],null);assert.equal(f.c.parkingSaveInProgress,false);assert.equal(f.ordinary.disabled,false);assert.equal(f.fields.saveParkingGpsBtn.disabled,false)});
for(const gps of ['denied','missing'])test('GPS-required parking save refuses missing coordinates: '+gps,async()=>{for(const lang of ['de','en']){const f=fixture({gps,lang});f.c.save(true);await new Promise(resolve=>setImmediate(resolve));assert.equal(f.calls.length,0);assert.equal(f.c.parkingSaveInProgress,false);assert.equal(f.fields.saveParkingGpsBtn.disabled,false);assert.match(f.fields.parkingGpsFeedback.textContent,lang==='en'?/GPS location unavailable/:/GPS-Standort nicht verfügbar/)}});
test('GPS-required save uses provided coordinates exactly once',async()=>{const f=fixture({gps:'success'});f.c.save(true);await new Promise(resolve=>setImmediate(resolve));assert.equal(f.calls.length,1);assert.equal(f.calls[0][3].lat,49.1);assert.equal(f.calls[0][3].lng,6.2);assert.equal(f.c.parkingSaveInProgress,false)});
test('parking PDF helper precedes stable extraction marker',()=>{const a=html.indexOf('function displayLegacyDate('),b=html.indexOf('// PDF Report Export via jsPDF');assert.ok(a>=0&&b>a);const ctx={window:{__toolyaUILocale:'en'}};vm.runInNewContext(html.slice(a,b)+'\nthis.format=displayLegacyDate;',ctx);assert.equal(ctx.format('25.11.2026 10:30'),'25/11/2026 10:30');assert.equal(ctx.format('25.11.2026 10:30',false),'25.11.2026 10:30')});
