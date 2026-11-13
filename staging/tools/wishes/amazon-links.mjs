/** Amazon-only URL parsing. No scraping, pricing, or product metadata claims. */
const MARKETS = new Set(['amazon.de','amazon.com','amazon.co.uk','amazon.fr','amazon.it','amazon.es','amazon.nl','amazon.pl','amazon.se','amazon.com.be','amazon.co.jp','amazon.ca','amazon.com.au']);
export function parseAmazonUrl(input) {
  if (typeof input !== 'string' || input.length > 4096 || /[\u0000-\u001f\u007f]/.test(input) || / /.test(input.trim())) return null;
  let url;
  try { url = new URL(input.trim()); } catch { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase().replace(/^(?:www|smile|m)\./,'');
  if (!MARKETS.has(host) || url.username || url.password || url.port) return null;
  const match = url.pathname.match(/^\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:\/|$)/i);
  if (!match) return null;
  return { asin: match[1].toUpperCase(), marketplace: host };
}
export function affiliateUrl(product, tags) {
  if (!product || !/^[A-Z0-9]{10}$/.test(product.asin) || !MARKETS.has(product.marketplace)) throw new Error('Invalid product');
  const tag = tags?.[product.marketplace];
  if (!tag || !/^[a-zA-Z0-9_-]{1,64}$/.test(tag)) throw new Error('Missing valid marketplace affiliate tag');
  const url = new URL('https://www.' + product.marketplace + '/dp/' + product.asin);
  url.searchParams.set('tag', tag);
  return url.toString();
}

/** Canonicalize externally shared Amazon.de links; discard third-party tracking parameters. */
export function sharedAmazonProductUrl(input) {
  const product=parseAmazonUrl(input);
  return product?.marketplace==='amazon.de' ? 'https://www.amazon.de/dp/'+product.asin : null;
}
