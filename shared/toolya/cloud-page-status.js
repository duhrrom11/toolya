// Explain cloud-only states without showing backend errors or retrying a write.
(() => {
  const messages = {
    loading: 'Wir laden deine gespeicherten Daten …',
    'load-failed': 'Deine gespeicherten Daten konnten gerade nicht geladen werden. Prüfe deine Internetverbindung und versuche es erneut.',
    'migration-paused': 'Deine bisherigen Daten auf diesem Gerät wurden noch nicht übernommen. Lade die Seite neu, um die Übernahme oder Sicherung erneut zu prüfen.',
    'save-unconfirmed': 'Toolya konnte die Speicherung nicht bestätigen. Beim Neuladen können offene Eingaben verloren gehen. Prüfe danach, ob deine Änderung bereits gespeichert ist, bevor du sie erneut eingibst.',
    'signed-out': 'Du bist abgemeldet. Melde dich erneut an, um deine Daten zu öffnen.',
    'account-changed': 'Deine Anmeldung hat sich geändert. Lade die Seite neu, um die Daten deines aktuellen Kontos zu öffnen.'
  };

  window.toolyaCloudPageStatus = (state) => {
    let gate = document.getElementById('toolya-cloud-gate');
    if (!gate) {
      gate = document.createElement('div');
      gate.id = 'toolya-cloud-gate';
      gate.className = 'toolya-cloud-page-status';
      document.body.append(gate);
    }
    gate.setAttribute('role', state === 'loading' ? 'status' : 'alert');

    const panel = document.createElement('div');
    const message = document.createElement('p');
    message.textContent = messages[state];
    panel.append(message);

    if (state !== 'loading') {
      const action = document.createElement(state === 'signed-out' ? 'a' : 'button');
      if (state === 'signed-out') {
        action.href = '../../?settings=1';
        action.textContent = 'Zur Anmeldung';
      } else {
        action.type = 'button';
        action.textContent = state === 'load-failed' ? 'Erneut versuchen' : 'Seite neu laden';
        action.addEventListener('click', () => window.location.reload());
      }
      panel.append(action);
    }

    gate.replaceChildren(panel);
    panel.querySelector('button,a')?.focus();
  };
})();
