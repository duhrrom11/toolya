#!/usr/bin/env node
'use strict';

// Deterministic, offline ChatGPT -> Toolya Builder bridge.
// The JSON brief is plain data and is never evaluated as JavaScript.
const fs = require('node:fs');
const path = require('node:path');
const {generateTool, validateToolArgs} = require('./create-tool.cjs');

const ROOT = path.resolve(__dirname, '..');
const BRIEF_DIR = 'docs/ai/briefs';
const MAX_BYTES = 12 * 1024;
const FIELDS = Object.freeze([
  'schemaVersion', 'slug', 'title', 'description', 'template',
  'outfit', 'scope', 'goal', 'acceptanceCriteria'
]);

function strictLine(value, min, max, label) {
  if (typeof value !== 'string' || value.trim() !== value ||
    value.length < min || value.length > max || /[\x00-\x1f\x7f]/.test(value)) {
    throw new Error(label + ' must be a trimmed single line (' + min + '-' + max + ' chars).');
  }
  return value;
}

function validateBrief(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Tool brief must be a JSON object.');
  }
  for (const key of Object.keys(input)) {
    if (!FIELDS.includes(key)) throw new Error('Unsupported tool brief field: ' + key);
  }
  for (const field of FIELDS) {
    if (!Object.hasOwn(input, field)) throw new Error('Missing required brief field: ' + field);
  }
  if (input.schemaVersion !== 1) throw new Error('Unsupported brief schemaVersion.');
  if (input.scope !== 'offline-draft') {
    throw new Error('Only offline-draft scope is allowed; cloud/deploy operations are forbidden.');
  }
  validateToolArgs(input);
  strictLine(input.goal, 10, 240, 'goal');
  if (!Array.isArray(input.acceptanceCriteria) ||
      input.acceptanceCriteria.length < 1 || input.acceptanceCriteria.length > 8) {
    throw new Error('acceptanceCriteria must contain 1-8 plain text items.');
  }
  input.acceptanceCriteria.forEach((value, index) =>
    strictLine(value, 8, 200, 'acceptanceCriteria[' + index + ']'));
  return Object.freeze({
    schemaVersion: 1,
    slug: input.slug,
    title: input.title,
    description: input.description,
    template: input.template,
    outfit: input.outfit,
    scope: 'offline-draft',
    goal: input.goal,
    acceptanceCriteria: Object.freeze([...input.acceptanceCriteria])
  });
}

function resolveBriefPath(repoRoot, filename) {
  if (typeof filename !== 'string' || !filename || filename.includes('\\') ||
      path.isAbsolute(filename) || !filename.endsWith('.json')) {
    throw new Error('Brief path must be a relative JSON path in ' + BRIEF_DIR);
  }
  const root = fs.realpathSync(repoRoot);
  const directory = path.resolve(root, BRIEF_DIR);
  const candidate = path.resolve(root, filename);
  if (path.dirname(candidate) !== directory ||
      !/^[a-z0-9][a-z0-9-]*\.json$/.test(path.basename(candidate))) {
    throw new Error('Brief must be a top-level JSON file within ' + BRIEF_DIR);
  }
  if (!fs.existsSync(directory) || fs.realpathSync(directory) !== directory ||
      !fs.statSync(directory).isDirectory()) {
    throw new Error('Missing or unsafe brief directory: ' + BRIEF_DIR);
  }
  const stat = fs.lstatSync(candidate);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_BYTES) {
    throw new Error('Brief must be a regular JSON file no larger than 12 KiB.');
  }
  if (fs.realpathSync(candidate) !== candidate) throw new Error('Unsafe brief path.');
  return candidate;
}

function readBrief(repoRoot, filename) {
  const file = resolveBriefPath(repoRoot, filename);
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { throw new Error('Invalid JSON in tool brief.'); }
  return validateBrief(parsed);
}

