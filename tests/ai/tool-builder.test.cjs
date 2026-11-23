'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {spawnSync} = require('node:child_process');
const {renderToolFiles, generateTool, TEMPLATES, parseOptions} = require('../../scripts/create-tool.cjs');

const root = path.resolve(__dirname, '../..');
const sample = {slug:'ci-builder-test-preview',title:'Builder Testentwurf',
  description:'Unveröffentlichte funktionale Vorlage für isolierte Tests.'};

test('all named templates render without a dependency or network invocation', () => {
  assert.deepEqual(TEMPLATES, ['starter','counter','percentage','checklist']);
  for (const template of TEMPLATES) {
    const files = renderToolFiles({...sample,template});
    assert.match(files['index.html'], /noindex,nofollow/);
    assert.match(files['index.html'], /data-toolya-draft="true"/);
    assert.match(files['index.html'], /shared\/toolya\/platform\.mjs/);
    assert.ok(!/\b(fetch|XMLHttpRequest|localStorage|sessionStorage|indexedDB)\b/.test(files['app.mjs']));
    assert.ok(!/\bhttps?:\/\/\S+\.supabase\.co\b/.test(files['app.mjs']));
    if (template !== 'starter') {
      assert.match(files['app.mjs'], /shared\/toolya\/tool-builder\/blocks\.mjs/);
      assert.ok(files['app.test.mjs'].includes("node:test"));
    } else assert.equal(files['app.test.mjs'], undefined);
  }
});

test('invalid templates rejected before creating anything', () => {
  for (const template of ['__proto__', '../../wishes','Counter','toString', '']) {
    assert.throws(() => renderToolFiles({...sample,template}), /template/);
  }
  assert.equal(parseOptions(['--template','checklist']).template, 'checklist');
  assert.throws(() => parseOptions(['--template','checklist','--template','counter']), /duplicate/);
});

test('generated functional tests run with Node in an isolated repo checkout', () => {
  const tests = [];
  const created = [];
  try {
    for (const template of ['counter','percentage','checklist']) {
      const slug = 'ci-ai-builder-' + template + '-test';
      const folder = path.join(root, 'tools', slug);
      assert.equal(fs.existsSync(folder), false, 'refuse to overwrite an existing draft');
      const result = generateTool({...sample,slug,template,repoRoot:root});
      created.push(folder);
      assert.equal(result.created, true);
      assert.equal(fs.existsSync(path.join(folder,'app.test.mjs')), true);
      const syntax = spawnSync(process.execPath, ['--check',path.join(folder,'app.mjs')], {encoding:'utf8'});
      assert.equal(syntax.status,0,syntax.stderr);
      const run = spawnSync(process.execPath, ['--test',path.join(folder,'app.test.mjs')], {encoding:'utf8'});
      tests.push({template, exit:run.status, output:run.stdout + run.stderr});
      assert.equal(run.status,0,template + ': ' + run.stdout + run.stderr);
    }
  } finally {
    for (const folder of created) fs.rmSync(folder,{recursive:true,force:true});
  }
  assert.equal(tests.length,3);
});

test('pure shared blocks validate bounds and preserve original inputs', async () => {
  const {counterStep, percentageOf, addChecklistItem, removeChecklistItem} =
    await import('../../shared/toolya/tool-builder/blocks.mjs');
  assert.equal(counterStep(0,-1),0);
  assert.equal(counterStep(9999,1),9999);
  assert.throws(() => counterStep(5, 100),RangeError);
  assert.equal(percentageOf(1,3),33.3);
  assert.throws(() => percentageOf(1,0),RangeError);
  assert.throws(() => percentageOf(-1,2),RangeError);
  const original = ['Eins'];
  const result = addChecklistItem(original,' <svg onload=alert(1)> ');
  assert.deepEqual(original,['Eins']);
  assert.equal(result.length,2);
  assert.equal(result[1],'<svg onload=alert(1)>');
  assert.deepEqual(removeChecklistItem(result,1),original);
  assert.throws(() => removeChecklistItem(result,42),RangeError);
  assert.throws(() => addChecklistItem(original,' '.repeat(80)),RangeError);
});
