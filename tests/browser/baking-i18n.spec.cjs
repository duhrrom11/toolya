/* Real Chromium smoke tests. All data is disposable in-memory fixture data. */
const {test,expect}=require('playwright/test');
const {resolve}=require('node:path');

test('English cake-pan guide calculates an example and includes the complete module instructions',async({page})=>{
 await page.route('https://**/*',route=>route.abort());
 await page.goto('/en/cake-pan-calculator/');
 await page.locator('#ty-en-pan-calculator button[type=submit]').click();
 await expect(page.locator('#ty-en-pan-calculator output')).toContainText(/0[.,]64/);
 await expect(page.locator('#studio-guide')).toContainText('Recipe photo and OCR');
 await expect(page.locator('#faq')).toContainText('Bundt pan');
 await expect(page.locator('meta[name=robots]')).toHaveAttribute('content','noindex,follow');
});

async function mountBackstudio(page){
 // Supply only the original calculator's public form controls. The real
 // Backstudio and Pro scripts construct their own panels and run unchanged.
 const controls={
  'orig-shape':['select','round'],'target-shape':['select','round'],
  'combinator-mode':['select','single'],'orig-d':['number','26'],
  'target-d':['number','20'],'orig-l':['number','30'],'orig-w':['number','10'],
  'target-l':['number','25'],'target-w':['number','11'],
  'combo-d1':['number','20'],'combo-d2':['number','16'],
  'base-time':['number','45'],'base-temp':['number','180'],
  'recipe-name':['text','My private apple cake'],
  'recipe-input':['textarea','250 g Omas Lieblingsmehl'],
 };
 const markup=Object.entries(controls).map(([id,[kind,value]])=>kind==='textarea'
  ?`<textarea id="${id}">${value}</textarea>`
  :kind==='select'?`<select id="${id}"><option value="${value}">${value}</option></select>`
  :`<input id="${id}" type="${kind}" value="${value}">`).join('');
 await page.setContent(`<html><body><div id="tab-rechner">${markup}</div></body></html>`);
 await page.evaluate(()=>{window.__toolyaUILocale='de';window.calculateRecipe=()=>{throw Error('Unexpected recipe persistence')};});
 await page.addScriptTag({path:resolve(__dirname,'../../tools/baking/backstudio.js')});
 await page.addScriptTag({path:resolve(__dirname,'../../tools/baking/backstudio-pro.js')});
}

test('real Backstudio scripts reversibly translate OCR, notes and pan labels without changing input values',async({page})=>{
 await mountBackstudio(page);
 await expect(page.locator('#bsp-ocr-button')).toHaveText('Foto erneut lesen');
 await expect(page.locator('#bsp-memory-search')).toHaveCount(1);
 await page.evaluate(()=>{window.__toolyaUILocale='en';document.dispatchEvent(new Event('toolya:locale-change'))});
 await expect(page.locator('#bsp-ocr-button')).toHaveText('Read photo again');
 await expect(page.locator('#bsp-camera-open')).toHaveText('📷 Open camera');
 // The missing-photo error is an accessible live status, not user data.
 await page.locator('#bsp-ocr-button').click();
 await expect(page.locator('#bsp-ocr-status')).toHaveText('Take or select a photo first.');
 await expect(page.locator('#bsp-ocr-status')).toHaveAttribute('aria-live','polite');
 // Force the permission-denied branch without requesting a real camera.
 await page.evaluate(()=>Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>Promise.reject(new DOMException('Denied','NotAllowedError'))}}));
 await page.locator('#bsp-camera-open').click();
 await expect(page.locator('#bsp-ocr-status')).toHaveText('Could not open the camera. Try “Use phone camera”.');
 await expect(page.locator('#bsp-camera-native-button')).toBeVisible();
 await page.locator('#bsp-recipe-text').fill('Omas private Anweisung ohne Mengenangabe');
 await page.locator('.bsp-panel button').filter({hasText:'Recognize ingredients'}).click();
 await expect(page.locator('#bsp-preview')).toHaveText('No clearly recognized quantities found. Edit the recipe text.');
 expect(await page.locator('#bsp-recipe-text').inputValue()).toBe('Omas private Anweisung ohne Mengenangabe');
 await expect(page.locator('#bsp-memory-search').locator('..').locator('span')).toHaveText('Search notes');
 await expect(page.locator('#bs-pan-shape option[value=round]')).toHaveText('Round');
 expect(await page.locator('#recipe-input').inputValue()).toBe('250 g Omas Lieblingsmehl');
 expect(await page.locator('#recipe-name').inputValue()).toBe('My private apple cake');
 await page.evaluate(()=>{window.__toolyaUILocale='de';document.dispatchEvent(new Event('toolya:locale-change'))});
 await expect(page.locator('#bsp-ocr-button')).toHaveText('Foto erneut lesen');
 await expect(page.locator('#bsp-ocr-status')).toHaveText('Kamera konnte nicht geöffnet werden. Versuche „Handykamera verwenden“.');
 await page.locator('.bsp-panel button').filter({hasText:'Zutaten erkennen'}).click();
 await expect(page.locator('#bsp-preview')).toHaveText('Keine eindeutig erkennbaren Mengen gefunden. Bitte Text bearbeiten.');
 await expect(page.locator('#bs-pan-shape option[value=round]')).toHaveText('Rund');
 expect(await page.locator('#recipe-input').inputValue()).toBe('250 g Omas Lieblingsmehl');
});

