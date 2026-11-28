const {test, expect} = require('playwright/test');
const {randomUUID} = require('node:crypto');
const {readFile} = require('node:fs/promises');

const origin = 'http://127.0.0.1:4173';
const publicPage = '/tools/wishes/public.html';
const dashboard = '/dashboard/?wishes=add#wish-profiles';
const owner = {id:'a1111111-1111-4111-8111-111111111111', email:'fixture@example.invalid', is_anonymous:false};
const personId = 'a2222222-2222-4222-8222-222222222222';
const listId = 'a3333333-3333-4333-8333-333333333333';
const tag = '?tag=duhrrom-21';
const amazon = key => 'https://www.amazon.de/hz/wishlist/ls/'+key;

function fixtures(seed = false) {
  return {
    wishlist_directory_profiles: seed ? [{id:personId,owner_id:owner.id,kind:'person',first_name:'Zoë',last_name:'Schröder',display_name:'Zoë Schröder',country:'Österreich',visibility:'directory'}] : [],
    wishlist_directory_lists: seed ? [{id:listId,profile_id:personId,name:'Bücherwünsche',url:amazon('BOOK123')+tag,visibility:'directory'}] : [],
    wishlist_directory_favorites: [],
    wishlist_card_drafts: []
  };
}

async function isolate(context, rows, signedIn = true) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:owner.id,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})+'.Zml4dHVyZQ';
  const session = {access_token:token,refresh_token:'fixture',token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,user:owner};
  if(signedIn)await context.addInitScript(({session})=>{
    localStorage.setItem('sb-yheogmeaosuigyaxkwth-auth-token',JSON.stringify(session));
  },{session});
  await context.route('**/*', async route=>{
    const request=route.request(), url=new URL(request.url());
    if(url.origin===origin)return route.continue();
    if(url.hostname!=='yheogmeaosuigyaxkwth.supabase.co')return route.abort();
    const method=request.method();
    const headers={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS','access-control-allow-headers':'*','content-type':'application/json'};
    const json=(data,status=200)=>route.fulfill({status,headers,body:JSON.stringify(data)});
    if(method==='OPTIONS')return route.fulfill({status:204,headers});
    const authenticated=(await request.allHeaders()).authorization==='Bearer '+token;
    if(url.pathname==='/auth/v1/user')return authenticated?json(owner):json({message:'Unauthorized'},401);
    const profiles=rows.wishlist_directory_profiles;
    const lists=rows.wishlist_directory_lists;
    const profile=id=>profiles.find(p=>p.id===id&&p.visibility!=='private');
    const projection=p=>({user_id:p.id,display_name:p.display_name,country:p.country,logo_url:p.image_url,website:p.website,
      lists:lists.filter(l=>l.profile_id===p.id&&l.visibility==='directory')});
    const body=['POST','PATCH'].includes(method)?request.postDataJSON():null;
    if(url.pathname==='/rest/v1/rpc/get_wishlist_public_profile')return json(profile(body.profile_id)?projection(profile(body.profile_id)):null);
    if(url.pathname==='/rest/v1/rpc/get_wishlist_public_list'){
      const item=lists.find(l=>l.id===body.list_id);
      const p=profile(item?.profile_id);
      const list=p&&item.visibility!=='private'?item:null;
      return json(p?{profile_id:p.id,list,other_lists:list&&p.show_other_lists?projection(p).lists.filter(l=>l.id!==item.id):[]}:null);
    }
    if(url.pathname==='/rest/v1/rpc/wishlist_directory_filters')return json({countries:['Österreich'],occasions:['Geburtstag']});
    const directory=profiles.filter(p=>p.visibility==='directory').map(projection);
    if(url.pathname==='/rest/v1/rpc/search_wishlist_directory')return json(directory);
    const table=url.pathname.split('/').at(-1);
    if(table==='wishlist_directory')return json(directory);
    if(!authenticated||!Object.hasOwn(rows,table))return json({message:'Fixture blocks this request'},403);
    const matching=rows[table].filter(row=>['id','owner_id','profile_id'].every(key=>!url.searchParams.has(key)||url.searchParams.get(key)==='eq.'+row[key]));
    const object=(await request.allHeaders()).accept?.includes('vnd.pgrst.object');
    if(method==='GET')return json(object?matching[0]||null:matching);
    if(method==='DELETE'){
      rows[table]=rows[table].filter(row=>!matching.includes(row));
      return route.fulfill({status:204,headers});
    }
    if(method==='PATCH'){
      for(const row of matching)Object.assign(row,body);
      return json(object?matching[0]:matching);
    }
    const inserted=(Array.isArray(body)?body:[body]).map(value=>({owner_id:owner.id,id:randomUUID(),...value}));
    for(const row of inserted){
      if(table==='wishlist_directory_favorites' && rows[table].some(r=>r.profile_id===row.profile_id))continue;
      rows[table].push(row);
    }
    return json(object?inserted[0]:inserted,201);
  });
}

