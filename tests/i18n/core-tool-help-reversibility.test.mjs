import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {applyToolInterfaceLocale} from '../../shared/toolya/i18n/interface.mjs';

const cases=[
 ['parking','Über „PDF-Report“ erstellst du eine Übersicht deiner Parkvorgänge und Gebühren.','Use the PDF report to review your parking sessions and fees.'],
 ['loans','Für aktive Verleihvorgänge mit Rückgabedatum kannst du direkt einen Google-Kalender-Eintrag generieren oder eine ICS-Datei herunterladen, um rechtzeitig erinnert zu werden.','For active loans with a return date, create a Google Calendar event or download an ICS reminder.'],
 ['car','Erfasse Fahrzeugausgaben, führe dein Tankbuch und behalte Wartung und Reifen im Blick.','Record vehicle expenses and fuel costs, and track maintenance and tyres.'],
 ['meters','Notiere die Ziffern vor dem Komma. Bei HT/NT-Zählern beide Register getrennt erfassen.','Enter the digits before the decimal separator. For dual-rate meters, record both registers separately.']
];

for(const [tool,german,english] of cases){
 test(`${tool} authored help copy translates and restores without touching editable data`,()=>{
  const {document}=parseHTML(`<main id="main-content"><p id="copy"></p><p id="draft" contenteditable="true"></p><p id="custom"></p></main>`);
  const copy=document.querySelector('#copy'),draft=document.querySelector('#draft'),custom=document.querySelector('#custom');
  copy.textContent=german;
  draft.textContent=german;
  custom.textContent='Customer note: Bitte unverändert lassen.';
  applyToolInterfaceLocale(document,tool,'en');
  assert.equal(copy.textContent,english);
  assert.equal(draft.textContent,german);
  assert.equal(custom.textContent,'Customer note: Bitte unverändert lassen.');
  applyToolInterfaceLocale(document,tool,'de');
  assert.equal(copy.textContent,german);
  assert.equal(draft.textContent,german);
 });
}
