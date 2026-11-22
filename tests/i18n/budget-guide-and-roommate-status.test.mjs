import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {applyToolInterfaceLocale,translateToolRuntimeStatus} from '../../shared/toolya/i18n/interface.mjs';

test('budget guide translates emphasized text and restores German without changing markup', () => {
 const {document}=parseHTML(`<main id="main-content"><p id="user-note" contenteditable="true">Ausgabe</p></main>
 <section id="guideSection"><div>
 <p>Wähle <strong>Ausgabe</strong>, <strong>Einnahme</strong> oder erstelle wiederkehrende <strong>Fixkosten/Abos</strong>. Gib Betrag, Datum, Kategorie und Zahlungsart ein. Alle Monats-Salden und Fixkosten-Quoten werden live berechnet.</p>
 <p>Setze Monats-Limits pro Kategorie mit visuellen Ampel-Fortschrittsbalken. Erstelle eigene Sparschwein-Ziele (Urlaub, Notgroschen) und zahle flexibel Beträge ein.</p>
 <p>Scanne Belege mit dem <strong>OCR-Scanner</strong>, lade mehrere Dokumentenfotos hoch oder schärfe verblasste Thermobons über den Helligkeits-/Kontrastfilter nach.</p>
 </div></section>`);
 const paragraphs=[...document.querySelectorAll('#guideSection p')];
 const before=paragraphs.map(p=>p.innerHTML);
 const emphasized=paragraphs[0].querySelectorAll('strong');
 applyToolInterfaceLocale(document,'budget','en');
 assert.match(paragraphs[0].textContent,/Choose Expense, Income or create recurring Fixed costs\/subscriptions/);
 assert.match(paragraphs[1].textContent,/Set monthly spending limits/);
 assert.match(paragraphs[2].textContent,/Scan receipts with the OCR scanner/);
 assert.equal(paragraphs[0].querySelectorAll('strong')[0],emphasized[0]);
 assert.equal(document.querySelector('#user-note').textContent,'Ausgabe');
 applyToolInterfaceLocale(document,'budget','de');
 assert.deepEqual(paragraphs.map(p=>p.innerHTML),before);
});

test('roommate cloud setup status is reversible but server diagnostics remain untouched',()=>{
 assert.equal(translateToolRuntimeStatus('housemates','en','Erstelle Cloud-Speicher im Hintergrund...'),'Creating private cloud storage…');
 assert.equal(translateToolRuntimeStatus('housemates','de','Creating private cloud storage…'),'Erstelle Cloud-Speicher im Hintergrund...');
 assert.equal(translateToolRuntimeStatus('housemates','en','PostgrestError: permission denied'),'PostgrestError: permission denied');
});
