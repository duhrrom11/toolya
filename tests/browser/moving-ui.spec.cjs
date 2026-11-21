const {test,expect}=require('playwright/test');
const origin='http://127.0.0.1:4173';
test('moving planner creates project, room and box assignment with mocked cloud',async({page})=>{
  await page.route('**/*',route=>{
    const url=route.request().url();
    if(url==='https://cdn.tailwindcss.com')return route.fulfill({status:200,contentType:'text/javascript',body:"document.head.insertAdjacentHTML('beforeend','<style>.hidden{display:none!important}</style>');"});
    if(url===origin+'/assets/vendor/supabase-2.57.0.js')
      return route.fulfill({status:200,contentType:'text/javascript',body:`
        window.__mvMock={writes:0,revision:1,snapshot:{locations:[{id:5,name:'Keller',icon:'📦'}],boxes:[{id:16,locId:5,name:'Gläser',desc:'Gläser',value:20,tag:'Zerbrechlich'}]}};
        window.supabase={createClient(){const m=window.__mvMock;const user={id:'mock-moving-user',is_anonymous:false,email:'mock@example.invalid'};
        return {auth:{
          async getUser(){return {data:{user},error:null}},
          async getSession(){return {data:{session:{user,access_token:'fixture'}},error:null}},
          onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
          async signOut(){return {error:null}}},
          from(name){if(name!=='user_data')throw Error('unexpected table '+name);
            return {select(){return this},eq(){return this},async maybeSingle(){return {data:{id:1,user_id:user.id,tool:'umzugskisten-inventar',data:m.snapshot,revision:m.revision},error:null}}}},
          async rpc(name,args){if(name!=='toolya_save_snapshot')throw Error(name);
            if(args.p_expected_revision!==m.revision)return {data:null,error:{code:'40001'}};
            m.snapshot=JSON.parse(JSON.stringify(args.p_data));m.revision++;m.writes++;
            return {data:[{data:m.snapshot,revision:m.revision}],error:null}}};
        }};
      `});
    if(url.startsWith(origin+'/'))return route.continue();
    return route.abort();
  });
  await page.goto(origin+'/tools/moving/index.html');
  const planner=page.locator('#toolya-moving-planner');
  const navigation=page.locator('#mv-journey');
  await expect(navigation).toBeVisible({timeout:15000});
  await expect(page.locator('#b3-inventory')).toBeVisible();
  await expect(planner).toBeHidden();
  await navigation.getByRole('button',{name:/Mein Umzug/}).dispatchEvent('click');
  await expect(planner).toBeVisible();
  await expect(page.locator('#b3-create')).toBeVisible();
  await expect(page.locator('#b3-inventory')).toBeHidden();
  const prompts=['Mein Testumzug','','Küche','EG','16'];
  page.on('dialog',d=>d.type()==='prompt'?d.accept(prompts.shift()??''):d.accept());
  await planner.getByRole('button',{name:/Neuen Umzug planen/}).dispatchEvent('click');
  await expect(planner.getByText('Mein Testumzug')).toBeVisible();
  await planner.getByRole('button',{name:'1. Zielräume'}).dispatchEvent('click');
  await planner.getByRole('button',{name:/Zielraum hinzufügen/}).dispatchEvent('click');
  await expect(planner.getByText('Küche')).toBeVisible();
  await planner.getByRole('button',{name:'2. Kisten zuordnen'}).dispatchEvent('click');
  await planner.getByRole('button',{name:/Vorhandene Kiste zuordnen/}).dispatchEvent('click');
  await expect(planner.getByText('Gläser')).toBeVisible();
  const db=await page.evaluate(()=>window.__mvMock);
  expect(db.snapshot.boxes[0].name).toBe('Gläser');
  expect(db.snapshot.moving.assignments).toHaveLength(1);
  expect(db.writes).toBe(3);
  await expect(planner.getByRole('button',{name:'Umzug abschließen'})).toHaveCount(0);
  await navigation.getByRole('button',{name:/Umzugstag/}).dispatchEvent('click');
  await expect(planner).toBeHidden();
  await expect(page.locator('#toolya-moving-transport')).toBeVisible();
  await navigation.getByRole('button',{name:/Einzug/}).dispatchEvent('click');
  await expect(planner).toBeVisible();
  await expect(planner.getByRole('button',{name:'Umzug abschließen'})).toBeVisible();
  await navigation.getByRole('button',{name:/Mein Inventar/}).dispatchEvent('click');
  await expect(planner).toBeHidden();
  await expect(page.locator('#b3-inventory')).toBeVisible();
  const locale = page.locator('[data-tool-locale="en"]');
  await locale.dispatchEvent('click');
  await expect(locale).toHaveAttribute('aria-pressed','true');
  await expect(navigation.getByRole('button',{name:/My inventory/})).toHaveAttribute('aria-pressed','true');
  await navigation.getByRole('button',{name:/My move/}).dispatchEvent('click');
  await expect(navigation.getByRole('button',{name:/Moving in/})).toHaveAttribute('aria-current','step');
  await expect(planner.getByText('Mein Testumzug')).toBeVisible();
  expect((await page.evaluate(()=>window.__mvMock)).writes).toBe(3);
});
