import test from 'node:test';
import assert from 'node:assert/strict';
import {createToolyaI18nextAdapter} from '../../shared/toolya/i18n/i18next-runtime-adapter.mjs';

function fakeI18next(){
 const bundles={};
 return {
  addResourceBundle(locale,ns,entries){(bundles[locale]??={})[ns]={...(bundles[locale]?.[ns]||{}),...entries};},
  getResourceBundle(locale,ns){return bundles[locale]?.[ns];},
  t(key,options){return bundles[options.lng]?.[options.ns]?.[key]??options.defaultValue;}
 };
}
test('existing dialogue and runtime translations resolve through one i18next instance',()=>{
 const i18next=fakeI18next(),adapter=createToolyaI18nextAdapter(i18next);
 assert.equal(adapter.translateTool('parking','en','Kein aktiver Parkschein-Timer'),'No active parking timer');
 assert.equal(adapter.translateTool('parking','de','Kein aktiver Parkschein-Timer'),'Kein aktiver Parkschein-Timer');
 assert.equal(adapter.translateAccount('en','Nicht angemeldet'),'Not signed in');
 assert.equal(adapter.translateTool('parking','en','Unknown user note'),'Unknown user note');
});
test('approved prefixes preserve user data and server diagnostics exactly',()=>{
 const adapter=createToolyaI18nextAdapter(fakeI18next());
 assert.equal(adapter.translatePrefix('budget','en','✏️ Buchung bearbeiten: My € purchase'),'✏️ Edit transaction: My € purchase');
 assert.equal(adapter.translatePrefix('budget','de','✏️ Edit transaction: My € purchase'),'✏️ Buchung bearbeiten: My € purchase');
 assert.equal(adapter.translatePrefix('moving','en','Anmeldung fehlgeschlagen: Error 401'),'Sign-in failed: Error 401');
 assert.equal(adapter.translatePrefix('moving','en','User note: Anmeldung fehlgeschlagen: Error 401'),'User note: Anmeldung fehlgeschlagen: Error 401');
});
test('invalid language and unknown namespaces do not translate',()=>{
 const adapter=createToolyaI18nextAdapter(fakeI18next());
 assert.equal(adapter.translateTool('../admin','en','Nicht angemeldet'),'Nicht angemeldet');
 assert.equal(adapter.translateAccount('fr','Nicht angemeldet'),'Nicht angemeldet');
 assert.equal(adapter.translateTool('moving','en',null),null);
});
