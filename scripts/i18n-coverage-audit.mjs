#!/usr/bin/env node
/**
 * Toolya DE/EN pre-release inventory. Read-only: no network, user data or DB.
 * Heuristic text findings require human/browser verification. --strict is a
 * conservative release gate and MUST NOT pass while any page lacks EN coverage.
 */
import fs from 'node:fs';
import path from 'node:path';
import {parseHTML} from 'linkedom';
import {reviewRuntimeLiteral} from './i18n-runtime-triage.mjs';
import {attachRuntimeEvidence} from './i18n-runtime-evidence.mjs';

const root=process.cwd();
const ignored=new Set(['.git','node_modules','coverage','dist','_site']);
const files=[];
function visit(dir=''){
 for(const item of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
  if(ignored.has(item.name))continue;
  const rel=path.posix.join(dir,item.name);
  if(item.isDirectory())visit(rel);
  else if(item.isFile())files.push(rel);
 }
}
visit();
const html=files.filter(f=>f.endsWith('.html')&&!f.startsWith('tests/')).sort();
const js=files.filter(f=>/\.(?:mjs|js)$/.test(f)&&!f.startsWith('tests/')&&!f.startsWith('scripts/')&&!f.startsWith('supabase/')).sort();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const fileSet=new Set(files);
const pairs=new Map([
 ['index.html','en/index.html'],
 ['umzugskisten/index.html','en/moving-boxes/index.html'],
 ['wg-organisator/index.html','en/roommate-organizer/index.html'],
 ['pflanzenpflege/index.html','en/plant-care/index.html'],
 ['backform-rechner/index.html','en/cake-pan-calculator/index.html'],
 ['autokosten/index.html','en/vehicle-costs/index.html'],
 ['haushaltsbuch/index.html','en/household-budget/index.html'],
 ['digitaler-nachlass/index.html','en/digital-estate/index.html'],
 ['parkplatz-merker/index.html','en/parking-spot/index.html'],
 ['tiergesundheit/index.html','en/pet-health/index.html'],
 ['verliehene-dinge/index.html','en/lent-items/index.html'],
 ['zaehlerstaende/index.html','en/meter-readings/index.html'],
 ['amazon-wunschliste-veroeffentlichen/index.html','en/publish-amazon-wishlist/index.html'],
 ['toolya-dashboard/index.html','en/toolya-dashboard/index.html'],
 ['legal.html','en/legal.html'],
 ['privacy.html','en/privacy.html']
]);
const bilingualPages=new Set(['404.html','offline.html']);
const bilingualApps=new Map([['tools/moving/helper/index.html','helper-client.mjs']]);
const redirectPages=new Set(['tools/wishes/index.html']);
const supportedTools=new Set(['dashboard/index.html','admin-stats-dashboard/index.html','admin-stats-dashboard/wishlist-finder.html',
 ...['index','heirs','handover','print-key'].map(x=>'tools/estate/'+x+'.html'),

 ...['moving','housemates','plants','baking','budget','car','loans','meters','parking','pet-health'].map(name=>'tools/'+name+'/index.html'),
 ...['public','dashboard','collection','discover','feed','planner','profile','occasions','reservations','assistant','bookmarks','cockpit','gift-analytics','gift-tasks','notifications','report','social'].map(name=>'tools/wishes/'+name+'.html')
]);
const german=/\b(?:Anmelden|Abmelden|Registrieren|Passwort|Einstellungen|Speichern|Löschen|Abbrechen|Schließen|Auswählen|Zurück|Datenschutz|Impressum|Warnung|Fehlermeldung|Warenkorb|Mitglieder|Pflanzen|Kisten|Herunterladen|Wiederherstellen|Übernehmen|Benutzerkonto|Bitte|Fehler)\b/i;
const reports=[];
let germanUi=[];
function isGermanLocale(el){
 for(let a=el;a;a=a.parentElement)if(a.getAttribute?.('lang')?.toLowerCase().startsWith('de'))return true;
 return false;
}
function small(value){return String(value).replace(/\s+/g,' ').trim().slice(0,110)}
for(const f of html){
 const source=read(f);
 const {document}=parseHTML(source);
 const lang=document.documentElement?.getAttribute('lang')||'unset';
 const isEnglish=f.startsWith('en/');
 const title=small(document.title||'');
 const counterpart=isEnglish ? [...pairs].find(([,en])=>en===f)?.[0] : pairs.get(f);
 /* Each application family mounts a different reversible language presentation.
    Check the actual entrypoint instead of counting only the original tool shell. */
 const entrypoint=f.startsWith('tools/wishes/')?'wishes-entry.mjs'
  :f.startsWith('tools/estate/')?'estate-entry.mjs'
  :f.startsWith('admin-stats-dashboard/')?'admin-entry.mjs'
  :f==='dashboard/index.html'?'dashboard-entry.mjs'
  :'tool-entry.mjs';
 const appSwitch=supportedTools.has(f)&&source.includes(entrypoint);
 const bilingualApp=bilingualApps.has(f)&&source.includes(bilingualApps.get(f))&&Boolean(document.querySelector('[data-helper-locale="en"]'));
 const hasEnglishRoute=isEnglish||appSwitch||bilingualApp||bilingualPages.has(f)||redirectPages.has(f)||Boolean(counterpart&&fileSet.has(counterpart));
 const noindex=Boolean(document.querySelector('meta[name="robots"]')?.getAttribute('content')?.includes('noindex'));
 const hasENLink=Boolean(document.querySelector('[data-set-locale="en"]'));
 const hasDELink=Boolean(document.querySelector('[data-set-locale="de"]'));
 const suspects=[];
 if(isEnglish){
  for(const el of document.querySelectorAll('body *')){
   if(isGermanLocale(el)||['SCRIPT','STYLE','NOSCRIPT','SVG','TEMPLATE'].includes(el.tagName))continue;
   for(const node of el.childNodes){
    if(node.nodeType!==3)continue;
    const t=small(node.textContent);
    if(t&&german.test(t)) suspects.push(t);
   }
   for(const attr of ['title','aria-label','placeholder','alt']){
    const t=small(el.getAttribute(attr)||'');
    if(t&&german.test(t))suspects.push(attr+': '+t);
   }
  }
 }
 if(suspects.length)germanUi.push({file:f,samples:[...new Set(suspects)].slice(0,12)});
 const status=isEnglish?'EN page':appSwitch?'EN opt-in tool':bilingualApp?'DE/EN application':bilingualPages.has(f)?'Bilingual fallback':redirectPages.has(f)?'Language-preserving redirect':hasEnglishRoute?'DE page with EN pair':'NO EN COVERAGE';
 reports.push({file:f,lang,status,noindex,langLinks:hasENLink&&hasDELink,englishCopy:counterpart||null,suspects:suspects.length});
}
const localeEntrypoints=['tool-entry.mjs','wishes-entry.mjs','estate-entry.mjs','dashboard-entry.mjs','admin-entry.mjs'];
const languageEvidence=localeEntrypoints.map(file=>({file,setsDocumentLanguage:/document\.documentElement\.lang\s*=\s*lang\b/.test(read('shared/toolya/i18n/'+file))}));
const htmlLangNotSet=languageEvidence.some(item=>!item.setsDocumentLanguage);
const scriptSources=[...html,...js];
const dynamic=[];
const callPattern=/\b(?:alert|confirm|prompt|textContent|innerHTML)\s*(?:\(|=)\s*(['"`])([^\n'"\`]{4,180})\1/g;
for(const f of scriptSources){
 if(f.startsWith('en/')||f.startsWith('shared/toolya/i18n/'))continue;
 const content=read(f);
 const examples=[],sightings=[];
 let m;
 while((m=callPattern.exec(content))!==null){
  if(!german.test(m[2]))continue;
  const text=small(m[2]);
  const line=content.slice(0,m.index).split('\n').length;
  examples.push(text);
  // This is a source-only candidate. It might already be translated by an
  // exact runtime catalogue and is never treated as private user content.
  sightings.push({line,kind:m[0].slice(0,m[0].indexOf('(')>=0?m[0].indexOf('('):m[0].indexOf('=' )).trim(),
   sample:text,literal:m[2],...reviewRuntimeLiteral(f,m[2],m[0],content.slice(m.index+m[0].length,m.index+m[0].length+30))});
 }
 // Explicit bilingual branches are separate source occurrences, not catalogue guesses.
 const conditional=/\b(alert|confirm|prompt)\s*\(\s*window\.__toolyaUILocale\s*===\s*['"]en['"]\s*\?\s*(['"])([^\n'"\\]+)\2\s*:\s*(['"])([^\n'"\\]+)\4\s*(?=[,)])/g;
 for(const branch of content.matchAll(conditional)){
  if(!german.test(branch[5]))continue;
  const line=content.slice(0,branch.index).split('\n').length;
  const sample=small(branch[5]);examples.push(sample);
  sightings.push({line,kind:branch[1],sample,literal:branch[5],english:branch[3],catalogueState:'explicit-branch-runtime-unverified'});
 }
 sightings.sort((a,b)=>a.line-b.line);
 if(examples.length)dynamic.push({file:f,total:examples.length,
  samples:[...new Set(examples)].slice(0,4),sightings});
}
// Only consume the report generated in this CI job; local invocations remain conservative.
let verifiedRuntime=0;
if(process.env.CI==='true'&&process.env.GITHUB_SHA&&process.argv.includes('--with-runtime-evidence')){
 const report=JSON.parse(read('test-results/i18n-quality/ten-tool-shell-report.json'));
 verifiedRuntime=attachRuntimeEvidence(dynamic,report,read);
}
const runtimeTriage={};
for(const item of dynamic)for(const occurrence of item.sightings)runtimeTriage[occurrence.catalogueState]=(runtimeTriage[occurrence.catalogueState]||0)+1;
const absent=reports.filter(x=>x.status==='NO EN COVERAGE');
const publicEnglish=reports.filter(x=>x.status==='EN page');
const toolPartial=reports.filter(x=>x.status==='EN opt-in tool');
const groups=Object.freeze({
 main:toolPartial.filter(x=>/^tools\/(?:moving|housemates|plants|baking|budget|car|loans|meters|parking|pet-health)\//.test(x.file)).length,
 wishes:toolPartial.filter(x=>x.file.startsWith('tools/wishes/')).length,
 estate:toolPartial.filter(x=>x.file.startsWith('tools/estate/')).length,
 dashboard:toolPartial.filter(x=>x.file==='dashboard/index.html').length,
 admin:toolPartial.filter(x=>x.file.startsWith('admin-stats-dashboard/')).length
});
// Release approval is an explicit owner decision for a fixed application snapshot,
// not an assertion that every candidate has a browser test.
const approval=JSON.parse(read('docs/i18n/english-release-approval.json'));
const {execFileSync}=await import('node:child_process');
let changedSinceApproval=null;
try{changedSinceApproval=execFileSync('git',['diff','--name-only',approval.acceptedRevision,'HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim().split('\n').filter(Boolean)}catch{}
const allowedReleaseFiles=new Set([...publicEnglish.map(p=>p.file),'sitemap.xml','scripts/i18n-quality.cjs','tests/i18n/quality-browser.cjs','tests/i18n/seo-reciprocity.test.mjs','tests/i18n/home-parity.test.mjs','tests/i18n/marketing.test.mjs','tests/platform/sitemap-indexing.test.mjs','.github/workflows/i18n-quality.yml','scripts/i18n-coverage-audit.mjs','.github/workflows/international-release-gate.yml','docs/i18n/english-release-approval.json']);
const approvalCurrent=approval.ownerAcceptedTranslation===true&&Array.isArray(changedSinceApproval)&&changedSinceApproval.every(f=>allowedReleaseFiles.has(f));
const sitemap=read('sitemap.xml');
const missingEnglishSitemap=publicEnglish.filter(p=>!sitemap.includes('<loc>https://toolya.app/'+p.file.replace(/index\.html$/,'')+'</loc>'));
const technicalBlockers=Boolean(absent.length||htmlLangNotSet||publicEnglish.some(p=>p.noindex)||germanUi.length||missingEnglishSitemap.length||!approvalCurrent);
const blockers=[
 `${absent.length} HTML pages without an English counterpart or a supported EN switch`,
 `${toolPartial.length} language-switch application views; owner acceptance recorded: ${approvalCurrent}`,
 htmlLangNotSet?'At least one application entrypoint lacks a document language assignment':'All five entrypoints assign document language; browser verification remains required',
 `${publicEnglish.filter(x=>x.noindex).length} of ${publicEnglish.length} English public pages have noindex`,
 `${germanUi.reduce((n,x)=>n+x.samples.length,0)} sampled suspicious German texts in English HTML (some may be intended)`,
 `${dynamic.length} source files with German dialog or DOM message literals (review runtime coverage)`
];
const rows=reports.map(x=>'| `'+x.file+'` | '+x.lang+' | '+x.status+' | '+(x.langLinks?'yes':'no')+' | '+(x.noindex?'yes':'no')+' | '+x.suspects+' |');
const output=[
 '# Toolya DE/EN – automatic coverage audit',
 '',
 'This is a source-wide inventory, **not** a certificate of full translation. Runtime text and auth/export flows still require isolated browser checks. User records, mascot preferences and back-end data are not touched.',
 '',
 `Source files checked: **${html.length} HTML pages** and **${js.length} JS/MJS files** (+ inline scripts within HTML).`,
 `English public pages: **${publicEnglish.length}**. Opt-in tool pages: **${toolPartial.length}** (main: ${groups.main}, wishes: ${groups.wishes}, estate: ${groups.estate}, dashboard: ${groups.dashboard}, admin: ${groups.admin}). HTML pages without EN coverage: **${absent.length}**.`,
 '',
 '## Release blockers',
 ...blockers.map(v=>'- '+v),
 '',
 '## Each HTML page',
 '| Page | HTML lang | EN coverage | DE+EN links | noindex | suspect EN texts |',
 '|---|---|---|---|---|---|',
 ...rows,
 '',
 '## English pages: German-language text candidates',
 ...(germanUi.length?germanUi.flatMap(x=>['### '+x.file,...x.samples.map(v=>'- '+v)]):['No German markers detected by dictionary (not proof of completeness).']),
 '',
 '## German message/dialog candidates in application source',
 ...(dynamic.length?dynamic.flatMap(x=>['### '+x.file+` (${x.total} matched occurrences)`,...x.samples.map(v=>'- '+v)]):['None detected by heuristic (not proof of completeness).']),
 '',
 '## Runtime catalogue triage (source evidence only)',
 ...Object.entries(runtimeTriage).map(([state,count])=>'- '+state+': '+count+' occurrences'),
 'Catalogue matches do not prove that the corresponding UI node invokes the translator. Unmatched or composite literals require source review; do not infer private data from a text match.',
 '',
 '## Mandatory manual acceptance before release',
 '- Every page and nested application state has correct English and German text, including alerts, confirmation, validation, loading, errors, account and password recovery.',
 '- No user-entered strings, identifiers, storage values, formulas or auth rules translated.',
 '- Real browser EN/DE journeys for all tools, mobile/320px, keyboard and screen reader, plus PDF/QR/CSV/print/backup.',
 '- Canonical and reciprocal hreflang, sitemap, OG, JSON-LD and removal of public EN noindex only at release readiness.',
 '- Latest CI green, current main changes safely reconciled, and both live languages checked after rollout.',
 '',
];
// Machine-readable triage: view and source candidates are tasks to verify,
 // NOT a measure of actual translated runtime strings or release readiness.
const classify=file=>file.startsWith('tools/wishes/')?'Wishes'
 :file.startsWith('tools/estate/')?'Estate'
 :file.startsWith('tools/moving/')||file.startsWith('tools/housemates/')||file.startsWith('tools/loans/')?'Organisation'
 :file.startsWith('tools/plants/')||file.startsWith('tools/baking/')||file.startsWith('tools/budget/')?'Household'
 :file.startsWith('tools/car/')||file.startsWith('tools/parking/')||file.startsWith('tools/meters/')?'Vehicles and meters'
 :file.startsWith('tools/pet-health/')?'Pet health'
 :file.includes('dashboard')||file.includes('account')||file.startsWith('index.html')?'Platform and auth'
 :'Shared or secondary';
const priority=(file,kind)=>file.includes('estate')||file.includes('auth')||file.includes('account')||
 file.includes('backup')||file.startsWith('admin-')?'high':
 kind==='app-view'?'high':'review';
const viewTasks=toolPartial.map(item=>({file:item.file,category:classify(item.file),
 priority:priority(item.file,'app-view'),kind:'app-view',
 state:approvalCurrent?'owner accepted; automated coverage remains scoped':'partially localized; authenticated/dynamic E2E review required',
 requiredChecks:['DE to EN','EN to DE','draft input retention','dynamic alerts and dialogs',
  'auth and cloud isolation','320/375/768 mobile','keyboard/accessible labels',
  'PDF/QR/CSV/backup when present']}));
const runtimeTasks=dynamic.map(item=>({file:item.file,category:classify(item.file),
 priority:priority(item.file,'runtime'),kind:'runtime-review',
 state:'German literal heuristic only; check runtime catalogue and usage before editing',
 count:item.total,occurrences:item.sightings}));
const auditJSON={
 schemaVersion:1,
 head:process.env.GITHUB_SHA||null,
 interpretation:'Review candidates, not proven untranslated UI or translation completeness.',
 totals:{htmlPages:html.length,jsFiles:js.length,englishPages:publicEnglish.length,
  incompleteAppViews:approvalCurrent?0:toolPartial.length,
  ownerAcceptedAppViews:approvalCurrent?toolPartial.length:0,dynamicCandidateFiles:dynamic.length,
  incompleteEnglishIndexing:publicEnglish.filter(x=>x.noindex).length,
  publicGermanCandidates:germanUi.length,missingRoutes:absent.length},
 releaseReady:!technicalBlockers,
 ownerApproval:{...approval,current:approvalCurrent},
 missingEnglishSitemap:missingEnglishSitemap.map(p=>p.file),
 languageEvidence,
 runtimeTriage,
 verifiedRuntime,
 blockers,
 viewTasks,runtimeTasks,
 seoGate:{noindexRetained:publicEnglish.some(p=>p.noindex),englishPagesAwaitingIndexApproval:publicEnglish.filter(x=>x.noindex).map(x=>x.file)}
};
fs.writeFileSync('i18n-coverage-report.json',JSON.stringify(auditJSON,null,2)+'\n');
output.push('## Machine-readable review queue','',
 'See i18n-coverage-report.json for each unfinished view, source file, priority and line-numbered literal candidate.',
 'An automatically found German literal is **not** proof that the user currently sees an untranslated text.');
fs.writeFileSync('i18n-coverage-report.md',output.join('\n')+'\n');
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,output.slice(0,21).join('\n')+'\n');
console.log('I18N PAGE AUDIT: '+JSON.stringify({html:html.length,js:js.length,english:publicEnglish.length,partialTools:toolPartial.length,missingPages:absent.length,englishNoindex:publicEnglish.filter(x=>x.noindex).length,partialGroups:groups,germanUiCandidates:germanUi.length,germanMessageFiles:dynamic.length,htmlLangNotSet}));
console.log('RUNTIME CATALOGUE TRIAGE: '+JSON.stringify(runtimeTriage));
console.log('Release blockers:\n'+blockers.map(b=>' - '+b).join('\n'));
console.log('Report: i18n-coverage-report.md');
if(process.argv.includes('--strict') && technicalBlockers){
 console.error('RELEASE GATE FAILED: DE/EN completeness is not verified.');
 process.exitCode=1;
}
