import {initializeToolyaI18next} from './i18next-singleton.mjs';
import {createToolyaI18nextAdapter} from './i18next-runtime-adapter.mjs';
const runtime=initializeToolyaI18next(globalThis.i18next);
const translator=runtime?createToolyaI18nextAdapter(runtime):null;
for(const el of document.querySelectorAll('[data-i18n-marketing]')){
 const source=el.dataset.i18nMarketing;
 if(!source||!translator)continue;
 const translated=translator.translateExact('de','marketing',source);
 if(translated!==source)el.textContent=translated;
}
// Language preference changes only on an explicit language link click.
import {normalizeLocale} from './locale.mjs';
for (const link of document.querySelectorAll('a[data-set-locale]')) {
  link.addEventListener('click', () => {
    const locale=normalizeLocale(link.dataset.setLocale);
    if(!locale)return;
    try { localStorage.setItem('toolya-locale-v1',locale); } catch (_) { /* private browser mode */ }
  });
}
