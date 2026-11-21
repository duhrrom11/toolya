// Language preference changes only on an explicit language link click.
import {normalizeLocale} from './locale.mjs';
for (const link of document.querySelectorAll('a[data-set-locale]')) {
  link.addEventListener('click', () => {
    const locale=normalizeLocale(link.dataset.setLocale);
    if(!locale)return;
    try { localStorage.setItem('toolya-locale-v1',locale); } catch (_) { /* private browser mode */ }
  });
}
