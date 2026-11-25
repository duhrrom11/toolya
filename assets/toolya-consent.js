// Toolya GA4 consent: no Google requests until explicit opt-in.
// Localized presentation only: the same stored yes/no consent and GA policy
// apply in either language. No additional i18n runtime or external request.
const CONSENT_COPY=Object.freeze({
 de:{dialog:'Statistik-Einstellungen',heading:'Statistik bei Toolya',
  message:'Dürfen wir mit Google Analytics Nutzungsstatistiken erstellen? Ohne Zustimmung wird Google Analytics nicht geladen. ',
  privacy:'Datenschutz',privacyHref:'/privacy.html',reject:'Ablehnen',
  accept:'Akzeptieren',settings:'Cookie-Einstellungen'},
 en:{dialog:'Analytics settings',heading:'Analytics at Toolya',
  message:'May we use Google Analytics to collect usage statistics? Without your consent, Google Analytics is not loaded. ',
  privacy:'Privacy notice',privacyHref:'/en/privacy.html',reject:'Reject',
  accept:'Accept',settings:'Cookie settings'}
});
function consentLocale(){
 const query=new URLSearchParams(location.search).get('lang');
 if(query==='de'||query==='en')return query;
 if(window.__toolyaUILocale==='de'||window.__toolyaUILocale==='en')return window.__toolyaUILocale;
 if(document.documentElement.lang==='en')return 'en';
 // Application locale switches set the document language before dispatching.
 // A stale saved preference must not override an explicitly selected German UI.
 if((window.__toolyaWishesLocale||window.__toolyaEstateLocale||window.__toolyaDashboardLocale||window.__toolyaAdminLocale)==='de')return 'de';
 if(location.pathname.startsWith('/tools/')||location.pathname.startsWith('/dashboard/')){
  try{return localStorage.getItem('toolya-locale-v1')==='en'?'en':'de'}catch{}
 }
 return 'de';
}
function localizeConsentPanel(panel,settings){
 const language=consentLocale(),copy=CONSENT_COPY[language];
 panel.lang=language;
 panel.setAttribute('aria-label',copy.dialog);
 panel.querySelector('strong').textContent=copy.heading;
 const description=panel.querySelector('p'),privacy=description.querySelector('a');
 // Update text nodes only, retaining the existing safe privacy link and listeners.
 description.firstChild.nodeValue=copy.message;
 privacy.href=copy.privacyHref;
 privacy.textContent=copy.privacy;
 panel.querySelector('.reject').textContent=copy.reject;
 panel.querySelector('.accept').textContent=copy.accept;
 settings.lang=language;
 settings.textContent=copy.settings;
}
const KEY = 'toolya.analytics.consent.v1';
const GA_ID = 'G-11L9Y8YK7B';
let choice = null;
try { const v = localStorage.getItem(KEY); if (v === 'yes' || v === 'no') choice = v; } catch {}
// Remove first-party GA identifiers when consent is withdrawn. This cannot erase data already sent.
function clearAnalyticsCookies() {
  const names = document.cookie.split(';').map(part => part.trim().split('=')[0]).filter(name => /^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name));
  const parts = location.hostname.split('.');
  const domains = ['', location.hostname, ...parts.slice(1).map((_, i) => parts.slice(i + 1).join('.'))];
  for (const name of names) {
    for (const domain of new Set(domains)) {
      for (const path of ['/', location.pathname]) {
        document.cookie = name + '=; Max-Age=0; path=' + path + '; SameSite=Lax' + (domain ? '; domain=' + domain : '');
      }
    }
  }
}
// Opt-in, tab-scoped GA4 diagnostics. The URL switch is removed before any GA request.
// Session storage is isolated per tab and disappears when the tab session ends.
const DEBUG_KEY = 'toolya.ga.debug.tab.v1';
let debugEnabled = false;
try {
  const url = new URL(location.href);
  const requested = url.searchParams.get('toolya_ga_debug');
  if (requested === '1' || requested === '0') {
    if (requested === '1') sessionStorage.setItem(DEBUG_KEY, '1');
    else sessionStorage.removeItem(DEBUG_KEY);
    url.searchParams.delete('toolya_ga_debug');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  }
  debugEnabled = sessionStorage.getItem(DEBUG_KEY) === '1';
} catch { /* Blocked storage or history: regular GA behavior remains unchanged. */ }
let loaded = false;
function enableAnalytics() {
  if (loaded) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied'
  });
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
  if (debugEnabled) window.gtag('set', 'debug_mode', true);
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false, send_page_view: false });
  // Never send URL query strings, fragments, referrers or sensitive tool interactions.
  window.gtag('event', 'page_view', { page_location: location.origin + location.pathname, page_referrer: '', page_title: document.title, ...(debugEnabled ? { debug_mode: true } : {}) });
  recordToolOpen();
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
  if (debugEnabled) {
    const status = document.createElement('aside');
    status.id = 'toolya-ga-local-debug';
    status.setAttribute('role', 'status');
    status.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:2147483647;max-width:340px;padding:12px;border:2px solid #167b79;border-radius:10px;background:#fff;color:#172b30;font:13px/1.5 system-ui;box-shadow:0 3px 16px #0003';
    const consentState = choice === 'yes' ? 'erteilt' : 'nicht erteilt';
    const toolState = TOOL_IDS.has(currentTool) ? currentTool : 'keine Tool-Seite';
    status.textContent = 'GA4 lokal · Einwilligung: ' + consentState + ' · Tool: ' + toolState + ' · Ereignis: ' + (TOOL_IDS.has(currentTool) ? 'tool_open eingereiht' : 'nicht zutreffend') + ' · Google-Skript: wird geladen';
    const attach = () => document.body?.appendChild(status);
    if (document.body) attach();
    else document.addEventListener('DOMContentLoaded', attach, { once: true });
    tag.addEventListener('load', () => { status.textContent = status.textContent.replace('wird geladen', 'geladen (kein Nachweis der Annahme durch GA4)'); });
    tag.addEventListener('error', () => { status.textContent = status.textContent.replace('wird geladen', 'blockiert oder nicht erreichbar'); });
  }
  document.head.appendChild(tag);
}
// Record a tool opening on the destination page, not during navigation.
// Only known tool paths; no URL, query string, user identifier or form content.
const TOOL_IDS = new Set(['wishes','budget','moving','plants','housemates','estate','car','pet-health','parking','loans','meters','baking']);
const toolMatch = location.pathname.match(/^\/tools\/([a-z-]+)\/(?:index\.html)?$/);
const currentTool = toolMatch?.[1];
function recordToolOpen() {
  if (choice !== 'yes' || !loaded || !TOOL_IDS.has(currentTool)) return;
  window.gtag('event', 'tool_open', {
    tool_name: currentTool,
    ...(debugEnabled ? { debug_mode: true } : {})
  });
}
// Regular estate pages remain consent-gated; local handover and key printing never collect analytics.
const analyticsAllowed = !/^\/tools\/estate\/(?:handover|print-key)\.html$/.test(location.pathname);
if (choice === 'yes' && analyticsAllowed) enableAnalytics();
function init() {
  if (document.getElementById('toolya-consent-panel')) return;
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = '/assets/toolya-consent.css';
  document.head.appendChild(stylesheet);
  const panel = document.createElement('section');
  panel.id = 'toolya-consent-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Statistik-Einstellungen');
  panel.innerHTML = '<strong>Statistik bei Toolya</strong><p>Dürfen wir mit Google Analytics Nutzungsstatistiken erstellen? Ohne Zustimmung wird Google Analytics nicht geladen. <a href="/privacy.html">Datenschutz</a></p><div class="actions"><button type="button" class="reject">Ablehnen</button><button type="button" class="accept">Akzeptieren</button></div>';
  panel.hidden = choice !== null;
  document.body.appendChild(panel);
  function decide(value) {
    choice = value;
    try { localStorage.setItem(KEY, value); } catch {}
    panel.hidden = true;
    if (value === 'yes' && analyticsAllowed) enableAnalytics();
    else if (loaded) {
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      clearAnalyticsCookies();
      // Reload removes the loaded Google script and all active GA listeners.
      location.reload();
    }
  }
  panel.querySelector('.reject').addEventListener('click', () => decide('no'));
  panel.querySelector('.accept').addEventListener('click', () => decide('yes'));
  const footer = document.querySelector('footer') || document.body;
  const link = document.createElement('a');
  link.id = 'toolya-consent-settings';
  link.href = '#cookie-einstellungen';
  link.textContent = 'Cookie-Einstellungen';
  link.className = 'toolya-consent-settings-link';
  localizeConsentPanel(panel,link);
  // The shared tool locale switch announces itself without changing consent.
  document.addEventListener('toolya:locale-change',()=>localizeConsentPanel(panel,link));
  document.addEventListener('toolya:wishes-locale-change',()=>localizeConsentPanel(panel,link));
  document.addEventListener('toolya:dashboard-locale-change',()=>localizeConsentPanel(panel,link));
  document.addEventListener('toolya:estate-locale-change',()=>localizeConsentPanel(panel,link));
  document.addEventListener('toolya:admin-locale-change',()=>localizeConsentPanel(panel,link));

  link.addEventListener('click', e => { e.preventDefault(); panel.hidden = false; panel.querySelector('.reject').focus(); });
  footer.appendChild(link);
  // A legacy footer can be replaced after consent initializes. Preserve
  // the original link and click handler even if it becomes detached.
  const observer = new MutationObserver(() => {
    const signature = document.querySelector('.toolya-signature-footer');
    const target = signature?.querySelector('.ty-footer-links') || signature || document.querySelector('footer');
    if (target && link.parentElement !== target) target.appendChild(link);
    if (signature) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  const signature = document.querySelector('.toolya-signature-footer');
  if (signature) {
    (signature.querySelector('.ty-footer-links') || signature).appendChild(link);
    observer.disconnect();
  }
  // Respect changes made in another tab, including withdrawal.
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return;
    const next = event.key === null ? null : event.newValue;
    if (next === choice) return;
    choice = next === 'yes' || next === 'no' ? next : null;
    if (loaded && choice !== 'yes') clearAnalyticsCookies();
    if (loaded || choice === 'yes') location.reload();
    else panel.hidden = choice !== null;
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
