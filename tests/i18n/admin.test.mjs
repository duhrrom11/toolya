import test from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';import {adminText} from '../../shared/toolya/i18n/admin-copy.mjs';import {applyAdminLocale} from '../../shared/toolya/i18n/admin-dom.mjs';
test('admin label translations do not touch private data, roles or action handlers',()=>{
 const {document}=parseHTML('<html><body><h1>Wunschlisten-Finder</h1><button onclick="publish()">Aktualisieren</button><input value="secret-api-key"><div id="summary"><h2>Neue Funde</h2></div></body></html>');
 const b=document.querySelector('button'),key=document.querySelector('input');applyAdminLocale(document,'en');
 assert.equal(document.querySelector('h1').textContent,'Wish-list finder');assert.equal(b.textContent,'Refresh');
 assert.equal(b.getAttribute('onclick'),'publish()');assert.equal(key.value,'secret-api-key');
 assert.equal(document.querySelector('#summary h2').textContent,'Neue Funde');
 applyAdminLocale(document,'de');assert.equal(b.textContent,'Aktualisieren');
});
test('admin implicit option values retain German keys during English display',()=>{const {document}=parseHTML('<html><body><select><option>Neue Funde</option></select></body></html>');const opt=document.querySelector('option');applyAdminLocale(document,'en');assert.equal(opt.getAttribute('value'),'Neue Funde');assert.equal(opt.textContent,'New findings');applyAdminLocale(document,'de');assert.equal(opt.hasAttribute('value'),false);});

test('admin index status and wish-list discovery notices remain reversible',()=>{
 const pairs=[["Alle Indexierungsanträge wurden am 17.11.2026 vom Betreiber für Google und Bing als gestellt gemeldet. Ein Antrag ist keine bestätigte Indexierung. Die vorhandenen Suchanalyse-APIs liefern Klicks und Impressionen, aber keinen verlässlichen Indexierungsstatus je URL.","The operator reported submitting all indexing requests to Google and Bing on 17 November 2026. A request does not confirm indexing. The available search analytics APIs report clicks and impressions, but do not provide reliable indexing status for each URL."],["Indexierung bestätigt","Indexing confirmed"],["„Nicht verifiziert“ bedeutet, dass keine bestätigenden URL-Inspektionsdaten vorliegen, nicht dass die Seite ausgeschlossen wurde.","“Not verified” means no confirming URL inspection data is available, not that the page has been excluded."],["Google URL-Prüfung","Google URL inspection"],["Bing URL-Prüfung","Bing URL inspection"],["Deutschsprachige und internationale Webseiten: zusätzlich englische, französische, spanische, italienische und weitere Suchbegriffe. Gesucht wird außerhalb Amazons. Bereits geprüfte Quellseiten werden übersprungen; gleiche Listen werden nur einmal erfasst.","German-language and international websites: searches also use English, French, Spanish, Italian and other search terms. Searches run outside Amazon. Previously checked source pages are skipped, and duplicate lists are recorded only once."],["API-Schlüssel","API key"],["Tavily-Konto öffnen ↗","Open Tavily account ↗"],["Datei auswählen","Choose file"],["So gelangen Funde auf die öffentliche Wunschlisten-Seite:","How findings appear on the public wish-list page:"],["Automatische Suche stoppen, bei den neuen Einträgen die Kästchen markieren (oder „Alle neuen dieser Seite auswählen“ klicken), danach „Auswahl öffentlich importieren“ drücken. Der Status wechselt anschließend auf „Veröffentlicht“. Die Listen erscheinen unter","Stop the automatic search, select the checkboxes next to new findings (or choose “Select all new on this page”), then click “Import selection publicly”. Their status changes to “Published”. The lists will appear at"],["Namen können aus Quellseiten übernommen werden und müssen geprüft werden. Statt Logos nutzt Toolya das Website-Favicon; fehlt es, erscheint das in den Einstellungen ausgewählte Toolya-Maskottchen. Prüfe die Quelle und die öffentliche Erreichbarkeit der Amazon-Liste vor der Veröffentlichung. Alle Amazon-Links erhalten","Names may be imported from source pages and must be checked. Toolya uses the site's favicon rather than its logo; if no favicon is available, the Toolya mascot selected in settings is shown. Check the source and public accessibility of the Amazon list before publishing. All Amazon links receive"],["Öffentliche Wunschlisten ansehen ↗","View public wish lists ↗"]];
 for(const [de,en] of pairs){assert.equal(adminText(de,'en'),en);assert.equal(adminText(en,'de'),de)}
 const {document}=parseHTML('<html><body><main><a href="/tools/wishes/">Öffentliche Wunschlisten ansehen ↗</a><p>Indexierung bestätigt</p><input value="private-key"></main></body></html>');
 applyAdminLocale(document,'en');
 assert.equal(document.querySelector('main a').textContent,'View public wish lists ↗');
 assert.equal(document.querySelector('main p').textContent,'Indexing confirmed');
 assert.equal(document.querySelector('input').value,'private-key');
 applyAdminLocale(document,'de');assert.equal(document.querySelector('main a').textContent,'Öffentliche Wunschlisten ansehen ↗');
});


