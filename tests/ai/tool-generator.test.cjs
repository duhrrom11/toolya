'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {OUTFITS, parseOptions, renderToolFiles, generateTool} = require('../../scripts/create-tool.cjs');

const repoRoot = path.resolve(__dirname, '../..');
function sandbox(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'toolya-scaffold-'));
  fs.mkdirSync(path.join(root, 'tools'));
  try { return fn(root); } finally { fs.rmSync(root, {recursive: true, force: true}); }
}
const sample = {
  slug: 'demo-test',
  title: 'Demo & <Test>',
  description: 'Ein lokaler Prototyp mit "Sonderzeichen" und Vorschau.'
};

test('strict input prevents traversal, broken names and HTML injection', () => {
  for (const slug of ['../bad', 'a/b', '.hidden', 'a--b', 'UPPER', 'bad_', 'a'.repeat(41)]) {
    assert.throws(() => renderToolFiles({...sample, slug}), /Slug/);
  }
  assert.throws(() => renderToolFiles({...sample, title: 'A'}), /title/);
  assert.throws(() => renderToolFiles({...sample, description: 'Line\nBreak and more'}), /description/);
  for (const outfit of ['__proto__', 'invalid', '../plants', 'constructor']) {
    assert.throws(() => renderToolFiles({...sample, outfit}), /outfit/);
  }
  assert.equal(parseOptions(['--slug', 'draft', '--title', 'Draft', '--description', 'Long enough description', '--outfit', 'plants']).outfit, 'plants');
  assert.throws(() => parseOptions(['--slug', 'demo', '--unknown', 'x']), /Unknown argument/);
  assert.throws(() => parseOptions(['--slug', '--title', 'broken']), /Missing or duplicate/);
  const html = renderToolFiles(sample)['index.html'];
  assert.match(html, /Demo &amp; &lt;Test&gt;/);
  assert.match(html, /&quot;Sonderzeichen&quot;/);
  assert.doesNotMatch(html, /<title>Demo & <Test>/);
});

test('generated prototype is noindex, local-only and uses shared platform', () => {
  const files = renderToolFiles(sample);
  assert.deepEqual(Object.keys(files).sort(), ['README.md', 'app.mjs', 'index.html']);
  const html = files['index.html'];
  assert.match(html, /noindex,nofollow/);
  assert.match(html, /shared\/toolya\/platform\.mjs/);
  assert.match(html, /shared\/toolya\/alpha\.css/);
  assert.match(html, /data-toolya-draft="true"/);
  assert.match(html, /name="toolya-draft-outfit" content="home"/);
  assert.match(html, /class="b3-header"/);
  assert.match(html, /class="b3-tool-title"/);
  assert.match(html, /class="b3-tool-icon"/);
  assert.doesNotMatch(html, /<a[^>]*class="ty-tool-wordmark"/); // platform owns the wordmark
  assert.match(html, /role="status"/);
  assert.match(files['README.md'], /kein fertiges Tool/);
  assert.doesNotMatch(files['app.mjs'], /\b(fetch|localStorage|sessionStorage|supabase)\b/);
  assert.doesNotMatch(html, /https?:\/\/[^" ]+\.supabase\.co/);
});

test('dry run never writes a file and existing tool is never overwritten', () => sandbox(root => {
  const preview = generateTool({...sample, repoRoot: root, dryRun: true});
  assert.equal(preview.created, false);
  assert.equal(fs.existsSync(path.join(root, 'tools', sample.slug)), false);
  const made = generateTool({...sample, repoRoot: root});
  assert.equal(made.created, true);
  assert.equal(fs.existsSync(path.join(root, 'tools', sample.slug, 'index.html')), true);
  assert.throws(() => generateTool({...sample, repoRoot: root}), /will not overwrite/);
  assert.equal(fs.readFileSync(path.join(root, 'tools', sample.slug, 'index.html'), 'utf8'),
    renderToolFiles(sample)['index.html']);
  const check = spawnSync(process.execPath,
    ['--check', path.join(root, 'tools', sample.slug, 'app.mjs')], {encoding: 'utf8'});
  assert.equal(check.status, 0, check.stderr);
}));

test('real canonical tool directory is protected against overwrite', () => {
  assert.throws(() => generateTool({
    repoRoot, slug: 'wishes', title: 'Bestehendes Tool',
    description: 'Diese vorhandene Route darf nicht veraendert werden.'
  }), /will not overwrite/);
});

test('project map resolves to actual production paths', () => {
  const map = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/ai/project-map.json'), 'utf8'));
  const inventory = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/runtime-port-inventory.json'), 'utf8'));
  assert.deepEqual(Object.keys(map.canonicalTools).sort(), Object.values(inventory.routes).sort());
  for (const [slug, file] of Object.entries(map.canonicalTools)) {
    assert.equal(file, 'tools/' + slug + '/index.html');
    assert.ok(fs.existsSync(path.join(repoRoot, file)), file);
  }
  for (const item of map.importantFiles) {
    assert.ok(fs.existsSync(path.join(repoRoot, item)), item);
  }
});

test('AI instructions retain production and mascot safety boundaries', () => {
  const rules = fs.readFileSync(path.join(repoRoot, 'AGENTS.md'), 'utf8');
  for (const anchor of [
    'toolya.app', 'Supabase', 'SHA256SUMS', 'Helferlein',
    'Wishlist', 'AGENTS.md', 'docs/ai/', 'production',
    'Pull Request'
  ]) assert.ok(rules.includes(anchor), anchor);
});

test('draft outfit role is drawn from established Toolya roles only', () => {
  const inventory = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/runtime-port-inventory.json'), 'utf8'));
  assert.deepEqual(OUTFITS.filter(x => x !== 'home').sort(), Object.values(inventory.routes).sort());
  const themed = renderToolFiles({...sample, outfit: 'plants'});
  assert.match(themed['index.html'], /name="toolya-draft-outfit" content="plants"/);
  assert.match(themed['README.md'], /Outfit: plants/);
  const platform = fs.readFileSync(path.join(repoRoot, 'shared/toolya/platform.mjs'), 'utf8');
  assert.match(platform, /data(?:set)?\.toolyaDraft/);
  assert.match(platform, /Object\.hasOwn\(TOOLS, draftOutfit/);
  assert.match(platform, /TOOLS\[tool\]\|\|draftContext\|\|TOOLS\.home/);
  assert.match(platform, /\(!TOOLS\[tool\]&&!draftContext\)/);
  assert.doesNotMatch(themed['index.html'], /https?:\/\/[^" ]+\.supabase\.co/);
});
