import test from 'node:test';
import assert from 'node:assert/strict';
import {createLegacyI18nextResources,registerLegacyCatalogues} from '../../shared/toolya/i18n/i18next-legacy-resources.mjs';
test('reuses existing translations in namespaced i18next resources',()=>{
 const resources=createLegacyI18nextResources();
 for(const ns of ['dashboard','wishes','estate','admin']){
   assert.ok(Object.keys(resources.en[ns]).length>0,ns);
   assert.deepEqual(Object.keys(resources.de[ns]),Object.keys(resources.en[ns]));
   for(const key of Object.keys(resources.de[ns]))assert.equal(resources.de[ns][key],key);
 }
 assert.equal(resources.en.dashboard['Mein Dashboard'],'My dashboard');
});
test('registers without initializing a second i18next runtime',()=>{
 const calls=[];
 const instance={addResourceBundle:(...args)=>calls.push(args)};
 assert.equal(registerLegacyCatalogues(instance),instance);
 assert.equal(calls.length,8);
 assert.ok(calls.every(([, , ,deep,overwrite])=>deep===true&&overwrite===false));
});
