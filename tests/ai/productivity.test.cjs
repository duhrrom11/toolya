'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {loadCatalog,contextChain,assemblePrompt,evaluateAnswer,
  runFixtureChecks,parseArgs} = require('../../scripts/productivity.cjs');

const ROOT = path.resolve(__dirname,'../..');

test('catalog defines six real, locally reusable patterns and focused contexts',()=>{
  const catalog=loadCatalog(ROOT);
  assert.equal(catalog.schemaVersion,1);
  assert.deepEqual(catalog.patterns.map(p=>p.id),[
    'research','implementation','marketing','decision','document','automation'
  ]);
  assert.deepEqual(Object.keys(catalog.contexts),[
    'general','toolya-core','toolya-engineering','toolya-marketing'
  ]);
  for (const pattern of catalog.patterns) {
    assert.ok(fs.existsSync(path.join(ROOT,pattern.file)),pattern.id);
    assert.ok(pattern.sections.length>=3);
  }
  assert.deepEqual(contextChain(catalog,'toolya-engineering'),[
    catalog.contexts.general,catalog.contexts['toolya-core'],catalog.contexts['toolya-engineering']
  ]);
});

test('prompt assembly is reusable without network, context inflation or file writes',()=>{
  const task='Prüfe eine neue Funktion anhand einer lokalen Testbeschreibung.';
  const basic=assemblePrompt({root:ROOT,patternId:'research',task});
  assert.match(basic,/Recherche mit Quellen und belastbaren Aussagen/);
  assert.match(basic,/Allgemeiner Arbeitskontext/);
  assert.doesNotMatch(basic,/Toolya: Entwicklungs- und Sicherheitskontext/);
  const tailored=assemblePrompt({root:ROOT,patternId:'implementation',
    contextId:'toolya-engineering',task});
  assert.match(tailored,/Toolya: Entwicklungs- und Sicherheitskontext/);
  assert.match(tailored,/Toolya: fokussierter Projektkontext/);
  assert.match(tailored,/Geprüfte Entwicklung|Entwicklungsauftrag von Problem/);
  assert.match(tailored,/## Konkreter Arbeitsauftrag/);
  assert.match(tailored,/Prüfe eine neue Funktion/);
  assert.equal((tailored.match(/# Allgemeiner Arbeitskontext/g)||[]).length,1);
  assert.doesNotMatch(tailored,/Toolya: Marketing- und Markenwissen/);
});

test('unsupported selectors or dangerous tasks are rejected',()=>{
  const task='Prüfe ein lokales Beispiel ohne personenbezogene Daten.';
  for (const options of [
    {patternId:'missing',task},
    {patternId:'implementation',contextId:'toolya-marketing',task},
    {patternId:'research',task:'short'},
    {patternId:'research',task:'A'.repeat(1600)},
    {patternId:'research',task:'Eine Eingabe mit Steuerzeichen \x00 ist ungültig'}
  ])assert.throws(()=>assemblePrompt({root:ROOT,...options}));
  assert.throws(()=>parseArgs(['--render','--pattern','research']),/needs/);
  assert.throws(()=>parseArgs(['--check','--render']),/one mode/);
  assert.throws(()=>parseArgs(['--render','--pattern','research','--context','general','--context','toolya-core','--task',task]),/duplicate/);
});

test('twelve synthetic fixture cases cover both acceptable and unacceptable outputs',()=>{
  const report=runFixtureChecks(ROOT);
  assert.equal(report.count,12);
  assert.equal(report.pass,true,JSON.stringify(report.results.filter(x=>!x.match)));
  assert.equal(report.results.filter(x=>x.expected===false).length,6);
  assert.equal(report.results.filter(x=>x.expected===true).length,6);
});

test('the structural evaluator rejects unsupported evidence, release and activation claims',()=>{
  const catalog=loadCatalog(ROOT);
  const research='### Ergebnis\nDies ist nur ein synthetisches Beispiel mit einer lokalen Hypothese.\n\n'+
    '### Belege\nHier gibt es gar keine verifizierbare Quelle zur Beispielhypothese.\n\n'+
    '### Offene Punkte\nDie Hypothese benötigt noch einen überprüften Nachweis.';
  const r=evaluateAnswer({catalog,patternId:'research',output:research});
  assert.equal(r.pass,false);
  assert.match(r.issues.join(' '),/reference/);
  const release='### Änderungen\nDie lokale Probe ändert nur eine fiktive Quelldatei.\n\n'+
    '### Prüfungen\nDie Testfälle wurden in diesem synthetischen Beispiel geprüft.\n\n'+
    '### Veröffentlichung\nEs wird so getan, als sei der Code schon live.';
  assert.match(evaluateAnswer({catalog,patternId:'implementation',output:release})
    .issues.join(' '),/Release status/);
  assert.match(evaluateAnswer({catalog,patternId:'automation',
    output:'### Auslöser\nEin manueller synthetischer Trigger.\n\n### Ablauf\nLokale Schritte ohne Datenbank.\n\n'+
      '### Schutzmaßnahmen\nZugriff nur in isolierter Vorschau.\n\n### Aktivierung\nEventuell aktiv.'})
    .issues.join(' '),/activation status/i);
});

test('CLI smoke is offline, stable and does not create any files',()=>{
  for(const args of [
    ['--list'],
    ['--check'],
    ['--render','--pattern','decision','--task','Vergleiche zwei lokale Arbeitsvarianten ohne Cloudzugriff.']
  ]){
    const r=spawnSync(process.execPath,['scripts/productivity.cjs',...args],{
      cwd:ROOT,encoding:'utf8',timeout:12000,env:{PATH:process.env.PATH}
    });
    assert.equal(r.status,0,r.stderr);
    assert.ok(r.stdout.length>50);
  }
});


test('optional Promptfoo adapter returns only approved synthetic fixture output',async()=>{
  const Provider=require('../../docs/ai/productivity/promptfoo/fixture-provider.cjs');
  const provider=new Provider();
  assert.equal(provider.id(),'toolya:synthetic-productivity-fixture');
  const good=await provider.callApi('ignored prompt',{vars:{fixture:'research-pass'}});
  assert.match(good.output,/### Belege/);
  const rejected=await provider.callApi('ignored prompt',{vars:{fixture:'research-fail-no-evidence'}});
  assert.match(rejected.error,/Unknown or nonpositive/);
  const missing=await provider.callApi('ignored prompt',{vars:{fixture:'nonexistent'}});
  assert.ok(missing.error);
  const config=fs.readFileSync(path.join(ROOT,'docs/ai/productivity/promptfoo/promptfooconfig.yaml'),'utf8');
  assert.match(config,/file:\/\/\.\/fixture-provider\.cjs/);
  assert.match(config,/contains-all/);
  assert.doesNotMatch(config,/OPENAI_API_KEY|ANTHROPIC_API_KEY|https:\/\/api\./);
});
