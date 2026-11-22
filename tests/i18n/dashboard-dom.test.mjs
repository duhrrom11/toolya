import test from 'node:test';
import assert from 'node:assert/strict';
import {applyDashboardPageLocale} from '../../shared/toolya/i18n/dashboard-dom.mjs';

function fixture(){
 const text={nodeType:3,nodeValue:'Mein Dashboard'};
 const attrs=new Map([['aria-label','Mein Dashboard']]);
 const element={id:'',tagName:'H1',parentElement:null,childNodes:[text],
  hasAttribute:name=>attrs.has(name),getAttribute:name=>attrs.get(name),
  setAttribute:(name,value)=>attrs.set(name,value),closest:()=>null};
 const body={id:'',tagName:'BODY',parentElement:null,childNodes:[],
  querySelectorAll:()=>[element],hasAttribute:()=>false,closest:()=>null};
 element.parentElement=body;
 return {document:{body},text,attrs};
}
test('dashboard DOM uses shared translator and restores German source on switch back',()=>{
 const {document,text,attrs}=fixture();
 const translate=(value,lang)=>lang==='en'&&value==='Mein Dashboard'?'My dashboard':value;
 applyDashboardPageLocale(document,'en',translate);
 assert.equal(text.nodeValue,'My dashboard');
 assert.equal(attrs.get('aria-label'),'My dashboard');
 applyDashboardPageLocale(document,'de',translate);
 assert.equal(text.nodeValue,'Mein Dashboard');
 assert.equal(attrs.get('aria-label'),'Mein Dashboard');
});
test('dashboard DOM preserves unknown text instead of translating user data',()=>{
 const {document,text}=fixture();
 text.nodeValue='Private note';
 applyDashboardPageLocale(document,'en',(value)=>value);
 assert.equal(text.nodeValue,'Private note');
});
