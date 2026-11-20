// Explicit user choice only. Does not touch Toolya buddy, auth, or application storage.
import {normalizeLocale} from './locale.mjs';
const key='toolya-locale-v1';
for (const link of document.querySelectorAll('[data-set-locale]')) {
  link.addEventListener('click', () => {
    const locale=normalizeLocale(link.dataset.setLocale);
    if (!locale) return;
    try { localStorage.setItem(key, locale); } catch (_) { /* storage may be blocked */ }
  });
}
// Preserve only recognized UTM campaign fields on same-origin tool CTA navigation,
// without storing identifiers or adding third-party trackers.
const allow=['utm_source','utm_medium','utm_campaign','utm_content'];
const incoming=new URLSearchParams(location.search);
for (const link of document.querySelectorAll('a[data-tool-link]')) {
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin)continue;
  for(const field of allow){
    const value=incoming.get(field);
    if(value&&/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(value))url.searchParams.set(field,value);
  }
  link.href=url.pathname+url.search+url.hash;
}
