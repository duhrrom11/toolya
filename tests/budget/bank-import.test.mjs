import test from 'node:test';
import assert from 'node:assert/strict';
import {bankPreview,applyBankImport,undoBankImport,decodeBankFile} from '../../tools/budget/bank-import.mjs';
const config={source:'Account A',delimiter:';',locale:'de',dateFormat:'DMY',mode:'signed',date:0,title:1,amount:2,transactionId:3};
const csv='Date;Title;Amount;ID\n28.11.2026;Market;-12,34;abc\n28.11.2026;Pay;100,00;def\n31.11.2026;Bad;2,00;ghi';
test('preview, import, repeat and source scope',()=>{
 const rows=bankPreview(csv,config);
 assert.deepEqual(rows.map(r=>r.status),['ready','ready','invalid']);
 const result=applyBankImport([],rows.slice(0,2),'batch',100);
 assert.equal(result.added,2);
 assert.equal(result.entries[0].price,12.34);
 assert.equal(applyBankImport(result.entries,rows.slice(0,2),'batch',200).added,0);
 assert.deepEqual(bankPreview(csv,config,result.entries).map(r=>r.status),['duplicate','duplicate','invalid']);
 assert.equal(bankPreview(csv,{...config,source:'Account B'},result.entries)[0].status,'review');
});
test('undo preserves changed bookings and inbound links',()=>{
 const rows=bankPreview(csv,config).slice(0,2);
 const result=applyBankImport([],rows,'batch',100);
 assert.equal(undoBankImport(result.entries,'batch').entries.length,0);
 const edited=structuredClone(result.entries);
 edited[0].note='Changed';
 assert.deepEqual(undoBankImport(edited,'batch').protectedIds,[100]);
 edited.push({id:900,refundOf:101});
 assert.equal(undoBankImport(edited,'batch').removable.length,0);
});
test('split debit credit and warning without bank ID',()=>{
 const c={...config,mode:'split',debit:2,credit:3,transactionId:-1};
 const rows=bankPreview('Date;Title;Debit;Credit\n28.11.2026;A;2,00;\n28.11.2026;A;2,00;\n28.11.2026;B;1,00;2,00',c);
 assert.deepEqual(rows.map(r=>r.status),['ready','review','invalid']);
 assert.equal(rows[0].cents,-200);
});
test('explicit Windows encoding',async()=>{
 const file=new Blob([Uint8Array.from([0x4d,0xfc,0x6c,0x6c,0x65,0x72])]);
 assert.equal(await decodeBankFile(file,'windows-1252'),'Müller');
 await assert.rejects(decodeBankFile(file,'utf-8'));
});
