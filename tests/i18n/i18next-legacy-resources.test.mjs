import test from 'node:test';
import assert from 'node:assert/strict';
import {createLegacyI18nextResources,registerLegacyCatalogues} from '../../shared/toolya/i18n/i18next-legacy-resources.mjs';
test('reuses existing translations in namespaced i18next resources',()=>{
 const resources=createLegacyI18nextResources();
 for(const ns of ['dashboard','marketing','wishes','estate','admin']){
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
 assert.equal(calls.length,Object.keys(createLegacyI18nextResources().de).length*2);
 assert.ok(calls.every(([, , ,deep,overwrite])=>deep===true&&overwrite===false));
});

test('existing tool dialogues and runtime statuses are available for i18next',()=>{
 const resources=createLegacyI18nextResources();
 assert.equal(resources.en.tool_parking['Kein aktiver Parkschein-Timer'],'No active parking timer');
 assert.equal(resources.de.tool_parking['Kein aktiver Parkschein-Timer'],'Kein aktiver Parkschein-Timer');
 assert.equal(resources.en.account['Nicht angemeldet'],'Not signed in');
 assert.ok(Object.keys(resources.en.tool_moving_selectors).length>0);
 assert.ok(Object.keys(resources.en.tool_budget).length>0);
});

test('reviewed homepage and guide translations share the same i18next resource instance',()=>{
 const resources=createLegacyI18nextResources();
 assert.equal(resources.en.marketing['Alle Tools'],'All tools');
 assert.equal(resources.en.marketing['Diese Anleitung auf Deutsch ansehen'],'Read this guide in German');
 assert.equal(resources.de.marketing['Alle Tools'],'Alle Tools');
});

test('marketing translations only resolve explicitly catalogued keys',()=>{
 const resources=createLegacyI18nextResources();
 assert.equal(resources.en.marketing['Alle Tools'],'All tools');
 assert.equal(Object.hasOwn(resources.en.marketing,'Private user note'),false);
 assert.equal(resources.en.marketing['Parkplatz-Merker'],'Parking spot saver');
});
