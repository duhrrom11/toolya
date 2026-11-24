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
  const buttonFor = () => document.querySelector('[data-toolya-install]');
  const statusFor = () => document.querySelector('[data-toolya-install-status]');

  function message(text) {
    const status = statusFor();
    if (!status) return;
    status.textContent = text;
    status.hidden = false;
  }

  function refresh() {
    const button = buttonFor();
    if (!button) return;
    button.hidden = installed();
    if (installed()) message((document.documentElement?.lang==='en'?'Toolya is already open as an app.':'Toolya ist bereits als App geöffnet.'));
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    refresh();
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    const button = buttonFor();
    if (button) button.hidden = true;
    message(document.documentElement?.lang==='en'?'Toolya has been installed as an app.':'Toolya wurde als App installiert.');
  });

  document.addEventListener('toolya:pwa-settings-mounted', refresh);
  document.addEventListener('DOMContentLoaded', refresh, { once: true });
  refresh();

  // Event delegation keeps the button working when platform.mjs mounts settings later.
  document.addEventListener('click', async event => {
    const button = event.target.closest?.('[data-toolya-install]');
    if (!button || installed()) return;

    if (installPrompt) {
      const prompt = installPrompt;
      installPrompt = null;
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice?.outcome === 'accepted') {
          button.hidden = true;
          message((document.documentElement?.lang==='en'?'Installation confirmed. Find Toolya on your home screen.':'Installation bestätigt. Du findest Toolya auf deinem Startbildschirm.'));
        } else {
          message((document.documentElement?.lang==='en'?'You can install Toolya later from the browser menu.':'Du kannst Toolya später über das Browsermenü installieren.'));
        }
      } catch {
        message((document.documentElement?.lang==='en'?'Open the browser menu and choose Install app.':'Öffne das Browsermenü und wähle „App installieren“.'));
      }
      return;
    }

    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (ios) {
      message((document.documentElement?.lang==='en'?'On iPhone or iPad: open Toolya in Safari, tap Share and choose Add to Home Screen.':'Auf iPhone oder iPad: Toolya in Safari öffnen, auf „Teilen“ tippen und „Zum Home-Bildschirm“ wählen.'));
    } else {
      message((document.documentElement?.lang==='en'?'Open the browser menu and choose Install app or Add to Home Screen. Chrome and Edge offer this directly in the menu.':'Öffne das Browsermenü und wähle „App installieren“ oder „Zum Startbildschirm hinzufügen“. In Chrome und Edge ist diese Funktion direkt im Menü verfügbar.'));
    }
  });
})();
