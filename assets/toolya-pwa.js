/* PWA installation on Toolya; no tracking or local data access. */
(() => {
  'use strict';
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Website remains usable even if registration is blocked.
      });
    }, { once: true });
  }

  let installPrompt = null;
  const installed = () =>
    window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const button = document.getElementById('toolyaInstallBtn');
  const hint = document.getElementById('toolyaInstallHint');

  const message = text => {
    if (!hint) return;
    hint.textContent = text;
    hint.hidden = false;
  };

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    if (button && !installed()) button.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    if (button) button.hidden = true;
    message('Toolya wurde als App installiert.');
  });

  if (!button) return;
  if (installed()) {
    button.hidden = true;
    return;
  }

  button.addEventListener('click', async () => {
    if (installPrompt) {
      const prompt = installPrompt;
      installPrompt = null;
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice?.outcome === 'accepted') {
          button.hidden = true;
          message('Die Installation wurde gestartet.');
        } else {
          message('Du kannst Toolya später über das Browsermenü installieren.');
        }
      } catch {
        message('Öffne das Browsermenü und wähle „App installieren“.');
      }
      return;
    }

    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (ios) {
      message('Auf iPhone oder iPad: Toolya in Safari öffnen, auf „Teilen“ tippen und „Zum Home-Bildschirm“ wählen.');
    } else {
      message('Öffne das Menü deines Browsers und wähle „App installieren“ oder „Zum Startbildschirm hinzufügen“. Nutze dazu https://toolya.app in Chrome oder Edge.');
    }
  });
})();
