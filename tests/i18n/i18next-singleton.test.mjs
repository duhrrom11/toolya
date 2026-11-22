import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeToolyaI18next} from '../../shared/toolya/i18n/i18next-singleton.mjs';

test('one i18next instance initialized once and receives existing tool resources',()=>{
 const bundles=new Map();
 const instance={isInitialized:false,initCalls:0,registrationCalls:0,
  init(options){this.initCalls++;this.options=options;this.isInitialized=true;return Promise.resolve(this);},
  addResourceBundle(lang,ns,data){this.registrationCalls++;bundles.set(lang+':'+ns,data);}
 };
 assert.equal(initializeToolyaI18next(instance),instance);
 assert.equal(initializeToolyaI18next(instance),instance);
 assert.equal(instance.initCalls,1);
 const registrationCount=instance.registrationCalls;
 assert.ok(registrationCount>0);
 assert.equal(initializeToolyaI18next(instance),instance);
 assert.equal(instance.registrationCalls,registrationCount,'catalogues must not be re-registered');
 assert.equal(instance.options.keySeparator,false);
 assert.equal(bundles.get('en:tool_parking')['Kein aktiver Parkschein-Timer'],'No active parking timer');
});
test('missing CDN i18next fails closed and leaves legacy fallback available',()=>{
 assert.equal(initializeToolyaI18next(undefined),null);
 assert.equal(initializeToolyaI18next({}),null);
});

test('already initialized runtime without resource API fails closed',()=>{
 assert.equal(initializeToolyaI18next({isInitialized:true,init(){}}),null);
});
