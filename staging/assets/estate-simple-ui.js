(function () {
  'use strict';
  // All navigation is local. This module never reads or transmits vault data.
  document.querySelectorAll('[data-estate-go]').forEach(link => {
    link.addEventListener('click', event => {
      const target = link.getAttribute('data-estate-go');
      const tab = document.querySelector('.tab-btn[data-tab="' + target + '"]');
      if (!tab) return;
      event.preventDefault();
      tab.click();
      document.getElementById('section-' + target)?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });

  // The Contact Picker API is optional, permission-based and not available on all devices.
  const field = document.getElementById('newAlarmPersonName');
  const email = document.getElementById('newAlarmPersonContact');
  if (!field || !email) return;
  const addButton = document.getElementById('addAlarmPersonBtn');
  if (!addButton) return;

  const picker = document.createElement('button');
  picker.type = 'button';
  picker.textContent = '📱 Aus Handy-Kontakten wählen';
  picker.className = 'py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl';
  picker.style.minHeight = '48px';
  picker.hidden = !(navigator.contacts && typeof navigator.contacts.select === 'function');
  addButton.insertAdjacentElement('afterend', picker);
  picker.addEventListener('click', async () => {
    try {
      const result = await navigator.contacts.select(['name','email'], {multiple:false});
      if (!result || !result.length) return;
      const person = result[0];
      field.value = String(person.name?.[0] || '').slice(0,120);
      email.value = String(person.email?.[0] || '').slice(0,254);
      email.focus();
    } catch (_) {
      // User cancellation requires no error message.
    }
  });
})();