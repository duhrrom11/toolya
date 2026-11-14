/* Keyboard support for audited dialogs. Does not read or write account/tool data. */
(() => {
  'use strict';
  function init() {
    const ids = ['settingsModal', 'settings-modal', 'helpModal', 'budgetModal', 'savingsModal', 'cook-modal', 'energyTipsModal'];
    // Garden utilities have the same IDs as some unrelated WG editors.
    if (document.getElementById('plantName')) ids.push('inventoryModal', 'seedsModal', 'roiModal', 'cisternModal', 'beetModal');
    const visible = node => {
      if (!node?.isConnected || node.hidden || getComputedStyle(node).visibility === 'hidden' || !node.getClientRects().length) return false;
      const closed = node.closest('details:not([open])');
      return !closed || closed.querySelector('summary')?.contains(node);
    };
    const records = [];
    for (const id of ids) {
      const dialog = document.getElementById(id);
      if (!dialog) continue; // Nachlass settings remain an ordinary page section.
      const close = Array.from(dialog.querySelectorAll('button')).find(button =>
        /^(?:close\w*|toggleSettingsModal|toggleHelpModal)\(\)/.test(button.getAttribute('onclick') || ''));
      if (!close) continue; // Never invent dismissal for security or busy overlays.
      const settings = id === 'settingsModal' || id === 'settings-modal';
      const title = dialog.querySelector('h2, h3');
      dialog.setAttribute('role', 'dialog');
      if (title) {
        if (!title.id) title.id = 'helferlein-' + id + '-title';
        dialog.setAttribute('aria-labelledby', title.id);
      } else dialog.setAttribute('aria-label', settings ? 'Einstellungen' : 'Dialog');
      dialog.tabIndex = -1;
      if (!settings) dialog.classList.add('helferlein-tool-dialog');
      // Keep existing labels and ARIA names authoritative.
      for (const input of dialog.querySelectorAll('input[type="email"], input[type="password"]')) {
        if (!input.labels.length && !input.hasAttribute('aria-label') && !input.hasAttribute('aria-labelledby')) {
          input.setAttribute('aria-label', input.type === 'email' ? 'E-Mail-Adresse' : 'Passwort');
        }
      }
      for (const button of dialog.querySelectorAll('button')) {
        if (/^[×✕✖]$/.test(button.textContent.trim()) && !button.hasAttribute('aria-label')) {
          button.setAttribute('aria-label', settings ? 'Einstellungen schließen' : 'Dialog schließen');
          button.classList.add('helferlein-dialog-close');
        }
      }
      records.push({dialog, close, open:false, returns:[]});
    }
    if (!records.length) return;
    let stack = [], lastFocus = document.activeElement, syncing = false;
    const managedInert = new Map();
    const top = () => stack[stack.length - 1];
    const controls = dialog => Array.from(dialog.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]'))
      .filter(node => !node.disabled && node.tabIndex >= 0 && !node.closest('[inert]') && visible(node));
    function restoreBackground() {
      for (const [node, original] of managedInert) node.inert = original;
      managedInert.clear();
    }
    function blockBackground(dialog) {
      for (let branch = dialog; branch && branch !== document.body; branch = branch.parentElement) {
        for (const sibling of branch.parentElement.children) {
          if (sibling === branch || /^(SCRIPT|STYLE|LINK|META)$/.test(sibling.tagName)) continue;
          managedInert.set(sibling, sibling.inert);
          sibling.inert = true;
        }
      }
    }
    function returnTarget(node) {
      if (visible(node) && !node.closest('[inert]') && !node.disabled && node !== document.body) return node;
      // More-tools actions close their <details> before opening the dialog.
      const summary = node?.closest?.('details:not([open])')?.querySelector('summary');
      return visible(summary) && !summary.closest('[inert]') ? summary : null;
    }
    function focusInside(record) { (controls(record.dialog)[0] || record.dialog).focus(); }
    function sync() {
      syncing = true;
      const before = top();
      const origins = [document.activeElement, lastFocus, ...(before?.returns || [])];
      const closed = stack.filter(record => !visible(record.dialog)).reverse();
      restoreBackground();
      stack = stack.filter(record => visible(record.dialog));
      for (const record of records) {
        const next = visible(record.dialog);
        if (next && !record.open) {
          record.returns = origins.filter(node => node && !record.dialog.contains(node));
          stack.push(record);
        }
        record.open = next;
      }
      const current = top();
      for (const record of records) record.dialog.setAttribute('aria-modal', String(record === current));
      if (current) {
        blockBackground(current.dialog);
        if (current !== before || !current.dialog.contains(document.activeElement)) {
          const previous = closed.flatMap(record => record.returns).map(returnTarget)
            .find(node => node && current.dialog.contains(node));
          if (previous) previous.focus();
          else focusInside(current);
        }
      } else if (closed.length) {
        const previous = closed.flatMap(record => record.returns).map(returnTarget).find(Boolean);
        if (previous) previous.focus();
      }
      syncing = false;
    }
    const observer = new MutationObserver(sync);
    for (const {dialog} of records) observer.observe(dialog, {attributes:true, attributeFilter:['class','hidden','style']});
    document.addEventListener('focusin', event => {
      if (!syncing && top() && visible(top().dialog) && !top().dialog.contains(event.target)) focusInside(top());
      lastFocus = document.activeElement;
    });
    document.addEventListener('keydown', event => {
      const current = top();
      if (!current || !visible(current.dialog)) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        current.close.click(); // Preserve the existing close/cleanup handler.
        sync();
      } else if (event.key === 'Tab') {
        const items = controls(current.dialog);
        const first = items[0] || current.dialog, last = items[items.length - 1] || current.dialog;
        if (!items.length || !current.dialog.contains(document.activeElement) ||
            (event.shiftKey && document.activeElement === first) ||
            (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    }, true);
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
