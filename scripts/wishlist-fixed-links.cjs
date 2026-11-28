const {readFileSync} = require('node:fs');
const {parseHTML} = require('linkedom');

const home = 'https://toolya.app';
const pages = [
  ['/tools/wishes/public.html', 'tools/wishes/public.html'],
  ['/amazon-wunschliste-veroeffentlichen/', 'amazon-wunschliste-veroeffentlichen/index.html'],
  ['/en/publish-amazon-wishlist/', 'en/publish-amazon-wishlist/index.html']
];
const links = new Set(pages.map(([page]) => new URL(page, home).href));
for (const [page, path] of pages) {
  const {document} = parseHTML(readFileSync(path, 'utf8'));
  for (const node of document.querySelectorAll('a[href],link[rel=canonical],link[rel=alternate]')) {
    const href = node.getAttribute('href').trim();
    if (!href || href.startsWith('#')) continue;
    const url = new URL(href, new URL(page, home));
    if (url.origin !== home) continue;
    url.hash = '';
    links.add(url.href);
  }
}
process.stdout.write([...links].sort().join('\n') + '\n');
