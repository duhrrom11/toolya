const encoder = new TextEncoder();

function escapeText(value) {
  return String(value).replaceAll('\\', '\\\\').replace(/\r\n|\r|\n/g, '\\n')
    .replaceAll(',', '\\,').replaceAll(';', '\\;');
}

function foldLine(line) {
  let folded = '';
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) {
      folded += '\r\n ';
      bytes = 1;
    }
    folded += character;
    bytes += size;
  }
  return folded;
}

export function buildAllDayCalendar({ title, date, description, uid, now = new Date() }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const day = new Date(date + 'T00:00:00Z');
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== date) return null;

  const stamp = now.toISOString().replace(/[-:]|\.\d{3}/g, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Toolya//Calendar export//EN',
    'BEGIN:VEVENT',
    'UID:' + escapeText(uid),
    'DTSTAMP:' + stamp,
    'DTSTART;VALUE=DATE:' + date.replaceAll('-', ''),
    'SUMMARY:' + escapeText(title),
    'DESCRIPTION:' + escapeText(description),
    'END:VEVENT',
    'END:VCALENDAR',
    ''
  ].map(foldLine).join('\r\n');
}

export function downloadAllDayCalendar(event) {
  const content = buildAllDayCalendar(event);
  if (content === null) return;
  const file = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/\s+/g, '_')}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
