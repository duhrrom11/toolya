// Toolya GA4 consent: no Google requests until explicit opt-in.
const KEY = 'toolya.analytics.consent.v1';
const GA_ID = 'G-11L9Y8YK7B';
let choice = null;
try { const v = localStorage.getItem(KEY); if (v === 'yes' || v === 'no') choice = v; } catch {}
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
  window.gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false, page_location: location.origin + location.pathname, page_referrer: '' });
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
  document.head.appendChild(tag);
}
if (choice === 'yes') enableAnalytics();
function init() {
  if (document.getElementById('toolya-consent-panel')) return;
  const style = document.createElement('style');
  style.textContent = `
#toolya-consent-panel{position:fixed;bottom:12px;left:12px;z-index:2147483000;max-width:390px;width:calc(100% - 24px);box-sizing:border-box;background:#fff;color:#172033;border:1px solid #dbe3ed;border-radius:14px;padding:15px;box-shadow:0 6px 28px #12253a29;font:14px/1.5 system-ui,sans-serif}
#toolya-consent-panel[hidden]{display:none!important}
#toolya-consent-panel p{margin:6px 0 12px}
#toolya-consent-panel .actions{display:flex;gap:8px;flex-wrap:wrap}
#toolya-consent-panel button{flex:1;min-width:125px;cursor:pointer;border-radius:9px;padding:9px 12px;font:600 14px system-ui,sans-serif;border:1px solid #0f766e;background:#fff;color:#115e59}
#toolya-consent-panel button.accept{background:#0f766e;color:#fff}
#toolya-consent-panel a{color:#075985;text-decoration:underline}
#toolya-consent-settings{cursor:pointer}
`;
  document.head.appendChild(style);
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
    if (value === 'yes') enableAnalytics();
    else if (loaded) {
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      // A reload prevents further tracking on this page after withdrawal.
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
  link.style.cssText = 'display:inline-block;margin:8px 12px;font:13px system-ui,sans-serif;text-decoration:underline;color:inherit';
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
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
