import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCents,legacyCents,addCents,decimalCents,validateSplit,parseBankDate,parseCSV} from '../../tools/budget/budget-domain.mjs';

test('decimal amounts and exact addition',()=>{
  assert.equal(parseCents('1.234,56','de'),123456);
  assert.equal(parseCents('-1,234.56','en'),-123456);
  assert.equal(addCents(10,20),30);
  assert.equal(legacyCents(12.34),1234);
  assert.equal(decimalCents(-1),'-0.01');
  assert.equal(decimalCents(Number.MAX_SAFE_INTEGER),'90071992547409.91');
  for(const s of ['1,2345','1.2,3','NaN','1e2',''])assert.throws(()=>parseCents(s,'de'));
  assert.throws(()=>addCents(Number.MAX_SAFE_INTEGER,1));
  assert.throws(()=>legacyCents(0.001));
});
test('split totals are exact',()=>{
  assert.equal(validateSplit(30,[{category:'A',cents:10},{category:'B',cents:20}]),true);
  assert.equal(validateSplit(31,[{category:'A',cents:10},{category:'B',cents:20}]),false);
  assert.equal(validateSplit(30,[{category:'A',cents:-10},{category:'B',cents:40}]),false);
});
test('explicit date formats and calendar validation',()=>{
  assert.equal(parseBankDate('03/04/2024','DMY'),'2024-04-03');
  assert.equal(parseBankDate('03/04/2024','MDY'),'2024-03-04');
  assert.equal(parseBankDate('2024-02-29','ISO'),'2024-02-29');
  assert.throws(()=>parseBankDate('2023-02-29','ISO'));
  assert.throws(()=>parseBankDate('31.04.2024','DMY'));
  assert.throws(()=>parseBankDate('03/04/2024'));
});
test('CSV delimiters, escaping, BOM, newlines and invalid quotes',()=>{
  assert.deepEqual(parseCSV('\uFEFFDate;Text;Amount\r\n2024-01-01;"A;B ""C""\nD";1,20\r\n'),[['Date','Text','Amount'],['2024-01-01','A;B "C"\nD','1,20']]);
  assert.deepEqual(parseCSV('a,b,\n1,2,',' ,'.trim()),[['a','b',''],['1','2','']]);
  assert.throws(()=>parseCSV('"a'));
  assert.throws(()=>parseCSV('"a"b'));
  assert.throws(()=>parseCSV('a"b'));
});
