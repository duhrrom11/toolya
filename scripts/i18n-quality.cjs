#!/usr/bin/env node
'use strict';
// Static read-only DE/EN inventory. No cloud, user data, or runtime writes.
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {parseHTML}=require('linkedom');
const ROOT=path.resolve(__dirname,'..');
const QUALITY_DIR='test-results/i18n-quality';
const germanPattern=/\b(?:Bitte|Speichern|Abbrechen|Zurück|Weiter|Öffnen|Schließen|Verwalten|Anmelden|Abmelden|Einstellungen|Löschen|Hinzufügen|Bearbeiten|Wunschliste|Deine|Meine|Konto|Erinnerungen|Übersicht|Datenschutz|Impressum|Umzugskisten|Pflanzenpflege|Haushaltsbuch)\b|[ÄÖÜäöüß]/;

function readJSON(root,p){return JSON.parse(fs.readFileSync(path.join(root,p),'utf8'))}
function assertConfig(c){
 if(!c||c.schemaVersion!==1||c.sourceLocale!=='de'||c.targetLocale!=='en'||
   !Array.isArray(c.toolRoutes)||c.toolRoutes.length!==12||
   !Array.isArray(c.marketingPages)||c.marketingPages.length!==16)throw Error('Invalid DE/EN route inventory');
 const tools=new Set(),pages=new Set();
 for(const item of c.toolRoutes){
  if(!item||typeof item.slug!=='string'||!/^[a-z][a-z-]*$/.test(item.slug)||
     tools.has(item.slug)||item.html!==('tools/'+item.slug+'/'+(item.slug==='wishes'?'public.html':'index.html'))||
     !/^en\/[a-z-]+\/index\.html$/.test(item.englishGuide))throw Error('Bad tool inventory route');
  tools.add(item.slug);
 }
 for(const item of c.marketingPages){
  if(!item||typeof item.key!=='string'||pages.has(item.en)||
     !/^en\/(?:[a-z-]+\/)?(?:index|privacy|legal)\.html$/.test(item.en)||
     !/^(?:[a-z-]+\/)?(?:index|privacy|legal)\.html$/.test(item.de))throw Error('Bad marketing page pair');
  pages.add(item.en);
 }
 for(const t of c.toolRoutes)if(!pages.has(t.englishGuide))throw Error('Tool missing English guide: '+t.slug);
 return true;
}
function assertGlossary(g){
 if(!g||g.schemaVersion!==1||g.sourceLocale!=='de'||g.targetLocale!=='en'||
    !Array.isArray(g.entries)||g.entries.length<15||!g.protectedTokens?.includes('Toolya'))throw Error('Invalid glossary');
 const seen=new Set();
 for(const row of g.entries){
  if(!row||typeof row.de!=='string'||typeof row.en!=='string'||!row.de.trim()||!row.en.trim()||
     !['brand','preferred','contextual'].includes(row.rule)||!row.context?.trim()||seen.has(row.de)||
     (row.rule==='brand'&&row.de!==row.en))throw Error('Bad glossary term');
  seen.add(row.de);
 }
 return true;
}
function placeholders(str){
 if(typeof str!=='string')return [];
 return [...str.matchAll(/\{\{\s*[a-z][a-z0-9_.-]*\s*\}\}|\$\{\s*[a-z][a-z0-9_.-]*\s*\}|\{[a-z][a-z0-9_.-]*\}|%(?:\d+\$)?[sdif]/gi)]
   .map(m=>m[0].replace(/\s+/g,'')).sort();
}
function comparePair(de,en){
 const source=placeholders(de),target=placeholders(en);
 return {match:JSON.stringify(source)===JSON.stringify(target),source,target};
}
function catalogAnalysis(resources){
 const namespaces=[],issues=[],de=resources?.de||{},en=resources?.en||{};
 for(const ns of [...new Set([...Object.keys(de),...Object.keys(en)])].sort()){
  if(ns.endsWith('_selectors'))continue; // Source selector metadata is English-only.
  const source=de[ns]||{},target=en[ns]||{};
  let missing=0,empty=0,placeholderReviews=0;
  for(const [key,value] of Object.entries(source)){
   if(!Object.hasOwn(target,key)){missing++;issues.push({kind:'missing-translation',namespace:ns,key});continue;}
   if(typeof target[key]!=='string'||!target[key].trim()){empty++;issues.push({kind:'empty-translation',namespace:ns,key});continue;}
   if(!comparePair(key,target[key]).match){
     placeholderReviews++;
     issues.push({kind:'placeholder-review',namespace:ns,key,source:placeholders(key),target:placeholders(target[key])});
   }
  }
  for(const key of Object.keys(target))if(!Object.hasOwn(source,key))
    issues.push({kind:'orphan-translation',namespace:ns,key});
  namespaces.push({namespace:ns,sourceKeys:Object.keys(source).length,targetKeys:Object.keys(target).length,
    missing,empty,placeholderReviews});
 }
 return {namespaces,issues};
}
function staticCandidates(doc,limit=10){
 const samples=[],seen=new Set();let count=0;
 for(const el of doc.querySelectorAll('body *')){
  if(['SCRIPT','STYLE','NOSCRIPT','SVG','TEMPLATE','TEXTAREA','PRE','CODE'].includes(el.tagName?.toUpperCase()))continue;
  for(const node of el.childNodes){
   if(node.nodeType!==3)continue;
   const value=(node.nodeValue||'').replace(/\s+/g,' ').trim();
   if(value.length<3||value.length>150||!germanPattern.test(value)||seen.has(value))continue;
   seen.add(value);count++;if(samples.length<limit)samples.push(value.slice(0,100));
  }
 }
 return {count,samples};
}
function selectorReach(doc,rows){
 let staticMatches=0,notFound=0,invalid=0,translated=0;
 for(const row of rows||[]){
  if(!Array.isArray(row)||typeof row[0]!=='string'){invalid++;continue;}
  const translatedValue=row[2]?row[3]:row[1];
  if(typeof translatedValue==='string'&&translatedValue.trim())translated++;
  try{if(doc.querySelector(row[0]))staticMatches++;else notFound++;}
  catch{invalid++;}
 }
 return {staticMatches,notFound,invalid,translated};
}
function counts(legacy,slug){
 return {selectorRules:(legacy.selectors?.[slug]||[]).length,
  dialogMessages:Object.keys(legacy.dialogs?.[slug]||{}).length+
   Object.keys(legacy.additionalDialogs?.[slug]||{}).length,
  runtimeMessages:Object.keys(legacy.runtimeStatus?.[slug]||{}).length,
  prefixRules:Object.keys(legacy.dialogPrefixes?.[slug]||{}).length+
   (legacy.runtimePrefixes?.[slug]||[]).length};
}
function readHtml(root,filename){
 const file=path.join(root,filename);
 if(!fs.existsSync(file))return null;
 const stat=fs.lstatSync(file);
 if(!stat.isFile()||stat.isSymbolicLink())throw Error('Unsafe HTML file: '+filename);
 return fs.readFileSync(file,'utf8');
}
function auditPages(root,config,legacy,resources){
 const tools=[],marketing=[],issues=[];
 for(const t of config.toolRoutes){
  const html=readHtml(root,t.html);
  if(html===null){issues.push({kind:'missing-tool-page',file:t.html});continue;}
  const doc=parseHTML(html).document;
  const selector=selectorReach(doc,legacy.selectors?.[t.slug]);
  const namespace=t.slug==='wishes'?'wishes':t.slug==='estate'?'estate':'tool_'+t.slug;
  const catalog={...counts(legacy,t.slug),namespace,
    translatedKeys:Object.keys(resources.en?.[namespace]||{}).length};
  tools.push({slug:t.slug,file:t.html,englishGuide:t.englishGuide,
   catalog,selector,staticGermanReview:staticCandidates(doc)});
  if(selector.invalid)issues.push({kind:'invalid-selector-review',file:t.html,count:selector.invalid});
 }
 for(const p of config.marketingPages){
  const en=readHtml(root,p.en),de=readHtml(root,p.de);
  if(en===null||de===null){issues.push({kind:'missing-marketing-pair',page:p.key,de:p.de,en:p.en});continue;}
  const enDoc=parseHTML(en).document,deDoc=parseHTML(de).document;
  const langs={de:deDoc.documentElement.getAttribute('lang'),en:enDoc.documentElement.getAttribute('lang')};
  const enToDe=!!enDoc.querySelector('[data-set-locale="de"]');
  const deToEn=!!deDoc.querySelector('[data-set-locale="en"]');
  const noindex=/name=["']robots["'][^>]*content=["']noindex,follow["']/.test(en);
  marketing.push({key:p.key,de:p.de,en:p.en,langs,enToDe,deToEn,noindex,
    germanTextReview:staticCandidates(enDoc)});
  if(langs.de!=='de'||langs.en!=='en')issues.push({kind:'marketing-lang',page:p.key,langs});
  if(!enToDe||!deToEn)issues.push({kind:'marketing-switch',page:p.key,enToDe,deToEn});
  if(!noindex)issues.push({kind:'marketing-noindex-removed',page:p.key});
 }
 return {tools,marketing,issues};
}
function validateReport(report){
 const hard=new Set(['missing-translation','empty-translation','missing-tool-page',
   'missing-marketing-pair','marketing-lang','marketing-switch','marketing-noindex-removed',
   'placeholder-review','invalid-selector-review']);
 const critical=report.issues.filter(x=>hard.has(x.kind));
 return {ok:critical.length===0,critical,review:report.issues.filter(x=>!hard.has(x.kind))};
}
async function auditRepository(root=ROOT){
 const config=readJSON(root,'docs/i18n/quality-config.json');
 const glossary=readJSON(root,'docs/i18n/glossary.json');
 assertConfig(config);assertGlossary(glossary);
 const load=p=>import(pathToFileURL(path.join(root,p)).href);
 const [{I18N_LEGACY_TOOL_CATALOGUES:legacy},{LEGACY_I18NEXT_RESOURCES:resources},
   {SUPPORTED_LOCALES}]=await Promise.all([
   load('shared/toolya/i18n/interface.mjs'),
   load('shared/toolya/i18n/i18next-legacy-resources.mjs'),
   load('shared/toolya/i18n/locale.mjs')]);
 if(JSON.stringify(SUPPORTED_LOCALES)!==JSON.stringify(['de','en']))throw Error('Locale architecture changed');
 const catalogs=catalogAnalysis(resources),pages=auditPages(root,config,legacy,resources);
 const report={schemaVersion:1,sourceLocale:'de',targetLocale:'en',
  interpretation:'Static German text candidates and selector match counts require manual review; they are NOT confirmed untranslated runtime content.',
  glossaryTerms:glossary.entries.length,namespaceCount:catalogs.namespaces.length,
  namespaces:catalogs.namespaces,tools:pages.tools,marketing:pages.marketing,
  issues:[...pages.issues,...catalogs.issues]};
 return {...report,validation:validateReport(report)};
}
function toMarkdown(r){
 const lines=['# Toolya DE/EN – automatischer Prüfbericht','',
  'Diese Zahlen sind **statische Review-Indikatoren**, keine Behauptung vollständiger Übersetzung.','','## Tool-Oberflächen (12)','',
  '| Tool | EN-Katalogschlüssel | Selektorregeln | Statische Treffer | Dialoge | Laufzeittexte | Deutsche HTML-Kandidaten* |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: |'];
 for(const t of r.tools)lines.push('| '+t.slug+' | '+t.catalog.translatedKeys+' | '+t.catalog.selectorRules+' | '+
   t.selector.staticMatches+' | '+t.catalog.dialogMessages+' | '+t.catalog.runtimeMessages+' | '+
   t.staticGermanReview.count+' |');
 lines.push('','## Marketing-/Informationsseiten ('+r.marketing.length+')','',
  '| Seite | DE-Pfad | EN-Pfad | Sprachwahl | Kandidaten deutscher Texte in EN* |',
  '| --- | --- | --- | --- | ---: |');
 for(const p of r.marketing)lines.push('| '+p.key+' | '+p.de+' | '+p.en+' | '+
   (p.enToDe&&p.deToEn?'vorhanden':'prüfen')+' | '+p.germanTextReview.count+' |');
 lines.push('','## i18next-Namespaces','','| Namespace | DE-Schlüssel | EN-Schlüssel | Fehlend | Leer | Platzhalter-Reviews |',
  '| --- | ---: | ---: | ---: | ---: | ---: |');
 for(const n of r.namespaces)lines.push('| '+n.namespace+' | '+n.sourceKeys+' | '+n.targetKeys+
   ' | '+n.missing+' | '+n.empty+' | '+n.placeholderReviews+' |');
 lines.push('','## Offene Prüfungen','',
   '- Harte strukturelle Probleme: '+r.validation.critical.length,
   '- Weitere Katalog-/Selektorprüfungen: '+r.validation.review.length,
   '- Statische Kandidaten werden nicht automatisch in die UI geschrieben.',
   '- Dynamische Selektoren können in der statischen HTML-Datei fehlen, ohne dass die Übersetzung fehlt.',
   '- Englische Informationsseiten bleiben bis zur fachlichen Freigabe noindex.',
   '- Nutzereinträge, persönliche Daten, Secrets und Produktiv-Cloudwerte niemals übersetzen.','',
   '## Beispielhafte Review-Kandidaten');
 for(const t of r.tools)lines.push('- '+t.slug+': '+t.staticGermanReview.samples.slice(0,3).map(JSON.stringify).join('; '));
 lines.push('','Vollständiger Bericht: report.json. JSON-Exporte: catalogues/{de,en}/*.json.');
 return lines.join('\n')+'\n';
}
function exportCatalogues(root,dir,resources){
 for(const lang of ['de','en']){
  const dest=path.join(dir,'catalogues',lang);fs.mkdirSync(dest,{recursive:true});
  for(const [ns,items] of Object.entries(resources[lang])){
   if(ns.endsWith('_selectors'))continue;
   if(!/^[a-z][a-z0-9_-]*$/.test(ns))throw Error('Invalid namespace');
   fs.writeFileSync(path.join(dest,ns+'.json'),JSON.stringify(items,null,2)+'\n');
  }
 }
}
async function writeReport(root=ROOT){
 const report=await auditRepository(root);
 const dir=path.join(root,'test-results/i18n-quality');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(path.join(dir,'REPORT.md'),toMarkdown(report));
 const {LEGACY_I18NEXT_RESOURCES}=await import(pathToFileURL(path.join(root,'shared/toolya/i18n/i18next-legacy-resources.mjs')).href);
 exportCatalogues(root,dir,LEGACY_I18NEXT_RESOURCES);
 return report;
}
async function main(args=process.argv.slice(2)){
 if(args.length!==1||!['--check','--report'].includes(args[0]))
  throw Error('Usage: node scripts/i18n-quality.cjs --check | --report');
 const r=args[0]==='--report'?await writeReport():await auditRepository();
 console.log('DE/EN: '+r.tools.length+' tools, '+r.marketing.length+' marketing pages, '+
   r.namespaceCount+' namespaces; '+r.validation.critical.length+' critical, '+
   r.validation.review.length+' review findings.');
 if(!r.validation.ok){
  console.error(JSON.stringify(r.validation.critical.slice(0,12),null,2));
  process.exitCode=1;
 }
}
if(require.main===module)main().catch(e=>{console.error('i18n quality: '+e.message);process.exitCode=1;});
module.exports={assertConfig,assertGlossary,placeholders,comparePair,catalogAnalysis,
  staticCandidates,selectorReach,counts,auditPages,validateReport,auditRepository,
  toMarkdown,exportCatalogues,writeReport,main};
