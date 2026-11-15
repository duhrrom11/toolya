const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const {document}=parseHTML('<html><body><main></main></body></html>');
 global.document=document;
 const {mountConnectPanel}=await import(pathToFileURL(path.resolve('shared/toolya/connect-panel.mjs')).href);
 let revision=1,loads=0,checks=0,confirmed=false;
 const controller={
  async checkRemote(){checks++;return {changed:true,localRevision:1,remoteRevision:revision}},
  async load(){loads++}
 };
 const panel=mountConnectPanel({controller,host:document.querySelector('main'),confirmReload:()=>confirmed,onReload:()=>{}});
 const buttons=document.querySelectorAll('#toolya-connect-panel button');
 assert.equal(buttons.length,2);
 buttons[0].click();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(loads,0,'checking must never load');
 assert.equal(buttons[1].hidden,false,'explicit reload required');
 buttons[1].click();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(loads,0,'cancel must preserve view');
 confirmed=true;revision=2;
 buttons[1].click();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(loads,0,'changed remote revision must require new review');
 buttons[0].click();await new Promise(resolve=>setImmediate(resolve));
 buttons[1].click();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(loads,1,'only confirmed unchanged review may load');
 panel.dispose();
 assert.equal(document.querySelector('#toolya-connect-panel'),null);
 console.log('PASS: Connect requires review, confirmation and unchanged revision before loading');
})().catch(error=>{console.error(error);process.exitCode=1});
