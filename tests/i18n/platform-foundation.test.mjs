import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {readAppLocale,persistAppLocale,APP_LOCALE_KEY} from '../../shared/toolya/i18n/locale.mjs';
const source=fs.readFileSync(new URL('../../shared/toolya/supabase-client.js',import.meta.url),'utf8');
const URL='https://yheogmeaosuigyaxkwth.supabase.co';
const KEY='sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv';
function environment(config){
 const calls=[],client={auth:{}};
 const window={supabase:{createClient(...args){calls.push(args);return client}}};
 if(config)window.HELPERLEIN_SUPABASE_CONFIG=config;
 vm.runInNewContext(source,{window,setTimeout,clearTimeout,Promise,Error});
 return {window,calls,client,auth:window.toolyaAuth};
}
test('shared account factory reuses the one production client per page',()=>{
 const {auth,calls,client}=environment();
 assert.equal(auth.get(),client);
 assert.equal(auth.get(URL,KEY),client);
 assert.equal(calls.length,1);
 assert.deepEqual(calls[0],[URL,KEY]);
});
test('account factory rejects invalid projects and keys before client creation',()=>{
 const {auth,calls}=environment();
 assert.throws(()=>auth.get(URL,'service_role'),/Invalid/);
 assert.throws(()=>auth.get('https://other.supabase.co',KEY),/Invalid/);
 assert.equal(calls.length,0);
});
test('preview cannot use production credentials or switch project after initialization',()=>{
 const config={mode:'preview',url:'https://isolated-fixture.supabase.co',publishableKey:'sb_publishable_fixture'};
 const {window,auth,calls}=environment(config);
 assert.throws(()=>auth.get(URL,KEY),/Invalid/);
 auth.get();
 assert.deepEqual(calls[0],[config.url,config.publishableKey]);
 window.HELPERLEIN_SUPABASE_CONFIG={...config,url:'https://second-fixture.supabase.co'};
 assert.throws(()=>auth.get(),/project changed/);
 assert.equal(calls.length,1);
});
test('shared timeout reports unavailable instead of hanging forever',async()=>{
 const {auth}=environment();
 assert.equal(await auth.deadline(()=>42,20),42);
 await assert.rejects(auth.deadline(()=>new Promise(()=>{}),5),/timed out/);
});
test('app locale preserves explicit selection, existing storage key and unrelated URL parameters',()=>{
 const values=new Map([[APP_LOCALE_KEY,'de']]);let replaced;
 const scope={location:{search:'?lang=en&id=123',href:'https://toolya.app/tools/wishes/public.html?lang=en&id=123#profile'},localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},history:{state:{keep:1},replaceState:(state,_,url)=>replaced={state,url}}};
 assert.equal(readAppLocale(scope),'en');
 assert.equal(persistAppLocale('de',scope),'de');
 assert.equal(values.get(APP_LOCALE_KEY),'de');
 assert.deepEqual(replaced,{state:{keep:1},url:'/tools/wishes/public.html?lang=de&id=123#profile'});
 assert.throws(()=>persistAppLocale('fr',scope),/Unsupported/);
 assert.equal(readAppLocale({}),'de');
});
