import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {dashboardText} from '../../shared/toolya/i18n/dashboard-copy.mjs';

const source=await readFile(new URL('../../dashboard/account-settings.js',import.meta.url),'utf8');

function isolatedAccount({updateError=null,signOutError=null,updateGate=null}={}){
 const elements=new Map();
 const node=id=>{
  if(!elements.has(id))elements.set(id,{
   value:'',hidden:false,textContent:'',open:false,
   classList:{toggle(){},add(){},remove(){}},
   addEventListener(){},setAttribute(){},focus(){},close(){},showModal(){},
   querySelector(){return {focus(){}}}
  });
  return elements.get(id);
 };
 const calls=[];
 const timers=new Map();
 let nextTimer=0,authListener;
 const auth={
  onAuthStateChange(listener){authListener=listener},
  getUser(){return new Promise(()=>{})}, // no live account or network
  async updateUser(payload){calls.push(['update',payload]);if(updateGate)await updateGate;return {error:updateError}},
  async signOut(){calls.push(['signOut']);return {error:signOutError}}
 };
 const context={
  document:{getElementById:node,body:{classList:{add(){},remove(){}}}},
  window:{supabase:{createClient:()=>({auth})}},
  location:{search:'',pathname:'/dashboard/',hash:''},
  history:{replaceState(){}},URLSearchParams,
  setTimeout(fn,ms){const id=++nextTimer;timers.set(id,{fn,ms});return id},
  clearTimeout(id){timers.delete(id)}
 };
 const instrumented=source.replace(/\}\)\(\);\s*$/, 'globalThis.__testSaveRecovery=()=>{recoveryActive=true;return saveRecovery()};})();');
 assert.notEqual(instrumented,source,'test entrypoint injected into isolated account closure');
 runInNewContext(instrumented,context,{filename:'dashboard/account-settings.js'});
 node('recoveryPassword').value='new-valid-password';
 node('recoveryPasswordConfirm').value='new-valid-password';
 return {
  node,calls,
  emitAuth(event,session){authListener(event,session)},
  runTimers(ms){for(const [id,timer] of [...timers])if(timer.ms===ms&&timers.delete(id))timer.fn()},
  async save(){await context.__testSaveRecovery()}
 };
}

test('recovery failure never clears credentials or starts a logout',async()=>{
 const fixture=isolatedAccount({updateError:{message:'synthetic error'}});
 await fixture.save();
 assert.equal(fixture.node('loginMessage').textContent,'Passwort konnte nicht geändert werden. Bitte fordere einen neuen Link an.');
 assert.deepEqual(fixture.calls.map(([name])=>name),['update']);
 assert.equal(fixture.node('recoveryPassword').value,'new-valid-password');
 assert.equal(fixture.node('passwordRecoveryPanel').hidden,false);
});

test('password update success plus logout failure reports truthful state',async()=>{
 const fixture=isolatedAccount({signOutError:{message:'synthetic sign-out error'}});
 await fixture.save();
 assert.deepEqual(fixture.calls.map(([name])=>name),['update','signOut']);
 assert.equal(fixture.node('recoveryPassword').value,'');
 assert.equal(fixture.node('recoveryPasswordConfirm').value,'');
 assert.equal(fixture.node('passwordRecoveryPanel').hidden,true);
 const german=fixture.node('loginMessage').textContent;
 assert.equal(german,'Passwort geändert, aber Abmelden fehlgeschlagen. Bitte melde dich manuell ab.');
 assert.equal(dashboardText(german,'en'),'Password changed, but signing out failed. Please sign out manually.');
 assert.equal(dashboardText(dashboardText(german,'en'),'de'),german);
});

test('successful recovery signs out after update and retains central token-only flow',async()=>{
 const fixture=isolatedAccount();
 await fixture.save();
 assert.deepEqual(fixture.calls.map(([name])=>name),['update','signOut']);
 assert.equal(fixture.node('loginMessage').textContent,'Passwort geändert. Bitte erneut anmelden.');
 const home=await readFile(new URL('../../index.html',import.meta.url),'utf8');
 assert.match(home,/auth\.resetPasswordForEmail\(email,/);
 assert.match(home,/auth\.updateUser\(\{ password: newPassword \}\)/);
 assert.match(home,/Passwort geändert, aber Abmelden fehlgeschlagen/);
 assert.match(home,/if \(error\) throw error;\s*updateUserDisplay\(\)/);
 assert.equal(dashboardText('user@example.org','en'),'user@example.org');
});

test('concurrent recovery submissions update password only once',async()=>{
 let release;
 const gate=new Promise(resolve=>{release=resolve});
 const fixture=isolatedAccount({updateGate:gate});
 const first=fixture.save();
 const second=fixture.save();
 assert.deepEqual(fixture.calls.map(([name])=>name),['update']);
 release();
 await Promise.all([first,second]);
 assert.deepEqual(fixture.calls.map(([name])=>name),['update','signOut']);
 assert.equal(fixture.node('loginMessage').textContent,'Passwort geändert. Bitte erneut anmelden.');
});


test('account initialization timeout reveals sign-in without claiming a verified session',()=>{
 const fixture=isolatedAccount();
 fixture.runTimers(10000);
 assert.equal(fixture.node('userInfo').textContent,'Status unklar');
 assert.equal(fixture.node('signedOutControls').hidden,false);
 assert.equal(fixture.node('logoutUser').hidden,true);
 fixture.emitAuth('INITIAL_SESSION',null);
 assert.equal(fixture.node('userInfo').textContent,'Nicht angemeldet');
});

test('a missing initial session cancels the startup timeout',()=>{
 const fixture=isolatedAccount();
 fixture.emitAuth('INITIAL_SESSION',null);
 fixture.runTimers(10000);
 assert.equal(fixture.node('userInfo').textContent,'Nicht angemeldet');
});

test('an unresponsive token verification times out without authorizing the user',async()=>{
 const fixture=isolatedAccount();
 fixture.emitAuth('INITIAL_SESSION',{access_token:'synthetic-token'});
 fixture.runTimers(0);
 await Promise.resolve();
 fixture.runTimers(10000);
 // Flush the promise chain, not the real network.
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(fixture.node('userInfo').textContent,'Status unklar');
 assert.equal(fixture.node('signedOutControls').hidden,false);
 assert.equal(fixture.node('logoutUser').hidden,true);
});
