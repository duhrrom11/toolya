const {test,expect}=require('playwright/test');
const origin='http://127.0.0.1:4173';
test('moving planner creates project, room and box assignment with mocked cloud',async({page})=>{
  const transport={boxes:[],grants:[],incidents:[]};
  let stateWrites=0,grantTarget;
  await page.route('**/*',route=>{
    const url=route.request().url();
    if(url.includes('/functions/v1/moving-helper')){
      const body=route.request().postDataJSON();
      if(body.action==='create'){
        grantTarget=body.target;
        return route.fulfill({json:{token:'synthetic-test-token'}});
      }
      if(body.action==='owner-transition'){
        const row=transport.boxes.find(box=>box.assignmentId===body.assignmentId);
        if(!row||row.version!==body.expectedVersion)return route.fulfill({status:409,json:{error:'stale'}});
        row.status=body.status;
        row.version++;
        stateWrites++;
        return route.fulfill({json:{assignmentId:row.assignmentId,status:row.status,version:row.version}});
      }
      return route.fulfill({json:transport});
    }
    if(url==='https://cdn.tailwindcss.com')return route.fulfill({status:200,contentType:'text/javascript',body:"document.head.insertAdjacentHTML('beforeend','<style>html body div.hidden{display:none!important}</style>');"});
    if(url===origin+'/assets/vendor/supabase-2.119.2.js')
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
  const consent=page.locator('#toolya-consent-panel');
  if(await consent.isVisible())await consent.getByRole('button',{name:'Ablehnen',exact:true}).click();
  await expect(page.locator('#b3-inventory')).toBeVisible();
  await expect(planner).toBeHidden();
  await navigation.getByRole('button',{name:/Mein Umzug/}).dispatchEvent('click');
  await expect(planner).toBeVisible();
  await expect(page.locator('#b3-create')).toBeVisible();
  await expect(page.locator('#b3-inventory')).toBeHidden();
  const prompts=['Mein Testumzug','2026-12-05','Küche','EG','16'];
  page.on('dialog',d=>d.type()==='prompt'?d.accept(prompts.shift()??''):d.accept());
  await planner.getByRole('button',{name:/Neuen Umzug planen/}).dispatchEvent('click');
  await expect(planner.getByText('Mein Testumzug')).toBeVisible();
  await expect(planner.getByText('05.12.2026')).toBeVisible();
  await planner.getByRole('button',{name:'1. Zielräume'}).dispatchEvent('click');
  await planner.getByRole('button',{name:/Zielraum hinzufügen/}).dispatchEvent('click');
  await expect(planner.getByText('Küche')).toBeVisible();
  await planner.getByRole('button',{name:'2. Kisten zuordnen'}).dispatchEvent('click');
  await planner.getByRole('button',{name:/Vorhandene Kiste zuordnen/}).dispatchEvent('click');
  await expect(planner.getByText('Gläser')).toBeVisible();
  const db=await page.evaluate(()=>window.__mvMock);
  expect(db.snapshot.boxes[0].name).toBe('Gläser');
  expect(db.snapshot.moving.projects[0].moveDate).toBe('2026-12-05');
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
  await expect(planner.getByRole('button',{name:'Finish move'})).toBeVisible();
  await expect(planner.getByText('5 Dec 2026')).toBeVisible();
  await expect(planner.getByRole('button',{name:'3. First 72 hours'})).toHaveAttribute('aria-current','true');
  await expect(planner.getByRole('heading',{name:'Küche'})).toBeVisible();
  await expect(planner.locator('[data-arrival-details]').getByText('Gläser')).toBeHidden();
  await planner.locator('[data-arrival-details] summary').click();
  await expect(planner.locator('[data-arrival-details]').getByText('Gläser')).toBeVisible();
  expect((await page.evaluate(()=>window.__mvMock)).writes).toBe(3);

  await navigation.getByRole('button',{name:/My inventory/}).dispatchEvent('click');
  await page.locator('#searchBox').fill('Glasser');
  await expect(page.locator('#inventoryContainer').getByRole('heading',{name:/Gläser/})).toBeVisible();
  await page.locator('#searchBox').clear();

  await navigation.getByRole('button',{name:/My move/}).dispatchEvent('click');
  await navigation.getByRole('button',{name:/Preparation/}).dispatchEvent('click');
  await page.locator('#boxLocationSelect').selectOption('5');
  await page.getByText('Create several boxes',{exact:true}).click();
  await page.locator('#boxBatchPrefix').fill('Kitchen');
  await page.getByRole('button',{name:'Preview names'}).click();
  await expect(page.locator('#boxBatchPreview')).toHaveText('Kitchen 01 · Kitchen 02');
  await page.locator('#boxBatchSave').click();
  await expect(page.locator('#editBoxName')).toHaveValue('Kitchen 01');
  await page.getByText('Enter multiple items',{exact:true}).click();
  await page.locator('#boxItemsBatch').fill('Tea towels, Coffee maker');
  await page.getByRole('button',{name:'Preview items'}).click();
  await page.locator('#boxItemsApply').click();
  await expect(page.locator('#subItemsContainer')).toContainText('Coffee maker');
  await page.locator('#editBoxModal').getByRole('button',{name:'Save',exact:true}).click();

  await page.getByText('Import a CSV list',{exact:true}).click();
  await page.locator('#boxCsvFile').setInputFiles({
    name:'boxes.csv',mimeType:'text/csv',
    buffer:Buffer.from('Box number;Name;Destination room;Contents\n007;Hall;Hallway;Umbrella\n007;Hall;Hallway;Books')
  });
  await expect(page.locator('#boxCsvStatus')).toHaveText('Valid entries: 1 of 2.');
  await expect(page.locator('#boxCsvRows')).toContainText('already exists');
  await page.locator('#boxCsvSave').click();
  await expect.poll(()=>page.evaluate(()=>window.__mvMock.writes)).toBe(6);
  const imported=await page.evaluate(()=>window.__mvMock.snapshot.boxes.at(-1));
  expect(imported).toMatchObject({name:'Hall 007',boxNumber:'007'});
  await navigation.getByRole('button',{name:/My inventory/}).dispatchEvent('click');
  await page.getByText('Move boxes into storage',{exact:true}).click();
  await page.locator('#movingBulkBoxes').getByLabel('Hall 007').check();
  await page.locator('#movingBulkLocation').selectOption('5');
  await page.locator('#movingBulkSave').click();
  await expect.poll(()=>page.evaluate(()=>window.__mvMock.snapshot.boxes.at(-1).locId)).toBe(5);

  await page.locator('#inventoryContainer .b3-moving-box-card').filter({hasText:'Kitchen 01'}).getByRole('button',{name:'Edit'}).click();
  await page.getByText('Placement and borrowed boxes',{exact:true}).click();
  await page.locator('#movingEditPlacement').fill('Hallway');
  await page.locator('#movingEditRental').selectOption('empty');
  await page.getByText('Move contents to another box',{exact:true}).click();
  await page.locator('#movingRepackTarget').selectOption({label:'Kitchen 02'});
  await page.locator('#movingRepackItems').getByLabel('Coffee maker').check();
  await page.locator('#editBoxModal').getByRole('button',{name:'Save',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.__mvMock.snapshot.boxes.find(box=>box.name==='Kitchen 02').subItems))
    .toEqual([{name:'Coffee maker',value:0}]);
  const source=await page.evaluate(()=>window.__mvMock.snapshot.boxes.find(box=>box.name==='Kitchen 01'));
  expect(source).toMatchObject({placement:'Hallway',rental:'empty',subItems:[{name:'Tea towels',value:0}]});
  transport.boxes.push({assignmentId:db.snapshot.moving.assignments[0].id,label:'Gläser',room:'Küche',
    priority:'normal',status:'packed',version:1});
  await navigation.getByRole('button',{name:/My move/}).dispatchEvent('click');
  await navigation.getByRole('button',{name:/Moving day/}).dispatchEvent('click');
  const transportRoot=page.locator('#toolya-moving-transport');
  const load=transportRoot.getByRole('button',{name:'Load transport mode'});
  if(await load.isVisible())await load.click();
  await transportRoot.getByRole('button',{name:'Sync boxes and rooms'}).click();
  await transportRoot.getByRole('button',{name:'Scan several boxes'}).click();
  const batch=page.locator('#movingBatchScan');
  await batch.locator('#movingScanManual').fill('16');
  await batch.getByRole('button',{name:'Record box'}).click();
  await expect(batch.locator('output')).toContainText('Status saved: Gläser');
  await batch.getByRole('button',{name:'Record box'}).click();
  await expect(batch.locator('output')).toContainText('already recorded');
  expect(stateWrites).toBe(1);
  await batch.getByRole('button',{name:'Close scanner'}).click();
  await transportRoot.getByRole('button',{name:'Undo last status change'}).click();
  await expect.poll(()=>transport.boxes[0].status).toBe('packed');
  expect(stateWrites).toBe(2);
  await transportRoot.locator('#mv-helper-name').fill('Kitchen team');
  await transportRoot.locator('#mv-helper-target').selectOption({label:'Room: Küche'});
  await transportRoot.getByRole('button',{name:'Create helper link'}).click();
  await expect.poll(()=>grantTarget).toBe('room:'+db.snapshot.moving.rooms[0].id);
  await expect(transportRoot.locator('#mv-helper-link')).toHaveValue(/synthetic-test-token/);



});
