import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {createSettingsSection,refreshSettingsSections} from '../../shared/toolya/settings-unify.mjs';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
test('account adapter forwards SDK operations exactly once, preserving receiver and result',async()=>{
 const methods=['signInWithPassword','signUp','signOut','resetPasswordForEmail','updateUser','getUser','getSession'];
 const calls=[],auth={};
 for(const method of methods)auth[method]=function(...args){assert.equal(this,auth);calls.push({method,args});return {data:method,error:null}};
 const subscription={data:{subscription:{unsubscribe(){}}}};
 auth.onAuthStateChange=function(fn){assert.equal(this,auth);fn('SIGNED_OUT',null);return subscription};
 const client={auth},window={supabase:{createClient:()=>client}};
 vm.runInNewContext(read('shared/toolya/supabase-client.js'),{window,setTimeout,clearTimeout,Promise,Error});
 assert.equal(window.toolyaAuth.get(),client);
 const service=window.toolyaAuth.forClient(client);
 assert.equal(service,window.toolyaAccountService);
 assert.equal(service,window.toolyaAuth.forClient(client));
 for(const method of methods){const arg={fixture:method};assert.deepEqual(await service[method](arg),{data:method,error:null});assert.equal(calls.at(-1).args[0],arg)}
 assert.equal(calls.length,methods.length);
 let event;assert.equal(service.onAuthStateChange((...args)=>event=args),subscription);assert.deepEqual(event,['SIGNED_OUT',null]);
 const error=new Error('offline');auth.signInWithPassword=()=>{throw error};await assert.rejects(service.signInWithPassword({}),e=>e===error);
});
test('shared settings sections preserve input state and custom headings across locale changes',()=>{
 const {document}=parseHTML('<html><body><main></main></body></html>');
 const host=document.querySelector('main');
 for(const kind of ['account','backup','extra','help']){const section=createSettingsSection(document,kind);host.append(section.details)}
 const account=host.querySelector('[data-settings-section="account"]');
 const input=document.createElement('input');input.value='synthetic fixture';account.querySelector('div').append(input);account.open=true;
 const help=host.querySelector('[data-settings-section="help"] summary');help.textContent='Custom title';
 refreshSettingsSections(host,'en');
 assert.equal(account.querySelector('summary').textContent,'Toolya account');
 assert.equal(account.querySelector('input'),input);assert.equal(input.value,'synthetic fixture');assert.equal(account.open,true);
 assert.equal(help.textContent,'Custom title');
 refreshSettingsSections(host,'de');assert.equal(account.querySelector('summary').textContent,'Toolya-Konto');
 assert.throws(()=>createSettingsSection(document,'unknown'));
});
test('advertised classic tools and shared account pages call the central adapter',()=>{
 const pages=['index.html','en/index.html','dashboard/account-settings.js','assets/estate-owner.js','shared/toolya/auth-page-gate.js',...['moving','housemates','plants','baking','budget','car','loans','meters','parking','pet-health'].map(x=>'tools/'+x+'/index.html')];
 for(const path of pages){assert.match(read(path),/toolyaAuth\?\.forClient\(/,path)}
 const wishes=read('tools/wishes/public-amazon.mjs');assert.match(wishes,/accessToken:async\(\)=>null/);assert.match(wishes,/window\.toolyaAccountClient/);
 assert.match(read('tools/wishes/wishlist-auth.mjs'),/toolyaAuth\?\.forClient\(/);
});
