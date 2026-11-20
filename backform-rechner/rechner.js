const panForm = document.querySelector('#pan-calculator');
const panResult = panForm.querySelector('output');
const panError = document.querySelector('#pan-calculator-error');
const formatFactor = new Intl.NumberFormat('de', { maximumFractionDigits: 4, minimumFractionDigits: 2 });
const formatAmount = new Intl.NumberFormat('de', { maximumFractionDigits: 2 });

function panArea(shape, size, width) {
  return shape === 'round' ? Math.PI * (size / 2) ** 2 : size * width;
}

for (const prefix of ['source', 'target']) {
  const shape = panForm.elements.namedItem(prefix + 'Shape');
  const width = panForm.elements.namedItem(prefix + 'Width');
  const group = shape.closest('fieldset');
  const updateFields = () => {
    const rectangular = shape.value === 'rect';
    group.querySelector('[data-dimension]').textContent = rectangular ? 'Länge (cm)' : 'Durchmesser (cm)';
    width.disabled = !rectangular;
    width.required = rectangular;
    width.closest('label').hidden = !rectangular;
  };
  shape.addEventListener('change', updateFields);
  updateFields();
}

panForm.addEventListener('input', () => {
  panResult.value = '';
  panError.textContent = '';
});
panForm.addEventListener('invalid', event => {
  const field = event.target;
  if (field !== panForm.querySelector('input:invalid')) return;
  panResult.value = '';
  const name = field.labels[0].textContent.trim();
  const group = field.closest('fieldset')?.querySelector('legend').textContent.trim();
  panError.textContent = [group, name, field.validationMessage].filter(Boolean).join(' – ');
}, true);
panForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(panForm);
  const area = prefix => panArea(data.get(prefix + 'Shape'), Number(data.get(prefix + 'Size')), Number(data.get(prefix + 'Width')));
  const factor = area('target') / area('source');
  const amount = data.get('amount');
  const result = amount === '' ? '' : ` · Neue Menge: ${formatAmount.format(Number(amount) * factor)} in derselben Einheit`;
  panError.textContent = '';
  panResult.value = `Faktor: × ${formatFactor.format(factor)}${result}`;
});
