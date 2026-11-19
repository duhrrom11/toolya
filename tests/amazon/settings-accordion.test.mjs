import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {unifyToolSettings} from '../../shared/toolya/settings-unify.mjs';

const css=readFileSync('shared/toolya/settings-accordion.css','utf8');
const platform=readFileSync('shared/toolya/platform.mjs','utf8');

function fixture(markup){
 const {document}=parseHTML('<html><body class="b3"><div id="settingsModal"><div class="settings-panel">'+markup+'</div></div></body></html>');
 globalThis.document=document;
 return document;
}

test('legacy account and backup controls are retained inside native, initially closed accordions',()=>{
 const doc=fixture('<div class="header"><h3>Einstellungen</h3><button id="closeSettingsBtn">×</button></div><div id="account"><h3>Mein Konto</h3><input id="loginEmail"><button id="register">Registrieren</button></div><div class="border-t"><label>Datensicherung</label><div class="b3-backup-actions"><button id="backup">Export</button></div></div><details class="toolya-appearance"><summary>Maskottchen</summary><input id="companion"></details><div class="footer"><button id="cancelSettingsBtn">Schließen</button></div>');
 const register=doc.getElementById('register'),backup=doc.getElementById('backup');
 let invoked=0;register.addEventListener('click',()=>invoked++);
 assert.equal(unifyToolSettings(doc.getElementById('settingsModal')),true);
 const modal=doc.getElementById('settingsModal'),account=modal.querySelector('[data-settings-section="account"]'),data=modal.querySelector('[data-settings-section="backup"]');
 assert.equal(account.tagName,'DETAILS');
 assert.equal(data.tagName,'DETAILS');
 assert.equal(account.hasAttribute('open'),false,'the native accordion starts collapsed');
 assert.equal(account.querySelector('#register'),register);
 assert.equal(data.querySelector('#backup'),backup);
 assert.equal(modal.querySelectorAll('details.toolya-appearance').length,1);
 register.dispatchEvent(new doc.defaultView.Event('click'));assert.equal(invoked,1,'original event listener retained');
 assert.equal(unifyToolSettings(modal),true);
 assert.equal(modal.querySelectorAll('[data-settings-section]').length,2,'idempotent conversion');
 assert.equal(doc.getElementById('closeSettingsBtn').closest('.header')!==null,true);
});

test('wishlist sections and specialty controls are classified without replacing inputs',()=>{
 const doc=fixture('<div class="wishlist-settings-heading"><button id="closeSettingsBtn">×</button></div><section class="wishlist-settings-section"><h3 id="settingsAccountTitle">Mein Konto</h3><input id="settingsEmail"></section><section class="wishlist-settings-section"><h3 id="settingsBackupTitle">Datensicherung</h3><p>Backup-Hinweis</p></section><div><h3>Ofenprofil Einstellungen</h3><input id="user-oven-factor"></div><details class="toolya-appearance"><summary>Maskottchen</summary></details>');
 const input=doc.getElementById('user-oven-factor');
 unifyToolSettings(doc.getElementById('settingsModal'));
 assert.ok(doc.querySelector('[data-settings-section="account"] #settingsEmail'));
 assert.ok(doc.querySelector('[data-settings-section="backup"] #settingsBackupTitle'));
 assert.equal(doc.querySelector('[data-settings-section="extra"] #user-oven-factor'),input);
 assert.equal(doc.querySelectorAll('details.toolya-appearance').length,1);
});

test('settings styles and shared loader provide responsive dialog layout',()=>{
 assert.match(css,/max-height:min\(88dvh,900px\)/);
 assert.match(css,/@media\(max-width:540px\)/);
 assert.match(platform,/unifyToolSettings\(modal\|\|fallbackDialog\)/);
 assert.match(platform,/settings-accordion\.css/);
});

test('legacy unlabeled settings close button remains visible outside accordion',()=>{
 const doc=fixture('<div class="flex justify-between"><h3>⚙️ Einstellungen und Konto</h3><button id="legacyClose">✕</button></div><div id="cloud-status-text">Nicht angemeldet</div><div><input id="auth-email"><button id="legacyLogin">Anmelden</button></div><button id="footerClose">Schließen</button>');
 unifyToolSettings(doc.getElementById('settingsModal'));
 assert.equal(doc.getElementById('legacyClose').closest('details'),null);
 assert.equal(doc.getElementById('legacyClose').closest('.justify-between')!==null,true);
 assert.ok(doc.querySelector('[data-settings-section="account"] #legacyLogin'));
 assert.equal(doc.getElementById('footerClose').closest('details'),null);
});
