import { scrape } from './toolya-core.mjs';
import { createClient } from 'npm:@supabase/supabase-js@2.49.8';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const MARKET = new Set(['amazon.de']);
const PATH = /^\/(?:hz\/wishlist\/ls\/[A-Z0-9]+|gp\/registry\/wishlist\/[A-Z0-9]+|registry\/wishlist\/[A-Z0-9]+)\/?$/i;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function amazonUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string' || raw.length > 2048) return null;
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
        !MARKET.has(hostname) || !PATH.test(url.pathname)) return null;
    return url;
  } catch { return null; }
}
function plain(raw: string): string {
  return raw.replace(/<[^>]*>/g, ' ').replace(/&(?:amp|#38);/gi, '&')
    .replace(/&(?:quot|#34);/gi, '"').replace(/&(?:apos|#39);/gi, "'")
    .replace(/&(?:lt|#60);/gi, '<').replace(/&(?:gt|#62);/gi, '>')
    .replace(/\s+/g, ' ').trim();
}
export function parseAmazonHtml(html: string, publicationId: string, base: URL) {
  const products: { publication_id: string; title: string; asin: string; product_url: string }[] = [];
  const seen = new Set<string>();
  const anchor = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchor.exec(html)) !== null && products.length < 100) {
    let link: URL;
    try { link = new URL(match[1].replace(/&amp;/g, '&'), base); } catch { continue; }
    if (link.hostname !== base.hostname || link.protocol !== 'https:') continue;
    const asin = link.pathname.match(/^\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:\/|$)/i)?.[1]?.toUpperCase();
    if (!asin || seen.has(asin)) continue;
    const title = plain(match[2]).slice(0, 300);
    if (title.length < 5) continue;
    seen.add(asin);
    products.push({ publication_id: publicationId, title, asin, product_url: new URL('/dp/' + asin, base).href });
  }
  return products;
}
export function controllerError(error: unknown): string {
  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) return 'Amazon-Anfrage hat das Zeitlimit überschritten';
  if (error instanceof Error && ['Amazon-Zugriff nicht verfügbar', 'Antwort zu groß', 'Leere Amazon-Antwort', 'Amazon verlangt eine Zugriffsprüfung', 'Produktdaten konnten nicht gespeichert werden'].includes(error.message)) return error.message;
  return 'Amazon-Daten derzeit nicht verfügbar';
}
export async function handleRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anon || !secret) return json({ error: 'Service unavailable' }, 503);
  const auth = req.headers.get('authorization') || '';
  if (!/^Bearer\s+\S+$/i.test(auth)) return json({ error: 'Unauthorized' }, 401);
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const payload = body && typeof body === 'object' && !Array.isArray(body) ? body as { publication_id?: unknown; amazon_url?: unknown; action?: unknown } : {};
  const creating = payload.action === 'create';
  const publicationId = payload.publication_id;
  if (!creating && (typeof publicationId !== 'string' || !ID.test(publicationId))) return json({ error: 'Invalid publication ID' }, 400);
  const admin = createClient(url, secret);
  let list: {id:string;user_id:string;amazon_url:string;scrape_status:string} | null = null;
  if (creating) {
    const valid = amazonUrl(payload.amazon_url);
    if (!valid) return json({error:'Nur öffentliche Amazon.de-Wunschlistenlinks sind erlaubt'},400);
    const profile = await admin.from('wishlist_profiles').select('first_name,last_name').eq('user_id',user.id).maybeSingle();
    if (profile.error || !profile.data?.first_name?.trim() || !profile.data?.last_name?.trim())
      return json({error:'Bitte zuerst dein Profil vervollständigen'},400);
    const inserted = await admin.from('wishlist_amazon_publications').insert({user_id:user.id,amazon_url:valid.href}).select('id,user_id,amazon_url,scrape_status').single();
    if (inserted.error) return json({error:'Wunschliste konnte nicht angelegt werden'},400);
    list = inserted.data;
  } else {
    const found = await admin.from('wishlist_amazon_publications').select('id,user_id,amazon_url,scrape_status').eq('id',publicationId).eq('user_id',user.id).maybeSingle();
    if (found.error || !found.data) return json({error:'Not found'},404);
    list = found.data;
  }
  const target = amazonUrl(list.amazon_url);
  if (!target) return json({ error: 'Invalid Amazon URL' }, 400);
  // The database serializes claims per user and enforces limits across all edge instances.
  const { data: claim, error: claimError } = await admin.rpc('claim_amazon_wishlist_scrape', {
    p_publication_id: list.id, p_user_id: user.id,
  });
  if (claimError) { if (creating) await admin.from('wishlist_amazon_publications').delete().eq('id',list.id).eq('user_id',user.id); return json({error:'Scraper unavailable'},503); }
  if (claim === 'rate_limited') { if (creating) await admin.from('wishlist_amazon_publications').delete().eq('id',list.id).eq('user_id',user.id); return json({error:'Too many scrape requests'},429); }
  if (claim !== 'claimed') { if (creating) await admin.from('wishlist_amazon_publications').delete().eq('id',list.id).eq('user_id',user.id); return json({error:'Already processed or in progress'},409); }

  let scrape_status = 'failed', scrape_error: string | null = 'Keine auslesbaren Produkte', title: string | null = null;
  let productCount = 0, priceCount = 0, descriptionCount = 0;
  try {
    // Reuse Toolya's deployed v17 parser, including wishlist pagination and completeness checks.
    // Only complete imports are persisted: never publish misleading partial product sets.
    if (!['amazon.de', 'www.amazon.de'].includes(target.hostname)) {
      throw new Error('Der bestehende Toolya-Importer unterstützt derzeit Amazon.de');
    }
    const result = await scrape(target.href, fetch, { enrichMissing: true });
    if (result.kind !== 'list' || !result.complete || !result.products.length) {
      throw new Error('Amazon-Wunschliste konnte nicht vollständig gelesen werden');
    }
    const products = result.products.map((p: { asin: string; title: string; description?: string; price?: number | null; imageUrl?: string | null; productUrl: string }) => ({
      publication_id: list.id, asin: p.asin, title: p.title,
      description: p.description?.trim() || null, price: typeof p.price === 'number' && Number.isFinite(p.price) ? p.price : null, product_url: p.productUrl, image_url: p.imageUrl || null,
    }));
    // One transaction replaces the previous snapshot only after a complete scrape.
    // A failed fetch, parse or database write leaves existing products untouched.
    const committed = await admin.rpc('commit_amazon_wishlist_scrape', {
      p_publication_id: list.id, p_user_id: user.id,
      p_products: products, p_title: result.title?.slice(0, 200) || null,
    });
    if (committed.error) throw new Error('Produktdaten konnten nicht gespeichert werden');
    productCount = committed.data;
    priceCount = products.filter(p => p.price !== null).length;
    descriptionCount = products.filter(p => p.description !== null).length;
    title = result.title?.slice(0, 200) || null;
    scrape_status = 'success';
    scrape_error = null;
  } catch (e) {
    scrape_error = controllerError(e);
  }
  const saved = scrape_status === 'success' ? { error: null } : await admin.from('wishlist_amazon_publications')
    .update({ scrape_status, scrape_error, updated_at: new Date().toISOString() })
    .eq('id', list.id).eq('user_id', user.id).eq('scrape_status', 'processing');
  if (creating && scrape_status !== 'success') await admin.from('wishlist_amazon_publications').delete().eq('id',list.id).eq('user_id',user.id);
  if (saved.error) return json({ error: 'Scraper-Status konnte nicht gespeichert werden' }, 503);
  return json({ status: scrape_status, product_count: productCount, price_count: priceCount, description_count: descriptionCount, ...(creating && scrape_status==='success' ? {publication_id:list.id} : {}), ...(creating && scrape_status==='failed' ? {error:'Die Amazon-Liste ist nicht öffentlich erreichbar oder konnte nicht vollständig gelesen werden'} : {}) });
}

if (import.meta.main) Deno.serve(handleRequest);
