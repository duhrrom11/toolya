import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../../tools/parking/index.html',import.meta.url),'utf8');
test('new GPS handler preserves private fields and deadline when required location fails in both locales',async()=>{
 const start=source.indexOf('let parkingSaveInProgress=false;');
 const end=source.indexOf('async function processPhotoAndSave',start);
 assert.ok(start>=0&&end>start,'actual GPS handler exists');
 for(const lang of ['de','en']){
  for(const mode of ['denied','missing','success']){
   const fields={parkDesc:{value:'Private Löschen'},parkSector:{value:'Private Zone'},parkCost:{value:'0'},parkPhotoInput:{files:[]},saveParkingGpsBtn:{disabled:false},parkingGpsFeedback:{textContent:''}};
   const deadline=Date.now()+60000,original={lat:12.34,lng:56.78},writes=[];
   const ctx={window:{__toolyaUILocale:lang},document:{getElementById:id=>fields[id],querySelector:()=>null},navigator:{geolocation:mode==='missing'?undefined:{getCurrentPosition(ok,fail){mode==='success'?ok({coords:{latitude:original.lat,longitude:original.lng}}):fail({code:1})}}},activeEndTime:deadline,currentGps:null,processPhotoAndSave:async(...args)=>writes.push(args),console,alert:()=>assert.fail('Unexpected alert')};
   const save=runInNewContext(source.slice(start,end)+'\nsaveParkingSession',ctx);
   save(true);await new Promise(resolve=>setImmediate(resolve));
   assert.equal(ctx.activeEndTime,deadline);
   assert.equal(fields.parkDesc.value,'Private Löschen');assert.equal(fields.parkSector.value,'Private Zone');assert.equal(fields.saveParkingGpsBtn.disabled,false);
   if(mode==='success'){assert.equal(writes.length,1);assert.equal(JSON.stringify(writes[0][3]),JSON.stringify(original));}
   else{assert.equal(writes.length,0);assert.equal(fields.parkingGpsFeedback.textContent,lang==='en'?'GPS location unavailable. Allow location access and try again.':'GPS-Standort nicht verfügbar. Bitte Standortzugriff erlauben und erneut versuchen.');}
  }
 }
});
test('GPS feedback is accessible and locale changes refresh countdown and history',()=>{
 assert.match(source,/id="parkingGpsFeedback"[^>]*role="status"[^>]*aria-live="polite"/);
 assert.match(source,/refreshParkingTimerLocale\(\);\s*if \(parkingCloudReady\) renderParkingList\(\)/);
});
