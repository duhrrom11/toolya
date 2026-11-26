/** Static homepage translation only; no application catalogues or auth dependencies. */
import {MARKETING_COPY} from './marketing-copy.mjs';
import {normalizeLocale} from './locale.mjs';

export function mountPublicHome(document, location, storage) {
 const locale = document.documentElement.lang === 'en' ? 'en' : 'de';
 for (const el of document.querySelectorAll('[data-i18n-marketing]')) {
  const source = el.dataset.i18nMarketing;
  if (locale === 'en' && source && Object.hasOwn(MARKETING_COPY, source)) {
   const translated = MARKETING_COPY[source];
   if (translated !== source) el.textContent = translated;
  }
 }
 const key = 'toolya-locale-v1';
 for (const link of document.querySelectorAll('[data-set-locale]')) {
  link.addEventListener('click', () => {
   const locale = normalizeLocale(link.dataset.setLocale);
   if (!locale) return;
   try { storage?.setItem(key, locale); } catch (_) { /* storage may be blocked */ }
  });
 }
 // Preserve only recognized UTM campaign fields on same-origin tool CTA links.
 const allow = ['utm_source','utm_medium','utm_campaign','utm_content'];
 const incoming = new URLSearchParams(location.search);
 for (const link of document.querySelectorAll('a[data-tool-link]')) {
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) continue;
  if (url.pathname.startsWith('/tools/') || url.pathname === '/dashboard/' || url.pathname === '/dashboard/index.html') url.searchParams.set('lang', locale);
  for (const field of allow) {
   const value = incoming.get(field);
   if (value && /^[a-z0-9][a-z0-9_-]{0,79}$/i.test(value)) url.searchParams.set(field,value);
  }
  link.href = url.pathname + url.search + url.hash;
 }
}
if (typeof document !== 'undefined') {
 let storage;
 try { storage = globalThis.localStorage; } catch (_) { /* storage may be blocked */ }
 mountPublicHome(document, location, storage);
}
