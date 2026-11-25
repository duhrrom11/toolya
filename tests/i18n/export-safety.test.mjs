import test from 'node:test';
import assert from 'node:assert/strict';
import {exportWishlistCsv,exportWishlistJson} from '../../tools/wishes/wishlist-utils.mjs';
import {parseCsv} from '../../supabase/functions/wishlist-discovery/model.mjs';
import {buildAllDayCalendar} from '../../shared/toolya/calendar-export.mjs';

test('Wishes CSV bilingual headers, formula safety and unchanged private JSON',()=>{
 const notes=['  =1+1','\tplain','\nplain','\rplain','＋1','＠SUM(1)',' ordinary text','A;B "C"'];
 const rows=notes.map(note=>({wishlist_products:{asin:'B012345678',marketplace:'amazon.de',title:'Privater Titel'},note,priority:2,created_at:'2026-01-01T00:00:00Z'}));
 const before=JSON.stringify(rows);
 for(const lang of ['de','en']){
  const output=exportWishlistCsv(rows,lang);
  const key=lang==='en'?'Note':'Notiz';
  const parsed=parseCsv(output);
  assert.deepEqual(parsed.map(row=>row[key]),notes.map((n,i)=>i<6?"'"+n.replace(/\r\n?/g,'\n'):n));
  assert.equal(parsed[0][lang==='en'?'Product title':'Produkttitel'],'Privater Titel');
  assert.equal(parsed[0]['Amazon-ASIN'],'B012345678');
 }
 assert.deepEqual(JSON.parse(exportWishlistJson(rows)).wishes.map(x=>x.note),notes);
 assert.equal(JSON.stringify(rows),before);
});

test('DE/EN calendar content preserves private title, UID and date; folds UTF-8 and escapes injection',()=>{
 const title='Privater Termin; '+ 'ä🚗'.repeat(45)+',\nBEGIN:VEVENT';
 const base={title,date:'2028-02-29',uid:'fixture-1@toolya.app',now:new Date('2026-11-25T12:00:00Z')};
 for(const description of ['KFZ-Termin','Vehicle appointment','Haustier-Termin','Pet appointment']){
  const content=buildAllDayCalendar({...base,description});
  assert.ok(content.split('\r\n').every(line=>Buffer.byteLength(line)<=75));
  const unfolded=content.replace(/\r\n /g,'');
  assert.ok(unfolded.includes('UID:fixture-1@toolya.app\r\n'));
  assert.ok(unfolded.includes('DTSTART;VALUE=DATE:20280229\r\n'));
  assert.ok(unfolded.includes('DESCRIPTION:'+description+'\r\n'));
  assert.ok(unfolded.includes('SUMMARY:Privater Termin\\; '+ 'ä🚗'.repeat(45)+'\\,\\nBEGIN:VEVENT\r\n'));
  assert.equal(unfolded.split('\r\n').filter(x=>x==='BEGIN:VEVENT').length,1);
 }
 assert.equal(buildAllDayCalendar({...base,date:'2026-02-29',description:'x'}),null);
});
