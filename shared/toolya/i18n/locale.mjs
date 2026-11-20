/**
 * Toolya language helpers. No auth, database, or DOM writes.
 * Importable in the browser and by Node's built-in test runner.
 */
export const SUPPORTED_LOCALES = Object.freeze(['de', 'en']);
export const DEFAULT_LOCALE = 'de';
const SAFE_CAMPAIGN = /^[a-z0-9][a-z0-9_-]{0,79}$/i;

export function normalizeLocale(value) {
  if (typeof value !== 'string') return null;
  const candidate = value.trim().toLowerCase().replace('_', '-');
  const language = candidate.split('-')[0];
  return SUPPORTED_LOCALES.includes(language) ? language : null;
}

export function localeFromPath(pathname) {
  const match = /^\/(de|en)(?:\/|$)/i.exec(pathname || '');
  return match ? match[1].toLowerCase() : null;
}

export function resolveLocale({pathname = '/', explicit = null, saved = null, browser = []} = {}) {
  const pathLocale = localeFromPath(pathname);
  if (pathLocale) return pathLocale;
  const manual = normalizeLocale(explicit) || normalizeLocale(saved);
  if (manual) return manual;
  for (const lang of browser) {
    const candidate = normalizeLocale(lang);
    if (candidate) return candidate;
  }
  return DEFAULT_LOCALE;
}

export function localizedPublicUrl(locale, slug = '') {
  const language = normalizeLocale(locale) || DEFAULT_LOCALE;
  const clean = String(slug).replace(/^\/+|\/+$/g, '');
  if (clean && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(clean)) throw new Error('Invalid public landing slug');
  return '/' + language + '/' + (clean ? clean + '/' : '');
}

export function campaignUrl({locale = 'de', slug = '', source, campaign, medium = 'organic_social', content = null} = {}) {
  if (!SAFE_CAMPAIGN.test(source || '') || !SAFE_CAMPAIGN.test(campaign || '') ||
      !SAFE_CAMPAIGN.test(medium || '') || (content !== null && !SAFE_CAMPAIGN.test(content))) {
    throw new Error('Invalid campaign parameter');
  }
  const url = new URL(localizedPublicUrl(locale, slug), 'https://toolya.app');
  url.searchParams.set('utm_source', source);
  url.searchParams.set('utm_medium', medium);
  url.searchParams.set('utm_campaign', campaign);
  if (content) url.searchParams.set('utm_content', content);
  return url.toString();
}
