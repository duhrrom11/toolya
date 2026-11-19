import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('llms.txt lists unique public sitemap URLs', () => {
  const read = name => readFileSync(new URL('../../' + name, import.meta.url), 'utf8');
  const sitemap = new Set(Array.from(read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1]));
  const index = read('llms.txt');
  assert.match(index, /^# Toolya\n\n> /);
  const links = index.split('\n').filter(line => line.startsWith('- '));
  assert.ok(links.length > 0);
  const seen = new Set();
  for (const line of links) {
    const link = line.match(/^- \[[^\]]+\]\((https:\/\/toolya\.app\/[^)\s]*)\)$/);
    assert.ok(link, line);
    const [, url] = link;
    assert.ok(sitemap.has(url), 'Not in sitemap: ' + url);
    assert.ok(!seen.has(url), 'Duplicate URL: ' + url);
    seen.add(url);
  }
});
