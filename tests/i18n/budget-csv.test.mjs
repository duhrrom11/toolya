import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseCsv} from '../../supabase/functions/wishlist-discovery/model.mjs';
const html=readFileSync(new URL('../../tools/budget/index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('function steuerCsvFeld'),html.indexOf('function exportBackup()',html.indexOf('function steuerCsvFeld')));
test('budget CSV both exports preserve signed prices, missing prices and formula safety across locales',async()=>{
 const data=[{date:'2026-11-24',title:'  =1+1',note:'A;B "C"\nD',price:-12.5,isTax:true},{date:'2026-11-23',title:'ordinary',note:'\nplain',price:null,isTax:true},{date:'2026-11-25',title:'not tax',price:0,isTax:false}];
 const original=JSON.stringify(data);let blob,filename;
 const ctx=vm.createContext({window:{__toolyaUILocale:'de'},getData:()=>data,parseReceiptDate:s=>new Date(s+'T12:00:00Z'),Blob,URL:{createObjectURL:b=>{blob=b;return 'blob:fixture'},revokeObjectURL(){}},document:{createElement:()=>({click(){filename=this.download}})},setTimeout(){},alert(){throw Error('unexpected alert')}});
 vm.runInContext(source,ctx);
 for(const lang of ['de','en'])for(const kind of ['AllBookings','Steuer']){
  ctx.window.__toolyaUILocale=lang;vm.runInContext('export'+kind+'CSV()',ctx);
  const rows=parseCsv(await blob.text()),en=lang==='en',price=en?'Price_EUR':'Preis_EUR',title=en?'Title':'Titel',note=en?'Note':'Notiz';
  assert.equal(rows.length,kind==='Steuer'?2:3);
  assert.equal(rows[0][price],'');assert.equal(rows[1][price],'-12.50');
  assert.equal(rows[1][title],"'  =1+1");assert.equal(rows[1][note],'A;B "C"\nD');
  assert.equal(rows[0][note],"'\nplain");assert.match(filename,/\.csv$/);
  assert.equal(JSON.stringify(data),original);
 }
});
