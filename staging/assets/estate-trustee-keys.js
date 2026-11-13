(function () {
  'use strict';
  const portal = new URL('./heirs.html', location.href).href;
  const personList = () => getVaultConfig()?.alarmPersons || [];
  const keyFor = person => {
    const key = currentDecryptedVault?.trusteeKeys?.[person.id];
    return typeof key === 'string' && /^[a-f0-9]{64}$/.test(key) ? key : null;
  };
  const messageFor = (person, key) =>
    'Hallo ' + person.name + ',\n\n'
    + 'du bist meine Vertrauensperson bei Helferlein.\n'
    + 'Dein persönlicher Schlüssel: ' + key + '\n'
    + 'Deine Tresorseite: ' + portal + '\n\n'
    + 'Bitte bewahre den Schlüssel gut auf. Die Freigabe mit zwei Schlüsseln '
    + 'oder nach 24 Stunden ist noch nicht eingerichtet.';

  function send(person, via) {
    if (!vaultReady) return;
    const key = keyFor(person);
    if (!key) return;
    const text = messageFor(person, key);
    if (via === 'email') {
      const link = document.createElement('a');
      link.href = 'mailto:' + encodeURIComponent(person.contact)
        + '?subject=' + encodeURIComponent('Dein persönlicher Helferlein-Schlüssel')
        + '&body=' + encodeURIComponent(text);
      link.click();
    } else if (via === 'whatsapp') {
      // Only on explicit click: the user knowingly forwards their key to WhatsApp.
      window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
    } else if (via === 'print') {
      printPeople([person]);
    }
  }

  function paintPeople() {
    const list = document.getElementById('alarmPersonsList');
    if (!list || !vaultReady) return;
    const cards = list.querySelectorAll('.delete-person-btn');
    personList().forEach((person, i) => {
      const card = cards[i]?.parentElement;
      if (!card || card.querySelector('.estate-send-actions')) return;
      const actions = document.createElement('div');
      actions.className = 'estate-send-actions flex flex-wrap gap-2 pt-2';
      const key = keyFor(person);
      if (!key) {
        const notice = document.createElement('span');
        notice.className = 'text-amber-200 text-sm';
        notice.textContent = 'Noch kein Schlüssel vorhanden.';
        actions.append(notice);
        const makeKey = document.createElement('button');
        makeKey.type = 'button';
        makeKey.textContent = '🔑 Schlüssel erstellen';
        makeKey.className = 'px-3 py-2 rounded-lg bg-indigo-700 text-white';
        makeKey.addEventListener('click', async () => {
          if (!vaultReady) return;
          makeKey.disabled = true;
          try {
            const saved = await updateLocalConfig(cfg => {
              if (!cfg.alarmPersons?.some(item => item.id === person.id)) throw new Error('Person nicht mehr vorhanden.');
              if (!currentDecryptedVault.trusteeKeys) currentDecryptedVault.trusteeKeys = {};
              if (!currentDecryptedVault.trusteeKeys[person.id]) {
                const bytes = crypto.getRandomValues(new Uint8Array(32));
                currentDecryptedVault.trusteeKeys[person.id] =
                  Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
              }
            });
            if (!saved) throw new Error('Speichern fehlgeschlagen.');
            const backedUp = await syncVaultToFirebase(true);
            if (!backedUp) alert('Schlüssel nur auf diesem Gerät gespeichert. Bitte online sichern.');
            renderAlarmPersons();
          } catch (_) {
            alert('Schlüssel konnte nicht gespeichert werden.');
            makeKey.disabled = false;
          }
        });
        actions.append(makeKey);
      } else {
        [['✉️ E-Mail', 'email'], ['💬 WhatsApp', 'whatsapp'], ['🖨️ Drucken', 'print']].forEach(([label, action]) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = label;
          button.className = 'px-3 py-2 rounded-lg bg-indigo-700 text-white';
          button.addEventListener('click', () => send(person, action));
          actions.append(button);
        });
      }
      card.append(actions);
    });
  }

  function paintChoices() {
    const root = document.getElementById('kitSharesPreview');
    if (!root || !vaultReady) return;
    root.replaceChildren();
    const people = personList();
    if (!people.length) { root.textContent = 'Lege zuerst eine Vertrauensperson an.'; return; }
    const note = document.createElement('p');
    note.className = 'col-span-full text-sm text-slate-300';
    note.textContent = 'Wähle aus, wessen Schlüssel du drucken möchtest. Eine Person pro Blatt.';
    root.append(note);
    for (const person of people) {
      const label = document.createElement('label');
      label.className = 'p-3 flex items-center gap-3 rounded-xl border border-slate-700';
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'estate-print-choice';
      check.value = person.id;
      check.disabled = !keyFor(person);
      check.checked = !check.disabled;
      const text = document.createElement('span');
      text.textContent = person.name + (check.disabled ? ' – kein Schlüssel vorhanden' : '');
      label.append(check, text);
      root.append(label);
    }
  }

  function printPeople(people) {
    if (!vaultReady) return;
    const rows = people.map(person => ({ person, key:keyFor(person) })).filter(row => row.key);
    if (!rows.length) { alert('Bitte wähle mindestens eine Person mit Schlüssel aus.'); return; }
    const win = window.open('', '_blank');
    if (!win) { alert('Bitte erlaube das Druckfenster.'); return; }
    const doc = win.document;
    doc.title = 'Helferlein – persönliche Schlüssel';
    const style = doc.createElement('style');
    style.textContent = 'body{font:18px/1.5 system-ui,sans-serif;color:#152b3d;margin:0}'
      + '.page{padding:24mm;min-height:235mm;box-sizing:border-box;page-break-after:always;break-after:page}'
      + '.page:last-child{page-break-after:auto;break-after:auto}'
      + 'code{display:block;background:#f1f5f9;border-radius:8px;padding:14px;overflow-wrap:anywhere;font-size:18px}'
      + 'img{width:160px;height:160px;display:block;margin-top:15px}'
      + '@media print{@page{size:A4;margin:0}}';
    doc.head.append(style);
    for (const row of rows) {
      const page = doc.createElement('section');
      page.className = 'page';
      const heading = doc.createElement('h1');
      heading.textContent = 'Dein Helferlein-Schlüssel';
      const person = doc.createElement('p');
      person.textContent = 'Nur für: ' + row.person.name;
      const label = doc.createElement('strong');
      label.textContent = 'Dein persönlicher Schlüssel';
      const code = doc.createElement('code');
      code.textContent = row.key;
      const url = doc.createElement('p');
      url.textContent = portal;
      const qr = doc.createElement('img');
      // Only the public portal URL goes to the QR service; never the private code.
      qr.src = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' + encodeURIComponent(portal);
      qr.alt = 'QR-Code zur Tresorseite';
      const notice = doc.createElement('p');
      notice.textContent = 'Gut aufbewahren. Die automatische Schlüsselfreigabe ist noch nicht aktiv.';
      page.append(heading, person, label, code, url, qr, notice);
      doc.body.append(page);
    }
    Promise.all(Array.from(doc.images, img => img.complete ? Promise.resolve() : new Promise(resolve => {
      img.onload = resolve; img.onerror = resolve;
    }))).then(() => { if (!win.closed) { win.focus(); win.print(); } });
  }

  window.estateRenderPrintChoices = paintChoices;
  window.estatePrintKeys = () => {
    const selected = new Set(Array.from(document.querySelectorAll('.estate-print-choice:checked'), input => input.value));
    printPeople(personList().filter(person => selected.has(person.id)));
  };
  window.addEventListener('estate:people-updated', () => { paintPeople(); paintChoices(); });
  document.addEventListener('DOMContentLoaded', () => {
    paintPeople();
    paintChoices();
  });
})();