test('pan finder, recipe calculator, shopping and cake plan stay translated without changing numeric or stored values',async({page})=>{
 await mountBackstudio(page);
 await page.evaluate(()=>{window.__toolyaUILocale='en';document.dispatchEvent(new Event('toolya:locale-change'))});
 await expect(page.locator('#bs-ratio')).toContainText('Scaling factor at desired height');
 await expect(page.locator('#bs-oven')).toContainText('Start checking after approx.');
 await expect(page.locator('#bs-scaled')).toContainText('Omas Lieblingsmehl');
 await expect(page.locator('#bsp-cake-output')).toContainText('Total frosting (outside + fillings)');
 await expect(page.locator('#bs-missing')).toHaveAttribute('aria-live','polite');
 await expect(page.locator('#bs-filltext')).toContainText('calculated fill level');
 await page.locator('#bs-pan-save').click();
 await page.locator('#bsp-compare-target').selectOption('mixed');
 await page.locator('.bsp-panel button').filter({hasText:'Find matching pans'}).click();
 await expect(page.locator('#bsp-compare-results')).toContainText('Batter required');
 await expect(page.locator('#bsp-compare-results')).toContainText('Recommended');
 await page.locator('#bs-shopping-custom').fill('Omas privater Vanillezucker');
 await page.locator('#bs-shopping-add').click();
 await expect(page.locator('#bs-shopping-items')).toContainText('Omas privater Vanillezucker');
 await expect(page.locator('#bs-shopping-items a')).toContainText('Amazon · Ad');
 await expect(page.locator('#bs-message')).toContainText('items added to your Backstudio shopping list');
 await expect(page.locator('#bs-shopping-items input[type=checkbox]')).toHaveAttribute('aria-label','Omas privater Vanillezucker completed');
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('toolya_backstudio_v1')));
 await page.evaluate(()=>{window.__toolyaUILocale='de';document.dispatchEvent(new Event('toolya:locale-change'))});
 await expect(page.locator('#bsp-compare-results')).toContainText('Füllbedarf');
 await expect(page.locator('#bs-ratio')).toContainText('Umrechnungsfaktor mit Wunschhöhe');
 await expect(page.locator('#bs-shopping-items a')).toContainText('Amazon · Anzeige');
 await expect(page.locator('#bs-message')).toContainText('Artikel zur Backstudio-Einkaufsliste hinzugefügt');
 await expect(page.locator('#bs-shopping-items')).toContainText('Omas privater Vanillezucker');
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('toolya_backstudio_v1')));
 expect(after).toEqual(before);
 expect(after.pans).toHaveLength(1);
 expect(after.shopping[0].title).toBe('Omas privater Vanillezucker');
 expect(await page.locator('#recipe-input').inputValue()).toBe('250 g Omas Lieblingsmehl');
});

test('baking notes search and delete confirmation localize reversibly, preserving the private note',async({page})=>{
 await mountBackstudio(page);
 await page.locator('#bs-note').fill('Meine geheime Füllung: Omas Sahne');
 await page.evaluate(()=>{window.__toolyaUILocale='en';document.dispatchEvent(new Event('toolya:locale-change'))});
 await page.locator('.bsp-panel button').filter({hasText:'Save baking note'}).click();
 await expect(page.locator('#bsp-memory-status')).toHaveText('Baking notes saved.');
 await expect(page.locator('#bsp-memory-list')).toContainText('Meine geheime Füllung: Omas Sahne');
 await expect(page.locator('#bsp-memory-list')).toContainText('Pan: Round');
 await page.locator('#bsp-memory-search').fill('Omas Sahne');
 await expect(page.locator('#bsp-memory-list')).toContainText('My private apple cake');
 await page.evaluate(()=>{window.__toolyaUILocale='de';document.dispatchEvent(new Event('toolya:locale-change'))});
 await expect(page.locator('#bsp-memory-status')).toHaveText('Backerfahrung gespeichert.');
 await expect(page.locator('#bsp-memory-list')).toContainText('Form: Rund');
 await expect(page.locator('#bsp-memory-list')).toContainText('Meine geheime Füllung: Omas Sahne');
 await page.once('dialog',async dialog=>{expect(dialog.message()).toBe('Diese Notiz löschen?');await dialog.dismiss()});
 await page.locator('#bsp-memory-list button').filter({hasText:'Löschen'}).click();
 await expect(page.locator('#bsp-memory-list')).toContainText('Meine geheime Füllung: Omas Sahne');
 await page.evaluate(()=>{window.__toolyaUILocale='en';document.dispatchEvent(new Event('toolya:locale-change'))});
 await page.once('dialog',async dialog=>{expect(dialog.message()).toBe('Delete this note?');await dialog.accept()});
 await page.locator('#bsp-memory-list button').filter({hasText:'Delete'}).click();
 await expect(page.locator('#bsp-memory-list')).toHaveText('No notes found.');
 expect(await page.locator('#bs-note').inputValue()).toBe('Meine geheime Füllung: Omas Sahne');
});
