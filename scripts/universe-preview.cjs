// Serve the release candidate on loopback with a separate Supabase backend.
const { createServer } = require('node:http');
const { readFile, realpath } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');

const productionRef = 'yheogmeaosuigyaxkwth';
const productionKey = 'sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv';
const existingProjects = new Set([productionRef, 'avapuibsidubuzxjtyld']);
const siteRoot = resolve(__dirname, '..');
const host = '127.0.0.1';
const topLevel = /^(?:account|assets|dashboard|en|shared|tools)\//;
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};
const rewriteTypes = new Set(['.html', '.js', '.mjs', '.json']);

function previewConfig(env) {
  const ref = env.TOOLYA_PREVIEW_SUPABASE_REF;
  const key = env.TOOLYA_PREVIEW_SUPABASE_KEY;
  const port = Number(env.TOOLYA_PREVIEW_PORT ?? 4173);
  if (!/^[a-z]{20}$/.test(ref ?? '') || existingProjects.has(ref)) {
    throw Error('Set TOOLYA_PREVIEW_SUPABASE_REF to a separate test project. Existing Toolya and Helferlein projects are blocked.');
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key ?? '') || key === productionKey) {
    throw Error('Set TOOLYA_PREVIEW_SUPABASE_KEY to the publishable key of the test project.');
  }
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Invalid preview port.');
  return { ref, key, port, backend: `https://${ref}.supabase.co`, origin: `http://${host}:${port}` };
}

function rewrite(source, config) {
  return source.replaceAll(productionRef, config.ref)
    .replaceAll(productionKey, config.key)
    .replace(/https:\/\/(?:www\.)?toolya\.app(?![\w.-])/gu, config.origin);
}

function previewServer(config) {
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Security-Policy', `connect-src 'self' ${config.backend}; worker-src 'none'; frame-src 'self'; object-src 'none'; form-action 'self';`);
    if (request.headers.host !== new URL(config.origin).host) {
      response.writeHead(403).end();
      return;
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    try {
      const requested = decodeURIComponent(new URL(request.url, config.origin).pathname).slice(1);
      const relative = requested.endsWith('/') || requested === '' ? requested + 'index.html' : requested;
      const allowed = topLevel.test(relative) || /^(?:index|privacy|legal)\.html$/.test(relative);
      if (!allowed || relative.split('/').some(part => part.startsWith('.') || part.includes('\\'))) {
        response.writeHead(404).end();
        return;
      }
      const target = await realpath(resolve(siteRoot, relative));
      const extension = extname(target);
      if (!target.startsWith(siteRoot + sep) || !Object.hasOwn(types, extension)) {
        response.writeHead(404).end();
        return;
      }
      const body = await readFile(target, rewriteTypes.has(extension) ? 'utf8' : undefined);
      response.setHeader('Content-Type', types[extension]);
      response.end(request.method === 'HEAD' ? undefined : (typeof body === 'string' ? rewrite(body, config) : body));
    } catch {
      response.writeHead(404).end();
    }
  });
}

if (require.main === module) {
  try {
    const config = previewConfig(process.env);
    previewServer(config).listen(config.port, host, () => console.log(`${config.origin}/tools/gamification/`));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { previewConfig, previewServer };
