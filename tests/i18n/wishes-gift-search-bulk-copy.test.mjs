import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';
import {applyWishLocale} from '../../shared/toolya/i18n/wishes-dom.mjs';
const read=name=>readFileSync(new URL('../../tools/wishes/'+name+'.mjs',import.meta.url),'utf8');

test('gift finder and product search translate only fixed result labels',()=>{
 const {document}=parseHTML('<html><body><article class="gift-finder-card"><span data-wish-owned-copy>🎲 Zufällige Inspiration</span><strong>✨ Aus der Community</strong><a data-wish-owned-copy href="https://www.amazon.de/dp/ABC">Bei Amazon ansehen ↗</a></article><article class="product-result"><h3 data-user-content>Keine passenden Produkte gefunden.</h3><p data-wish-owned-copy>🌟 Öffentlicher Wunsch vorhanden</p><a data-wish-owned-copy href="https://www.amazon.de/dp/ABC">Produkt bei Amazon ansehen ↗</a></article></body></html>');
 const before=document.body.textContent;
 applyWishLocale(document,'en');
 assert.equal(document.querySelector('.gift-finder-card span').textContent,'🎲 Random inspiration');
 assert.equal(document.querySelector('.gift-finder-card strong').textContent,'✨ Aus der Community');
 assert.equal(document.querySelector('.product-result h3').textContent,'Keine passenden Produkte gefunden.');
 assert.equal(document.querySelector('.product-result p').textContent,'🌟 Public wish available');
 assert.equal(document.querySelector('.product-result a').textContent,'View product on Amazon ↗');
 assert.equal(document.querySelector('.gift-finder-card a').getAttribute('href'),'https://www.amazon.de/dp/ABC');
 applyWishLocale(document,'de');assert.equal(document.body.textContent,before);
 assert.match(read('gift-finder'),/tag\.setAttribute\('data-wish-owned-copy',''\)/);
 assert.match(read('gift-planner'),/h\.setAttribute\('data-user-content',''\);h\.textContent=product\.title/);
});

test('bulk import messages retain counts, known error distinctions and original source names',()=>{
 const pairs=[
 ['🔐 Amazon-Sammelimport (Toolya-Admin)','🔐 Amazon bulk import (Toolya admin)'],
 ['22 Wunschlisten importieren','Import 22 wish lists'],
 ['Nach aktueller Liste stoppen','Stop after current list'],
 ['Liste nicht vollständig lesbar; nichts gespeichert','List could not be read in full; nothing saved'],
 [': wird gelesen …',': reading…'],
 [': bereits vorhanden – übersprungen',': already exists – skipped'],
 [' Produkte zugeordnet (',' products assigned ('],
 [' neue Wünsche)',' new wishes)'],
 [' – nicht importiert',' – not imported'],
 ['Abgeschlossen: ','Finished: '],
 [' Listen importiert, ',' lists imported, '],
 [' bereits vorhanden, ',' already exist, '],
 [' fehlgeschlagen.',' failed.'],
 [' Vorzeitig gestoppt.',' Stopped early.']
 ];
 for(const [de,en] of pairs){assert.equal(wishesText(de,'en'),en,de);assert.equal(wishesText(en,'de'),de,en)}
 const source=read('amazon-bulk-import');
 assert.match(source,/setRow\(row,\(\)=>title\+ui\(': wird gelesen …'\)\)/);
 assert.match(source,/rowCopy\.clear\(\)/);
 assert.match(source,/toolya:wishes-locale-change',paint/);
 assert.match(source,/p_preview_id:preview\.previewId,p_source_id:id,p_list_title:title\.slice\(0,80\)/);
 assert.match(source,/if\(cancel\|\|token!==session\|\|getUser\(\)\?\.id!==owner\)break/);
 assert.match(source,/needsReload=true;setStatus\(summary\)/);
});