test('dashboard separates profiles and lists, selects the owner, and retains the link after edits or withdrawal',async({context,page})=>{
  const rows=fixtures();await isolate(context,rows);
  await page.goto(dashboard);
  const panel=page.locator('#wish-profiles');
  await expect(panel.getByRole('heading',{name:'Profil anlegen'})).toBeVisible();
  await panel.getByLabel('Vorname',{exact:true}).fill('Zoë');
  await panel.getByLabel('Nachname',{exact:true}).fill('Schröder');
  await panel.getByLabel('Land',{exact:true}).fill('Österreich');
  await panel.getByLabel('Sichtbarkeit').selectOption('directory');
  await expect(panel.locator('.hint')).toContainText('Zoë Schröder');
  await expect(panel.locator('img')).toHaveAttribute('src',/toolya_wishlist_/);
  await panel.getByRole('button',{name:'Speichern',exact:true}).click();
  await expect(panel.getByRole('heading',{name:'Amazon-Wunschliste hinzufügen'})).toBeVisible();
  await expect(panel.getByRole('combobox',{name:'Profil',exact:true})).toBeHidden();
  await panel.getByLabel('Name der Wunschliste').fill('Bücherwünsche');
  await panel.getByLabel('Amazon-Wunschlisten-Link').fill(amazon('BOOK123')+'?tag=old');
  await panel.getByLabel('Sichtbarkeit').selectOption('directory');
  await panel.getByRole('button',{name:'Speichern',exact:true}).click();
  const address=await panel.getByRole('link',{name:'Liste ansehen'}).getAttribute('href');
  expect(rows.wishlist_directory_lists[0].url).toBe(amazon('BOOK123')+tag);

  await panel.getByRole('button',{name:'Profil anlegen'}).click();
  await panel.getByLabel('Profilart').selectOption('organization');
  await expect(panel.getByLabel('Vorname',{exact:true})).toBeHidden();
  await panel.getByLabel('Vereinsname').fill('Verein Beispiel');
  await panel.getByLabel('Land',{exact:true}).fill('Schweiz');
  await panel.getByLabel('Website des Vereins').fill('https://example.invalid/');
  await panel.getByLabel('Sichtbarkeit').selectOption('link');
  await panel.getByRole('button',{name:'Speichern',exact:true}).click();
  await expect(panel.getByRole('heading',{name:'Verein Beispiel'})).toBeVisible();
  await panel.getByRole('button',{name:'Amazon-Wunschliste hinzufügen'}).click();
  await expect(panel.getByRole('combobox',{name:'Profil',exact:true})).toBeVisible();
  await expect(panel.locator('select[name=profile] option')).toHaveCount(3);
  await expect(panel.getByRole('combobox',{name:'Profil',exact:true})).toHaveValue('');
  await panel.getByRole('button',{name:'Abbrechen'}).click();

  await panel.getByRole('button',{name:'Liste bearbeiten'}).click();
  await panel.getByLabel('Amazon-Wunschlisten-Link').fill(amazon('BOOK456'));
  await panel.getByRole('button',{name:'Speichern',exact:true}).click();
  await expect(panel.getByRole('link',{name:'Liste ansehen'})).toHaveAttribute('href',address);
  const shared=await context.newPage();await shared.goto(address);
  await expect(shared.getByRole('link',{name:'Originalliste bei Amazon öffnen'})).toHaveAttribute('href',amazon('BOOK456')+tag);
  page.once('dialog',dialog=>dialog.accept());
  await panel.getByRole('button',{name:'Liste zurückziehen'}).click();
  await expect(panel.getByRole('status')).toContainText('zurückgezogen');
  await shared.reload();
  await expect(shared.locator('#profileDetail')).toContainText('Diese Wunschliste ist nicht mehr verfügbar.');
  await expect(shared.getByRole('link',{name:'Zum Wunschprofil'})).toBeVisible();
  await expect(shared.getByRole('link',{name:'Originalliste bei Amazon öffnen'})).toHaveCount(0);
});

