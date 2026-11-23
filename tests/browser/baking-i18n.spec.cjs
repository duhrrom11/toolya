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

test('real Backstudio scripts reversibly translate OCR, notes and pan labels without changing input values',async({page})=>{
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
 await expect(page.locator('#bsp-memory-search').locator('..').locator('span')).toHaveText('Search notes');
 await expect(page.locator('#bs-pan-shape option[value=round]')).toHaveText('Round');
 expect(await page.locator('#recipe-input').inputValue()).toBe('250 g Omas Lieblingsmehl');
 expect(await page.locator('#recipe-name').inputValue()).toBe('My private apple cake');
 await page.evaluate(()=>{window.__toolyaUILocale='de';document.dispatchEvent(new Event('toolya:locale-change'))});
 await expect(page.locator('#bsp-ocr-button')).toHaveText('Foto erneut lesen');
 await expect(page.locator('#bsp-ocr-status')).toHaveText('Kamera konnte nicht geöffnet werden. Versuche „Handykamera verwenden“.');
 await expect(page.locator('#bs-pan-shape option[value=round]')).toHaveText('Rund');
 expect(await page.locator('#recipe-input').inputValue()).toBe('250 g Omas Lieblingsmehl');
});
