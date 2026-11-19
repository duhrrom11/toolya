import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseHTML } from 'linkedom';

const root = new URL('../../', import.meta.url);
const origin = 'https://toolya.app';
const read = path => readFileSync(new URL(path, root), 'utf8');
const readPage = path => parseHTML(read(path)).document;
const sitemapUrls = Array.from(read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1]);

function hasNoindex(document) {
  return Array.from(document.querySelectorAll('meta[name]')).some(meta => {
    const name = meta.getAttribute('name').toLowerCase();
    return ['robots', 'googlebot', 'bingbot'].includes(name)
      && /\bnoindex\b/i.test(meta.getAttribute('content') ?? '');
  });
}

test('sitemap contains only public canonical, indexable HTML', () => {
  const unique = new Set(sitemapUrls);
  assert.ok(sitemapUrls.length > 0);
  assert.equal(unique.size, sitemapUrls.length, 'duplicate sitemap URLs');
  assert.ok(unique.has(origin + '/'), 'public homepage missing');
  assert.ok(unique.has(origin + '/tools/wishes/public.html'), 'public wishlist directory missing');

  for (const entry of sitemapUrls) {
    const url = new URL(entry);
    assert.equal(url.origin, origin, entry);
    assert.equal(url.href, url.origin + url.pathname, entry + ' contains URL parameters');
    const path = url.pathname.slice(1) + (url.pathname.endsWith('/') ? 'index.html' : '');
    const page = readPage(path);
    const canonical = Array.from(page.querySelectorAll('link[rel="canonical"]'), link => link.getAttribute('href'));
    assert.deepEqual(canonical, [entry], path + ' canonical mismatch');
    assert.ok(!hasNoindex(page), path + ' is excluded from indexing');
  }
});

test('tool, account and admin HTML stay outside the sitemap', () => {
  const files = execFileSync('git', ['ls-files', '--', '*.html'], { cwd: root, encoding: 'utf8' })
    .trim().split('\n');
  const sitemap = new Set(sitemapUrls);
  const privateAreas = files.filter(path => /^(tools|dashboard|admin-stats-dashboard)\//.test(path));
  assert.ok(privateAreas.length > 0);

  for (const path of privateAreas) {
    if (path === 'tools/wishes/public.html') continue;
    const direct = origin + '/' + path;
    const directory = direct.replace(/\/index\.html$/, '/');
    assert.ok(!sitemap.has(direct), path + ' is in the sitemap');
    assert.ok(!sitemap.has(directory), directory + ' is in the sitemap');
    const page = readPage(path);
    if (path === 'tools/wishes/index.html') {
      assert.equal(page.querySelector('link[rel="canonical"]')?.getAttribute('href'),
        origin + '/tools/wishes/public.html');
      assert.match(page.querySelector('meta[http-equiv="refresh"]')?.getAttribute('content') ?? '',
        /^0\s*;\s*url\s*=\s*\.\/public\.html$/i);
    } else {
      assert.ok(hasNoindex(page), path + ' lost noindex');
    }
  }
});
