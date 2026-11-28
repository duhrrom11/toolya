// Pure monetary and CSV primitives. No storage or network access.
export function parseCents(input, locale = 'de') {
  if (!['de','en'].includes(locale)) throw new RangeError('locale');
  const raw = String(input).trim();
  const pattern = locale === 'de'
    ? /^([+-]?)(\d+|\d{1,3}(?:\.\d{3})+)(?:,(\d{1,2}))?$/
    : /^([+-]?)(\d+|\d{1,3}(?:,\d{3})+)(?:\.(\d{1,2}))?$/;
  const m = pattern.exec(raw);
  if (!m) throw new RangeError('amount');
  const cents = BigInt(m[2].replace(/[.,]/g,'')) * 100n + BigInt((m[3] || '').padEnd(2,'0'));
  const signed = m[1] === '-' ? -cents : cents;
  if (signed > BigInt(Number.MAX_SAFE_INTEGER) || signed < -BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('amount');
  return Number(signed);
}
export function legacyCents(value) {
  if (typeof value !== 'number' && typeof value !== 'string') throw new RangeError('amount');
  const raw = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) throw new RangeError('legacy amount');
  return parseCents(raw,'en');
}
export function addCents(...values) {
  let total = 0n;
  for (const n of values) {
    if (!Number.isSafeInteger(n)) throw new RangeError('amount');
    total += BigInt(n);
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER) || total < -BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('sum');
  return Number(total);
}
export function decimalCents(value) {
  if (!Number.isSafeInteger(value)) throw new RangeError('amount');
  const abs = BigInt(Math.abs(value));
  return (value < 0 ? '-' : '') + String(abs / 100n) + '.' + String(abs % 100n).padStart(2,'0');
}
export function validateSplit(total, parts) {
  return Number.isSafeInteger(total) && total > 0 && Array.isArray(parts) && parts.length > 1 &&
    parts.every(p => p && typeof p.category === 'string' && p.category.trim() && Number.isSafeInteger(p.cents) && p.cents > 0) &&
    addCents(...parts.map(p=>p.cents)) === total;
}
export function parseBankDate(input, format) {
  const raw = String(input).trim();
  let y,m,d;
  if (format === 'ISO') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!match) throw new RangeError('date');
    [,y,m,d] = match;
  } else {
    if (!['DMY','MDY'].includes(format)) throw new RangeError('date format');
    const match = /^(\d{1,2})([./-])(\d{1,2})\2(\d{4})$/.exec(raw);
    if (!match) throw new RangeError('date');
    y=match[4]; m=match[format==='DMY'?3:1]; d=match[format==='DMY'?1:3];
  }
  const iso = y+'-'+m.padStart(2,'0')+'-'+d.padStart(2,'0');
  const date = new Date(iso+'T00:00:00Z');
  if (y==='0000' || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==iso) throw new RangeError('date');
  return iso;
}
// Strict RFC-style quoted cells; delimiter is explicitly selected, never guessed.
export function parseCSV(input, delimiter=';') {
  if (![';',','].includes(delimiter)) throw new RangeError('delimiter');
  const source=String(input).replace(/^\uFEFF/,'');
  const rows=[]; let row=[], cell='', state='start';
  const finishCell=()=>{row.push(cell);cell='';state='start';};
  const finishRow=()=>{finishCell();rows.push(row);row=[];};
  for(let i=0;i<source.length;i++){
    const c=source[i];
    if(state==='quoted'){
      if(c==='"'){if(source[i+1]==='"'){cell+='"';i++;}else state='closed';}
      else cell+=c;
      continue;
    }
    if(c===delimiter){finishCell();continue;}
    if(c==='\r'||c==='\n'){if(c==='\r'&&source[i+1]==='\n')i++;finishRow();continue;}
    if(state==='closed')throw new SyntaxError('unexpected character after quote');
    if(c==='"'){if(state!=='start')throw new SyntaxError('unexpected quote');state='quoted';continue;}
    cell+=c;state='plain';
  }
  if(state==='quoted')throw new SyntaxError('unclosed quote');
  if(row.length||cell||state==='closed')finishRow();
  return rows;
}
