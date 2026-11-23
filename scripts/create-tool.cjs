#!/usr/bin/env node
'use strict';

// Offline-only scaffold for a NEW Toolya webtool. No network, database or deployment.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const HELP = [
  'Toolya tool scaffold (offline, not a deployment)',
  'Usage:',
  '  node scripts/create-tool.cjs --slug example-tool --title "Beispieltool" --description "Ein neues Tool fuer den Alltag." [--dry-run]',
  '',
  'Creates tools/<slug>/{index.html,app.mjs,README.md} only if the folder is new.',
  'Generated pages are noindex prototypes, not registered or published tools.'
].join('\n');

function parseOptions(argv) {
  const options = {dryRun: false};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') { options.help = true; continue; }
    if (arg === '--dry-run') { options.dryRun = true; continue; }
    if (!['--slug', '--title', '--description'].includes(arg)) {
      throw new Error('Unknown argument: ' + arg);
    }
    const value = argv[++i];
    if (!value || value.startsWith('--') || options[arg.slice(2)] !== undefined) {
      throw new Error('Missing or duplicate value for ' + arg);
    }
    options[arg.slice(2)] = value;
  }
  return options;
}

function validateToolArgs({slug, title, description}) {
  if (typeof slug !== 'string' || slug.length > 40 ||
      !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Slug must be 1-40 lowercase ASCII letters, digits or single hyphens.');
  }
  for (const [name, value, min, max] of [
    ['title', title, 3, 80], ['description', description, 10, 180]
  ]) {
    if (typeof value !== 'string' || value.trim() !== value ||
        value.length < min || value.length > max || /[\x00-\x1f\x7f]/.test(value)) {
      throw new Error(name + ' must be ' + min + '-' + max + ' trimmed, single-line characters.');
    }
  }
}

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderToolFiles(args) {
  validateToolArgs(args);
  const {slug, title, description} = args;
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const html = [
    '<!doctype html>',
    '<html lang="de">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width,initial-scale=1">',
    '  <meta name="robots" content="noindex,nofollow">',
    '  <title>' + safeTitle + ' | Toolya (Entwurf)</title>',
    '  <meta name="description" content="' + safeDescription + '">',
    '  <link rel="stylesheet" href="../../shared/toolya/alpha.css">',
    '  <script type="module" src="../../shared/toolya/platform.mjs"></script>',
    '  <script type="module" src="./app.mjs"></script>',
    '  <style>',
    '    body{margin:0;background:#f4faf9;color:#16383d;font:16px/1.6 system-ui,sans-serif}',
    '    .draft-wrap{max-width:880px;margin:auto;padding:2rem 1rem 4rem}',
    '    .draft-panel{padding:1.5rem;border:1px solid #d5e7e6;background:#fff;border-radius:1rem}',
    '    .draft-action{border:0;border-radius:.7rem;background:#087e82;color:white;padding:.8rem 1.2rem;font:inherit;cursor:pointer}',
    '    :focus-visible{outline:3px solid #087e82;outline-offset:3px}',
    '  </style>',
    '</head>',
    '<body>',
    '  <header class="draft-wrap">',
    '    <a href="/">Zur Toolya-Startseite</a>',
    '    <h1>' + safeTitle + '</h1>',
    '    <p>' + safeDescription + '</p>',
    '  </header>',
    '  <main id="main" class="draft-wrap">',
    '    <section class="draft-panel" aria-labelledby="draft-title">',
    '      <h2 id="draft-title">Funktionsprototyp</h2>',
    '      <p>Hier entsteht die eigentliche Tool-Funktion. Dieser Entwurf speichert keine Daten.</p>',
    '      <button class="draft-action" id="draft-action" type="button">Funktion pruefen</button>',
    '      <p role="status" id="draft-status" aria-live="polite"></p>',
    '    </section>',
    '  </main>',
    '</body>',
    '</html>',
    ''
  ].join('\n');
  const app = [
    '// Local-only placeholder. Replace with tested tool logic before release.',
    "const action = document.querySelector('#draft-action');",
    "const status = document.querySelector('#draft-status');",
    "if (action && status) action.addEventListener('click', () => {",
    "  status.textContent = 'Vorlage bereit. Noch keine produktive Funktion.';",
    '});',
    ''
  ].join('\n');
  const readme = [
    '# ' + title + ' (unveroeffentlichter Entwurf)',
    '',
    'Route nach Freigabe: /tools/' + slug + '/ (derzeit nicht registriert).',
    '',
    'Dies ist ein Offline-Geruest, **kein fertiges Tool**. Der Generator veraendert',
    'keine vorhandenen Seiten, Tabellen, Edge Functions oder Live-Einstellungen.',
    '',
    'Vor einem Release:',
    '- [ ] Fachfunktion und isolierte Tests implementieren.',
    '- [ ] Neue Route in Navigation/SEO nur nach Entscheidung aufnehmen.',
    '- [ ] Tool-Mapping, thematisches Outfit und Nutzerauswahl in shared/toolya/platform.mjs pruefen.',
    '- [ ] Vorhandene Header-, Footer- und Wortmarken-Assets statt Eigenbauten verwenden.',
    '- [ ] Cloud-Funktionen ausschliesslich mit Auth/RLS, Fail-Closed-Verhalten und separater Freigabe.',
    '- [ ] Barrierefreiheit, Mobilansicht, Locale, Datenschutz und Tests pruefen.',
    '- [ ] noindex-Entwurfsstatus erst im Release-PR anhand der SEO-Strategie anpassen.',
    '',
    'Siehe docs/ai/TOOL-GENERATOR.md und AGENTS.md.',
    ''
  ].join('\n');
  return Object.freeze({'index.html': html, 'app.mjs': app, 'README.md': readme});
}

function generateTool({repoRoot = ROOT, slug, title, description, dryRun = false}) {
  const files = renderToolFiles({slug, title, description});
  const toolsDir = path.resolve(repoRoot, 'tools');
  if (!fs.existsSync(toolsDir) || !fs.statSync(toolsDir).isDirectory()) {
    throw new Error('Missing tools/ folder in target repository.');
  }
  const directory = path.resolve(toolsDir, slug);
  if (path.dirname(directory) !== toolsDir) throw new Error('Unsafe target directory.');
  if (fs.existsSync(directory)) throw new Error('Tool already exists; will not overwrite: ' + slug);
  if (dryRun) return {directory, files: Object.keys(files), created: false};
  fs.mkdirSync(directory);
  try {
    for (const [name, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(directory, name), content, {flag: 'wx', mode: 0o644});
    }
  } catch (error) {
    fs.rmSync(directory, {recursive: true, force: true});
    throw error;
  }
  return {directory, files: Object.keys(files), created: true};
}

if (require.main === module) {
  try {
    const args = parseOptions(process.argv.slice(2));
    if (args.help) console.log(HELP);
    else {
      const result = generateTool(args);
      console.log((result.created ? 'Created: ' : 'Dry run (no files written): ') + result.directory);
      console.log(result.files.join(', '));
    }
  } catch (error) {
    console.error('Toolya scaffold: ' + error.message);
    process.exitCode = 1;
  }
}
module.exports = {parseOptions, validateToolArgs, renderToolFiles, generateTool};
