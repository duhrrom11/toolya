import test from 'node:test';
import assert from 'node:assert/strict';
import {saveProfile,saveRule,removePreference,suggestCategory,bulkEdit} from '../../tools/budget/budget-organization.mjs';
import {bankPreview,applyBankImport} from '../../tools/budget/bank-import.mjs';
test('profile roundtrip, rename and deletion',()=>{
 const p={id:'p1',name:'Bank',source:'A',encoding:'utf-8',delimiter:';',locale:'de',dateFormat:'DMY',mode:'signed',mapping:{date:0,title:1,amount:2}};
 const list=saveProfile([],p);
 assert.equal(list[0].mapping.amount,2);
 assert.equal(saveProfile(list,{...p,name:'Renamed'})[0].name,'Renamed');
 assert.deepEqual(removePreference(list,'p1'),[]);
 assert.throws(()=>saveProfile([],{...p,mapping:{date:-1}}));
});
test('literal longest rule wins and manual category overrides',()=>{
 const rules=[{id:'a',match:'REWE',category:'Lebensmittel'},{id:'b',match:'REWE Tankstelle',category:'Auto'}].reduce(saveRule,[]);
 assert.equal(suggestCategory('REWE TANKSTELLE',rules),'Auto');
 const config={source:'A',delimiter:';',locale:'de',dateFormat:'DMY',mode:'signed',date:0,title:1,amount:2,rules,fileDigest:'abc'};
 const rows=bankPreview('Date;Title;Amount\n28.11.2026;REWE;-10,00',config);
 assert.equal(rows[0].suggestedCategory,'Lebensmittel');
 rows[0].category='Sonstiges';
 const imported=applyBankImport([],rows,'batch',100);
 assert.equal(imported.entries[0].category,'Sonstiges');
 assert.equal(bankPreview('Date;Title;Amount\n28.11.2026;REWE;-10,00',config,imported.entries)[0].status,'duplicate');
 assert.equal(applyBankImport(imported.entries,rows,'another',200).added,0);
});
test('bulk edit protects hidden and split bookings',()=>{
 const rows=[{id:1,category:'Auto'},{id:2,category:'Wohnen',splits:[{}]}];
 assert.throws(()=>bulkEdit(rows,[2],[1],{needsReview:true}));
 assert.throws(()=>bulkEdit(rows,[2],[2],{category:'Auto'}));
 const result=bulkEdit(rows,[1],[1],{needsReview:true});
 assert.equal(result.changed,1);assert.equal(result.entries[0].needsReview,true);
 assert.equal(result.entries[1],rows[1]);assert.equal(rows[0].needsReview,undefined);
});