test('dynamic finder controls translate without translating imported names, account data or stored keys',()=>{
 const {document}=parseHTML('<html lang="de"><body><main><section id="rows">'+
  '<article><h3>Veröffentlicht</h3><p>Neue Funde</p>'+
  '<button id="hide" data-admin-copy onclick="doNotCall()">Ausblenden</button>'+
  '<button id="withdraw" data-admin-copy>Veröffentlichung zurücknehmen</button>'+
  '<label data-admin-copy>Land (freiwillig)<input id="country" value="Meine private Stadt"></label>'+
  '<input id="choose" data-admin-aria-prefix="Auswählen:" aria-label="Auswählen: Veröffentlicht" value="private-record-001">'+
  '<button id="restore" data-admin-copy data-admin-aria-prefix="Fund wieder anzeigen:" aria-label="Fund wieder anzeigen: Veröffentlicht">Wieder anzeigen</button>'+
  '</article></section><section id="healthReview">'+
  '<h3 data-admin-copy>Manuell zu prüfende Links (HTTP 404/410)</h3>'+
  '<a href="/profile/example">Veröffentlicht</a></section></main></body></html>');
 const imported=document.querySelector('#rows h3'),raw=document.querySelector('#rows p');
 const choose=document.querySelector('#choose'),country=document.querySelector('#country');
 const hide=document.querySelector('#hide'),restore=document.querySelector('#restore');
 applyAdminLocale(document,'en');
 assert.equal(imported.textContent,'Veröffentlicht','private matching name must remain German');
 assert.equal(raw.textContent,'Neue Funde','unmarked imported text must stay untouched');
 assert.equal(document.querySelector('#healthReview a').textContent,'Veröffentlicht');
 assert.equal(hide.textContent,'Hide');
 assert.equal(hide.getAttribute('onclick'),'doNotCall()');
 assert.equal(document.querySelector('#withdraw').textContent,'Withdraw publication');
 assert.equal(document.querySelector('label').firstChild.textContent,'Country (optional)');
 assert.equal(country.value,'Meine private Stadt');
 assert.equal(choose.getAttribute('aria-label'),'Select: Veröffentlicht');
 assert.equal(restore.getAttribute('aria-label'),'Show finding again: Veröffentlicht');
 assert.equal(restore.textContent,'Show again');
 assert.equal(choose.value,'private-record-001');
 assert.equal(document.querySelector('#healthReview h3').textContent,
  'Links requiring manual review (HTTP 404/410)');
 applyAdminLocale(document,'de');
 assert.equal(hide.textContent,'Ausblenden');
 assert.equal(choose.getAttribute('aria-label'),'Auswählen: Veröffentlicht');
 assert.equal(restore.getAttribute('aria-label'),'Fund wieder anzeigen: Veröffentlicht');
 assert.equal(country.value,'Meine private Stadt');
 assert.equal(choose.value,'private-record-001');
 assert.equal(imported.textContent,'Veröffentlicht');
});

test('admin finder marks only author-owned content; publishing and account controls are unchanged',async()=>{
 const {readFileSync}=await import('node:fs');
 const source=readFileSync(new URL('../../admin-stats-dashboard/wishlist-finder.mjs',import.meta.url),'utf8');
 assert.match(source,/function elUI\(tag,label\)/);
 assert.match(source,/applyAdminLocale\(document,currentAdminLocale\(\)\)/);
 assert.match(source,/info\.append\(el\('h3',r\.name\),Object\.hasOwn\(labels,r\.status\)/);
 assert.match(source,/sourceFavicon\(r\.source_url\)/);
 assert.match(source,/await api\('publish'/);
 assert.match(source,/await api\('withdraw'/);
});
