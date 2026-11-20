import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { parseHTML } from 'linkedom';

const root = new URL('../../', import.meta.url);
const origin = 'https://toolya.app';
const read = path => readFileSync(new URL(path, root), 'utf8');
const readPage = path => parseHTML(read(path)).document;
const sitemapUrls = Array.from(read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1]);

const guideUrls = sitemapUrls.map(entry => new URL(entry))
  .filter(url => /^\/[^/]+\/$/.test(url.pathname));

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

test('public guides link to the website publisher and identify it in JSON-LD', () => {
  const website = JSON.parse(readPage('index.html')
    .querySelector('script[type="application/ld+json"]').textContent)['@graph']
    .find(entity => entity['@type'] === 'WebSite');
  const publisher = new URL(website.publisher['@id']);
  assert.equal(publisher.origin, origin);
  assert.ok(publisher.hash, 'publisher anchor missing');
  assert.ok(readPage(publisher.pathname.slice(1)).getElementById(publisher.hash.slice(1)),
    'publisher anchor has no target');

  assert.ok(guideUrls.length > 0, 'public guides missing from sitemap');
  for (const url of guideUrls) {
    const page = readPage(url.pathname.slice(1) + 'index.html');
    const meta = JSON.parse(page.querySelector('script[type="application/ld+json"]').textContent);
    assert.equal(meta.publisher?.['@id'], publisher.href, url.pathname + ' publisher mismatch');
    const links = Array.from(page.querySelectorAll('footer a[href]'),
      link => new URL(link.getAttribute('href'), url).href);
    assert.ok(links.includes(publisher.href), url.pathname + ' publisher link missing');
  }
});

test('public guide jump links and image accessibility attributes are present', () => {
  for (const url of guideUrls) {
    const path = url.pathname.slice(1) + 'index.html';
    const page = readPage(path);
    for (const link of page.querySelectorAll('a[href^="#"]')) {
      const target = link.getAttribute('href').slice(1);
      assert.ok(target && page.getElementById(target), path + ' missing jump target #' + target);
    }
    for (const image of page.querySelectorAll('main img')) {
      const label = path + ' ' + image.getAttribute('src');
      assert.ok(image.hasAttribute('alt'), label + ' missing alt attribute');
      assert.match(image.getAttribute('width') ?? '', /^[1-9]\d*$/, label + ' missing width');
      assert.match(image.getAttribute('height') ?? '', /^[1-9]\d*$/, label + ' missing height');
      if (image.closest('figure, a')) {
        assert.ok(image.getAttribute('alt').trim(), label + ' missing descriptive alt text');
      }
    }
  }
});

test('sitemap pages have complete social previews with local images', () => {
  for (const entry of sitemapUrls) {
    const url = new URL(entry);
    const path = url.pathname.slice(1) + (url.pathname.endsWith('/') ? 'index.html' : '');
    const page = readPage(path);
    for (const property of ['og:title', 'og:description', 'og:locale', 'og:url', 'og:image']) {
      const tags = page.querySelectorAll(`meta[property="${property}"]`);
      assert.equal(tags.length, 1, path + ' expected exactly one ' + property);
      assert.ok(tags[0].getAttribute('content')?.trim(), path + ' empty ' + property);
    }
    assert.equal(page.querySelector('meta[property="og:url"]').getAttribute('content'), entry);
    const image = new URL(page.querySelector('meta[property="og:image"]').getAttribute('content'));
    assert.equal(image.origin, origin, path + ' preview image must be hosted on Toolya');
    assert.ok(existsSync(new URL(image.pathname.slice(1), root)), path + ' preview image missing');
    assert.match(page.querySelector('meta[name="twitter:card"]')?.getAttribute('content') ?? '',
      /^summary(_large_image)?$/, path + ' invalid Twitter card');
  }
});
