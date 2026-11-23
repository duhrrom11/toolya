#!/usr/bin/env node
'use strict';

// Read-only, loopback-bound draft preview with no backend or API proxy.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MIME = Object.freeze({
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json', '.png':'image/png', '.webp':'image/webp',
  '.svg':'image/svg+xml', '.ico':'image/x-icon', '.woff2':'font/woff2'
});
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; font-src 'self'; connect-src 'none'; " +
  "form-action 'none'; object-src 'none'; frame-src 'none'; base-uri 'self'";

function parsePreviewOptions(args) {
  const options = {port:4173};
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--help' || key === '-h') {options.help = true; continue;}
    if (!['--slug','--port'].includes(key)) throw new Error('Unknown flag: ' + key);
    const value = args[++i];
    if (!value || value.startsWith('--') || seen.has(key)) {
      throw new Error('Missing or duplicate option: ' + key);
    }
    seen.add(key);
    options[key.slice(2)] = value;
  }
  const port = Number(options.port);
  if (!Number.isSafeInteger(port) || port < 0 || port > 65535 ||
      !/^\d+$/.test(String(options.port))) throw new Error('Port must be 0-65535.');
  options.port = port;
  return options;
}

function assertDraft(repoRoot, slug) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug || '') || slug.length > 40) {
    throw new Error('Invalid draft slug.');
  }
  const root = fs.realpathSync(repoRoot);
  const dir = path.join(root, 'tools', slug);
  if (!fs.lstatSync(dir).isDirectory() || fs.realpathSync(dir) !== dir) {
    throw new Error('Draft folder must be a real directory.');
  }
  const file = path.join(dir, 'index.html');
  if (!fs.lstatSync(file).isFile() || fs.realpathSync(file) !== file) {
    throw new Error('Draft entry point must be a regular file.');
  }
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('data-toolya-draft="true"') ||
      !html.includes('name="robots" content="noindex,nofollow"')) {
    throw new Error('Only explicit noindex tool drafts can be previewed.');
  }
  return {root, slug};
}

function allowedPath(pathname, slug) {
  if (pathname === '/') return 'redirect';
  if (pathname === '/tools/' + slug + '/') return 'tools/' + slug + '/index.html';
  if (pathname === '/tools/' + slug + '/index.html' ||
      pathname === '/tools/' + slug + '/app.mjs') return pathname.slice(1);
  if (/^\/shared\/toolya\/[a-zA-Z0-9/_-]+\.(?:mjs|js|css|json)$/.test(pathname)) return pathname.slice(1);
  if (/^\/assets\/[a-zA-Z0-9/_-]+\.(?:css|js|mjs|json|png|webp|svg|woff2)$/.test(pathname)) return pathname.slice(1);
  if (pathname === '/favicon.ico' || pathname === '/manifest.json') return pathname.slice(1);
  return null;
}

function createPreviewServer({repoRoot = ROOT, slug}) {
  const {root} = assertDraft(repoRoot, slug);
  return http.createServer((req,res) => {
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Security-Policy', CSP);
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405); return res.end();}
    const hostname = (req.headers.host || '').split(':')[0].toLowerCase();
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
      res.writeHead(403); return res.end();
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname); }
    catch {res.writeHead(400);return res.end();}
    if (pathname.includes('\\') || pathname.includes('//') ||
        pathname.split('/').some(segment => segment === '.' || segment === '..')) {
      res.writeHead(403);return res.end();
    }
    const relative = allowedPath(pathname, slug);
    if (relative === 'redirect') {
      res.writeHead(302, {'Location':'/tools/' + slug + '/'});return res.end();
    }
    if (!relative) {res.writeHead(404);return res.end();}
    const target = path.resolve(root,relative);
    if (!target.startsWith(root + path.sep)) {res.writeHead(403);return res.end();}
    let real;
    try {
      real = fs.realpathSync(target);
      if (real !== target || !fs.statSync(real).isFile()) {
        res.writeHead(403);return res.end();
      }
    } catch {res.writeHead(404);return res.end();}
    const mime = MIME[path.extname(real)];
    if (!mime) {res.writeHead(403);return res.end();}
    res.writeHead(200, {'Content-Type':mime});
    if (req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(real);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  });
}

if (require.main === module) {
  try {
    const opts = parsePreviewOptions(process.argv.slice(2));
    if (opts.help) {
      console.log('Local-only preview: node scripts/preview-tool.cjs --slug my-draft [--port 4173]');
    } else {
      const server = createPreviewServer({slug:opts.slug});
      server.listen(opts.port, '127.0.0.1', () => {
        console.log('Toolya draft preview: http://127.0.0.1:' + server.address().port + '/tools/' + opts.slug + '/');
        console.log('Local browser only. No cloud, API, production data or deployment.');
      });
    }
  } catch (err) {console.error('Preview error: ' + err.message);process.exitCode = 1;}
}
module.exports = {parsePreviewOptions, assertDraft, allowedPath, createPreviewServer};
