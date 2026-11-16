(function () {
if (window.__toolyaConsentInitialized) return;
window.__toolyaConsentInitialized = true;
// Toolya GA4 consent: no Google requests until explicit opt-in.
const KEY = 'toolya.analytics.consent.v1';
const GA_ID = 'G-11L9Y8YK7B';
// A first-party consent cookie is a fallback when mobile browsers block localStorage.
const COOKIE_KEY = 'toolya_analytics_consent';
function readCookieChoice() {
  const match = document.cookie.split(';').map(v => v.trim()).find(v => v.startsWith(COOKIE_KEY + '='));
  const value = match ? match.slice(COOKIE_KEY.length + 1) : null;
  return value === 'yes' || value === 'no' ? value : null;
}
function persistChoice(value) {
  try { localStorage.setItem(KEY, value); } catch {}
  document.cookie = COOKIE_KEY + '=' + value + '; Max-Age=15552000; Path=/; SameSite=Lax; Secure';
}
function readChoice() {
  // The cookie is authoritative when present, including after cross-tab updates.
  const cookie = readCookieChoice();
  if (cookie !== null) return cookie;
  try { const value = localStorage.getItem(KEY); return value === 'yes' || value === 'no' ? value : null; } catch { return null; }
}
let choice = readChoice();
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
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false, send_page_view: false });
  // Never send URL query strings, fragments, referrers or sensitive tool interactions.
  window.gtag('event', 'page_view', { page_location: location.origin + location.pathname, page_referrer: '', page_title: document.title });
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
  document.head.appendChild(tag);
}
// Sensitive estate routes must never send analytics, even after a prior opt-in.
const analyticsAllowed = !/^\/tools\/estate(?:\/|$)/.test(location.pathname);
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
    persistChoice(value);
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
  link.addEventListener('click', e => { e.preventDefault(); panel.hidden = false; panel.querySelector('.reject').focus(); });
  footer.appendChild(link);
  // The shared Toolya footer may be inserted after DOMContentLoaded.
  // Move the link into it when available without duplicating the link.
  if (!document.querySelector('footer')) {
    const observer = new MutationObserver(() => {
      const actualFooter = document.querySelector('footer');
      if (actualFooter) { actualFooter.appendChild(link); observer.disconnect(); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  // Respect changes made in another tab, including withdrawal.
  window.addEventListener('pageshow', () => { const latest = readChoice(); if (latest !== choice) { choice = latest; if (loaded && choice !== 'yes') { clearAnalyticsCookies(); location.reload(); } else panel.hidden = choice !== null; } });
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return;
    const next = event.key === null ? null : event.newValue;
    if (next === choice) return;
    choice = next === 'yes' || next === 'no' ? next : null;
    if (choice !== null) persistChoice(choice);
    if (loaded && choice !== 'yes') clearAnalyticsCookies();
    if (loaded || choice === 'yes') location.reload();
    else panel.hidden = choice !== null;
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();

})();