test('guest favorites migrate once and an isolated second browser can remove them',async({browser})=>{
  const rows=fixtures(true);
  const guest=await browser.newContext({serviceWorkers:'block'});
  const first=await browser.newContext({serviceWorkers:'block'});
  const second=await browser.newContext({serviceWorkers:'block'});
  try{
    await isolate(guest,rows,false);
    const page=await guest.newPage();
    await page.goto(origin+publicPage+'?profile='+personId);
    await page.getByRole('button',{name:/Profil merken/}).click();
    await expect(page.locator('#favoriteItems')).toContainText('Zoë Schröder');
    const storage=await guest.storageState();
    await isolate(first,rows);
    await first.addInitScript(({storage,origin})=>{
      for(const entry of storage.origins.find(row=>row.origin===origin)?.localStorage||[])localStorage.setItem(entry.name,entry.value);
    },{storage,origin});
    const signed=await first.newPage();
    await signed.goto(origin+publicPage);
    await expect(signed.locator('#favoriteItems')).toContainText('Zoë Schröder');
    expect(rows.wishlist_directory_favorites).toHaveLength(1);
    await isolate(second,rows);
    const other=await second.newPage();
    await other.goto(origin+publicPage);
    await expect(other.locator('#favoriteItems')).toContainText('Zoë Schröder');
    await other.locator('#favoriteItems').getByRole('button',{name:'Entfernen'}).click();
    await expect(other.locator('#favoriteCount')).toHaveText('0');
    expect(rows.wishlist_directory_favorites).toHaveLength(0);
  }finally{await Promise.all([guest.close(),first.close(),second.close()]);}
});

async function readQR(page, path, four=false) {
  const png=(await readFile(path)).toString('base64');
  return page.evaluate(async({png,four})=>{
    const image=new Image();image.src='data:image/png;base64,'+png;await image.decode();
    const positions=four?[[8,10],[108,10],[8,152],[108,152]].map(([x,y])=>[x/210,y/297,94/210,133/297]):[[0,0,1,1]];
    return positions.map(([x,y,w,h])=>{
      const card=document.createElement('canvas');
      card.width=Math.round(w*image.width);card.height=Math.round(h*image.height);
      const ctx=card.getContext('2d');
      ctx.drawImage(image,x*image.width,y*image.height,w*image.width,h*image.height,0,0,card.width,card.height);
      const main=ctx.getImageData(0,0,card.width,Math.floor(card.height*.8));
      const ad=ctx.getImageData(Math.floor(card.width*.68),Math.floor(card.height*.73),Math.floor(card.width*.3),Math.floor(card.height*.26));
      return [window.jsQR(main.data,main.width,main.height)?.data,window.jsQR(ad.data,ad.width,ad.height)?.data];
    });
  },{png,four});
}

