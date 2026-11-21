import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const readTool = name => readFile(new URL('../../tools/' + name + '/index.html', import.meta.url), 'utf8');

for (const name of ['parking', 'loans']) {
 test(name + ': bilingual register/login/logout without production backend', async () => {
  const html = await readTool(name);
  const start = html.indexOf('async function supabaseRegister()');
  const end = html.indexOf('async function checkUserSession()', start);
  assert.ok(start >= 0 && end > start, 'auth functions found');
  const alerts = [], calls = [];
  const fields = { 'auth-email': {value: ''}, 'auth-password': {value: ''} };
  const window = {__toolyaUILocale:'en'};
  const auth = {
   async signUp(values){calls.push(['register',values]);return {error:null}},
   async signInWithPassword(values){calls.push(['login',values]);return {error:null}},
   async signOut(){calls.push(['logout']);return {error:null}}
  };
  const context = {
   window, document:{getElementById:id=>fields[id]}, supabaseClient:{auth},
   alert:value=>alerts.push(value),checkUserSession:()=>calls.push(['refresh']),
   toggleSettingsModal:()=>calls.push(['close'])
  };
  runInNewContext(html.slice(start,end),context);
  const invoke = name => runInNewContext(name + '()',context);
  await invoke('supabaseRegister');
  await invoke('supabaseLogin');
  assert.deepEqual(alerts,['Please enter your email and password.','Please enter your email and password.']);
  assert.equal(calls.length,0);
  window.__toolyaUILocale='de';
  await invoke('supabaseRegister');
  assert.equal(alerts.at(-1),'Bitte E-Mail und Passwort eingeben.');
  fields['auth-email'].value='fake@example.invalid';
  fields['auth-password'].value='fake-password';
  window.__toolyaUILocale='en';
  await invoke('supabaseRegister');
  await invoke('supabaseLogin');
  await invoke('supabaseLogout');
  assert.deepEqual(alerts.slice(-3),['Registration successful!','Signed in successfully!','Signed out.']);
  assert.deepEqual(calls.map(x=>x[0]),['register','refresh','login','refresh','close','logout','refresh']);
  assert.equal(calls[0][1].email,'fake@example.invalid');
  assert.equal(calls[0][1].password,'fake-password');
 });
}

for (const name of ['plants','baking','moving']) {
 test(name + ': guarded auth messages retain original DE and offer EN',async()=>{
  const html=await readTool(name);
  for(const text of ['Please enter your email and password.','Registration failed: ','Sign-in failed: ','Sign-out failed: ','Signed in. Your account is ready.','Request processed. If confirmation is required']) {
   assert.ok(html.includes(text),name+' missing '+text);
  }
  for(const text of ['Bitte E-Mail und Passwort eingeben.','Registrierung fehlgeschlagen: ','Anmeldung fehlgeschlagen: ','Abmeldung fehlgeschlagen: ']) {
   assert.ok(html.includes(text),name+' DE changed '+text);
  }
  assert.ok(html.includes('window.__toolyaUILocale'),name+' missing locale switch');
 });
}

for (const name of ['parking','loans']) {
 test(name + ': session states distinguish signed out from unavailable auth and clear stale identity',async()=>{
  const html=await readTool(name);
  const start=html.indexOf('async function checkUserSession()');
  const end=html.indexOf('\n        }',start)+10;
  assert.ok(start>=0 && end>start);
  const elements=Object.fromEntries(['cloud-status-text','cloud-user-display','header-user-badge','header-user-email','btn-logout'].map(id=>[id,{
   innerText:'stale@example.invalid',classList:{add(){},remove(){}}
  }]));
  let response={data:{user:{email:'person@example.invalid'}}};
  const window={__toolyaUILocale:'en'};
  const context={window,document:{getElementById:id=>elements[id]},
   supabaseClient:{auth:{getUser:async()=>{if(response instanceof Error)throw response;return response}}}};
  runInNewContext(html.slice(start,end),context);
  const invoke=()=>runInNewContext('checkUserSession()',context);
  await invoke();
  assert.equal(elements['cloud-status-text'].innerText,'Status: Connected and signed in');
  assert.equal(elements['cloud-user-display'].innerText,'person@example.invalid');
  response={data:{user:null},error:null};
  await invoke();
  assert.equal(elements['cloud-status-text'].innerText,'Not signed in');
  assert.equal(elements['cloud-user-display'].innerText,'');
  assert.equal(elements['header-user-email'].innerText,'');
  response=new Error('network unavailable');
  await invoke();
  assert.equal(elements['cloud-status-text'].innerText,'Status: Unable to verify connection or session');
  window.__toolyaUILocale='de';
  await invoke();
  assert.equal(elements['cloud-status-text'].innerText,'Status: Verbindung oder Sitzung nicht überprüfbar');
  response={data:{user:null},error:{name:'AuthSessionMissingError'}};
  await invoke();
  assert.equal(elements['cloud-status-text'].innerText,'Nicht angemeldet');
 });
}

test('moving: registration and session refresh keep the active language and latest identity', async () => {
 const html = await readTool('moving');
 const start = html.indexOf('async function registerUser()');
 const end = html.indexOf('function openSettings()', start);
 assert.ok(start >= 0 && end > start);
 const fields = {
  loginEmail: {value:'person@example.invalid'}, loginPassword: {value:'synthetic-password'},
  userInfo: {textContent:''}, cloudStatus: {textContent:''}
 };
 const alerts = [];
 const pending = [];
 const window = {__toolyaUILocale:'en', supabaseClient:{auth:{
  async signUp(){return {data:{session:null},error:null}},
  getUser(){return new Promise(resolve=>pending.push(resolve))}
 }}};
 const context = {window, document:{getElementById:id=>fields[id]}, alert:value=>alerts.push(value), closeSettings(){}};
 runInNewContext(html.slice(start,end),context);
 await runInNewContext('registerUser()',context);
 assert.match(alerts.at(-1),/^Request processed\. If confirmation is required/);
 const latestRefresh = runInNewContext('updateUserDisplay()',context);
 assert.equal(pending.length,2);
 pending[1]({data:{user:null},error:{name:'AuthSessionMissingError'}});
 await latestRefresh;
 assert.equal(fields.userInfo.textContent,'Nicht angemeldet');
 pending[0]({data:{user:{email:'old-account@example.invalid'}},error:null});
 await Promise.resolve();
 assert.equal(fields.userInfo.textContent,'Nicht angemeldet');
 assert.equal(fields.cloudStatus.textContent,'Nicht angemeldet');
});
