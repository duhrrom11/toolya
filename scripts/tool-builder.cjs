'use strict';

// Developer-only source templates. Rendering is deterministic and offline.
const TEMPLATES = Object.freeze(['starter', 'counter', 'percentage', 'checklist']);

const core = '../../shared/toolya/tool-builder/blocks.mjs';

const specs = Object.freeze({
  counter: {
    markup: [
      '      <p>Ein lokaler Zähler mit Grenzen von 0 bis 9999.</p>',
      '      <output id="counter-value" aria-label="Aktueller Stand">0</output>',
      '      <div class="draft-controls">',
      '        <button class="draft-action" id="counter-minus" type="button">−1</button>',
      '        <button class="draft-action" id="counter-plus" type="button">+1</button>',
      '      </div>',
      '      <p id="draft-status" role="status" aria-live="polite"></p>'
    ],
    app: [
      "import {counterStep} from '" + core + "';",
      "const value = document.querySelector('#counter-value');",
      "const status = document.querySelector('#draft-status');",
      'let count = 0;',
      "document.querySelector('#counter-plus').addEventListener('click', () => {",
      '  count = counterStep(count, 1);',
      '  value.textContent = String(count);',
      "  status.textContent = 'Zähler aktualisiert.';",
      '});',
      "document.querySelector('#counter-minus').addEventListener('click', () => {",
      '  count = counterStep(count, -1);',
      '  value.textContent = String(count);',
      "  status.textContent = 'Zähler aktualisiert.';",
      '});'
    ],
    test: [
      "import {counterStep} from '" + core + "';",
      "test('bounded counter increment and decrement', () => {",
      '  assert.equal(counterStep(0, 1), 1);',
      '  assert.equal(counterStep(0, -1), 0);',
      '  assert.equal(counterStep(9999, 1), 9999);',
      '  assert.throws(() => counterStep(0, 99), RangeError);',
      '});'
    ]
  },
  percentage: {
    markup: [
      '      <p>Ein rein lokaler Prozentrechner ohne Speicherung.</p>',
      '      <form id="percentage-form">',
      '        <label for="percentage-part">Teil</label>',
      '        <input id="percentage-part" name="part" type="number" min="0" step="any" required inputmode="decimal">',
      '        <label for="percentage-total">Gesamt</label>',
      '        <input id="percentage-total" name="total" type="number" min="0" step="any" required inputmode="decimal">',
      '        <button class="draft-action" type="submit">Berechnen</button>',
      '      </form>',
      '      <output id="percentage-result" aria-label="Prozentergebnis">–</output>',
      '      <p id="draft-status" role="status" aria-live="polite"></p>'
    ],
    app: [
      "import {percentageOf} from '" + core + "';",
      "const form = document.querySelector('#percentage-form');",
      "const output = document.querySelector('#percentage-result');",
      "const status = document.querySelector('#draft-status');",
      "form.addEventListener('submit', event => {",
      '  event.preventDefault();',
      "  const part = form.elements.namedItem('part').value;",
      "  const total = form.elements.namedItem('total').value;",
      '  try {',
      "    if (!part.trim() || !total.trim()) throw new RangeError('Missing input.');",
      '    const result = percentageOf(Number(part), Number(total));',
      "    output.textContent = new Intl.NumberFormat('de-DE', {maximumFractionDigits: 1}).format(result) + ' %';",
      "    status.textContent = 'Ergebnis lokal berechnet.';",
      '  } catch {',
      "    output.textContent = '–';",
      "    status.textContent = 'Bitte gültige Zahlen eingeben (Gesamt größer als null).';",
      '  }',
      '});'
    ],
    test: [
      "import {percentageOf} from '" + core + "';",
      "test('percentage calculation and invalid total', () => {",
      '  assert.equal(percentageOf(25, 100), 25);',
      '  assert.equal(percentageOf(1, 3), 33.3);',
      '  assert.throws(() => percentageOf(1, 0), RangeError);',
      '  assert.throws(() => percentageOf(-1, 10), RangeError);',
      '});'
    ]
  },
  checklist: {
    markup: [
      '      <p>Eine flüchtige Liste: Bei Neuladen gehen Einträge verloren.</p>',
      '      <form id="checklist-form">',
      '        <label for="checklist-input">Neuer Eintrag</label>',
      '        <input id="checklist-input" name="item" type="text" maxlength="80" required autocomplete="off">',
      '        <button class="draft-action" type="submit">Hinzufügen</button>',
      '      </form>',
      '      <ul id="checklist-items" aria-label="Einträge"></ul>',
      '      <p id="draft-status" role="status" aria-live="polite"></p>'
    ],
    app: [
      "import {addChecklistItem, removeChecklistItem} from '" + core + "';",
      "const form = document.querySelector('#checklist-form');",
      "const list = document.querySelector('#checklist-items');",
      "const status = document.querySelector('#draft-status');",
      'let items = [];',
      'function render() {',
      '  list.replaceChildren();',
      '  items.forEach((label, index) => {',
      "    const item = document.createElement('li');",
      "    const text = document.createElement('span');",
      '    text.textContent = label;',
      "    const remove = document.createElement('button');",
      "    remove.type = 'button';",
      "    remove.textContent = 'Entfernen';",
      "    remove.setAttribute('aria-label', 'Eintrag ' + (index + 1) + ' entfernen');",
      "    remove.addEventListener('click', () => {",
      '      items = removeChecklistItem(items, index);',
      '      render();',
      "      status.textContent = 'Eintrag entfernt.';",
      '    });',
      '    item.append(text, remove);',
      '    list.append(item);',
      '  });',
      '}',
      "form.addEventListener('submit', event => {",
      '  event.preventDefault();',
      '  try {',
      "    items = addChecklistItem(items, form.elements.namedItem('item').value);",
      "    form.elements.namedItem('item').value = '';",
      '    render();',
      "    status.textContent = 'Eintrag lokal hinzugefügt.';",
      '  } catch {',
      "    status.textContent = 'Bitte einen kurzen Eintrag verwenden (maximal 50 Einträge).';",
      '  }',
      '});'
    ],
    test: [
      "import {addChecklistItem, removeChecklistItem} from '" + core + "';",
      "test('checklist sanitizes labels and never mutates original array', () => {",
      '  const before = [];',
      "  const after = addChecklistItem(before, '  <b>Test</b>  ');",
      '  assert.deepEqual(before, []);',
      "  assert.deepEqual(after, ['<b>Test</b>']);",
      '  assert.deepEqual(removeChecklistItem(after, 0), []);',
      "  assert.throws(() => addChecklistItem(after, ' '), RangeError);",
      '});'
    ]
  }
});

function renderTemplate(name = 'starter') {
  if (!TEMPLATES.includes(name)) throw new Error('Unknown tool template: ' + name);
  if (name === 'starter') return null;
  const spec = specs[name];
  return Object.freeze({
    markup: [...spec.markup],
    app: spec.app.join('\n') + '\n',
    test: [
      "import test from 'node:test';",
      "import assert from 'node:assert/strict';",
      '// Auto-generated local starter tests. Extend with tool-specific scenarios.',
      ...spec.test,
      ''
    ].join('\n')
  });
}

module.exports = {TEMPLATES, renderTemplate};
