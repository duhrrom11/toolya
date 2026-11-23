import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {parseHTML} from 'linkedom';
import auditModule from '../../scripts/i18n-quality.cjs';
import {resolveLocale,normalizeLocale} from '../../shared/toolya/i18n/locale.mjs';
import {dashboardText} from '../../shared/toolya/i18n/dashboard-copy.mjs';
import {applyDashboardPageLocale} from '../../shared/toolya/i18n/dashboard-dom.mjs';

const root=resolve(import.meta.dirname,'../..');
const {assertConfig,assertGlossary,comparePair,placeholders,catalogAnalysis,
  auditRepository,validateReport,staticCandidates}=auditModule;
const read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));

test('full route inventory covers twelve canonical apps and all 17 English marketing pages',()=>{
 const c=read('docs/i18n/quality-config.json');
 assert.equal(assertConfig(c),true);
 const tools=c.toolRoutes.map(x=>x.slug);
 assert.equal(new Set(tools).size,12);
 const runtime=read('docs/runtime-port-inventory.json');
 assert.deepEqual(tools.slice().sort(),Object.values(runtime.routes).sort());
 assert.equal(c.marketingPages.length,17);
 for(const t of c.toolRoutes)assert.ok(c.marketingPages.some(p=>p.en===t.englishGuide));
});

test('versioned glossary protects Toolya wordmark and provides DE/EN review terms',()=>{
 const g=read('docs/i18n/glossary.json');
 assert.equal(assertGlossary(g),true);
 assert.equal(g.entries.find(x=>x.de==='Toolya').en,'Toolya');
 assert.ok(g.entries.find(x=>x.de==='Datenschutz'&&x.en==='Privacy'));
 assert.throws(()=>assertGlossary({...g,entries:g.entries.map(
   x=>x.de==='Toolya'?{...x,en:'Translated brand'}:x)}),/Brand|glossary/i);
 assert.throws(()=>assertGlossary({...g,entries:[...g.entries,g.entries[0]]}),/glossary/i);
});

test('placeholder scanner detects lost, extra and renamed variables without touching source strings',()=>{
 assert.deepEqual(placeholders('Hallo {{name}}, Betrag {amount} und %s'),
   ['%s','{amount}','{{name}}']);
 assert.equal(comparePair('Hi {{name}}, {count}', 'Hello {{name}}, {count}').match,true);
 assert.equal(comparePair('Hi {{name}}','Hello {{user}}').match,false);
 assert.equal(comparePair('Summe: %s','Total: %d').match,false);
 assert.equal(comparePair('{{name}}','{{name}} {{name}}').match,false);
 assert.equal(comparePair('Simple text','Simple translated text').match,true);
});

test('catalogue checker reports missing and empty translations with an explicit hard failure',()=>{
 const fixture={de:{test:{Hallo:'Hallo','Guten Tag':'Guten Tag','Hey {name}':'Hey {name}'}},
   en:{test:{Hallo:'Hello','Guten Tag':'','Hey {name}':'Hey {person}'}}};
 const checked=catalogAnalysis(fixture);
 assert.equal(checked.namespaces[0].empty,1);
 assert.equal(checked.namespaces[0].placeholderReviews,1);
 const report={issues:checked.issues};
 const quality=validateReport(report);
 assert.equal(quality.ok,false);
 assert.ok(quality.critical.some(x=>x.kind==='empty-translation'));
 assert.ok(quality.review.some(x=>x.kind==='placeholder-review'));
 fixture.en.test={Hallo:'Hello'};
 assert.ok(catalogAnalysis(fixture).issues.some(x=>x.kind==='missing-translation'));
});

test('static audit reports every tool, all bilingual marketing pages, and review-only candidates',async()=>{
 const report=await auditRepository(root);
 assert.equal(report.tools.length,12);
 assert.equal(report.marketing.length,17);
 assert.ok(report.namespaces.length>=7);
 assert.ok(report.glossaryTerms>=20);
 assert.deepEqual(report.tools.map(x=>x.slug).sort(),
   read('docs/i18n/quality-config.json').toolRoutes.map(x=>x.slug).sort());
 assert.ok(report.marketing.every(x=>x.langs.en==='en'&&x.langs.de==='de'));
 assert.ok(report.tools.every(x=>Number.isInteger(x.selector.staticMatches)));
 assert.equal(report.validation.ok,true,
   JSON.stringify(report.validation.critical.slice(0,8)));
 assert.ok(report.interpretation.includes('NOT confirmed'));
});

test('German-looking UI text is only classified as a review candidate, never auto-translated',()=>{
 const {document}=parseHTML('<html lang="en"><body><p>Bitte anmelden</p><script>Bitte nicht zählen</script><div><span>Settings</span></div></body></html>');
 const result=staticCandidates(document);
 assert.equal(result.count,1);
 assert.equal(result.samples[0],'Bitte anmelden');
});

test('DE/EN switching is reversible, and user-authored values never become translation keys',()=>{
 assert.equal(normalizeLocale('en-GB'),'en');
 assert.equal(resolveLocale({pathname:'/en/moving-boxes/',saved:'de'}),'en');
 assert.equal(resolveLocale({pathname:'/tools/moving/',saved:'en'}),'en');
 assert.equal(dashboardText('✓ Meine Aufgaben','en'),'✓ My tasks');
 assert.equal(dashboardText('notes: Benutzerkonto ist vertraulich','en'),
   'notes: Benutzerkonto ist vertraulich');
 const {document}=parseHTML('<html lang="de"><body><h1>✓ Meine Aufgaben</h1><ul id="tasks"><li>Privater Eintrag: Speichern</li></ul><input value="Benutzernotiz" placeholder="Was möchtest du erledigen?"></body></html>');
 const input=document.querySelector('input');
 applyDashboardPageLocale(document,'en');
 assert.equal(document.querySelector('h1').textContent,'✓ My tasks');
 assert.equal(document.querySelector('#tasks li').textContent,'Privater Eintrag: Speichern');
 assert.equal(input.value,'Benutzernotiz');
 applyDashboardPageLocale(document,'de');
 assert.equal(document.querySelector('h1').textContent,'✓ Meine Aufgaben');
 assert.equal(input.getAttribute('placeholder'),'Was möchtest du erledigen?');
});