test('all four PNG formats carry both QR targets, and language variants survive a cloud save and reopen',async({context,page})=>{
  const rows=fixtures(true);await isolate(context,rows);
  const qrPath=require.resolve('jsqr');
  const publicTarget='https://toolya.app'+publicPage+'?list='+listId;
  await page.goto(publicPage+'?list='+listId);
  await page.getByRole('link',{name:'Liste teilen'}).click();
  const editor=page.locator('#wishCardEditor');
  await expect(editor.getByRole('heading',{name:'Karten gestalten'})).toBeVisible();
  await page.addScriptTag({path:qrPath});
  for(const format of ['square','story','a4','four']){
    await editor.getByLabel('Ausgabeformat').selectOption(format);
    const [file]=await Promise.all([page.waitForEvent('download'),editor.getByRole('button',{name:'Bild herunterladen'}).click()]);
    const codes=await readQR(page,await file.path(),format==='four');
    expect(codes).toEqual(Array(format==='four'?4:1).fill([publicTarget,'https://toolya.app/']));
  }

  await editor.getByRole('button',{name:'Vorlage gestalten'}).click();
  await expect(editor.getByRole('combobox',{name:'Design',exact:true}).locator('option')).toHaveCount(18);
  await editor.getByRole('combobox',{name:'Design',exact:true}).selectOption('botanical');
  await expect(editor.getByRole('group',{name:'Vorlage'}).locator('button[aria-pressed]')).toHaveCount(5);
  await editor.getByLabel('Titel',{exact:true}).fill('Zoë et Jérôme');
  await editor.getByLabel('Freitext',{exact:true}).fill('日本語');
  await editor.getByLabel('Neue Sprachfassung').selectOption('ar');
  await editor.getByRole('button',{name:'Sprachfassung hinzufügen'}).click();
  await editor.getByLabel('Titel',{exact:true}).fill('مرحبا بالعالم');
  await editor.getByLabel('Freitext',{exact:true}).fill('Привіт');
  await editor.getByLabel('Zweite Sprache auf der Karte').selectOption({label:'Deutsch · Zoë et Jérôme'});
  await editor.getByLabel('Name unter „Meine Karten“').fill('Sprachenkarte');
  await editor.getByRole('button',{name:'Entwurf speichern'}).click();
  await expect(editor.getByRole('status').first()).toHaveText('Gespeichert.');
  expect(rows.wishlist_card_drafts[0].draft.variants.map(v=>v.text.note)).toEqual(['日本語','Привіт']);
  await page.goto('/dashboard/#wish-cards');
  await page.getByRole('link',{name:'Sprachenkarte'}).click();
  await expect(editor.getByLabel('Titel',{exact:true})).toHaveValue('مرحبا بالعالم');
  await expect(editor.getByRole('combobox',{name:'Zweite Sprache auf der Karte'})).not.toHaveValue('');
  const preview=editor.getByRole('img');
  await expect(preview).toHaveAttribute('aria-label',/مرحبا بالعالم.*Привіт.*Zoë et Jérôme.*日本語/);
  await expect(editor.getByRole('button',{name:'Drucken'})).toBeEnabled();
  await page.evaluate(()=>{window.print=()=>{window.printRequested=true;};});
  await editor.getByRole('button',{name:'Drucken'}).click();
  await page.waitForFunction(()=>window.printRequested);
  await page.emulateMedia({media:'print'});
  await expect(page.locator('#wish-card-print img')).toBeVisible();
  await expect(editor).toBeHidden();
  await page.pdf({path:test.info().outputPath('sprachkarte-druck.pdf'),preferCSSPageSize:true});
  await page.emulateMedia({media:'screen'});
  if(process.env.TOOLYA_TEST_JSPDF){
    await page.addScriptTag({path:process.env.TOOLYA_TEST_JSPDF});
    const [download]=await Promise.all([page.waitForEvent('download'),editor.getByRole('button',{name:'PDF herunterladen'}).click()]);
    const pdf=(await readFile(await download.path())).toString('latin1');
    expect(pdf.match(/\/URI \(https:\/\/toolya\.app\/\)/g)).toHaveLength(4);
    await download.saveAs(test.info().outputPath('sprachkarte-export.pdf'));
  }
  await editor.getByRole('button',{name:'Duplizieren'}).click();
  await expect(editor.getByRole('status').first()).toHaveText('Kopie gespeichert.');
  expect(rows.wishlist_card_drafts).toHaveLength(2);

  await page.setViewportSize({width:320,height:800});
  await editor.getByRole('button',{name:'Vorschau',exact:true}).click();
  await expect(editor.getByRole('img')).toBeVisible();
  await expect(editor.getByLabel('Titel',{exact:true})).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
  await editor.getByRole('button',{name:'Bearbeiten',exact:true}).click();
  await expect(editor.getByLabel('Titel',{exact:true})).toBeVisible();
  await page.locator('[data-wishes-locale="en"]').click();
  await expect(editor.getByRole('heading',{name:'Design cards'})).toBeVisible();
  await expect(editor.getByLabel('Title',{exact:true})).toHaveValue('مرحبا بالعالم');
});