function escapePlainMarkdown(value) {
  // Treat AI-supplied plain text as text rather than executable HTML or Markdown.
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/([\\\x60*_[\]{}#!|])/g, '\\$1');
}

function renderBriefDocument(brief) {
  return [
    '# ' + escapePlainMarkdown(brief.title) + ' – Funktionsbrief (Entwurf)',
    '',
    'Status: **unveröffentlicht** · Freigabe: **ausstehend** · Daten: **nur lokal**',
    '',
    '## Zweck',
    '',
    escapePlainMarkdown(brief.goal),
    '',
    '## Gewählte Ausgangsvorlage',
    '',
    '- Funktion: `' + brief.template + '`',
    '- Bestehendes Maskottchen-Outfit: `' + brief.outfit + '`',
    '- Route nach separater Freigabe: `/tools/' + brief.slug + '/`',
    '',
    '## Akzeptanzkriterien – bewusst NOCH NICHT als vollständig umgesetzt markieren',
    '',
    ...brief.acceptanceCriteria.map(item => '- [ ] ' + escapePlainMarkdown(item)),
    '',
    '## Verbindliche Grenzen',
    '',
    '- Der erzeugte Code entspricht nur der gewählten Ausgangsvorlage.',
    '- Die obigen Kriterien sind Anforderungen, **keine geprüften Erfolge**.',
    '- Neue Produktlogik, Cloud-Zugriffe, Auth, RLS, Übersetzungen, Navigation und SEO brauchen eigene Entwicklung und Tests.',
    '- Keine produktiven Supabase-Daten, API-Secrets oder echten Nutzerkonten verwenden.',
    '- Dieser Entwurf bleibt `noindex,nofollow` und wird nicht automatisch veröffentlicht.',
    '',
    'Quellen: `AGENTS.md` und `docs/ai/CHATGPT-TOOL-HANDOFF.md`.',
    ''
  ].join('\n');
}

function buildFromBrief({repoRoot = ROOT, filename, dryRun = false, validateOnly = false}) {
  const brief = readBrief(repoRoot, filename);
  if (validateOnly) return {
    valid: true, created: false, slug: brief.slug, template: brief.template,
    outfit: brief.outfit, route: '/tools/' + brief.slug + '/'
  };
  const result = generateTool({...brief, repoRoot, dryRun});
  const files = [...result.files, 'TOOL-BRIEF.md'];
  if (!dryRun) {
    try {
      fs.writeFileSync(path.join(result.directory, 'TOOL-BRIEF.md'),
        renderBriefDocument(brief), {flag: 'wx', mode: 0o644});
    } catch (error) {
      if (result.created) fs.rmSync(result.directory, {recursive: true, force: true});
      throw error;
    }
  }
  return {
    valid: true, created: result.created, slug: brief.slug,
    template: brief.template, outfit: brief.outfit,
    route: '/tools/' + brief.slug + '/', directory: result.directory, files
  };
}

function parseArgs(argv) {
  const opts = {dryRun: false, validateOnly: false, json: false};
  const seen = new Set();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {opts.help = true; continue;}
    if (['--dry-run', '--validate-only', '--json'].includes(arg)) {
      if (seen.has(arg)) throw new Error('Duplicate flag: ' + arg);
      seen.add(arg);
      opts[arg === '--dry-run' ? 'dryRun' : arg === '--json' ? 'json' : 'validateOnly'] = true;
      continue;
    }
    if (arg !== '--spec' || seen.has(arg)) throw new Error('Unknown or duplicate argument: ' + arg);
    seen.add(arg);
    if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error('Missing --spec path.');
    opts.filename = argv[++i];
  }
  if (opts.validateOnly && opts.dryRun) throw new Error('Choose either --validate-only or --dry-run.');
  if (!opts.help && !opts.filename) throw new Error('Specify --spec docs/ai/briefs/<name>.json');
  return opts;
}

if (require.main === module) {
  try {
    const opts = parseArgs(process.argv.slice(2));
    if (opts.help) {
      console.log('Toolya ChatGPT brief: --spec docs/ai/briefs/<name>.json [--validate-only | --dry-run] [--json]');
    } else {
      const result = buildFromBrief(opts);
      if (opts.json) console.log(JSON.stringify(result));
      else {
        console.log((result.created ? 'Created' : 'Validated / previewed') + ': ' + result.route);
        if (result.files) console.log('Files: ' + result.files.join(', '));
      }
    }
  } catch (error) {
    console.error('Toolya brief: ' + error.message);
    process.exitCode = 1;
  }
}

module.exports = {FIELDS, validateBrief, resolveBriefPath, readBrief,
  renderBriefDocument, buildFromBrief, parseArgs};
