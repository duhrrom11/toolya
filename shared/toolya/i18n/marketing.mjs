import {initializeToolyaI18next} from './i18next-singleton.mjs';
import {createToolyaI18nextAdapter} from './i18next-runtime-adapter.mjs';
const runtime=initializeToolyaI18next(globalThis.i18next);
const translator=runtime?createToolyaI18nextAdapter(runtime):null;
const locale=document.documentElement.lang==='en'?'en':'de';
// Translate only app-authored, explicitly marked elements; never user content.
for(const el of document.querySelectorAll('[data-i18n-marketing]')){
 const source=el.dataset.i18nMarketing;
 if(!source||!translator)continue;
 const translated=translator.translateExact(locale,'marketing',source);
 if(translated!==source)el.textContent=translated;
}
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
  // The language signal is explicit and limited to Toolya's existing app links.
  if (url.pathname.startsWith('/tools/') || url.pathname === '/dashboard/' || url.pathname === '/dashboard/index.html') url.searchParams.set('lang','en');
  for(const field of allow){
    const value=incoming.get(field);
    if(value&&/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(value))url.searchParams.set(field,value);
  }
  link.href=url.pathname+url.search+url.hash;
}
