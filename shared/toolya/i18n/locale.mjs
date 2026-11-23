/**
 * Toolya language helpers. No auth, database, or DOM writes.
 * Importable in the browser and by Node's built-in test runner.
 */
export const SUPPORTED_LOCALES = Object.freeze(['de', 'en']);
export const DEFAULT_LOCALE = 'de';
const SAFE_CAMPAIGN = /^[a-z0-9][a-z0-9_-]{0,79}$/i;

export function normalizeLocale(value) {
  if (typeof value !== 'string') return null;
  // Accept valid BCP 47-style language tags, not arbitrary strings that merely
  // begin with "de" or "en". This is a display preference, never a data key.
  const candidate = value.trim().replace(/_/g, '-');
  if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(candidate)) return null;
  const language = candidate.split('-')[0].toLowerCase();
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

const PUBLIC_GUIDES = Object.freeze({
  'moving-boxes': 'umzugskisten',
  'roommate-organizer': 'wg-organisator',
  'plant-care': 'pflanzenpflege',
  'cake-pan-calculator': 'backform-rechner',
  'vehicle-costs': 'autokosten',
  'household-budget': 'haushaltsbuch',
  'digital-estate': 'digitaler-nachlass',
  'parking-spot': 'parkplatz-merker',
  'pet-health': 'tiergesundheit',
  'lent-items': 'verliehene-dinge',
  'meter-readings': 'zaehlerstaende',
  'publish-amazon-wishlist': 'amazon-wunschliste-veroeffentlichen',
  'toolya-dashboard': 'toolya-dashboard'
});

export function localizedPublicUrl(locale, slug = '') {
  const language = normalizeLocale(locale) || DEFAULT_LOCALE;
  let clean = String(slug);
  while (clean.startsWith('/')) clean = clean.slice(1);
  while (clean.endsWith('/')) clean = clean.slice(0, -1);
  if (clean && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(clean)) throw new Error('Invalid public landing slug');
  if (!clean) return language === 'de' ? '/' : '/en/';
  if (!Object.hasOwn(PUBLIC_GUIDES, clean)) throw new Error('Unknown public landing slug');
  return language === 'de' ? '/' + PUBLIC_GUIDES[clean] + '/' : '/en/' + clean + '/';
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
