'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {OUTFITS, TEMPLATES} = require('../../scripts/create-tool.cjs');
const {FIELDS,validateBrief,readBrief,buildFromBrief,renderBriefDocument,parseArgs} =
  require('../../scripts/create-tool-from-brief.cjs');

const REPO = path.resolve(__dirname, '../..');
const SAMPLE = 'docs/ai/briefs/ai-prozentrechner-entwurf.json';
const sample = JSON.parse(fs.readFileSync(path.join(REPO,SAMPLE),'utf8'));

function workspace(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'toolya-ai-brief-'));
  fs.mkdirSync(path.join(dir,'tools'));
  fs.mkdirSync(path.join(dir,'docs','ai','briefs'),{recursive:true});
  try {return run(dir);} finally {fs.rmSync(dir,{recursive:true,force:true});}
}
function putSpec(root, name, value) {
  const file='docs/ai/briefs/'+name+'.json';
  fs.writeFileSync(path.join(root,file),JSON.stringify(value));
  return file;
}

test('checked-in example and JSON Schema match the generator contract', () => {
  const brief = readBrief(REPO,SAMPLE);
  assert.deepEqual(brief.slug,sample.slug);
  assert.equal(brief.scope,'offline-draft');
  const schema = JSON.parse(fs.readFileSync(path.join(REPO,'docs/ai/tool-brief.schema.json'),'utf8'));
  assert.equal(schema.additionalProperties,false);
  assert.deepEqual(schema.required,FIELDS);
  assert.deepEqual(schema.properties.template.enum,TEMPLATES);
  assert.deepEqual(schema.properties.outfit.enum,OUTFITS);
  assert.equal(schema.properties.scope.const,'offline-draft');
  assert.equal(schema.properties.schemaVersion.const,1);
});

test('unsupported fields, secret-bearing code and backend scope cannot enter the contract', () => {
  for (const input of [
    null,[],42,'hello',{},
    {...sample,schemaVersion:2},
    {...sample,scope:'production'},
    {...sample,scope:'supabase-write'},
    {...sample,sourceCode:'fetch("/api")'},
    {...sample,privateKey:'sk-secret-not-real'},
    {...sample,acceptanceCriteria:[]},
    {...sample,acceptanceCriteria:Array.from({length:9},()=> 'Use accessibility.')},
    {...sample,acceptanceCriteria:['invalid']},
    {...sample,goal:'one'},
    {...sample,goal:'Line\nBreak with a harmful second instruction'},
    {...sample,slug:'../existing'},
    {...sample,template:'eval'},
    {...sample,outfit:'__proto__'}
  ]) assert.throws(()=>validateBrief(input));
  assert.throws(()=>parseArgs(['--spec',SAMPLE,'--dry-run','--validate-only']),/either/);
  assert.throws(()=>parseArgs(['--spec',SAMPLE,'--spec',SAMPLE]),/duplicate/);
});

test('dry-run and validation are read-only and return structured results', () => workspace(root => {
  const spec=putSpec(root,'test-demo', {...sample,slug:'builder-demo'});
  const validate=buildFromBrief({repoRoot:root,filename:spec,validateOnly:true});
  assert.deepEqual(validate,{valid:true,created:false,slug:'builder-demo',template:'percentage',
    outfit:'budget',route:'/tools/builder-demo/'});
  const dry=buildFromBrief({repoRoot:root,filename:spec,dryRun:true});
  assert.equal(dry.created,false);
  assert.deepEqual(dry.files.sort(),['README.md','TOOL-BRIEF.md','app.mjs','app.test.mjs','index.html'].sort());
  assert.equal(fs.existsSync(path.join(root,'tools','builder-demo')),false);
  assert.equal(fs.readdirSync(path.join(root,'tools')).length,0);
}));

test('full handoff produces tested scaffold and unmet requirements, never overwrites', () => workspace(root => {
  const spec=putSpec(root,'create-demo',{...sample,slug:'brief-test-demo',
    goal:'A safe prototype that renders <script>alert(1)</script> literally.',
    acceptanceCriteria:[
      'Display <img src=x onerror=alert(1)> as plain text in the draft plan.',
      'Provide a real test for percentage outcomes.'
    ]
  });
  const result=buildFromBrief({repoRoot:root,filename:spec});
  assert.equal(result.created,true);
  assert.equal(result.files.length,5);
  const folder=path.join(root,'tools','brief-test-demo');
  const html=fs.readFileSync(path.join(folder,'index.html'),'utf8');
  const doc=fs.readFileSync(path.join(folder,'TOOL-BRIEF.md'),'utf8');
  assert.match(html,/noindex,nofollow/);
  assert.match(doc,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(doc,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(doc,/- \[ \] Provide a real test/);
  assert.match(doc,/keine geprüften Erfolge/);
  assert.doesNotMatch(doc,/<script>/);
  assert.throws(()=>buildFromBrief({repoRoot:root,filename:spec}),/will not overwrite/);
  const check=spawnSync(process.execPath,['--check',path.join(folder,'app.mjs')],{encoding:'utf8'});
  assert.equal(check.status,0,check.stderr);
}));

test('brief path cannot escape allowed folder or follow a symlink', () => workspace(root => {
  putSpec(root,'allowed',sample);
  const cases = [
    '/etc/passwd','../README.md','.github/workflows/ai-development.yml',
    'docs/ai/tool-brief.schema.json','docs/ai/briefs/../tool-brief.schema.json',
    'docs/ai/briefs/not-a-file.txt'
  ];
  for (const filename of cases) assert.throws(()=>readBrief(root,filename));
  const pathToSymlink=path.join(root,'docs/ai/briefs/linked.json');
  fs.symlinkSync(path.join(root,'docs/ai/briefs/allowed.json'),pathToSymlink);
  assert.throws(()=>readBrief(root,'docs/ai/briefs/linked.json'),/regular JSON|unsafe/i);
  fs.writeFileSync(path.join(root,'docs/ai/briefs/oversized.json'),'A'.repeat(12289));
  assert.throws(()=>readBrief(root,'docs/ai/briefs/oversized.json'),/12 KiB/);
}));

test('the CLI exposes machine-readable validation without creating any tool', () => {
  const rootOutput=path.join(REPO,'tools',sample.slug);
  assert.equal(fs.existsSync(rootOutput),false);
  const cli=spawnSync(process.execPath,['scripts/create-tool-from-brief.cjs','--spec',SAMPLE,'--dry-run','--json'],{cwd:REPO,encoding:'utf8'});
  assert.equal(cli.status,0,cli.stderr);
  const result=JSON.parse(cli.stdout);
  assert.equal(result.valid,true);
  assert.equal(result.created,false);
  assert.equal(result.slug,sample.slug);
  assert.ok(result.files.includes('TOOL-BRIEF.md'));
  assert.equal(fs.existsSync(rootOutput),false);
});
